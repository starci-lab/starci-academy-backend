import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LeaderboardRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `courseLeaderboard`: request + user into
 * {@link LeaderboardHandler}. Constructed by the query service — not injected.
 */
export class LeaderboardQuery {
    constructor(
        readonly params: ExecuteParams<LeaderboardRequest>,
    ) {}
}
