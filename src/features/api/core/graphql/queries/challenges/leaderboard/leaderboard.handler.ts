import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import {
    LeaderboardMyRankData,
    LeaderboardResponseData,
    LeaderboardRequestDefaults,
} from "./graphql-types"
import {
    LeaderboardService,
} from "@modules/bussiness"

@QueryHandler(LeaderboardQuery)
export class LeaderboardHandler
implements IQueryHandler<LeaderboardQuery, LeaderboardResponseData>
{
    constructor(
        private readonly leaderboardService: LeaderboardService,
    ) {}

    async execute(query: LeaderboardQuery): Promise<LeaderboardResponseData> {
        const { request, user } = query.params
        const { courseId } = request

        const requestedLimit = request.limit ?? LeaderboardRequestDefaults.DEFAULT_LIMIT
        const limit = Math.max(
            1,
            Math.min(requestedLimit, LeaderboardRequestDefaults.MAX_LIMIT),
        )

        const board = await this.leaderboardService.getLeaderboard(courseId)

        const entries = board.entries.slice(0, limit).map((e) => ({
            rank: e.rank,
            enrollmentId: e.enrollmentId,
            userId: e.userId,
            username: e.username,
            avatar: e.avatar,
            totalScore: e.totalScore,
            completedChallenges: e.completedChallenges,
        }))

        let myRank: LeaderboardMyRankData | null = null
        if (user) {
            // Cheap path: user is already inside the cached window.
            const inCache = board.entries.find((e) => e.userId === user.id)
            if (inCache) {
                myRank = {
                    rank: inCache.rank,
                    totalScore: inCache.totalScore,
                    completedChallenges: inCache.completedChallenges,
                }
            } else {
                // Outside the window — query directly.
                const direct = await this.leaderboardService.getMyRank(courseId, user.id)
                if (direct) {
                    myRank = direct
                }
            }
        }

        return {
            courseId: board.courseId,
            totalChallenges: board.totalChallenges,
            maxPossibleScore: board.maxPossibleScore,
            entries,
            myRank,
            computedAt: board.computedAt,
        }
    }
}
