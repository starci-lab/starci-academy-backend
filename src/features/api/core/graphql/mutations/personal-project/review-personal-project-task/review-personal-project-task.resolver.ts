import {
    Args,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLLocale,
} from "@modules/api/apollo/server/decorators/locale.decorators"
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
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness/guards/graphql-must-enrolled.guard"
import {
    ReviewPersonalProjectTaskRequest,
} from "./graphql-types/request"
import {
    ReviewPersonalProjectTaskResponse,
    ReviewPersonalProjectTaskResponseData,
} from "./graphql-types/response"
import {
    ReviewPersonalProjectTaskService,
} from "./review-personal-project-task.service"

@Resolver()
/**
 * GraphQL leaf for per-task review. Enrollment guard lives here so an
 * unenrolled caller never reaches the handler's enrollment lookup.
 */
export class ReviewPersonalProjectTaskResolver {
    constructor(
        private readonly service: ReviewPersonalProjectTaskService,
    ) {}

    @UseThrottler(ThrottlerConfig.Medium)
    @GraphQLSuccessMessage({
        [Locale.En]: "Task review queued successfully",
        [Locale.Vi]: "Đã gửi yêu cầu chấm task thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
        GraphQLMustEnrolledGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ReviewPersonalProjectTaskResponse,
        {
            name: "reviewPersonalProjectTask",
            description: "Submit a single milestone task for AI review against its pass criteria.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Args(
            "request",
            {
                description: "Personal project task review request.",
            },
        )
            request: ReviewPersonalProjectTaskRequest,
        @GraphQLLocale()
            locale: Locale,
    ): Promise<ReviewPersonalProjectTaskResponseData> {
        return this.service.execute({
            request,
            user,
            locale,
        })
    }
}
