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
    TouchContentAiSessionRequest,
    TouchContentAiSessionResponse,
} from "./graphql-types"
import type {
    TouchContentAiSessionData,
} from "./graphql-types"

@Resolver()
/** GraphQL entry that bumps recency so this conversation is the one auto-reopened on reload. */
export class TouchContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Mark a content-AI conversation as just-opened (bumps recency → it is the
     * one auto-reopened on reload). Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation opened",
        [Locale.Vi]: "Đã mở hội thoại",
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => TouchContentAiSessionResponse,
        {
            name: "touchContentAiSession",
            description: "Mark a content-AI conversation as just-opened (persists last-read).",
        },
    )
    async execute(
        @Args("request")
            request: TouchContentAiSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<TouchContentAiSessionData> {
        await this.contentAiService.touchSession({
            userId: user.id,
            sessionId: request.sessionId,
        })
        return {
            touched: true,
        }
    }
}
