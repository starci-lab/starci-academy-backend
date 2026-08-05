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
import type {
    KeycloakAuthGuardRequest,
} from "@modules/keycloak"
import {
    LastPersonalTaskAttemptRequest,
    LastPersonalTaskAttemptResponse,
    LastPersonalTaskAttemptResponseData,
} from "./graphql-types"
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
