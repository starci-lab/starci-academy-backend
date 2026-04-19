import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengesRequest,
} from "./graphql-types"

export class ChallengesQuery {
    constructor(
        readonly params: ExecuteParams<ChallengesRequest>,
    ) {}
}
