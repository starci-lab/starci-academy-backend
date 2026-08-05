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
    UserMilestoneTaskFeedbacksQuery,
} from "./user-milestone-task-feedbacks.query"
import {
    UserMilestoneTaskFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserMilestoneTaskFeedbacksResponseData,
} from "./graphql-types/response"

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
