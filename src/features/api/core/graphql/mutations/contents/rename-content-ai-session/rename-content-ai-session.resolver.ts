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
    RenameContentAiSessionRequest,
} from "./graphql-types/request"
import {
    RenameContentAiSessionResponse,
} from "./graphql-types/response"
import type {
    RenameContentAiSessionData,
} from "./graphql-types/response"

@Resolver()
/** GraphQL entry that lets the user replace a generated sidebar title. */
export class RenameContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Rename one of the current user's content-AI conversations. A blank title
     * resets it to auto-titling. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation renamed",
        [Locale.Vi]: "Đã đổi tên hội thoại", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RenameContentAiSessionResponse,
        {
            name: "renameContentAiSession",
            description: "Rename one of the current user's content-AI conversations.",
        },
    )
    async execute(
        @Args("request")
            request: RenameContentAiSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<RenameContentAiSessionData> {
        await this.contentAiService.renameContentAiSession({
            userId: user.id,
            sessionId: request.sessionId,
            title: request.title,
        })
        return {
            renamed: true,
        }
    }
}
