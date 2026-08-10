import {
    IQueryHandler,
    QueryHandler,
} from "@nestjs/cqrs"
import {
    ICQRSHandler,
} from "@modules/platform/cqrs/icqrs-handler"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import {
    LeaderboardRequestDefaults,
} from "./graphql-types/request"
import {
    LeaderboardMyRankData,
    LeaderboardResponseData,
} from "./graphql-types/response"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"

@QueryHandler(LeaderboardQuery)
/**
 * Serves the course leaderboard from the progress projection (inline recompute
 * + CDC). Clamps `limit` to the cached window; `myRank` uses the cache when
 * the viewer is inside it, otherwise a direct rank lookup.
 */
export class LeaderboardHandler
    extends ICQRSHandler<LeaderboardQuery, LeaderboardResponseData>
    implements IQueryHandler<LeaderboardQuery, LeaderboardResponseData>
{
    /**
     * Constructor.
     * @param progressProjectionService - Reads the flat CQRS progress projection.
     */
    constructor(
        // reads the flat CQRS projection (kept fresh by inline recompute + CDC);
        // same getLeaderboard/getMyRank shapes the old LeaderboardService exposed
        private readonly progressProjectionService: ProgressProjectionService,
    ) {
        super()
    }

    /**
     * Processes the leaderboard query.
     * @param query - The query carrying request + viewer.
     * @returns The clamped board window, and the viewer's rank when there is a viewer.
     */
    protected override async process(query: LeaderboardQuery): Promise<LeaderboardResponseData> {
        const { request, user } = query.params
        const { courseId } = request

        const requestedLimit = request.limit ?? LeaderboardRequestDefaults.DEFAULT_LIMIT
        const limit = Math.max(
            1,
            Math.min(requestedLimit,
                LeaderboardRequestDefaults.MAX_LIMIT),
        )

        const board = await this.progressProjectionService.getLeaderboard(courseId)

        const entries = board.entries.slice(0,
            limit).map((entry) => ({
            rank: entry.rank,
            enrollmentId: entry.enrollmentId,
            userId: entry.userId,
            username: entry.username,
            avatar: entry.avatar,
            totalScore: entry.totalScore,
            completedChallenges: entry.completedChallenges,
            lessonsRead: entry.lessonsRead,
            milestoneProgress: entry.milestoneProgress,
            totalXp: entry.totalXp,
        }))

        let myRank: LeaderboardMyRankData | null = null
        if (user) {
            // Cheap path: user is already inside the cached window.
            const inCache = board.entries.find((entry) => entry.userId === user.id)
            if (inCache) {
                myRank = {
                    rank: inCache.rank,
                    totalScore: inCache.totalScore,
                    completedChallenges: inCache.completedChallenges,
                    lessonsRead: inCache.lessonsRead,
                    milestoneProgress: inCache.milestoneProgress,
                    totalXp: inCache.totalXp,
                }
            } else {
                // Outside the window -- query directly.
                const direct = await this.progressProjectionService.getMyRank(courseId,
                    user.id)
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
