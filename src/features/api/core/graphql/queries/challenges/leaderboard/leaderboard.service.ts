import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import {
    LeaderboardRequest,
    LeaderboardResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Dispatches `courseLeaderboard` through QueryBus so the resolver never
 * constructs the CQRS query itself.
 */
export class LeaderboardSingleQueryService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<LeaderboardRequest>,
    ): Promise<LeaderboardResponseData> {
        return this.queryBus.execute(new LeaderboardQuery(params))
    }
}
