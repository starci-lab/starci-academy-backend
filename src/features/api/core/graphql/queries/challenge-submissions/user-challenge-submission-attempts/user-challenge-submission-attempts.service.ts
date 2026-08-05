import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "../../../../types/execute"
import {
    UserChallengeSubmissionAttemptsQuery,
} from "./user-challenge-submission-attempts.query"
import {
    UserChallengeSubmissionAttemptsRequest,
} from "./graphql-types/request"
import {
    UserChallengeSubmissionAttemptsResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `userChallengeSubmissionAttempts` through QueryBus so the
 * resolver never constructs the CQRS query itself.
 */
export class UserChallengeSubmissionAttemptsService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserChallengeSubmissionAttemptsRequest>,
    ): Promise<UserChallengeSubmissionAttemptsResponseData> {
        return this.queryBus.execute(
            new UserChallengeSubmissionAttemptsQuery(params),
        )
    }
}
