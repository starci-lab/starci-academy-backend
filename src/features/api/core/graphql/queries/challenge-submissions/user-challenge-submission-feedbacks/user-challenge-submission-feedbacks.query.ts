import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserChallengeSubmissionFeedbacksRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `userChallengeSubmissionFeedbacks`: request + locale
 * into {@link UserChallengeSubmissionFeedbacksHandler}. Not injected.
 */
export class UserChallengeSubmissionFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionFeedbacksRequest>,
    ) {}
}
