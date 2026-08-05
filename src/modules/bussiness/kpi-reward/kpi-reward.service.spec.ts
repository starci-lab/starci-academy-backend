import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    KpiRewardService,
} from "./kpi-reward.service"
import {
    KPI_TARGET_MAX,
} from "./kpi-reward.catalog"
import {
    CoinHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/coin-history.entity"
import {
    KpiWeeklyRewardFloorEntity,
} from "@modules/databases/postgresql/primary/entities/kpi-weekly-reward-floor.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    KpiKey,
} from "@modules/databases/postgresql/primary/enums/kpi-key"
import {
    KpiRewardAlreadyClaimedException,
} from "@modules/platform/exceptions/errors/kpi-reward/kpi-reward-already-claimed"
import {
    KpiRewardNotEligibleException,
} from "@modules/platform/exceptions/errors/kpi-reward/kpi-reward-not-eligible"
import {
    UserStatsProjectionService,
} from "../projections/user-stats/user-stats-projection.service"
import type {
    UserStatsResult,
} from "../projections/user-stats/types"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Build a full {@link UserStatsResult} fixture, overriding only what a case needs. */
const makeStats = (overrides: Partial<UserStatsResult> = {
}): UserStatsResult => ({
    followerCount: 0,
    followingCount: 0,
    unreadNotificationCount: 0,
    streak: 0,
    longestStreak: 0,
    weeklyXp: 0,
    weeklyLessons: 0,
    weeklyChallenges: 0,
    weeklyCoding: 0,
    weeklyFlashcards: 0,
    weeklyMilestones: 0,
    weeklyStudyDays: 0,
    weekResetAt: "",
    last7Days: [],
    ...overrides,
})

describe("KpiRewardService",
    () => {
        let module: TestingModule
        let service: KpiRewardService
        let entityManager: EntityManagerMock
        let userStatsProjectionService: jest.Mocked<UserStatsProjectionService>

        const userId = "user-1"
        const key = KpiKey.Lessons

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // raw `query` backs getCurrentWeekStart/lowerFloor/setTarget's jsonb write
            entityManager.query = jest.fn().mockResolvedValue([])

            userStatsProjectionService = {
                getStats: jest.fn(),
            } as unknown as jest.Mocked<UserStatsProjectionService>

            module = await Test.createTestingModule({
                providers: [
                    KpiRewardService,
                    {
                        provide: UserStatsProjectionService,
                        useValue: userStatsProjectionService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<KpiRewardService>(KpiRewardService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("setTarget",
            () => {
                it("clamps a target above the KPI's max down to KPI_TARGET_MAX[key]",
                    async () => {
                        // StudyDays caps at 7 -- a wildly over-large request must be clamped
                        const result = await service.setTarget({
                            userId,
                            key: KpiKey.StudyDays,
                            target: 100,
                        })

                        expect(result).toBe(KPI_TARGET_MAX[KpiKey.StudyDays])
                    })

                it("clamps a negative target to 0",
                    async () => {
                        const result = await service.setTarget({
                            userId,
                            key,
                            target: -5,
                        })

                        expect(result).toBe(0)
                    })

                it("truncates a fractional target before clamping",
                    async () => {
                        // Math.trunc(4.9) = 4, well within the Lessons max (100)
                        const result = await service.setTarget({
                            userId,
                            key,
                            target: 4.9,
                        })

                        expect(result).toBe(4)
                    })

                it("persists the clamped target via an atomic jsonb_set keyed by the KPI",
                    async () => {
                        await service.setTarget({
                            userId,
                            key,
                            target: 50,
                        })

                        // first query call is the UPDATE ... jsonb_set write
                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("jsonb_set")
                        expect(sql).toContain("weekly_kpi_targets")
                        expect(params).toEqual([
                            userId,
                            `{${key}}`,
                            50,
                        ])
                    })

                it("lowers this week's floor to the new target when the target is non-zero",
                    async () => {
                        await service.setTarget({
                            userId,
                            key,
                            target: 50,
                        })

                        // second query call is lowerFloor's upsert against the floor table
                        expect(entityManager.query).toHaveBeenCalledTimes(2)
                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[1]
                        expect(sql).toContain("kpi_weekly_reward_floors")
                        expect(sql).toContain("LEAST")
                        expect(params).toEqual([
                            userId,
                            key,
                            50,
                        ])
                    })

                it("skips lowering the floor when the target is cleared to zero",
                    async () => {
                        await service.setTarget({
                            userId,
                            key,
                            target: 0,
                        })

                        // only the jsonb_set write happens -- no floor upsert for a clear
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })

                it("skips lowering the floor when a negative target clamps down to zero",
                    async () => {
                        await service.setTarget({
                            userId,
                            key,
                            target: -1,
                        })

                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })
            })

        describe("claimReward",
            () => {
                it("grants the reward and marks the existing floor row claimed",
                    async () => {
                        const floorRow = {
                            id: "floor-1",
                            userId,
                            kpiKey: key,
                            floorTarget: 10,
                            claimedAt: null,
                            coinReward: null,
                        } as KpiWeeklyRewardFloorEntity
                        // #1 findOne: the floor row for this KPI/week already exists
                        entityManager.findOne.mockResolvedValueOnce(floorRow)
                        userStatsProjectionService.getStats.mockResolvedValueOnce(
                            makeStats({
                                weeklyLessons: 10,
                            }),
                        )
                        // #2 findOne: writeCoinHistory's ledger dedupe check -- no prior grant
                        entityManager.findOne.mockResolvedValueOnce(null)
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 42,
                        })

                        const result = await service.claimReward({
                            userId,
                            key,
                        })

                        // Lessons pays 2 coin per unit of floor target: 10 * 2 = 20
                        expect(result).toEqual({
                            balance: 42,
                            coinReward: 20,
                        })
                        expect(floorRow.claimedAt).toBeInstanceOf(Date)
                        expect(floorRow.coinReward).toBe(20)
                        // ledger row appended under the KPI-reward source
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CoinHistoryEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                points: 20,
                            }),
                        )
                        // spendable balance credited exactly once
                        expect(entityManager.increment).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                id: userId,
                            },
                            "coinBalance",
                            20,
                        )
                    })

                it("lazily seeds the floor row from the current target when none exists this week",
                    async () => {
                        // #1 findOne: no floor row for this KPI/week yet
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // findOneOrFail #1: the user's currently self-set target
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            weeklyKpiTargets: {
                                [key]: 8,
                            },
                        })
                        userStatsProjectionService.getStats.mockResolvedValueOnce(
                            makeStats({
                                weeklyLessons: 8,
                            }),
                        )
                        // #2 findOne: writeCoinHistory's ledger dedupe check
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // findOneOrFail #2: the refreshed balance read
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 16,
                        })

                        const result = await service.claimReward({
                            userId,
                            key,
                        })

                        expect(entityManager.create).toHaveBeenCalledWith(
                            KpiWeeklyRewardFloorEntity,
                            expect.objectContaining({
                                userId,
                                kpiKey: key,
                                floorTarget: 8,
                            }),
                        )
                        expect(result.coinReward).toBe(16)
                    })

                it("throws KpiRewardNotEligibleException when no floor row exists and the current target is 0",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            weeklyKpiTargets: {
                            },
                        })

                        await expect(
                            service.claimReward({
                                userId,
                                key,
                            }),
                        ).rejects.toBeInstanceOf(KpiRewardNotEligibleException)
                        // no reward path touched at all
                        expect(entityManager.create).not.toHaveBeenCalled()
                    })

                it("throws KpiRewardAlreadyClaimedException when this week's floor row is already claimed",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "floor-1",
                            userId,
                            kpiKey: key,
                            floorTarget: 10,
                            claimedAt: new Date(),
                            coinReward: 20,
                        })

                        await expect(
                            service.claimReward({
                                userId,
                                key,
                            }),
                        ).rejects.toBeInstanceOf(KpiRewardAlreadyClaimedException)
                        // never re-checked the stats projection for an already-claimed KPI
                        expect(userStatsProjectionService.getStats).not.toHaveBeenCalled()
                    })

                it("throws KpiRewardNotEligibleException when the current value is still below the floor",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "floor-1",
                            userId,
                            kpiKey: key,
                            floorTarget: 10,
                            claimedAt: null,
                            coinReward: null,
                        })
                        userStatsProjectionService.getStats.mockResolvedValueOnce(
                            makeStats({
                                weeklyLessons: 9,
                            }),
                        )

                        await expect(
                            service.claimReward({
                                userId,
                                key,
                            }),
                        ).rejects.toBeInstanceOf(KpiRewardNotEligibleException)
                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })

                it("does not double-credit when the coin-history ledger already has this week's grant",
                    async () => {
                        const floorRow = {
                            id: "floor-1",
                            userId,
                            kpiKey: key,
                            floorTarget: 10,
                            claimedAt: null,
                            coinReward: null,
                        } as KpiWeeklyRewardFloorEntity
                        entityManager.findOne.mockResolvedValueOnce(floorRow)
                        userStatsProjectionService.getStats.mockResolvedValueOnce(
                            makeStats({
                                weeklyLessons: 10,
                            }),
                        )
                        // #2 findOne: a ledger row ALREADY exists for this (source, refId) --
                        // a racing double-claim must not re-credit the balance
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "ledger-existing",
                        })
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 42,
                        })

                        await service.claimReward({
                            userId,
                            key,
                        })

                        expect(entityManager.increment).not.toHaveBeenCalled()
                        // the floor row is still marked claimed so it can't be retried forever
                        expect(floorRow.claimedAt).toBeInstanceOf(Date)
                    })
            })
    })
