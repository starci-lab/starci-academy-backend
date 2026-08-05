import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserChallengeSubmissionFeedbacksRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `userChallengeSubmissionFeedbacks`: request + locale
 * into {@link UserChallengeSubmissionFeedbacksHandler}. Not injected.
 */
export class UserChallengeSubmissionFeedbacksQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionFeedbacksRequest>,
    ) {}
}
