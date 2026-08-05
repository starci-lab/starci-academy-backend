import {
    Args,
    Context,
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
import type {
    KeycloakAuthGuardRequest,
} from "@modules/integrations/keycloak/types/guard"
import {
    LastPersonalTaskAttemptRequest,
} from "./graphql-types/request"
import {
    LastPersonalTaskAttemptResponse,
    LastPersonalTaskAttemptResponseData,
} from "./graphql-types/response"
import {
    LastPersonalTaskAttemptService,
} from "./last-personal-task-attempt.service"

@Resolver()
/**
 * GraphQL surface for `lastPersonalTaskAttempt` -- forwards Keycloak realm roles
 * so the handler can authorize staff viewing another learner's attempt.
 */
export class LastPersonalTaskAttemptResolver {
    constructor(
        private readonly service: LastPersonalTaskAttemptService,
    ) {}

    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Latest personal task attempt fetched successfully",
        [Locale.Vi]: "Lấy kết quả đánh giá mới nhất thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => LastPersonalTaskAttemptResponse,
        {
            name: "lastPersonalTaskAttempt",
            description: "Latest AI review attempt for a user on a milestone task. Callers may read their own row; staff needs realm roles instructor, admin, or mentor.",
        },
    )
    async execute(
        @KeycloakGraphQLUser()
            user: UserEntity,
        @Context()
            context: {
                req: KeycloakAuthGuardRequest
            },
        @Args(
            "request",
            {
                description: "Course, task, and user identifiers.",
            },
        )
            request: LastPersonalTaskAttemptRequest,
    ): Promise<LastPersonalTaskAttemptResponseData> {
        return this.service.execute({
            request,
            user,
            keycloakToken: context.req.keycloakToken,
        })
    }
}
