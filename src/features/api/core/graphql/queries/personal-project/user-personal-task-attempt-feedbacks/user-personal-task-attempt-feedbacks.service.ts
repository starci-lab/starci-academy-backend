import {
    Injectable,
} from "@nestjs/common"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ExecuteParams,
} from "@features/api/core/types"
import {
    UserPersonalTaskAttemptFeedbacksQuery,
} from "./user-personal-task-attempt-feedbacks.query"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
    UserPersonalTaskAttemptFeedbacksResponseData,
} from "./graphql-types"

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
