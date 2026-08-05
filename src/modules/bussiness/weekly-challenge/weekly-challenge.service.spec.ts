import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    WeeklyChallengeService,
} from "./weekly-challenge.service"
import {
    WEEKLY_CHALLENGE_REWARD_COIN,
} from "./weekly-challenge.catalog"
import {
    ChallengeEntity,
    CoinHistoryEntity,
    UserEntity,
    WeeklyChallengeClaimEntity,
} from "@modules/databases"
import {
    WeeklyChallengeRewardAlreadyClaimedException,
    WeeklyChallengeRewardNotEligibleException,
} from "@modules/exceptions"
import {
    toGlobalId,
} from "@modules/routing"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("WeeklyChallengeService",
    () => {
        let module: TestingModule
        let service: WeeklyChallengeService
        let entityManager: EntityManagerMock

        const userId = "user-1"
        const challengeId = "chal-1"
        const weekStartIso = "2026-08-03T00:00:00.000Z"

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            entityManager.query = jest.fn().mockResolvedValue([])

            module = await Test.createTestingModule({
                providers: [
                    WeeklyChallengeService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<WeeklyChallengeService>(WeeklyChallengeService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("getWeeklyChallenge — deterministic pick",
            () => {
                it("returns null when there are no challenges at all",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(0)

                        const result = await service.getWeeklyChallenge(null)

                        expect(result).toBeNull()
                        // never attempts a pick against an empty pool
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("picks deterministically by id-ASC order offset by the ISO week number",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_end: "2026-08-09T16:59:59.999Z",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([])

                        await service.getWeeklyChallenge(null)

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("ORDER BY c.id ASC")
                        expect(sql).toContain("EXTRACT(WEEK FROM now())")
                        expect(params).toEqual([
                            1,
                        ])
                    })

                it("returns null defensively when the pick yields no row despite a non-empty pool",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getWeeklyChallenge(null)

                        expect(result).toBeNull()
                        // stops right after the empty pick -- never queries week-end/passers
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })

                it("builds the anonymous view — no pass/claim lookups, coinReward null",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_end: "2026-08-09T16:59:59.999Z",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([])

                        const result = await service.getWeeklyChallenge(null)

                        expect(result).toEqual(
                            expect.objectContaining({
                                challengeGlobalId: toGlobalId(ChallengeEntity.name,
                                    challengeId),
                                title: "Two Sum",
                                viewerPassed: false,
                                passedCount: 0,
                                leaderboard: [],
                                claimed: false,
                                coinReward: null,
                            }),
                        )
                        // anonymous viewer never triggers the pass/claim queries
                        expect(entityManager.query).toHaveBeenCalledTimes(3)
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("marks an authed viewer as passed + already claimed and reports the coin reward",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_end: "2026-08-09T16:59:59.999Z",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([])
                        // didViewerPass
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: true,
                            },
                        ])
                        // getWeekStart (inside hasClaimed)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_start: weekStartIso,
                            },
                        ])
                        // hasClaimed's findOne: a claim row already exists this week
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "claim-1",
                        })

                        const result = await service.getWeeklyChallenge(userId)

                        expect(result?.viewerPassed).toBe(true)
                        expect(result?.claimed).toBe(true)
                        expect(result?.coinReward).toBe(WEEKLY_CHALLENGE_REWARD_COIN)
                    })

                it("reports viewerPassed but NOT claimed when no claim row exists yet",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_end: "2026-08-09T16:59:59.999Z",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: true,
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_start: weekStartIso,
                            },
                        ])
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const result = await service.getWeeklyChallenge(userId)

                        expect(result?.viewerPassed).toBe(true)
                        expect(result?.claimed).toBe(false)
                        // the reward is still shown as claimable
                        expect(result?.coinReward).toBe(WEEKLY_CHALLENGE_REWARD_COIN)
                    })

                it("caps the leaderboard at 10 while passedCount reflects every passer",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_end: "2026-08-09T16:59:59.999Z",
                            },
                        ])
                        const passers = Array.from({
                            length: 12,
                        },
                        (_, index) => ({
                            username: `user-${index}`,
                            avatar: null,
                            passed_at: "2026-08-04T10:00:00.000Z",
                        }))
                        entityManager.query.mockResolvedValueOnce(passers)

                        const result = await service.getWeeklyChallenge(null)

                        expect(result?.passedCount).toBe(12)
                        expect(result?.leaderboard).toHaveLength(10)
                    })
            })

        describe("claimReward",
            () => {
                it("throws WeeklyChallengeRewardNotEligibleException when there are no challenges",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(0)

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(WeeklyChallengeRewardNotEligibleException)
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("throws WeeklyChallengeRewardNotEligibleException when the pick yields no row",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([])

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(WeeklyChallengeRewardNotEligibleException)
                    })

                it("throws WeeklyChallengeRewardNotEligibleException when the viewer hasn't passed this week",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: false,
                            },
                        ])

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(WeeklyChallengeRewardNotEligibleException)
                        // never enters the claiming transaction for an ineligible viewer
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("throws WeeklyChallengeRewardAlreadyClaimedException when a claim row already exists this week",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: true,
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_start: weekStartIso,
                            },
                        ])
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "claim-existing",
                        })

                        await expect(
                            service.claimReward(userId),
                        ).rejects.toBeInstanceOf(WeeklyChallengeRewardAlreadyClaimedException)
                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })

                it("grants the flat WEEKLY_CHALLENGE_REWARD_COIN reward and records the claim row",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: true,
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_start: weekStartIso,
                            },
                        ])
                        // no existing claim row this week
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // writeCoinHistory's ledger dedupe check -- no prior grant
                        entityManager.findOne.mockResolvedValueOnce(null)
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 100,
                        })

                        const result = await service.claimReward(userId)

                        expect(result).toEqual({
                            balance: 100,
                            coinReward: WEEKLY_CHALLENGE_REWARD_COIN,
                        })
                        expect(entityManager.increment).toHaveBeenCalledWith(
                            UserEntity,
                            {
                                id: userId,
                            },
                            "coinBalance",
                            WEEKLY_CHALLENGE_REWARD_COIN,
                        )
                        expect(entityManager.save).toHaveBeenCalledWith(
                            CoinHistoryEntity,
                            expect.objectContaining({
                                user: {
                                    id: userId,
                                },
                                points: WEEKLY_CHALLENGE_REWARD_COIN,
                            }),
                        )
                        expect(entityManager.create).toHaveBeenCalledWith(
                            WeeklyChallengeClaimEntity,
                            expect.objectContaining({
                                userId,
                                challengeId,
                                coinReward: WEEKLY_CHALLENGE_REWARD_COIN,
                            }),
                        )
                    })

                it("does not double-credit when the ledger already carries this week's grant",
                    async () => {
                        entityManager.count.mockResolvedValueOnce(1)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: challengeId,
                                title: "Two Sum",
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                ok: true,
                            },
                        ])
                        entityManager.query.mockResolvedValueOnce([
                            {
                                week_start: weekStartIso,
                            },
                        ])
                        entityManager.findOne.mockResolvedValueOnce(null)
                        // a ledger row already exists for this (source, refId) -- a racing
                        // double-claim must not re-credit the balance
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "ledger-existing",
                        })
                        entityManager.findOneOrFail.mockResolvedValueOnce({
                            id: userId,
                            coinBalance: 100,
                        })

                        await service.claimReward(userId)

                        expect(entityManager.increment).not.toHaveBeenCalled()
                    })
            })
    })
