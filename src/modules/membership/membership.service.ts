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
    InjectPrimaryPostgreSQLEntityManager,
    MembershipEntity,
    MembershipStatus,
    TransactionEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    DayjsService,
} from "@modules/mixin"
import {
    MEMBERSHIP_PERIOD_MONTHS,
} from "./constants"
import type {
    ExpireDueMembershipsResult,
    ExtendPeriodParams,
    GrantFreeMonthsParams,
    GrantMembershipParams,
} from "./types"

/**
 * Owns community-membership entitlement: granting/extending on payment,
 * checking whether a user is currently a member, and the expiry sweep.
 *
 * @example
 * await membershipService.grantMembership({ userId, transactionId })
 * const member = await membershipService.isActive(userId)
 */
@Injectable()
export class MembershipService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) { }

    /**
     * Grant or extend a membership on successful payment and mark the funding
     * transaction succeeded — both inside one DB transaction. Idempotent: a
     * transaction already marked succeeded is left untouched so webhook retries
     * (and the reconcile poll) never double-extend the period.
     *
     * @param params - the owning `userId` and the `transactionId` that funded it
     */
    async grantMembership({
        userId,
        transactionId,
    }: GrantMembershipParams): Promise<void> {
        await this.entityManager.transaction(
            async (entityManager) => {
                // idempotency guard — skip if this payment was already applied
                const transaction = await entityManager.findOne(
                    TransactionEntity,
                    {
                        where: {
                            id: transactionId,
                        },
                    },
                )
                if (transaction?.status === TransactionStatus.Succeeded) {
                    return
                }

                // extend the period by one billing cycle, stacking on any time left
                await this.extendPeriod({
                    userId,
                    months: MEMBERSHIP_PERIOD_MONTHS,
                    entityManager,
                })

                // mark the funding transaction succeeded in the same unit of work
                await entityManager.update(
                    TransactionEntity,
                    {
                        id: transactionId,
                    },
                    {
                        status: TransactionStatus.Succeeded,
                    },
                )
            },
        )
    }

    /**
     * Grant free membership months not tied to a payment — used by the
     * "buy a course → get N months free" reverse funnel. Stacks on any time
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
        // no row → never a member
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

        // first-ever payment → create the row; otherwise mutate in place
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
