import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    LeaderboardRequest,
} from "./graphql-types"

export class LeaderboardQuery {
    constructor(
        readonly params: ExecuteParams<LeaderboardRequest>,
    ) {}
}
