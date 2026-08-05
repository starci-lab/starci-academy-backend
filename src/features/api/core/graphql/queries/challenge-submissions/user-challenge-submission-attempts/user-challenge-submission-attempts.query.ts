import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserChallengeSubmissionAttemptsRequest,
} from "./graphql-types/request"

/**
 * QueryBus payload for `userChallengeSubmissionAttempts`: request + locale + user
 * into {@link UserChallengeSubmissionAttemptsHandler}. Not injected.
 */
export class UserChallengeSubmissionAttemptsQuery {
    constructor(
        readonly params: ExecuteParams<UserChallengeSubmissionAttemptsRequest>,
    ) {}
}
