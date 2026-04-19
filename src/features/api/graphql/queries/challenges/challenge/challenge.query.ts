import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengeRequest,
} from "./graphql-types"

export class ChallengeQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeRequest>,
    ) {}
}
