import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AiEntitlementService,
} from "./ai-entitlement.service"
import {
    AiSubscriptionEntity,
} from "@modules/databases/postgresql/primary/entities/ai-subscription.entity"
import {
    CreditUsageHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/credit-usage-history.entity"
import {
    AiCeilSurface,
} from "@modules/databases/postgresql/primary/enums/ai-ceil-surface"
import {
    AiSubStatus,
} from "@modules/databases/postgresql/primary/enums/ai-sub-status"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModeNotEntitledException,
} from "@modules/platform/exceptions/errors/ai/ai-mode-not-entitled"
import {
    AiQuotaExhaustedException,
} from "@modules/platform/exceptions/errors/ai/ai-quota-exhausted"
import {
    TIER_ALLOWED_CATEGORIES,
} from "./constants/ai-entitlement.constants"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
    QueryBuilderMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Free base credit caps the mocked quota config hands back (credits per window). */
const BASE_CREDITS_5H = 30
const BASE_CREDITS_WEEK = 100

/** Premium credit caps the mocked tier catalog hands back for {@link AiSubTier.Plus}. */
const PLUS_CREDITS_5H = 250
const PLUS_CREDITS_WEEK = 2500

/** A timestamp safely in the future so lazy window resets do NOT fire. */
const futureDate = (): Date => new Date(Date.now() + 60 * 60 * 1000)

/** A timestamp safely in the past so a lazy window reset DOES fire. */
const pastDate = (): Date => new Date(Date.now() - 60 * 60 * 1000)

/** An ACTIVE paid Plus subscription (the "paid" half of the unlock rule). */
const paidPlus = (): Partial<AiSubscriptionEntity> => ({
    tier: AiSubTier.Plus,
    status: AiSubStatus.Active,
    currentPeriodEnd: futureDate(),
})

/**
 * Build a subscription row with free-lane defaults; pass overrides to model a
 * premium / expired-window state per test.
 */
const buildSubscription = (
    overrides: Partial<AiSubscriptionEntity> = {
    },
): AiSubscriptionEntity => ({
    id: "sub-1",
    tier: null,
    status: AiSubStatus.Active,
    currentPeriodEnd: null,
    autoRenew: false,
    window5hResetAt: futureDate(),
    windowWeekResetAt: futureDate(),
    credit5hUsed: 0,
    creditWeekUsed: 0,
    // Coin-shop aiCredit top-up counters -- default to 0 so the allowance math
    // (limit + bonus) never degrades to NaN when a test omits them
    bonusCredit5h: 0,
    bonusCreditWeek: 0,
    ...overrides,
}) as AiSubscriptionEntity

describe("AiEntitlementService",
    () => {
        let module: TestingModule
        let service: AiEntitlementService
        let entityManager: EntityManagerMock
        let mountFilesystemService: jest.Mocked<Pick<MountFilesystemService, "appConfig">>
        let aiAutoQuotaConfigService: jest.Mocked<AiAutoQuotaConfigService>

        const userId = "user-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // tier catalog: a single Plus tier so findTierConfig resolves credits
            mountFilesystemService = {
                appConfig: jest.fn(() => ({
                    subscriptions: {
                        tiers: [
                            {
                                tier: AiSubTier.Plus,
                                creditsPer5h: PLUS_CREDITS_5H,
                                creditsPerWeek: PLUS_CREDITS_WEEK,
                            },
                        ],
                    },
                })),
            } as unknown as jest.Mocked<Pick<MountFilesystemService, "appConfig">>

            // free base credit caps
            aiAutoQuotaConfigService = {
                getAutoQuota: jest.fn(() => ({
                    creditsPer5h: BASE_CREDITS_5H,
                    creditsPerWeek: BASE_CREDITS_WEEK,
                })),
            } as unknown as jest.Mocked<AiAutoQuotaConfigService>

            module = await Test.createTestingModule({
                providers: [
                    AiEntitlementService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: aiAutoQuotaConfigService,
                    },
                ],
            }).compile()

            service = module.get<AiEntitlementService>(AiEntitlementService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("resolve",
            () => {
                it("lazily creates a free row and resolves the free allowance for a new user",
                    async () => {
                        // findOne returns null -> loadOrCreate must create + save
                        const result = await service.resolve({
                            userId,
                        })

                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                        // a brand-new free user has spent nothing -> full base allowance
                        expect(result.creditRemaining5h).toBe(BASE_CREDITS_5H)
                        expect(result.creditRemainingWeek).toBe(BASE_CREDITS_WEEK)
                    })

                it("resolves the tier allowance for an active paid subscriber",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription({
                                tier: AiSubTier.Plus,
                                status: AiSubStatus.Active,
                                currentPeriodEnd: futureDate(),
                                credit5hUsed: 50,
                            }),
                        )

                        const result = await service.resolve({
                            userId,
                        })

                        // remaining = tier cap (overrides base) − used
                        expect(result.creditRemaining5h).toBe(PLUS_CREDITS_5H - 50)
                    })

                it("zeroes the counters when the 5h window has elapsed",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription({
                                window5hResetAt: pastDate(),
                                credit5hUsed: 7,
                            }),
                        )

                        const result = await service.resolve({
                            userId,
                        })

                        // window rolled over -> spent counters dropped back to 0
                        expect(result.creditRemaining5h).toBe(BASE_CREDITS_5H)
                        const saved = entityManager.save.mock
                            .calls[0][0] as AiSubscriptionEntity
                        expect(saved.credit5hUsed).toBe(0)
                    })
            })

        describe("consume",
            () => {
                it("still records a history row (but skips the debit) when the cost is not positive",
                    async () => {
                        await service.consume({
                            userId,
                            cost: 0,
                            surface: AiCeilSurface.Grading,
                        })

                        // the transaction opens (to write the audit row) but the subscription
                        // is never locked/debited for a zero-cost run
                        expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                credits: 0,
                            }),
                        )
                    })

                it("debits both windows under a pessimistic write lock",
                    async () => {
                        const subscription = buildSubscription({
                            tier: AiSubTier.Plus,
                            status: AiSubStatus.Active,
                            currentPeriodEnd: futureDate(),
                            credit5hUsed: 10,
                            creditWeekUsed: 100,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await service.consume({
                            userId,
                            cost: 5,
                            surface: AiCeilSurface.Grading,
                        })

                        // row is locked FOR UPDATE so concurrent debits serialize
                        expect(queryBuilder.setLock).toHaveBeenCalledWith("pessimistic_write")
                        // both sliding windows advanced by the grading cost
                        expect(subscription.credit5hUsed).toBe(15)
                        expect(subscription.creditWeekUsed).toBe(105)
                        expect(entityManager.save).toHaveBeenCalledWith(subscription)
                        // AND the audit-history row is written atomically alongside the debit
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                credits: 5,
                                surface: AiCeilSurface.Grading,
                            }),
                        )
                    })

                it("creates and debits the subscription on the first paid AI use",
                    async () => {
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(null)

                        await service.consume({
                            userId,
                            cost: 5,
                            surface: AiCeilSurface.Grading,
                        })

                        expect(entityManager.query).toHaveBeenCalledWith(
                            "SELECT id FROM users WHERE id = $1 FOR UPDATE",
                            [
                                userId,
                            ],
                        )
                        expect(entityManager.create).toHaveBeenCalledWith(
                            AiSubscriptionEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                            }),
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                credit5hUsed: 5,
                                creditWeekUsed: 5,
                            }),
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                credits: 5,
                            }),
                        )
                    })

                it("rejects a debit that would exceed the locked 5h allowance without writing history",
                    async () => {
                        const subscription = buildSubscription({
                            credit5hUsed: BASE_CREDITS_5H - 1,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await expect(service.consume({
                            userId,
                            cost: 2,
                            surface: AiCeilSurface.Grading,
                        })).rejects.toBeInstanceOf(AiQuotaExhaustedException)

                        expect(subscription.credit5hUsed).toBe(BASE_CREDITS_5H - 1)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("grantTier",
            () => {
                it("is idempotent — a transaction already succeeded is left untouched",
                    async () => {
                        // grantTier claims via UPDATE ... WHERE status=pending;
                        // a non-pending row loses the claim (0 rows affected)
                        entityManager.update.mockResolvedValueOnce({
                            affected: 0,
                        })

                        await service.grantTier({
                            userId,
                            tier: AiSubTier.Plus,
                            transactionId: "txn-1",
                        })

                        // lost claim -> no subscription mutation
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "txn-1",
                                status: TransactionStatus.Pending,
                            },
                            {
                                status: TransactionStatus.Succeeded,
                            },
                        )
                    })

                it("activates the tier and marks the funding transaction succeeded",
                    async () => {
                        const subscription = buildSubscription()
                        // this call wins the Pending -> Succeeded claim
                        entityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })
                        // loadOrCreate resolves the user's existing row
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.grantTier({
                            userId,
                            tier: AiSubTier.Plus,
                            transactionId: "txn-1",
                        })

                        expect(subscription.tier).toBe(AiSubTier.Plus)
                        expect(subscription.status).toBe(AiSubStatus.Active)
                        expect(subscription.currentPeriodEnd).toBeInstanceOf(Date)
                        expect(entityManager.save).toHaveBeenCalledWith(subscription)
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "txn-1",
                                status: TransactionStatus.Pending,
                            },
                            {
                                status: TransactionStatus.Succeeded,
                            },
                        )
                    })

                it("reports whether THIS call was the one that granted the tier",
                    async () => {
                        entityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription())

                        await expect(service.grantTier({
                            userId,
                            tier: AiSubTier.Pro,
                            transactionId: "txn-2",
                        })).resolves.toBe(true)

                        entityManager.update.mockResolvedValueOnce({
                            affected: 0,
                        })

                        await expect(service.grantTier({
                            userId,
                            tier: AiSubTier.Pro,
                            transactionId: "txn-2",
                        })).resolves.toBe(false)
                    })

                it("turns auto-renew off so a grant funds exactly one billing period",
                    async () => {
                        const subscription = buildSubscription({
                            autoRenew: true,
                        })
                        entityManager.update.mockResolvedValueOnce({
                            affected: 1,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.grantTier({
                            userId,
                            tier: AiSubTier.Max,
                            transactionId: "txn-3",
                        })

                        expect(subscription.autoRenew).toBe(false)
                        expect(subscription.tier).toBe(AiSubTier.Max)
                    })
            })

        // The unlock rule this platform actually runs on: a user reaches the paid
        // model tiers when they have an ACTIVE paid subscription **OR** at least one
        // active enrollment. Neither half alone may be treated as the whole rule --
        // these lock both halves and the neither-case.
        describe("unlock rule (paid OR active enrollment)",
            () => {
                it("unlocks the paid categories for an active paid subscriber who is NOT enrolled",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(paidPlus()),
                        )
                        // no enrollment rows at all
                        entityManager.count.mockResolvedValue(0)

                        await expect(service.resolveTierCategories({
                            userId,
                        })).resolves.toEqual(TIER_ALLOWED_CATEGORIES[AiSubTier.Plus])
                        // the paid half short-circuits -- the enrollment query is not needed
                        expect(entityManager.count).not.toHaveBeenCalled()
                    })

                it("unlocks the SAME paid categories for an enrolled learner who never paid",
                    async () => {
                        // no subscription row at all -> the enrollment half must carry it
                        entityManager.findOne.mockResolvedValueOnce(null)
                        entityManager.count.mockResolvedValueOnce(1)

                        await expect(service.resolveTierCategories({
                            userId,
                        })).resolves.toEqual(TIER_ALLOWED_CATEGORIES[AiSubTier.Plus])
                        expect(entityManager.count).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                    isEnrolled: true,
                                },
                            },
                        )
                    })

                it("falls back to the free categories for a learner who is neither paid nor enrolled",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription())
                        entityManager.count.mockResolvedValueOnce(0)

                        await expect(service.resolveTierCategories({
                            userId,
                        })).resolves.toEqual(TIER_ALLOWED_CATEGORIES.free)
                    })

                it("ignores a TRIAL enrollment row -- only is_enrolled = true counts",
                    async () => {
                        // the query itself pins `isEnrolled: true`, so a trial-only
                        // learner is counted as zero by the database
                        entityManager.count.mockResolvedValueOnce(0)

                        await expect(service.hasAnyActiveEnrollment(userId))
                            .resolves.toBe(false)
                        expect(entityManager.count.mock.calls[0][1]).toEqual({
                            where: {
                                user: {
                                    id: userId,
                                },
                                isEnrolled: true,
                            },
                        })
                    })

                it("counts through a caller-supplied manager so the check can share a transaction",
                    async () => {
                        const outerManager = makeEntityManagerMock()
                        outerManager.count.mockResolvedValueOnce(2)

                        await expect(service.hasAnyActiveEnrollment(
                            userId,
                            outerManager as never,
                        )).resolves.toBe(true)
                        expect(entityManager.count).not.toHaveBeenCalled()
                    })

                describe("assertCanUsePaidModels",
                    () => {
                        it("passes for an active paid subscriber",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(
                                    buildSubscription(paidPlus()),
                                )

                                await expect(service.assertCanUsePaidModels({
                                    userId,
                                })).resolves.toBeUndefined()
                            })

                        it("passes for an enrolled learner who never paid",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(null)
                                entityManager.count.mockResolvedValueOnce(1)

                                await expect(service.assertCanUsePaidModels({
                                    userId,
                                })).resolves.toBeUndefined()
                            })

                        it("rejects a learner who is neither paid nor enrolled",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(buildSubscription())
                                entityManager.count.mockResolvedValueOnce(0)

                                const error = await service.assertCanUsePaidModels({
                                    userId,
                                }).catch((thrown: unknown) => thrown)

                                expect(error).toBeInstanceOf(AiModeNotEntitledException)
                                expect((error as AiModeNotEntitledException).metadata).toMatchObject({
                                    reason: "no active paid subscription or enrollment",
                                })
                            })
                    })

                describe("isPremiumActive (the paid half)",
                    () => {
                        it("does not treat a cancelled subscription as paid",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(
                                    buildSubscription({
                                        ...paidPlus(),
                                        status: AiSubStatus.Cancelled,
                                    }),
                                )
                                entityManager.count.mockResolvedValueOnce(0)

                                await expect(service.resolveTierCategories({
                                    userId,
                                })).resolves.toEqual(TIER_ALLOWED_CATEGORIES.free)
                            })

                        it("does not treat a lapsed billing period as paid",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(
                                    buildSubscription({
                                        ...paidPlus(),
                                        currentPeriodEnd: pastDate(),
                                    }),
                                )
                                entityManager.count.mockResolvedValueOnce(0)

                                await expect(service.resolveTierCategories({
                                    userId,
                                })).resolves.toEqual(TIER_ALLOWED_CATEGORIES.free)
                            })

                        it("does not treat a tier with no period end as paid",
                            async () => {
                                entityManager.findOne.mockResolvedValueOnce(
                                    buildSubscription({
                                        tier: AiSubTier.Plus,
                                        status: AiSubStatus.Active,
                                        currentPeriodEnd: null,
                                    }),
                                )
                                entityManager.count.mockResolvedValueOnce(0)

                                await expect(service.resolveTierCategories({
                                    userId,
                                })).resolves.toEqual(TIER_ALLOWED_CATEGORIES.free)
                            })

                        it("spends the FREE base allowance for an enrolled-but-unpaid learner",
                            async () => {
                                // the unlock rule opens the model tiers, but the credit
                                // allowance still follows the actual (absent) paid tier
                                entityManager.findOne.mockResolvedValueOnce(buildSubscription())
                                entityManager.count.mockResolvedValueOnce(1)

                                const result = await service.snapshot({
                                    userId,
                                })

                                expect(result.tier).toBeNull()
                                expect(result.credit.limit5h).toBe(BASE_CREDITS_5H)
                                expect(result.credit.limitWeek).toBe(BASE_CREDITS_WEEK)
                                // ...while the model ceiling is the unlocked one
                                expect(result.allowedCategories)
                                    .toEqual(TIER_ALLOWED_CATEGORIES[AiSubTier.Plus])
                            })
                    })
            })

        describe("getSettings",
            () => {
                it("reports canPremium for an active paid subscriber, with the tier named",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(paidPlus()),
                        )

                        await expect(service.getSettings({
                            userId,
                        })).resolves.toEqual({
                            canPremium: true,
                            tier: AiSubTier.Plus,
                        })
                    })

                it("reports canPremium with a NULL tier for an enrolled learner who never paid",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription())
                        entityManager.count.mockResolvedValueOnce(1)

                        await expect(service.getSettings({
                            userId,
                        })).resolves.toEqual({
                            canPremium: true,
                            tier: null,
                        })
                    })

                it("refuses canPremium for a learner who is neither paid nor enrolled",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription())
                        entityManager.count.mockResolvedValueOnce(0)

                        await expect(service.getSettings({
                            userId,
                        })).resolves.toEqual({
                            canPremium: false,
                            tier: null,
                        })
                    })
            })

        describe("snapshot",
            () => {
                it("reports both windows, the reset times and an empty ceiling for a fresh free user",
                    async () => {
                        const subscription = buildSubscription({
                            credit5hUsed: 4,
                            creditWeekUsed: 9,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)
                        entityManager.count.mockResolvedValueOnce(0)

                        const result = await service.snapshot({
                            userId,
                        })

                        expect(result.credit).toEqual({
                            limit5h: BASE_CREDITS_5H,
                            used5h: 4,
                            remaining5h: BASE_CREDITS_5H - 4,
                            limitWeek: BASE_CREDITS_WEEK,
                            usedWeek: 9,
                            remainingWeek: BASE_CREDITS_WEEK - 9,
                        })
                        expect(result.window5hResetAt).toBe(subscription.window5hResetAt)
                        expect(result.windowWeekResetAt).toBe(subscription.windowWeekResetAt)
                        expect(result.ceil).toEqual({
                            default: null,
                            chatbot: null,
                            grading: null,
                            interview: null,
                        })
                        expect(result.allowedCategories).toEqual(TIER_ALLOWED_CATEGORIES.free)
                    })

                it("folds the Coin-shop bonus into the shown limit and floors remaining at zero",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            bonusCredit5h: 10,
                            bonusCreditWeek: 20,
                            // overspent beyond even the bonus-extended cap
                            credit5hUsed: BASE_CREDITS_5H + 999,
                            creditWeekUsed: BASE_CREDITS_WEEK + 999,
                        }))
                        entityManager.count.mockResolvedValueOnce(0)

                        const result = await service.snapshot({
                            userId,
                        })

                        expect(result.credit.limit5h).toBe(BASE_CREDITS_5H + 10)
                        expect(result.credit.limitWeek).toBe(BASE_CREDITS_WEEK + 20)
                        expect(result.credit.remaining5h).toBe(0)
                        expect(result.credit.remainingWeek).toBe(0)
                    })

                it("surfaces the per-surface ceiling the user saved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Low,
                                grading: AiModelCategory.High,
                            },
                        }))
                        entityManager.count.mockResolvedValueOnce(0)

                        const result = await service.snapshot({
                            userId,
                        })

                        expect(result.ceil).toEqual({
                            default: AiModelCategory.Low,
                            chatbot: null,
                            grading: AiModelCategory.High,
                            interview: null,
                        })
                    })
            })

        describe("assertNotOverQuota",
            () => {
                it("passes while both windows still have room",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            credit5hUsed: 1,
                            creditWeekUsed: 1,
                        }))
                        entityManager.count.mockResolvedValueOnce(0)

                        await expect(service.assertNotOverQuota({
                            userId,
                        })).resolves.toBeUndefined()
                    })

                it("blocks on the exhausted 5h window",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            credit5hUsed: BASE_CREDITS_5H,
                        }))
                        entityManager.count.mockResolvedValueOnce(0)

                        const error = await service.assertNotOverQuota({
                            userId,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(AiQuotaExhaustedException)
                        expect((error as AiQuotaExhaustedException).metadata).toMatchObject({
                            window: "5h",
                        })
                    })

                it("blocks on the exhausted weekly window even when the 5h window has room",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            credit5hUsed: 0,
                            creditWeekUsed: BASE_CREDITS_WEEK,
                        }))
                        entityManager.count.mockResolvedValueOnce(0)

                        const error = await service.assertNotOverQuota({
                            userId,
                        }).catch((thrown: unknown) => thrown)

                        expect((error as AiQuotaExhaustedException).metadata).toMatchObject({
                            window: "week",
                        })
                    })

                it("lets a PAID subscriber through a spend that would exhaust the free base",
                    async () => {
                        // the regression this method exists for: the old free-base-only
                        // check blocked a paid user at the free cap
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ...paidPlus(),
                            credit5hUsed: BASE_CREDITS_5H + 1,
                            creditWeekUsed: BASE_CREDITS_WEEK + 1,
                        }))

                        await expect(service.assertNotOverQuota({
                            userId,
                        })).resolves.toBeUndefined()
                    })
            })

        describe("window resets",
            () => {
                it("zeroes the weekly counter AND its bonus when the weekly window elapsed",
                    async () => {
                        const subscription = buildSubscription({
                            windowWeekResetAt: pastDate(),
                            creditWeekUsed: 42,
                            bonusCreditWeek: 7,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        const result = await service.resolve({
                            userId,
                        })

                        expect(subscription.creditWeekUsed).toBe(0)
                        // a Coin-shop top-up funds the CURRENT cycle only
                        expect(subscription.bonusCreditWeek).toBe(0)
                        expect(subscription.windowWeekResetAt).toBeInstanceOf(Date)
                        expect(result.creditRemainingWeek).toBe(BASE_CREDITS_WEEK)
                    })

                it("initialises a window whose reset timestamp was never set",
                    async () => {
                        const subscription = buildSubscription({
                            window5hResetAt: null,
                            windowWeekResetAt: null,
                            credit5hUsed: 3,
                            bonusCredit5h: 5,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.resolve({
                            userId,
                        })

                        expect(subscription.window5hResetAt).toBeInstanceOf(Date)
                        expect(subscription.windowWeekResetAt).toBeInstanceOf(Date)
                        expect(subscription.credit5hUsed).toBe(0)
                        expect(subscription.bonusCredit5h).toBe(0)
                    })
            })

        describe("consume (allowance boundaries + attribution)",
            () => {
                it("rejects a debit that would exceed the weekly allowance",
                    async () => {
                        const subscription = buildSubscription({
                            creditWeekUsed: BASE_CREDITS_WEEK,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        const error = await service.consume({
                            userId,
                            cost: 1,
                            surface: AiCeilSurface.Chatbot,
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(AiQuotaExhaustedException)
                        expect((error as AiQuotaExhaustedException).metadata).toMatchObject({
                            window: "week",
                        })
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("allows a debit that lands exactly on the allowance (boundary)",
                    async () => {
                        const subscription = buildSubscription({
                            credit5hUsed: BASE_CREDITS_5H - 2,
                            creditWeekUsed: 0,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await service.consume({
                            userId,
                            cost: 2,
                            surface: AiCeilSurface.Chatbot,
                        })

                        expect(subscription.credit5hUsed).toBe(BASE_CREDITS_5H)
                    })

                it("spends the Coin-shop bonus before refusing the debit",
                    async () => {
                        const subscription = buildSubscription({
                            credit5hUsed: BASE_CREDITS_5H,
                            bonusCredit5h: 5,
                            bonusCreditWeek: 5,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await service.consume({
                            userId,
                            cost: 5,
                            surface: AiCeilSurface.Interview,
                        })

                        expect(subscription.credit5hUsed).toBe(BASE_CREDITS_5H + 5)
                    })

                it("records the full attribution of a billed run on the audit row",
                    async () => {
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(buildSubscription())

                        await service.consume({
                            userId,
                            cost: 3,
                            surface: AiCeilSurface.Grading,
                            model: "gpt-5-mini",
                            provider: "openai",
                            recommendation: "medium",
                            promptTokens: 1200,
                            completionTokens: 300,
                            attempts: 2,
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                surface: AiCeilSurface.Grading,
                                model: "gpt-5-mini",
                                provider: "openai",
                                recommendation: "medium",
                                credits: 3,
                                promptTokens: 1200,
                                completionTokens: 300,
                                attempts: 2,
                            }),
                        )
                    })

                it("normalizes every omitted attribution field to null on the audit row",
                    async () => {
                        await service.consume({
                            userId,
                            cost: 0,
                            surface: AiCeilSurface.Chatbot,
                        })

                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                task: null,
                                recommendation: null,
                                model: null,
                                provider: null,
                                promptTokens: null,
                                completionTokens: null,
                                attempts: null,
                            }),
                        )
                    })

                it("charges an ACTIVE paid subscriber against the tier cap, not the free base",
                    async () => {
                        const subscription = buildSubscription({
                            ...paidPlus(),
                            credit5hUsed: BASE_CREDITS_5H + 10,
                            creditWeekUsed: BASE_CREDITS_WEEK + 10,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await service.consume({
                            userId,
                            cost: 1,
                            surface: AiCeilSurface.Grading,
                        })

                        expect(subscription.credit5hUsed).toBe(BASE_CREDITS_5H + 11)
                    })

                it("charges a LAPSED subscriber against the free base again",
                    async () => {
                        const subscription = buildSubscription({
                            ...paidPlus(),
                            currentPeriodEnd: pastDate(),
                            credit5hUsed: BASE_CREDITS_5H,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await expect(service.consume({
                            userId,
                            cost: 1,
                            surface: AiCeilSurface.Grading,
                        })).rejects.toBeInstanceOf(AiQuotaExhaustedException)
                    })

                it("falls back to the base allowance when the tier is not in the mounted catalog",
                    async () => {
                        // an active Max subscription with no Max entry in the catalog
                        const subscription = buildSubscription({
                            tier: AiSubTier.Max,
                            status: AiSubStatus.Active,
                            currentPeriodEnd: futureDate(),
                            credit5hUsed: BASE_CREDITS_5H,
                        })
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await expect(service.consume({
                            userId,
                            cost: 1,
                            surface: AiCeilSurface.Grading,
                        })).rejects.toBeInstanceOf(AiQuotaExhaustedException)
                    })
            })

        describe("history",
            () => {
                it("returns the requested page newest-first with the total row count",
                    async () => {
                        const createdAt = new Date("2026-08-19T00:00:00.000Z")
                        entityManager.findAndCount.mockResolvedValueOnce([
                            [
                                {
                                    id: "row-1",
                                    recommendation: "medium",
                                    model: "gpt-5-mini",
                                    provider: "openai",
                                    credits: 3,
                                    createdAt,
                                    surface: AiCeilSurface.Grading,
                                    // not part of the public item shape
                                    promptTokens: 100,
                                },
                            ],
                            7,
                        ])

                        const page = await service.history({
                            userId,
                            limit: 10,
                            offset: 20,
                        })

                        expect(page).toEqual({
                            items: [
                                {
                                    id: "row-1",
                                    recommendation: "medium",
                                    model: "gpt-5-mini",
                                    provider: "openai",
                                    credits: 3,
                                    createdAt,
                                    surface: AiCeilSurface.Grading,
                                },
                            ],
                            total: 7,
                        })
                        expect(entityManager.findAndCount).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            {
                                where: {
                                    user: {
                                        id: userId,
                                    },
                                },
                                order: {
                                    createdAt: "DESC",
                                },
                                take: 10,
                                skip: 20,
                            },
                        )
                    })
            })

        describe("grantBonusCredit",
            () => {
                it("locks the row, adds to both windows and returns the post-grant totals",
                    async () => {
                        const outerManager = makeEntityManagerMock()
                        const subscription = buildSubscription({
                            bonusCredit5h: 2,
                            bonusCreditWeek: 3,
                        })
                        const queryBuilder = outerManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        await expect(service.grantBonusCredit({
                            userId,
                            amount5h: 10,
                            amountWeek: 100,
                            entityManager: outerManager as never,
                        })).resolves.toEqual({
                            bonusCredit5h: 12,
                            bonusCreditWeek: 103,
                        })

                        expect(queryBuilder.setLock).toHaveBeenCalledWith("pessimistic_write")
                        expect(outerManager.save).toHaveBeenCalledWith(subscription)
                        // the grant runs entirely on the caller's transaction
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("creates the subscription when the user has never had one",
                    async () => {
                        const outerManager = makeEntityManagerMock()
                        const queryBuilder = outerManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(null)
                        outerManager.findOne.mockResolvedValueOnce(null)

                        const result = await service.grantBonusCredit({
                            userId,
                            amount5h: 5,
                            amountWeek: 50,
                            entityManager: outerManager as never,
                        })

                        expect(outerManager.create).toHaveBeenCalled()
                        expect(result).toEqual({
                            bonusCredit5h: 5,
                            bonusCreditWeek: 50,
                        })
                    })

                it("rolls a due window reset forward FIRST so the bonus lands in the live window",
                    async () => {
                        const outerManager = makeEntityManagerMock()
                        const subscription = buildSubscription({
                            window5hResetAt: pastDate(),
                            bonusCredit5h: 99,
                            credit5hUsed: 40,
                        })
                        const queryBuilder = outerManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(subscription)

                        const result = await service.grantBonusCredit({
                            userId,
                            amount5h: 10,
                            amountWeek: 0,
                            entityManager: outerManager as never,
                        })

                        // the about-to-expire 99 is reset away, then the 10 is added
                        expect(result.bonusCredit5h).toBe(10)
                        expect(subscription.credit5hUsed).toBe(0)
                    })
            })

        describe("resolveCeil",
            () => {
                it("returns null when the user has no subscription row",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(service.resolveCeil({
                            userId,
                            surface: AiCeilSurface.Grading,
                        })).resolves.toBeNull()
                    })

                it("returns null when the row carries no overrides",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: null,
                        }))

                        await expect(service.resolveCeil({
                            userId,
                        })).resolves.toBeNull()
                    })

                it("prefers the surface override over the global default",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Low,
                                grading: AiModelCategory.High,
                            },
                        }))

                        await expect(service.resolveCeil({
                            userId,
                            surface: AiCeilSurface.Grading,
                        })).resolves.toBe(AiModelCategory.High)
                    })

                it("falls back to the global default when that surface has no override",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Medium,
                            },
                        }))

                        await expect(service.resolveCeil({
                            userId,
                            surface: AiCeilSurface.Interview,
                        })).resolves.toBe(AiModelCategory.Medium)
                    })

                it("reads just the global default when no surface is named",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Medium,
                                chatbot: AiModelCategory.Low,
                            },
                        }))

                        await expect(service.resolveCeil({
                            userId,
                        })).resolves.toBe(AiModelCategory.Medium)
                    })

                it("returns null (uncapped) when only another surface is capped",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(buildSubscription({
                            ceilOverrides: {
                                chatbot: AiModelCategory.Low,
                            },
                        }))

                        await expect(service.resolveCeil({
                            userId,
                            surface: AiCeilSurface.Grading,
                        })).resolves.toBeNull()
                    })
            })

        describe("setCeil",
            () => {
                it("sets one surface's ceiling while keeping the others",
                    async () => {
                        const subscription = buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Low,
                            },
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        const result = await service.setCeil({
                            userId,
                            surface: AiCeilSurface.Grading,
                            category: AiModelCategory.High,
                        })

                        expect(subscription.ceilOverrides).toEqual({
                            default: AiModelCategory.Low,
                            grading: AiModelCategory.High,
                        })
                        expect(entityManager.save).toHaveBeenCalledWith(subscription)
                        expect(result.ceil.grading).toBe(AiModelCategory.High)
                    })

                it("writes the GLOBAL default when no surface is named",
                    async () => {
                        const subscription = buildSubscription({
                            ceilOverrides: null,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.setCeil({
                            userId,
                            category: AiModelCategory.Medium,
                        })

                        expect(subscription.ceilOverrides).toEqual({
                            default: AiModelCategory.Medium,
                        })
                    })

                it("clears one key with a null category and keeps the rest of the map",
                    async () => {
                        const subscription = buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Low,
                                grading: AiModelCategory.High,
                            },
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        const result = await service.setCeil({
                            userId,
                            surface: AiCeilSurface.Grading,
                            category: null,
                        })

                        expect(subscription.ceilOverrides).toEqual({
                            default: AiModelCategory.Low,
                        })
                        expect(result.ceil.grading).toBeNull()
                    })

                it("drops the overrides map to NULL once the last key is cleared",
                    async () => {
                        const subscription = buildSubscription({
                            ceilOverrides: {
                                default: AiModelCategory.Low,
                            },
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.setCeil({
                            userId,
                        })

                        expect(subscription.ceilOverrides).toBeNull()
                    })

                it("applies a due window reset before echoing the refreshed snapshot",
                    async () => {
                        const subscription = buildSubscription({
                            window5hResetAt: pastDate(),
                            credit5hUsed: 12,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        const result = await service.setCeil({
                            userId,
                            category: AiModelCategory.Low,
                        })

                        expect(subscription.credit5hUsed).toBe(0)
                        expect(result.credit.used5h).toBe(0)
                    })

                it("echoes a snapshot whose allowedCategories are computed WITHOUT the unlock check",
                    async () => {
                        // DIVERGENCE, reported not blessed: `snapshot()` resolves
                        // `unlocked` (paid OR enrolled) and reports the unlocked
                        // ceiling; `setCeil` calls the same builder with no
                        // `unlocked` argument, so an active paid subscriber is
                        // echoed the FREE ceiling next to their own paid `tier`.
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(paidPlus()),
                        )

                        const result = await service.setCeil({
                            userId,
                            category: AiModelCategory.Low,
                        })

                        expect(result.tier).toBe(AiSubTier.Plus)
                        expect(result.allowedCategories).toEqual(TIER_ALLOWED_CATEGORIES.free)
                        // ...while the read path reports the unlocked ceiling for the
                        // very same row
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(paidPlus()),
                        )
                        const read = await service.snapshot({
                            userId,
                        })
                        expect(read.allowedCategories)
                            .toEqual(TIER_ALLOWED_CATEGORIES[AiSubTier.Plus])
                    })
            })
    })
