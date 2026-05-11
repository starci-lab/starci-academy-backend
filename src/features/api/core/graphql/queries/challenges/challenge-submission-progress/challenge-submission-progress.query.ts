import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeSubmissionProgressRequest,
} from "./graphql-types"

export class ChallengeSubmissionProgressQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionProgressRequest>,
    ) {}
}
