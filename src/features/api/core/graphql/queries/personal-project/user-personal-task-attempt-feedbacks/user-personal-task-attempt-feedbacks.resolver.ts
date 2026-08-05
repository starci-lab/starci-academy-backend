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
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    UserPersonalTaskAttemptFeedbacksRequest,
} from "./graphql-types/request"
import {
    UserPersonalTaskAttemptFeedbacksResponse,
    UserPersonalTaskAttemptFeedbacksResponseData,
} from "./graphql-types/response"
import {
    UserPersonalTaskAttemptFeedbacksService,
} from "./user-personal-task-attempt-feedbacks.service"

@Resolver()
/**
 * GraphQL surface for `userPersonalTaskAttemptFeedbacks` -- paginated feedback
 * for an explicit attemptId (history drill-down, not "latest").
 */
export class UserPersonalTaskAttemptFeedbacksResolver {
    constructor(
        private readonly service: UserPersonalTaskAttemptFeedbacksService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Personal task attempt feedbacks fetched successfully",
        [Locale.Vi]: "Lấy danh sách feedback thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => UserPersonalTaskAttemptFeedbacksResponse,
        {
            name: "userPersonalTaskAttemptFeedbacks",
            description: "Returns a paginated list of feedbacks for a personal project task attempt.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Pagination, sorts, and filters.",
            },
        )
            request: UserPersonalTaskAttemptFeedbacksRequest,
    ): Promise<UserPersonalTaskAttemptFeedbacksResponseData> {
        return this.service.execute({
            request,
        })
    }
}
