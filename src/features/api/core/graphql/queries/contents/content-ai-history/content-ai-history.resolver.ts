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
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
    KeycloakGraphQLUser,
} from "@modules/keycloak"
import {
    ContentAiService,
} from "@modules/bussiness"
import {
    ContentAiHistoryRequest,
    ContentAiHistoryResponse,
} from "./graphql-types"
import type {
    ContentAiHistoryData,
} from "./graphql-types"

@Resolver()
/**
 * GraphQL surface for `contentAiSessionMessages` — returns one conversation's
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
