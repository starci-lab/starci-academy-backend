import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengesRequest,
} from "./graphql-types"

export class ChallengesQuery {
    constructor(
        readonly params: ExecuteParams<ChallengesRequest>,
    ) {}
}
