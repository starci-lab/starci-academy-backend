import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    ChallengeSubmissionRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `challengeSubmission`: request + locale + user into
 * {@link ChallengeSubmissionHandler}. Constructed by the query service -- not injected.
 */
export class ChallengeSubmissionQuery {
    constructor(
        readonly params: ExecuteParams<ChallengeSubmissionRequest>,
    ) {}
}
