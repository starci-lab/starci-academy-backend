import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ChallengeSubmissionProgressRequest,
} from "./graphql-types/request"

/**
 * CQRS query carrying the `challengeSubmissionProgress` request params
 * (request DTO + authenticated user) to {@link ChallengeSubmissionProgressHandler}.
 */
export class ChallengeSubmissionProgressQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionProgressRequest>,
    ) {}
}
