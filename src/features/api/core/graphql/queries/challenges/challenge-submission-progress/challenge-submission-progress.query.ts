import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChallengeSubmissionProgressRequest,
} from "./graphql-types"

/**
 * CQRS query carrying the `challengeSubmissionProgress` request params
 * (request DTO + authenticated user) to {@link ChallengeSubmissionProgressHandler}.
 */
export class ChallengeSubmissionProgressQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionProgressRequest>,
    ) {}
}
