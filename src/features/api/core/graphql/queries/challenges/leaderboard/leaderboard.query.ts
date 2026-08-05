import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    LeaderboardRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `courseLeaderboard`: request + user into
 * {@link LeaderboardHandler}. Constructed by the query service -- not injected.
 */
export class LeaderboardQuery {
    constructor(
        readonly params: ExecuteParams<LeaderboardRequest>,
    ) {}
}
