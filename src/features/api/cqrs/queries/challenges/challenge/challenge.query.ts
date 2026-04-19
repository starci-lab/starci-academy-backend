import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengeRequest,
} from "@features/api/graphql/queries/challenges/challenge/graphql-types"

export class ChallengeQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeRequest>,
    ) {}
}
