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
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
import {
    KeycloakGraphQLUser,
} from "@modules/integrations/keycloak/keycloak.decorators"
import {
    ContentAiService,
} from "@modules/bussiness/content-ai/content-ai.service"
import type {
    ContentAiScope,
} from "@modules/bussiness/content-ai/types/session"
import {
    ContentAiSessionsRequest,
} from "./graphql-types/request"
import {
    ContentAiSessionsResponse,
} from "./graphql-types/response"
import type {
    ContentAiSessionsData,
} from "./graphql-types/response"

@Resolver()
/**
 * GraphQL surface for `contentAiSessions` -- list by content/task/foundation/
 * course scope, or search across the caller's conversations when `search` is set.
 */
export class ContentAiSessionsResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * List the current user's content-AI conversations for a content (recency
     * first), or search ALL their conversations in the course when `search` is
     * given. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversations loaded successfully",
        [Locale.Vi]: "Đã tải danh sách hội thoại", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentAiSessionsResponse,
        {
            name: "contentAiSessions",
            description: "The current user's content-AI conversations (list or search).",
        },
    )
    async execute(
        @Args("request")
            request: ContentAiSessionsRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ContentAiSessionsData> {
        const sessions = await this.contentAiService.sessions({
            userId: user.id,
            scope: request.scope as ContentAiScope | undefined,
            contentId: request.contentId,
            taskId: request.taskId,
            challengeId: request.challengeId,
            quizId: request.quizId,
            foundationId: request.foundationId,
            courseId: request.courseId,
            search: request.search,
            limit: request.limit,
            offset: request.offset,
            includeArchived: request.includeArchived,
        })
        return {
            sessions,
        }
    }
}
