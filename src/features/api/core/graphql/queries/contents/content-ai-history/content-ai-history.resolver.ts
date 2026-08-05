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
import {
    ContentAiHistoryRequest,
} from "./graphql-types/request"
import {
    ContentAiHistoryResponse,
} from "./graphql-types/response"
import type {
    ContentAiHistoryData,
} from "./graphql-types/response"

@Resolver()
/**
 * GraphQL surface for `contentAiSessionMessages` -- returns one conversation's
 * turns (oldest first), scoped to the caller's sessions via ContentAiService.
 */
export class ContentAiHistoryResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Load the current user's saved content-AI conversation for a content
     * (scoped to their enrollment), oldest first. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation loaded successfully",
        [Locale.Vi]: "Đã tải hội thoại", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ContentAiHistoryResponse,
        {
            name: "contentAiSessionMessages",
            description: "A content-AI conversation's (session's) saved turns, oldest first.",
        },
    )
    async execute(
        @Args("request")
            request: ContentAiHistoryRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ContentAiHistoryData> {
        const messages = await this.contentAiService.loadSessionMessages({
            userId: user.id,
            sessionId: request.sessionId,
        })
        return {
            messages,
        }
    }
}
