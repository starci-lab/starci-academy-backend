import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    LeaderboardService,
} from "./leaderboard.service"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    CourseLeaderboardCacheResult,
} from "@modules/cache"
import type {
    EntityManager,
} from "typeorm"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("LeaderboardService", () => {
    let module: TestingModule
    let service: LeaderboardService
    let cacheService: jest.Mocked<CacheService>
    let entityManager: jest.Mocked<Pick<EntityManager, "query">>

    const courseId = "course-1"

    beforeEach(async () => {
        cacheService = {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
        } as unknown as jest.Mocked<CacheService>

        entityManager = {
            query: jest.fn(),
        } as unknown as jest.Mocked<Pick<EntityManager, "query">>

        module = await Test.createTestingModule({
            providers: [
                LeaderboardService,
                {
                    provide: CacheService,
                    useValue: cacheService,
                },
                {
                    provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                    useValue: entityManager,
                },
            ],
        }).compile()

        service = module.get<LeaderboardService>(LeaderboardService)
    })

    afterEach(async () => {
        await module.close()
    })

    describe("getLeaderboard", () => {
        it("returns cached payload on hit and does not touch the database", async () => {
            const cached: CourseLeaderboardCacheResult = {
                courseId,
                totalChallenges: 3,
                maxPossibleScore: 300,
                entries: [
                    {
                        enrollmentId: "e1",
                        userId: "u1",
                        username: "alice",
                        avatar: null,
                        totalScore: 250,
                        completedChallenges: 2,
                        rank: 1,
                    },
                ],
                computedAt: new Date("2026-01-01T00:00:00Z"),
            }
            cacheService.get.mockResolvedValueOnce(cached)

            const result = await service.getLeaderboard(courseId)

            expect(result).toBe(cached)
            expect(cacheService.get).toHaveBeenCalledWith({
                key: CacheKey.CourseLeaderboard,
                args: [courseId],
            })
            expect(entityManager.query).not.toHaveBeenCalled()
            expect(cacheService.set).not.toHaveBeenCalled()
        })

        it("computes from DB on cache miss and stores the result", async () => {
            cacheService.get.mockResolvedValueOnce(undefined)
            entityManager.query
                .mockResolvedValueOnce([
                    {
                        total_challenges: "2",
                        max_possible_score: "200",
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        enrollment_id: "e1",
                        user_id: "u1",
                        username: "alice",
                        avatar: null,
                        total_score: "150",
                        completed_challenges: "1",
                    },
                    {
                        enrollment_id: "e2",
                        user_id: "u2",
                        username: "bob",
                        avatar: "bob.png",
                        total_score: "120",
                        completed_challenges: "1",
                    },
                ])

            const result = await service.getLeaderboard(courseId)

            expect(result.totalChallenges).toBe(2)
            expect(result.maxPossibleScore).toBe(200)
            expect(result.entries).toEqual([
                {
                    enrollmentId: "e1",
                    userId: "u1",
                    username: "alice",
                    avatar: null,
                    totalScore: 150,
                    completedChallenges: 1,
                    rank: 1,
                },
                {
                    enrollmentId: "e2",
                    userId: "u2",
                    username: "bob",
                    avatar: "bob.png",
                    totalScore: 120,
                    completedChallenges: 1,
                    rank: 2,
                },
            ])
            expect(entityManager.query).toHaveBeenCalledTimes(2)
            expect(cacheService.set).toHaveBeenCalledWith({
                key: CacheKey.CourseLeaderboard,
                args: [courseId],
                cacheResult: result,
            })
        })

        it("re-computes when cache returns a value missing the entries array", async () => {
            cacheService.get.mockResolvedValueOnce({
                courseId,
                totalChallenges: 0,
                maxPossibleScore: 0,
                computedAt: new Date(),
            } as unknown as CourseLeaderboardCacheResult)
            entityManager.query.mockResolvedValueOnce([
                {
                    total_challenges: "0",
                    max_possible_score: "0",
                },
            ])

            const result = await service.getLeaderboard(courseId)

            expect(result.entries).toEqual([])
            expect(entityManager.query).toHaveBeenCalled()
            expect(cacheService.set).toHaveBeenCalled()
        })
    })

    describe("updateLeaderboard", () => {
        it("short-circuits when the course has no challenges", async () => {
            entityManager.query.mockResolvedValueOnce([
                {
                    total_challenges: "0",
                    max_possible_score: "0",
                },
            ])

            const result = await service.updateLeaderboard(courseId)

            expect(result).toEqual({
                courseId,
                totalChallenges: 0,
                maxPossibleScore: 0,
                entries: [],
                computedAt: expect.any(Date),
            })
            expect(entityManager.query).toHaveBeenCalledTimes(1)
            expect(cacheService.set).toHaveBeenCalledWith({
                key: CacheKey.CourseLeaderboard,
                args: [courseId],
                cacheResult: result,
            })
        })

        it("numbers entries by their position in the sorted DB result", async () => {
            entityManager.query
                .mockResolvedValueOnce([
                    {
                        total_challenges: 4,
                        max_possible_score: 400,
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        enrollment_id: "e1",
                        user_id: "u1",
                        username: "first",
                        avatar: null,
                        total_score: 400,
                        completed_challenges: 4,
                    },
                    {
                        enrollment_id: "e2",
                        user_id: "u2",
                        username: "second",
                        avatar: null,
                        total_score: 300,
                        completed_challenges: 3,
                    },
                    {
                        enrollment_id: "e3",
                        user_id: "u3",
                        username: "third",
                        avatar: null,
                        total_score: 150,
                        completed_challenges: 1,
                    },
                ])

            const result = await service.updateLeaderboard(courseId)

            expect(result.entries.map((e) => e.rank)).toEqual([1, 2, 3])
            expect(result.entries.map((e) => e.userId)).toEqual(["u1", "u2", "u3"])
        })

        it("coerces stringified numeric columns to JS numbers", async () => {
            entityManager.query
                .mockResolvedValueOnce([
                    {
                        total_challenges: "1",
                        max_possible_score: "100",
                    },
                ])
                .mockResolvedValueOnce([
                    {
                        enrollment_id: "e1",
                        user_id: "u1",
                        username: null,
                        avatar: null,
                        total_score: "100",
                        completed_challenges: "1",
                    },
                ])

            const result = await service.updateLeaderboard(courseId)

            expect(result.totalChallenges).toBe(1)
            expect(result.maxPossibleScore).toBe(100)
            expect(result.entries[0].totalScore).toBe(100)
            expect(result.entries[0].completedChallenges).toBe(1)
        })
    })

    describe("invalidateLeaderboard", () => {
        it("deletes the cached entry for the given course", async () => {
            await service.invalidateLeaderboard(courseId)

            expect(cacheService.del).toHaveBeenCalledWith({
                key: CacheKey.CourseLeaderboard,
                args: [courseId],
            })
        })
    })

    describe("getMyRank", () => {
        it("returns null when the user has no aggregated row at all", async () => {
            entityManager.query.mockResolvedValueOnce([])

            const result = await service.getMyRank(courseId, "user-x")

            expect(result).toBeNull()
        })

        it("returns null when the user has zero score and zero completions", async () => {
            entityManager.query.mockResolvedValueOnce([
                {
                    user_id: "user-x",
                    total_score: 0,
                    completed_challenges: 0,
                    higher_count: 5,
                },
            ])

            const result = await service.getMyRank(courseId, "user-x")

            expect(result).toBeNull()
        })

        it("returns rank = higher_count + 1 for an active user", async () => {
            entityManager.query.mockResolvedValueOnce([
                {
                    user_id: "user-x",
                    total_score: "180",
                    completed_challenges: "2",
                    higher_count: "12",
                },
            ])

            const result = await service.getMyRank(courseId, "user-x")

            expect(result).toEqual({
                rank: 13,
                totalScore: 180,
                completedChallenges: 2,
            })
        })

        it("counts users with completedChallenges > 0 even if totalScore is 0", async () => {
            entityManager.query.mockResolvedValueOnce([
                {
                    user_id: "user-x",
                    total_score: "0",
                    completed_challenges: "1",
                    higher_count: "0",
                },
            ])

            const result = await service.getMyRank(courseId, "user-x")

            expect(result).toEqual({
                rank: 1,
                totalScore: 0,
                completedChallenges: 1,
            })
        })
    })
})
