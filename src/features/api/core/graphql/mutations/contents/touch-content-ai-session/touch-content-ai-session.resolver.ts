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
    TouchContentAiSessionRequest,
} from "./graphql-types/request"
import {
    TouchContentAiSessionResponse,
} from "./graphql-types/response"
import type {
    TouchContentAiSessionData,
} from "./graphql-types/response"

@Resolver()
/** GraphQL entry that bumps recency so this conversation is the one auto-reopened on reload. */
export class TouchContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Mark a content-AI conversation as just-opened (bumps recency -> it is the
     * one auto-reopened on reload). Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation opened",
        [Locale.Vi]: "Đã mở hội thoại", // vn-ok: vi-locale string emitted to clients
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
