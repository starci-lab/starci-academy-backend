import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserChallengeSubmissionAttemptsRequest,
} from "./graphql-types"

/**
 * QueryBus payload for `userChallengeSubmissionAttempts`: request + locale + user
 * into {@link UserChallengeSubmissionAttemptsHandler}. Not injected.
 */
export class UserChallengeSubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionAttemptsRequest>,
    ) {}
}
