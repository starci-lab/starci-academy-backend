import {
    ProEntitlementSourceEntity,
} from "@modules/databases/postgresql/primary/entities/pro-entitlement-source.entity"
import {
    ProSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/pro-subscription.entity"
import {
    ProSubscriptionStatus,
} from "@modules/databases/postgresql/primary/enums/pro-subscription-status"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    ProSubscriptionService,
} from "./pro-subscription.service"

describe(
    "ProSubscriptionService",
    () => {
        const createHarness = ({
            claimAffected = 1,
            existing = null,
        }: {
            claimAffected?: number
            existing?: ProSubscriptionEntity | null
        } = {
        }) => {
            const saved: Array<unknown> = []
            const manager = {
                update: jest.fn().mockResolvedValue({
                    affected: claimAffected,
                }),
                query: jest.fn().mockResolvedValue([]),
                findOne: jest.fn().mockResolvedValue(existing),
                create: jest.fn((_entity, data) => ({
                    id: "generated-id",
                    ...data,
                })),
                save: jest.fn(async (entity) => {
                    saved.push(entity)
                    return entity
                }),
            }
            const entityManager = {
                ...manager,
                transaction: jest.fn(async (work) => work(manager)),
            }
            return {
                manager,
                saved,
                service: new ProSubscriptionService(
                    entityManager as never,
                    new DayjsService(),
                ),
            }
        }

        it(
            "claims a pending payment and persists one subscription plus one audit source",
            async () => {
                const harness = createHarness()
                await expect(harness.service.grantPaidPeriod({
                    userId: "user-1",
                    transactionId: "transaction-1",
                    offerRevision: "pro-v1",
                })).resolves.toBe(true)

                expect(harness.manager.query).toHaveBeenCalledWith(
                    "SELECT id FROM users WHERE id = $1 FOR UPDATE",
                    [
                        "user-1",
                    ],
                )
                expect(harness.manager.create).toHaveBeenCalledWith(
                    ProSubscriptionEntity,
                    expect.objectContaining({
                        renewalIntent: false,
                    }),
                )
                expect(harness.manager.create).toHaveBeenCalledWith(
                    ProEntitlementSourceEntity,
                    expect.objectContaining({
                        offerRevision: "pro-v1",
                        transaction: {
                            id: "transaction-1",
                        },
                    }),
                )
                expect(harness.saved).toHaveLength(2)
            },
        )

        it(
            "does not extend access when another settlement path already claimed the transaction",
            async () => {
                const harness = createHarness({
                    claimAffected: 0,
                })
                await expect(harness.service.grantPaidPeriod({
                    userId: "user-1",
                    transactionId: "transaction-1",
                    offerRevision: "pro-v1",
                })).resolves.toBe(false)
                expect(harness.manager.query).not.toHaveBeenCalled()
                expect(harness.manager.save).not.toHaveBeenCalled()
            },
        )

        it(
            "stacks a renewal on the unexpired period and reactivates a cancelled subscription",
            async () => {
                const currentPeriodEnd = new Date(Date.now() + 86_400_000)
                const existing = {
                    id: "subscription-1",
                    currentPeriodEnd,
                    status: ProSubscriptionStatus.CancelledAtPeriodEnd,
                    renewalIntent: false,
                    cancelledAt: new Date(),
                } as ProSubscriptionEntity
                const harness = createHarness({
                    existing,
                })
                await harness.service.grantPaidPeriod({
                    userId: "user-1",
                    transactionId: "transaction-2",
                    offerRevision: "pro-v1",
                })
                expect(existing.status).toBe(ProSubscriptionStatus.Active)
                expect(existing.cancelledAt).toBeNull()
                expect(existing.currentPeriodEnd.getTime()).toBeGreaterThan(currentPeriodEnd.getTime())
            },
        )
    },
)
