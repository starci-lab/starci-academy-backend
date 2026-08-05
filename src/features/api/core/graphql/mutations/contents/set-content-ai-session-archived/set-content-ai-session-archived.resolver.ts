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
    SetContentAiSessionArchivedRequest,
    SetContentAiSessionArchivedResponse,
} from "./graphql-types"
import type {
    SetContentAiSessionArchivedData,
} from "./graphql-types"

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
