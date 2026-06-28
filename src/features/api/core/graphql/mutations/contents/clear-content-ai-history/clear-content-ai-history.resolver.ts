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
    ClearContentAiHistoryRequest,
    ClearContentAiHistoryResponse,
} from "./graphql-types"
import type {
    ClearContentAiHistoryData,
} from "./graphql-types"

@Resolver()
export class ClearContentAiHistoryResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Clear the current user's saved content-AI conversation for a content
     * (scoped to their enrollment). Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation cleared successfully",
        [Locale.Vi]: "Đã xoá hội thoại",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ClearContentAiHistoryResponse,
        {
            name: "deleteContentAiSession",
            description: "Delete one of the current user's content-AI conversations (sessions).",
        },
    )
    async execute(
        @Args("request")
            request: ClearContentAiHistoryRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ClearContentAiHistoryData> {
        await this.contentAiService.deleteSession({
            userId: user.id,
            sessionId: request.sessionId,
        })
        return {
            cleared: true,
        }
    }
}
