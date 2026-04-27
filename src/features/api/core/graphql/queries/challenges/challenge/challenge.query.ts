import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeRequest,
} from "./graphql-types"

export class ChallengeQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeRequest>,
    ) {}
}
