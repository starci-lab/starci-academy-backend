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
    UserChallengeSubmissionFeedbacksQuery,
} from "./user-challenge-submission-feedbacks.query"
import {
    UserChallengeSubmissionFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserChallengeSubmissionFeedbacksResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Dispatches `userChallengeSubmissionFeedbacks` through QueryBus so the
 * resolver never constructs the CQRS query itself.
 */
export class UserChallengeSubmissionFeedbacksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserChallengeSubmissionFeedbacksRequest>,
    ): Promise<UserChallengeSubmissionFeedbacksResponseData> {
        return this.queryBus.execute(
            new UserChallengeSubmissionFeedbacksQuery(params),
        )
    }
}
