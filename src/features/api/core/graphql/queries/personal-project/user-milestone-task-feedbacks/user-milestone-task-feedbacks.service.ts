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
    UserMilestoneTaskFeedbacksQuery,
} from "./user-milestone-task-feedbacks.query"
import {
    UserMilestoneTaskFeedbacksRequest,
    UserMilestoneTaskFeedbacksResponseData,
} from "./graphql-types"

@Injectable()
/**
 * Thin QueryBus adapter for userMilestoneTaskFeedbacks.
 */
export class UserMilestoneTaskFeedbacksService {
    constructor(
        private readonly queryBus: QueryBus,
    ) {}

    async execute(
        params: ExecuteParams<UserMilestoneTaskFeedbacksRequest>,
    ): Promise<UserMilestoneTaskFeedbacksResponseData> {
        return this.queryBus.execute(
            new UserMilestoneTaskFeedbacksQuery(params),
        )
    }
}
