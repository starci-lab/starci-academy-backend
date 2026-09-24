import {
    ProEntitlementSourceEntity,
} from "@modules/databases/postgresql/primary/entities/pro-entitlement-source.entity"
import {
    ProSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/pro-subscription.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ProSubscriptionStatus,
} from "@modules/databases/postgresql/primary/enums/pro-subscription-status"
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
    Injectable,
} from "@nestjs/common"
import {
    In,
    LessThanOrEqual,
} from "typeorm"
import type {
    EntityManager,
} from "typeorm"

/** Funding transaction and catalog revision used to grant one paid period. */
export interface GrantProSubscriptionParams {
    userId: string
    transactionId: string
    offerRevision: string
}

@Injectable()
/** Owns the dedicated Pro lifecycle without rewriting legacy entitlements. */
export class ProSubscriptionService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly dayjsService: DayjsService,
    ) {}

    async findForUser(userId: string): Promise<ProSubscriptionEntity | null> {
        return this.entityManager.findOne(ProSubscriptionEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                },
            })
    }

    async isActive(userId: string): Promise<boolean> {
        const subscription = await this.findForUser(userId)
        return Boolean(
            subscription
            && subscription.status !== ProSubscriptionStatus.Expired
            && this.dayjsService.from(subscription.currentPeriodEnd).isAfter(this.dayjsService.now()),
        )
    }

    async grantPaidPeriod({
        userId,
        transactionId,
        offerRevision,
    }: GrantProSubscriptionParams): Promise<boolean> {
        return this.entityManager.transaction(async (manager) => {
            const claim = await manager.update(
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
                return false
            }

            // A user row always exists and is the serialization anchor even for
            // the first Pro purchase, before a subscription row can be locked.
            await manager.query(
                "SELECT id FROM users WHERE id = $1 FOR UPDATE",
                [
                    userId,
                ],
            )

            const existing = await manager.findOne(ProSubscriptionEntity,
                {
                    where: {
                        user: {
                            id: userId,
                        },
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                })
            const now = this.dayjsService.now()
            const periodStart = existing
                && this.dayjsService.from(existing.currentPeriodEnd).isAfter(now)
                ? this.dayjsService.from(existing.currentPeriodEnd)
                : now
            const periodEnd = periodStart.add(1,
                "month")
            const subscription = existing ?? manager.create(ProSubscriptionEntity,
                {
                    user: {
                        id: userId,
                    },
                    accessVersion: 1,
                    renewalIntent: false,
                })
            subscription.status = ProSubscriptionStatus.Active
            subscription.currentPeriodEnd = periodEnd.toDate()
            subscription.cancelledAt = null
            await manager.save(subscription)

            await manager.save(manager.create(ProEntitlementSourceEntity,
                {
                    user: {
                        id: userId,
                    },
                    transaction: {
                        id: transactionId,
                    },
                    periodStart: periodStart.toDate(),
                    periodEnd: periodEnd.toDate(),
                    offerRevision,
                }))
            return true
        })
    }

    async cancelAtPeriodEnd(userId: string): Promise<ProSubscriptionEntity | null> {
        const subscription = await this.findForUser(userId)
        if (!subscription || !await this.isActive(userId)) {
            return subscription
        }
        subscription.renewalIntent = false
        subscription.status = ProSubscriptionStatus.CancelledAtPeriodEnd
        subscription.cancelledAt = this.dayjsService.now().toDate()
        return this.entityManager.save(subscription)
    }

    async expireDue(): Promise<number> {
        const result = await this.entityManager.update(
            ProSubscriptionEntity,
            {
                status: In([
                    ProSubscriptionStatus.Active,
                    ProSubscriptionStatus.CancelledAtPeriodEnd,
                ]),
                currentPeriodEnd: LessThanOrEqual(this.dayjsService.now().toDate()),
            },
            {
                status: ProSubscriptionStatus.Expired,
                renewalIntent: false,
            },
        )
        return result.affected ?? 0
    }
}
