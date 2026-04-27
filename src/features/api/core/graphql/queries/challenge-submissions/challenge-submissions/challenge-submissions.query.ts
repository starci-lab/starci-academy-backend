import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeSubmissionsRequest,
} from "./graphql-types"

export class ChallengeSubmissionsQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionsRequest>,
    ) {}
}
