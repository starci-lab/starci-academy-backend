import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    LeaderboardHandler,
} from "./leaderboard.handler"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import {
    LeaderboardRequestDefaults,
} from "./graphql-types"
import {
    LeaderboardService,
} from "@modules/bussiness"
import type {
    CourseLeaderboardCacheResult,
    CourseLeaderboardEntry,
} from "@modules/cache"
import type {
    UserEntity,
} from "@modules/databases"

const buildEntry = (
    overrides: Partial<CourseLeaderboardEntry> = {
    },
): CourseLeaderboardEntry => ({
    enrollmentId: "e1",
    userId: "u1",
    username: "alice",
    avatar: null,
    totalScore: 100,
    completedChallenges: 1,
    rank: 1,
    ...overrides,
})

const buildBoard = (
    entries: Array<CourseLeaderboardEntry>,
): CourseLeaderboardCacheResult => ({
    courseId: "course-1",
    totalChallenges: 5,
    maxPossibleScore: 500,
    entries,
    computedAt: new Date("2026-01-01T00:00:00Z"),
})

const fakeUser = (id: string): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("LeaderboardHandler", () => {
    let module: TestingModule
    let handler: LeaderboardHandler
    let leaderboardService: jest.Mocked<LeaderboardService>

    beforeEach(async () => {
        leaderboardService = {
            getLeaderboard: jest.fn(),
            getMyRank: jest.fn(),
        } as unknown as jest.Mocked<LeaderboardService>

        module = await Test.createTestingModule({
            providers: [
                LeaderboardHandler,
                {
                    provide: LeaderboardService,
                    useValue: leaderboardService,
                },
            ],
        }).compile()

        handler = module.get<LeaderboardHandler>(LeaderboardHandler)
    })

    afterEach(async () => {
        await module.close()
    })

    it("returns the cached top + maps fields, no user → myRank is null", async () => {
        const board = buildBoard([
            buildEntry({
                userId: "u1", rank: 1, totalScore: 250,
            }),
            buildEntry({
                userId: "u2", rank: 2, totalScore: 120, enrollmentId: "e2",
            }),
        ])
        leaderboardService.getLeaderboard.mockResolvedValueOnce(board)

        const result = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1",
                },
                user: undefined as unknown as UserEntity,
            }),
        )

        expect(result.courseId).toBe("course-1")
        expect(result.totalChallenges).toBe(5)
        expect(result.maxPossibleScore).toBe(500)
        expect(result.entries.map((e) => e.userId)).toEqual(["u1", "u2"])
        expect(result.myRank).toBeNull()
        expect(leaderboardService.getMyRank).not.toHaveBeenCalled()
    })

    it("returns myRank from the cached window when the user is in the top entries", async () => {
        const board = buildBoard([
            buildEntry({
                userId: "u1", rank: 1, totalScore: 300,
            }),
            buildEntry({
                userId: "u2",
                rank: 2,
                totalScore: 200,
                completedChallenges: 2,
                enrollmentId: "e2",
            }),
        ])
        leaderboardService.getLeaderboard.mockResolvedValueOnce(board)

        const result = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1",
                },
                user: fakeUser("u2"),
            }),
        )

        expect(result.myRank).toEqual({
            rank: 2,
            totalScore: 200,
            completedChallenges: 2,
        })
        expect(leaderboardService.getMyRank).not.toHaveBeenCalled()
    })

    it("falls back to getMyRank when the user is outside the cached window", async () => {
        const board = buildBoard([
            buildEntry({
                userId: "u1", rank: 1, totalScore: 300,
            }),
        ])
        leaderboardService.getLeaderboard.mockResolvedValueOnce(board)
        leaderboardService.getMyRank.mockResolvedValueOnce({
            rank: 42,
            totalScore: 75,
            completedChallenges: 1,
        })

        const result = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1",
                },
                user: fakeUser("u99"),
            }),
        )

        expect(leaderboardService.getMyRank).toHaveBeenCalledWith("course-1", "u99")
        expect(result.myRank).toEqual({
            rank: 42,
            totalScore: 75,
            completedChallenges: 1,
        })
    })

    it("returns null myRank when getMyRank reports the user has no scored attempts", async () => {
        leaderboardService.getLeaderboard.mockResolvedValueOnce(buildBoard([]))
        leaderboardService.getMyRank.mockResolvedValueOnce(null)

        const result = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1",
                },
                user: fakeUser("u99"),
            }),
        )

        expect(result.myRank).toBeNull()
    })

    it("clamps limit to [1, MAX_LIMIT]", async () => {
        const fullBoard = buildBoard(
            Array.from(
                {
                    length: LeaderboardRequestDefaults.MAX_LIMIT,
                },
                (_, i) =>
                    buildEntry({
                        userId: `u${i}`,
                        enrollmentId: `e${i}`,
                        rank: i + 1,
                        totalScore: 500 - i,
                    }),
            ),
        )
        leaderboardService.getLeaderboard.mockResolvedValue(fullBoard)

        const resultLow = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1", limit: 0,
                },
                user: undefined as unknown as UserEntity,
            }),
        )
        expect(resultLow.entries).toHaveLength(1)

        const resultHigh = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1", limit: 9999,
                },
                user: undefined as unknown as UserEntity,
            }),
        )
        expect(resultHigh.entries).toHaveLength(LeaderboardRequestDefaults.MAX_LIMIT)
    })

    it("uses the default limit when none is provided", async () => {
        const fullBoard = buildBoard(
            Array.from(
                {
                    length: LeaderboardRequestDefaults.MAX_LIMIT,
                },
                (_, i) =>
                    buildEntry({
                        userId: `u${i}`,
                        enrollmentId: `e${i}`,
                        rank: i + 1,
                        totalScore: 500 - i,
                    }),
            ),
        )
        leaderboardService.getLeaderboard.mockResolvedValueOnce(fullBoard)

        const result = await handler.execute(
            new LeaderboardQuery({
                request: {
                    courseId: "course-1",
                },
                user: undefined as unknown as UserEntity,
            }),
        )

        expect(result.entries).toHaveLength(LeaderboardRequestDefaults.DEFAULT_LIMIT)
    })
})
