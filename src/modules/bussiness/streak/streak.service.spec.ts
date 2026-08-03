import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    StreakService,
    STREAK_FREEZE_COST,
    STREAK_FREEZE_MAX,
} from "./streak.service"
import {
    UserEntity,
} from "@modules/databases"
import {
    StreakFreezeInsufficientPointsException,
    StreakFreezeLimitReachedException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("StreakService",
    () => {
        let module: TestingModule
        let service: StreakService
        let entityManager: EntityManagerMock

        const userId = "user-1"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            module = await Test.createTestingModule({
                providers: [
                    StreakService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<StreakService>(StreakService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("buyStreakFreeze",
            () => {
                it("re-reads the row with a pessimistic write lock so a concurrent buy can't overspend",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 500,
                            streakFreezes: 0,
                        })

                        await service.buyStreakFreeze(userId)

                        expect(entityManager.findOneOrFail).toHaveBeenCalledWith(
                            UserEntity,
                            expect.objectContaining({
                                where: {
                                    id: userId,
                                },
                                lock: {
                                    mode: "pessimistic_write",
                                },
                            }),
                        )
                    })

                it(`throws StreakFreezeLimitReachedException at the ${STREAK_FREEZE_MAX}-freeze cap`,
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 10000,
                            streakFreezes: STREAK_FREEZE_MAX,
                        })

                        await expect(
                            service.buyStreakFreeze(userId),
                        ).rejects.toBeInstanceOf(StreakFreezeLimitReachedException)
                        // a hard stop — no debit is attempted once the cap is hit
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it(`throws StreakFreezeInsufficientPointsException when Coin balance is below ${STREAK_FREEZE_COST}`,
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: STREAK_FREEZE_COST - 1,
                            streakFreezes: 0,
                        })

                        await expect(
                            service.buyStreakFreeze(userId),
                        ).rejects.toBeInstanceOf(StreakFreezeInsufficientPointsException)
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("checks the cap BEFORE affordability — a maxed-out + broke user still gets the cap error",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 0,
                            streakFreezes: STREAK_FREEZE_MAX,
                        })

                        await expect(
                            service.buyStreakFreeze(userId),
                        ).rejects.toBeInstanceOf(StreakFreezeLimitReachedException)
                    })

                it("buys a freeze: debits Coin, credits one freeze, and returns the refreshed values",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 250,
                            streakFreezes: 1,
                        })

                        const result = await service.buyStreakFreeze(userId)

                        // atomic spend: debit Coin by the cost, credit exactly one freeze
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                id: userId,
                            },
                            {
                                coinBalance: 250 - STREAK_FREEZE_COST,
                                streakFreezes: 2,
                            },
                        )
                        expect(result).toEqual({
                            streakFreezes: 2,
                            points: 250 - STREAK_FREEZE_COST,
                        })
                    })

                it("runs the read-check-write inside one transaction",
                    async () => {
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 250,
                            streakFreezes: 0,
                        })

                        await service.buyStreakFreeze(userId)

                        expect(entityManager.transaction).toHaveBeenCalledTimes(1)
                    })
            })
    })
