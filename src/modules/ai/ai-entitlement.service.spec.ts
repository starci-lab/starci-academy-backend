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
    AiCeilSurface,
    AiMode,
    AiSubStatus,
    AiSubscriptionEntity,
    AiSubTier,
    CreditUsageHistoryEntity,
    TransactionStatus,
} from "@modules/databases"
import {
    MountFilesystemService,
    AiAutoQuotaConfigService,
} from "@modules/filesystem"
import {
    DayjsService,
} from "@modules/mixin"
import {
    AiModeNotEntitledException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
    QueryBuilderMock,
} from "@modules/tests"

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
    preferredMode: null,
    window5hResetAt: futureDate(),
    windowWeekResetAt: futureDate(),
    credit5hUsed: 0,
    creditWeekUsed: 0,
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
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
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
                it("lazily creates a free row and resolves the Auto lane for a new user",
                    async () => {
                        // findOne returns null → loadOrCreate must create + save
                        const result = await service.resolve({
                            userId,
                        })

                        expect(entityManager.create).toHaveBeenCalled()
                        expect(entityManager.save).toHaveBeenCalled()
                        expect(result.mode).toBe(AiMode.Auto)
                        // a brand-new free user has spent nothing → full base allowance
                        expect(result.creditRemaining5h).toBe(BASE_CREDITS_5H)
                        expect(result.creditRemainingWeek).toBe(BASE_CREDITS_WEEK)
                    })

                it("resolves the Premium lane for an active paid subscriber (no requested mode)",
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

                        expect(result.mode).toBe(AiMode.Premium)
                        // remaining = tier cap (overrides base) − used
                        expect(result.creditRemaining5h).toBe(PLUS_CREDITS_5H - 50)
                    })

                it("throws when an explicit Premium mode is requested without an active tier",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(),
                        )

                        await expect(
                            service.resolve({
                                userId,
                                requestedMode: AiMode.Premium,
                            }),
                        ).rejects.toBeInstanceOf(AiModeNotEntitledException)
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

                        // window rolled over → spent counters dropped back to 0
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
                            mode: AiMode.Premium,
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

                it("debits both windows under a pessimistic write lock for Premium",
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
                            mode: AiMode.Premium,
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
                                mode: AiMode.Premium,
                                surface: AiCeilSurface.Grading,
                            }),
                        )
                    })

                it("still records a history row when the locked row is missing (no debit, no crash)",
                    async () => {
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(null)

                        await service.consume({
                            userId,
                            mode: AiMode.Premium,
                            cost: 5,
                            surface: AiCeilSurface.Grading,
                        })

                        // no subscription to debit, but the audit row is still written
                        expect(entityManager.save).toHaveBeenCalledTimes(1)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CreditUsageHistoryEntity,
                            expect.objectContaining({
                                credits: 5,
                            }),
                        )
                    })
            })

        describe("grantTier",
            () => {
                it("is idempotent — a transaction already succeeded is left untouched",
                    async () => {
                        // first findOne (the funding transaction) is already succeeded
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "txn-1",
                            status: TransactionStatus.Succeeded,
                        })

                        await service.grantTier({
                            userId,
                            tier: AiSubTier.Plus,
                            transactionId: "txn-1",
                        })

                        // no subscription mutation, no transaction status flip
                        expect(entityManager.save).not.toHaveBeenCalled()
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("activates the tier and marks the funding transaction succeeded",
                    async () => {
                        const subscription = buildSubscription()
                        entityManager.findOne
                            // funding transaction is still pending
                            .mockResolvedValueOnce({
                                id: "txn-1",
                                status: TransactionStatus.Pending,
                            })
                            // loadOrCreate resolves the user's existing row
                            .mockResolvedValueOnce(subscription)

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
                            },
                            {
                                status: TransactionStatus.Succeeded,
                            },
                        )
                    })
            })

        describe("updateSettings",
            () => {
                it("rejects choosing the Premium lane without an active subscription",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(),
                        )

                        await expect(
                            service.updateSettings({
                                userId,
                                mode: AiMode.Premium,
                            }),
                        ).rejects.toBeInstanceOf(AiModeNotEntitledException)
                    })
            })
    })
