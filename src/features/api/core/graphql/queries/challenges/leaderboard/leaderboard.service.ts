import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    LeaderboardQuery,
} from "./leaderboard.query"
import {
    LeaderboardRequest,
} from "./graphql-types/request"
import {
    LeaderboardResponseData,
} from "./graphql-types/response"

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
