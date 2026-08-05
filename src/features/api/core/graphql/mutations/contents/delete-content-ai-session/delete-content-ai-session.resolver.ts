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
    DeleteContentAiSessionRequest,
} from "./graphql-types/request"
import {
    DeleteContentAiSessionResponse,
} from "./graphql-types/response"
import type {
    DeleteContentAiSessionData,
} from "./graphql-types/response"

@Resolver()
/** GraphQL entry that removes a conversation the user no longer wants in the sidebar. */
export class DeleteContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Delete the current user's saved content-AI conversation (a hard delete
     * of the session row, cascading its messages -- not a partial history
     * wipe), scoped to their enrollment. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation deleted successfully",
        [Locale.Vi]: "Đã xoá hội thoại", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => DeleteContentAiSessionResponse,
        {
            name: "deleteContentAiSession",
            description: "Delete one of the current user's content-AI conversations (sessions).",
        },
    )
    async execute(
        @Args("request")
            request: DeleteContentAiSessionRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<DeleteContentAiSessionData> {
        await this.contentAiService.deleteSession({
            userId: user.id,
            sessionId: request.sessionId,
        })
        return {
            cleared: true,
        }
    }
}
