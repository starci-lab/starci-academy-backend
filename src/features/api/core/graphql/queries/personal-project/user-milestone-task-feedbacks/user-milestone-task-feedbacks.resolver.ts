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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserMilestoneTaskFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserMilestoneTaskFeedbacksResponse,
    UserMilestoneTaskFeedbacksResponseData,
} from "./graphql-types/response"
import {
    UserMilestoneTaskFeedbacksService,
} from "./user-milestone-task-feedbacks.service"

@Resolver()
/**
 * GraphQL surface for `userMilestoneTaskFeedbacks` -- authenticated feedback page
 * for the caller's own latest milestone-task attempt.
 */
export class UserMilestoneTaskFeedbacksResolver {
    constructor(
        private readonly service: UserMilestoneTaskFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Milestone task feedbacks fetched successfully",
        [Locale.Vi]: "Lấy chi tiết phản hồi thành công", // vn-ok: vi-locale string emitted to clients
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
