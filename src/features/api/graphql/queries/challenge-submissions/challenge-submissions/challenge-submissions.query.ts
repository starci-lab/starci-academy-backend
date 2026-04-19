import {
    ExecuteParams,
} from "@features/api/types"
import {
    ChallengeSubmissionsRequest,
} from "./graphql-types"

export class ChallengeSubmissionsQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionsRequest>,
    ) {}
}
