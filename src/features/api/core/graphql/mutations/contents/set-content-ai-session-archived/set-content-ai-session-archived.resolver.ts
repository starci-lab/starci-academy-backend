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
    SetContentAiSessionArchivedRequest,
} from "./graphql-types/request"
import {
    SetContentAiSessionArchivedResponse,
} from "./graphql-types/response"
import type {
    SetContentAiSessionArchivedData,
} from "./graphql-types/response"

@Resolver()
/** GraphQL entry that hides a conversation without deleting its history. */
export class SetContentAiSessionArchivedResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Archive / unarchive one of the current user's content-AI conversations.
     * Archived conversations leave the default list but stay searchable. Requires
     * authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation updated",
        [Locale.Vi]: "Đã cập nhật hội thoại", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(KeycloakAuthGraphQLGuard)
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SetContentAiSessionArchivedResponse,
        {
            name: "setContentAiSessionArchived",
            description: "Archive / unarchive one of the current user's content-AI conversations.",
        },
    )
    async execute(
        @Args("request")
            request: SetContentAiSessionArchivedRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<SetContentAiSessionArchivedData> {
        await this.contentAiService.setContentAiSessionArchived({
            userId: user.id,
            sessionId: request.sessionId,
            archived: request.archived,
        })
        return {
            archived: request.archived,
        }
    }
}
