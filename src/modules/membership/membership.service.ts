import {
    Injectable,
} from "@nestjs/common"
import {
    In,
    LessThan,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    MembershipEntity,
} from "@modules/databases/postgresql/primary/entities/membership.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    MembershipStatus,
} from "@modules/databases/postgresql/primary/enums/membership-status"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    MEMBERSHIP_PERIOD_MONTHS,
} from "./constants"
import type {
    ExpireDueMembershipsResult,
    ExtendPeriodParams,
    GrantFreeMonthsParams,
    GrantMembershipParams,
} from "./types/membership"

@Injectable()
/**
 * Owns community-membership entitlement: granting/extending on payment,
 * checking whether a user is currently a member, and the expiry sweep.
 *
 * @example
 * await membershipService.grantMembership({ userId, transactionId })
 * const member = await membershipService.isActive(userId)
 */
export class MembershipService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) { }

    /**
     * Grant or extend a membership on successful payment and mark the funding
     * transaction succeeded -- both inside one DB transaction. Atomic: the
     * Pending->Succeeded transition is claimed FIRST via a guarded `UPDATE ...
     * WHERE status = 'pending'` (same technique as
     * `TransactionActionService.updateTransactionStatusIfExpected`); the period
     * is only extended when THIS call is the one that won that claim (rows-
     * affected = 1). A concurrent webhook/reconcile-poll race that loses the
     * claim sees 0 rows affected and no-ops -- so a paid transaction extends the
     * membership exactly once, not merely "checked then acted on".
     *
     * @param params - the owning `userId` and the `transactionId` that funded it
     */
    async grantMembership({
        userId,
        transactionId,
    }: GrantMembershipParams): Promise<boolean> {
        return this.entityManager.transaction(
            async (entityManager): Promise<boolean> => {
                // atomically claim the Pending -> Succeeded transition BEFORE
                // granting anything -- this IS the guard, replacing the earlier
                // read-then-compare-in-app-code (TOCTOU) idempotency check
                const claim = await entityManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                        status: TransactionStatus.Pending,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
                if (!claim.affected) {
                    // already claimed (granted) by a concurrent/earlier path -> not a new grant
                    return false
                }

                // this call alone won the claim -> extend the period by one
                // billing cycle, stacking on any time left; runs exactly once
                // for this transaction
                await this.extendPeriod({
                    userId,
                    months: MEMBERSHIP_PERIOD_MONTHS,
                    entityManager,
                })

                // a new grant happened -> caller may notify the buyer
                return true
            },
        )
    }

    /**
     * Grant free membership months not tied to a payment -- used by the
     * "buy a course -> get N months free" reverse funnel. Stacks on any time
     * the user already has left.
     *
     * @param params - the owning `userId` and the number of `months` to add
     */
    async grantFreeMonths({
        userId,
        months,
    }: GrantFreeMonthsParams): Promise<void> {
        // no-op on a non-positive grant so callers can pass a config value blindly
        if (months <= 0) {
            return
        }
        // run in its own transaction so a partial failure rolls back cleanly
        await this.entityManager.transaction(
            async (entityManager) => {
                await this.extendPeriod({
                    userId,
                    months,
                    entityManager,
                })
            },
        )
    }

    /**
     * Whether the user currently holds an active membership: the row is not
     * expired and its billing period has not yet elapsed.
     *
     * @param userId - the user to check
     * @returns true when the user has member access right now
     */
    async isActive(userId: string): Promise<boolean> {
        // load the single membership row, if any
        const membership = await this.entityManager.findOne(
            MembershipEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        // no row -> never a member
        if (!membership?.currentPeriodEnd) {
            return false
        }
        // an explicitly expired row is never active even if the date check passes
        if (membership.status === MembershipStatus.Expired) {
            return false
        }
        // active iff the period end is still in the future
        return this.dayjsService
            .from(membership.currentPeriodEnd)
            .isAfter(this.dayjsService.now())
    }

    /**
     * Flip every membership whose billing period has elapsed to expired. Driven
     * by a cron sweep so access is revoked even when no read path touches the row.
     *
     * @returns the number of rows expired by this sweep
     */
    async expireDue(): Promise<ExpireDueMembershipsResult> {
        // expire rows still marked active/cancelled whose period already passed
        const result = await this.entityManager.update(
            MembershipEntity,
            {
                status: In([
                    MembershipStatus.Active,
                    MembershipStatus.Cancelled,
                ]),
                currentPeriodEnd: LessThan(this.dayjsService.now().toDate()),
            },
            {
                status: MembershipStatus.Expired,
            },
        )
        // `affected` is driver-dependent; coerce a missing value to zero
        return {
            expiredCount: result.affected ?? 0,
        }
    }

    /**
     * Load-or-create the membership row and push its period end out by `months`,
     * stacking on any remaining time. Always leaves the row active. Runs inside
     * the caller's transaction so granting + transaction-update stay atomic.
     *
     * @param params - owner `userId`, `months` to add, and the active `entityManager`
     */
    private async extendPeriod({
        userId,
        months,
        entityManager,
    }: ExtendPeriodParams): Promise<void> {
        // load the existing row so renewals stack instead of resetting
        const existing = await entityManager.findOne(
            MembershipEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            },
        )
        // base the extension on the later of "now" and any unexpired remaining time
        const now = this.dayjsService.now()
        const base = existing?.currentPeriodEnd
            && this.dayjsService.from(existing.currentPeriodEnd).isAfter(now)
            ? this.dayjsService.from(existing.currentPeriodEnd)
            : now
        const nextPeriodEnd = base.add(months,
            "month").toDate()

        // first-ever payment -> create the row; otherwise mutate in place
        const membership = existing ?? entityManager.create(
            MembershipEntity,
            {
                user: {
                    id: userId,
                },
                autoRenew: false,
            },
        )
        membership.currentPeriodEnd = nextPeriodEnd
        membership.status = MembershipStatus.Active
        await entityManager.save(membership)
    }
}
