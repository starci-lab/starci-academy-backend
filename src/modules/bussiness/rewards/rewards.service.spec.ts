import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    RewardsService,
} from "./rewards.service"
import {
    VoucherService,
} from "./voucher.service"
import {
    STREAK_FREEZE_REWARD_KEY,
    AI_CREDIT_BOOST_REWARD_KEY,
    VOUCHER_10_REWARD_KEY,
} from "./rewards.catalog"
import {
    STREAK_FREEZE_MAX,
} from "../streak/streak.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    RewardRedemptionEntity,
} from "@modules/databases/postgresql/primary/entities/reward-redemption.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    RewardRedemptionStatus,
} from "@modules/databases/postgresql/primary/enums/reward-redemption-status"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InsufficientRewardPointsException,
} from "@modules/platform/exceptions/errors/rewards/insufficient-reward-points"
import {
    RewardRedemptionAlreadyCancelledException,
} from "@modules/platform/exceptions/errors/rewards/reward-redemption-already-cancelled"
import {
    RewardRedemptionNotFoundException,
} from "@modules/platform/exceptions/errors/rewards/reward-redemption-not-found"
import {
    RewardRedemptionNotFulfillableException,
} from "@modules/platform/exceptions/errors/rewards/reward-redemption-not-fulfillable"
import {
    UnknownRewardException,
} from "@modules/platform/exceptions/errors/rewards/unknown-reward"
import {
    StreakFreezeLimitReachedException,
} from "@modules/platform/exceptions/errors/streak/streak-freeze-limit-reached"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
    QueryBuilderMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * `computeSpent`/`manager.insert` reach for query-builder + insert surface the
 * shared {@link makeEntityManagerMock} does not model -- extended locally so
 * this file stays the single place that knows about it.
 */
type RewardsEntityManagerMock = EntityManagerMock & {
    insert: jest.Mock
}

type SpentQueryBuilderMock = QueryBuilderMock & {
    select: jest.Mock
    getRawOne: jest.Mock
}

describe("RewardsService",
    () => {
        let module: TestingModule
        let service: RewardsService
        let entityManager: RewardsEntityManagerMock
        let queryBuilder: SpentQueryBuilderMock
        let voucherService: jest.Mocked<VoucherService>
        let aiEntitlementService: jest.Mocked<AiEntitlementService>

        const userId = "user-1"
        const redemptionId = "redemption-1"

        /** Program the `computeSpent` aggregate query to resolve a given sum. */
        const setSpent = (sum: number | undefined) => {
            queryBuilder.getRawOne.mockResolvedValueOnce(
                sum === undefined
                    ? undefined
                    : {
                        sum: String(sum),
                    },
            )
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock() as RewardsEntityManagerMock
            // manager.insert isn't part of the shared mock's surface -- bolt it on
            entityManager.insert = jest.fn().mockResolvedValue({
                identifiers: [
                    {
                        id: redemptionId,
                    },
                ],
            })
            // computeSpent's aggregate query needs `select`/`getRawOne` the shared
            // query-builder mock doesn't carry -- extend the shared builder instance
            queryBuilder = entityManager.createQueryBuilder() as SpentQueryBuilderMock
            queryBuilder.select = jest.fn(() => queryBuilder)
            queryBuilder.getRawOne = jest.fn().mockResolvedValue(undefined)
            // that setup call shouldn't count against a test's own assertions
            entityManager.createQueryBuilder.mockClear()

            voucherService = {
                mint: jest.fn(),
            } as unknown as jest.Mocked<VoucherService>

            aiEntitlementService = {
                grantBonusCredit: jest.fn(),
            } as unknown as jest.Mocked<AiEntitlementService>

            module = await Test.createTestingModule({
                providers: [
                    RewardsService,
                    {
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<RewardsService>(RewardsService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns a wallet with a non-negative derived balance when spending exceeds coins",
            async () => {
                const redemption = {
                    id: redemptionId,
                    status: RewardRedemptionStatus.Pending,
                }
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: userId,
                    coinBalance: 50,
                })
                setSpent(125)
                entityManager.find.mockResolvedValueOnce([redemption])

                const wallet = await service.getWallet(userId)

                expect(wallet).toEqual({
                    balance: 0,
                    spent: 125,
                    redemptions: [redemption],
                })
                expect(queryBuilder.getRawOne).toHaveBeenCalled()
            })

        it("falls back to an unknown reward key when localizing a stored title",
            () => {
                expect(service.titleFor(
                    "not-in-catalog",
                    Locale.En,
                )).toBe("not-in-catalog")
            })

        it("localizes the complete reward catalog for Vietnamese learners",
            () => {
                const catalog = service.getCatalog(Locale.Vi)

                expect(catalog.length).toBeGreaterThan(0)
                expect(catalog.every((reward) => reward.title.length > 0)).toBe(true)
                expect(service.getReward(STREAK_FREEZE_REWARD_KEY)?.key).toBe(STREAK_FREEZE_REWARD_KEY)
            })

        it("localizes catalog titles and descriptions for English learners",
            () => {
                const catalog = service.getCatalog(Locale.En)
                const vietnameseTitle = service.getCatalog(Locale.Vi)
                    .find((reward) => reward.key === STREAK_FREEZE_REWARD_KEY)?.title

                expect(catalog.length).toBeGreaterThan(0)
                expect(catalog.every((reward) => reward.title.length > 0 && reward.description.length > 0)).toBe(true)
                expect(catalog.find((reward) => reward.key === STREAK_FREEZE_REWARD_KEY)?.title).not.toBe(
                    vietnameseTitle,
                )
            })

        it("defaults an absent spent aggregate and empty redemption history",
            async () => {
                entityManager.findOneOrFail.mockResolvedValueOnce({
                    id: userId,
                    coinBalance: 75,
                })
                setSpent(undefined)
                entityManager.find.mockResolvedValueOnce([])

                await expect(service.getWallet(userId)).resolves.toEqual(expect.objectContaining({
                    balance: 75,
                    spent: 0,
                    redemptions: [],
                }))
            })

        describe("redeem",
            () => {
                it("derives balance as coinBalance minus the non-cancelled spent sum",
                    async () => {
                        // 1000 coin, 200 already spent on non-cancelled redemptions,
                        // streakFreeze costs 100 -> affordable with room to spare
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 1000,
                            streakFreezes: 0,
                        } as UserEntity)
                        setSpent(200)

                        const result = await service.redeem({
                            userId,
                            rewardKey: STREAK_FREEZE_REWARD_KEY,
                        })

                        // balance = (1000 - 200) - 100 cost
                        expect(result.balance).toBe(700)
                        // the aggregate excludes cancelled rows from the spent sum
                        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
                            "redemption.status != :cancelled",
                            {
                                cancelled: RewardRedemptionStatus.Cancelled,
                            },
                        )
                    })

                it("throws InsufficientRewardPointsException on overspend and writes nothing",
                    async () => {
                        // 50 coin, nothing spent yet, streakFreeze costs 100 -> short
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 50,
                            streakFreezes: 0,
                        } as UserEntity)
                        setSpent(0)

                        await expect(
                            service.redeem({
                                userId,
                                rewardKey: STREAK_FREEZE_REWARD_KEY,
                            }),
                        ).rejects.toBeInstanceOf(InsufficientRewardPointsException)
                        expect(entityManager.insert).not.toHaveBeenCalled()
                    })

                it("throws StreakFreezeLimitReachedException at the STREAK_FREEZE_MAX cap",
                    async () => {
                        // plenty of coin, but already holding the max streak freezes
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 10000,
                            streakFreezes: STREAK_FREEZE_MAX,
                        } as UserEntity)
                        setSpent(0)

                        await expect(
                            service.redeem({
                                userId,
                                rewardKey: STREAK_FREEZE_REWARD_KEY,
                            }),
                        ).rejects.toBeInstanceOf(StreakFreezeLimitReachedException)
                        // the cap rejects before any write happens
                        expect(entityManager.update).not.toHaveBeenCalled()
                        expect(entityManager.insert).not.toHaveBeenCalled()
                    })

                it("grants a digital reward (streakFreeze) instantly and increments the inventory",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 1000,
                            streakFreezes: 1,
                        } as UserEntity)
                        setSpent(0)

                        const result = await service.redeem({
                            userId,
                            rewardKey: STREAK_FREEZE_REWARD_KEY,
                        })

                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                id: userId,
                            },
                            {
                                streakFreezes: 2,
                            },
                        )
                        expect(entityManager.insert).toHaveBeenCalledWith(
                            RewardRedemptionEntity,
                            expect.objectContaining({
                                status: RewardRedemptionStatus.Granted,
                            }),
                        )
                        expect(result.streakFreezes).toBe(2)
                    })

                it("lands a physical reward as Pending instead of Granted",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 1000,
                            streakFreezes: 0,
                        } as UserEntity)
                        setSpent(0)

                        await service.redeem({
                            userId,
                            rewardKey: "sticker",
                        })

                        expect(entityManager.insert).toHaveBeenCalledWith(
                            RewardRedemptionEntity,
                            expect.objectContaining({
                                status: RewardRedemptionStatus.Pending,
                            }),
                        )
                        // no inventory side-effect for a non-streak-freeze reward
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("mints a voucher and echoes its code for a voucher-kind reward",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 1000,
                            streakFreezes: 0,
                        } as UserEntity)
                        setSpent(0)
                        voucherService.mint.mockResolvedValueOnce({
                            code: "7K4P-QX9M",
                        } as never)

                        const result = await service.redeem({
                            userId,
                            rewardKey: VOUCHER_10_REWARD_KEY,
                        })

                        expect(voucherService.mint).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId,
                                redemptionId,
                            }),
                        )
                        expect(result.voucherCode).toBe("7K4P-QX9M")
                    })

                it("grants bonus AI credit and echoes it for an aiCredit-kind reward",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 1000,
                            streakFreezes: 0,
                        } as UserEntity)
                        setSpent(0)

                        const result = await service.redeem({
                            userId,
                            rewardKey: AI_CREDIT_BOOST_REWARD_KEY,
                        })

                        expect(aiEntitlementService.grantBonusCredit).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId,
                                amount5h: 30,
                                amountWeek: 30,
                            }),
                        )
                        expect(result.aiCreditGranted).toEqual({
                            amount5h: 30,
                            amountWeek: 30,
                        })
                    })

                it("throws UnknownRewardException for an unrecognized catalog key before touching the DB",
                    async () => {
                        await expect(
                            service.redeem({
                                userId,
                                rewardKey: "does-not-exist",
                            }),
                        ).rejects.toBeInstanceOf(UnknownRewardException)
                        expect(entityManager.transaction).not.toHaveBeenCalled()
                    })
            })

        describe("fulfillRedemption",
            () => {
                it("transitions a Pending redemption to Fulfilled",
                    async () => {
                        const redemption = {
                            id: redemptionId,
                            status: RewardRedemptionStatus.Pending,
                        } as RewardRedemptionEntity
                        entityManager.findOne.mockResolvedValueOnce(redemption)

                        const result = await service.fulfillRedemption(redemptionId)

                        expect(result.status).toBe(RewardRedemptionStatus.Fulfilled)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                status: RewardRedemptionStatus.Fulfilled,
                            }),
                        )
                    })

                it("throws RewardRedemptionNotFoundException when the redemption doesn't exist",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.fulfillRedemption(redemptionId),
                        ).rejects.toBeInstanceOf(RewardRedemptionNotFoundException)
                    })

                it("rejects with RewardRedemptionNotFulfillableException when the redemption isn't Pending",
                    async () => {
                        const redemption = {
                            id: redemptionId,
                            status: RewardRedemptionStatus.Granted,
                        } as RewardRedemptionEntity
                        entityManager.findOne.mockResolvedValueOnce(redemption)

                        await expect(
                            service.fulfillRedemption(redemptionId),
                        ).rejects.toBeInstanceOf(RewardRedemptionNotFulfillableException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })
            })

        describe("cancelRedemption",
            () => {
                it("cancels a redemption (the round-3a refund path — cost drops out of the spent sum)",
                    async () => {
                        const redemption = {
                            id: redemptionId,
                            status: RewardRedemptionStatus.Pending,
                        } as RewardRedemptionEntity
                        entityManager.findOne.mockResolvedValueOnce(redemption)

                        const result = await service.cancelRedemption(redemptionId)

                        expect(result.status).toBe(RewardRedemptionStatus.Cancelled)
                        expect(entityManager.save).toHaveBeenCalledWith(
                            expect.objectContaining({
                                status: RewardRedemptionStatus.Cancelled,
                            }),
                        )
                    })

                it("rejects with RewardRedemptionAlreadyCancelledException when already Cancelled",
                    async () => {
                        const redemption = {
                            id: redemptionId,
                            status: RewardRedemptionStatus.Cancelled,
                        } as RewardRedemptionEntity
                        entityManager.findOne.mockResolvedValueOnce(redemption)

                        await expect(
                            service.cancelRedemption(redemptionId),
                        ).rejects.toBeInstanceOf(RewardRedemptionAlreadyCancelledException)
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("throws RewardRedemptionNotFoundException when the redemption doesn't exist",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.cancelRedemption(redemptionId),
                        ).rejects.toBeInstanceOf(RewardRedemptionNotFoundException)
                    })
            })
    })
