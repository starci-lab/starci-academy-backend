import {
    Args,
    Query,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    UserMilestoneTaskFeedbacksRequest,
    UserMilestoneTaskFeedbacksResponse,
    UserMilestoneTaskFeedbacksResponseData,
} from "./graphql-types"
import {
    UserMilestoneTaskFeedbacksService,
} from "./user-milestone-task-feedbacks.service"

@Resolver()
export class UserMilestoneTaskFeedbacksResolver {
    constructor(
        private readonly service: UserMilestoneTaskFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone task feedbacks fetched successfully",
        [Locale.Vi]: "Lấy chi tiết phản hồi thành công",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserMilestoneTaskFeedbacksResponse,
        {
            name: "userMilestoneTaskFeedbacks",
            description: "Feedback rows for the authenticated user’s latest attempt on a milestone task.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Course, task, and pagination filters.",
            },
        )
            request: UserMilestoneTaskFeedbacksRequest,
    ): Promise<UserMilestoneTaskFeedbacksResponseData> {
        return this.service.execute({
            request,
            user,
        })
    }
}
