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
    UserPersonalTaskAttemptFeedbacksQuery,
} from "./user-personal-task-attempt-feedbacks.query"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserPersonalTaskAttemptFeedbacksResponseData,
} from "./graphql-types/response"

@Injectable()
/**
 * Thin QueryBus adapter for userPersonalTaskAttemptFeedbacks.
 */
export class UserPersonalTaskAttemptFeedbacksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserPersonalTaskAttemptFeedbacksRequest>,
    ): Promise<UserPersonalTaskAttemptFeedbacksResponseData> {
        return this.queryBus.execute(
            new UserPersonalTaskAttemptFeedbacksQuery(params),
        )
    }
}
