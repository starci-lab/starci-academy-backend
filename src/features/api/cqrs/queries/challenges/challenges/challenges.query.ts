import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengesRequest,
} from "@features/api/graphql/queries/challenges/challenges/graphql-types"

export class ChallengesQuery {
    constructor(
        readonly params: ExecuteParams<ChallengesRequest>,
    ) {}
}
