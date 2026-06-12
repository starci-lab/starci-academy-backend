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
    AiMode,
    AiSubStatus,
    AiSubscriptionEntity,
    AiSubTier,
    ModelProvider,
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
    EncryptionService,
} from "@modules/crypto"
import {
    AiByokInvalidException,
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

/** Auto-lane caps the mocked quota config hands back (uses per window). */
const AUTO_USES_5H = 30
const AUTO_USES_WEEK = 100

/** Premium credit caps the mocked tier catalog hands back for {@link AiSubTier.Plus}. */
const PLUS_CREDITS_5H = 250
const PLUS_CREDITS_WEEK = 2500

/** A timestamp safely in the future so lazy window resets do NOT fire. */
const futureDate = (): Date => new Date(Date.now() + 60 * 60 * 1000)

/** A timestamp safely in the past so a lazy window reset DOES fire. */
const pastDate = (): Date => new Date(Date.now() - 60 * 60 * 1000)

/**
 * Build a subscription row with free-lane defaults; pass overrides to model a
 * premium / byok / expired-window state per test.
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
    byokProvider: null,
    byokKeyEncrypted: null,
    preferredMode: null,
    window5hResetAt: futureDate(),
    windowWeekResetAt: futureDate(),
    auto5hUsed: 0,
    autoWeekUsed: 0,
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
        let encryptionService: jest.Mocked<EncryptionService>

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

            // free Auto-lane caps
            aiAutoQuotaConfigService = {
                getAutoQuota: jest.fn(() => ({
                    usesPer5h: AUTO_USES_5H,
                    usesPerWeek: AUTO_USES_WEEK,
                })),
            } as unknown as jest.Mocked<AiAutoQuotaConfigService>

            // BYOK crypto: encrypt returns an opaque payload, decrypt echoes a key
            encryptionService = {
                encrypt: jest.fn(() => ({
                    cipherText: "cipher",
                })),
                decrypt: jest.fn(() => "decrypted-key"),
            } as unknown as jest.Mocked<EncryptionService>

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
                    {
                        provide: EncryptionService,
                        useValue: encryptionService,
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
                        // a brand-new user has spent nothing → full Auto allowance
                        expect(result.autoRemaining5h).toBe(AUTO_USES_5H)
                        expect(result.autoRemainingWeek).toBe(AUTO_USES_WEEK)
                        // no paid tier → premium pool is zero
                        expect(result.creditRemaining5h).toBe(0)
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
                        // remaining = tier cap − used
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

                it("allows an ephemeral BYOK request even when no key is stored",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(),
                        )

                        const result = await service.resolve({
                            userId,
                            requestedMode: AiMode.Byok,
                            ephemeralByok: true,
                        })

                        expect(result.mode).toBe(AiMode.Byok)
                    })

                it("zeroes the counters when the 5h window has elapsed",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription({
                                window5hResetAt: pastDate(),
                                auto5hUsed: 12,
                                credit5hUsed: 7,
                            }),
                        )

                        const result = await service.resolve({
                            userId,
                        })

                        // window rolled over → spent counters dropped back to 0
                        expect(result.autoRemaining5h).toBe(AUTO_USES_5H)
                        const saved = entityManager.save.mock
                            .calls[0][0] as AiSubscriptionEntity
                        expect(saved.auto5hUsed).toBe(0)
                        expect(saved.credit5hUsed).toBe(0)
                    })
            })

        describe("consume",
            () => {
                it("is a no-op for the Auto lane (never opens a transaction)",
                    async () => {
                        await service.consume({
                            userId,
                            mode: AiMode.Auto,
                            cost: 5,
                        })

                        expect(entityManager.transaction).not.toHaveBeenCalled()
                    })

                it("is a no-op when the cost is not positive",
                    async () => {
                        await service.consume({
                            userId,
                            mode: AiMode.Premium,
                            cost: 0,
                        })

                        expect(entityManager.transaction).not.toHaveBeenCalled()
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
                        })

                        // row is locked FOR UPDATE so concurrent debits serialize
                        expect(queryBuilder.setLock).toHaveBeenCalledWith("pessimistic_write")
                        // both sliding windows advanced by the grading cost
                        expect(subscription.credit5hUsed).toBe(15)
                        expect(subscription.creditWeekUsed).toBe(105)
                        expect(entityManager.save).toHaveBeenCalledWith(subscription)
                    })

                it("does nothing when the locked row is missing",
                    async () => {
                        const queryBuilder = entityManager
                            .createQueryBuilder() as unknown as QueryBuilderMock
                        queryBuilder.getOne.mockResolvedValueOnce(null)

                        await service.consume({
                            userId,
                            mode: AiMode.Premium,
                            cost: 5,
                        })

                        expect(entityManager.save).not.toHaveBeenCalled()
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

        describe("getByokApiKey",
            () => {
                it("returns null when no BYOK key is stored",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(),
                        )

                        const result = await service.getByokApiKey({
                            userId,
                        })

                        expect(result).toBeNull()
                        expect(encryptionService.decrypt).not.toHaveBeenCalled()
                    })

                it("decrypts and returns the stored key",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription({
                                byokProvider: ModelProvider.OpenAI,
                                byokKeyEncrypted: JSON.stringify({
                                    cipherText: "cipher",
                                }),
                            }),
                        )

                        const result = await service.getByokApiKey({
                            userId,
                        })

                        expect(result).toBe("decrypted-key")
                        expect(encryptionService.decrypt).toHaveBeenCalledWith({
                            payload: {
                                cipherText: "cipher",
                            },
                        })
                    })
            })

        describe("updateSettings",
            () => {
                it("clears a stored BYOK key and drops a now-orphaned preference",
                    async () => {
                        const subscription = buildSubscription({
                            byokProvider: ModelProvider.OpenAI,
                            byokKeyEncrypted: "stored",
                            preferredMode: AiMode.Byok,
                        })
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.updateSettings({
                            userId,
                            clearByok: true,
                        })

                        expect(subscription.byokProvider).toBeNull()
                        expect(subscription.byokKeyEncrypted).toBeNull()
                        expect(subscription.preferredMode).toBeNull()
                    })

                it("rejects a BYOK key supplied without a provider",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildSubscription(),
                        )

                        await expect(
                            service.updateSettings({
                                userId,
                                byokApiKey: "sk-test",
                            }),
                        ).rejects.toBeInstanceOf(AiByokInvalidException)
                    })

                it("encrypts and stores a provider + key pair",
                    async () => {
                        const subscription = buildSubscription()
                        entityManager.findOne.mockResolvedValueOnce(subscription)

                        await service.updateSettings({
                            userId,
                            byokProvider: ModelProvider.OpenAI,
                            byokApiKey: "sk-test",
                        })

                        expect(encryptionService.encrypt).toHaveBeenCalledWith({
                            plainText: "sk-test",
                        })
                        expect(subscription.byokProvider).toBe(ModelProvider.OpenAI)
                        expect(subscription.byokKeyEncrypted).toBe(
                            JSON.stringify({
                                cipherText: "cipher",
                            }),
                        )
                    })

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
