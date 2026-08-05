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
    DeleteContentAiSessionRequest,
    DeleteContentAiSessionResponse,
} from "./graphql-types"
import type {
    DeleteContentAiSessionData,
} from "./graphql-types"

@Resolver()
/** GraphQL entry that removes a conversation the user no longer wants in the sidebar. */
export class DeleteContentAiSessionResolver {
    constructor(
        private readonly contentAiService: ContentAiService,
    ) { }

    /**
     * Delete the current user's saved content-AI conversation (a hard delete
     * of the session row, cascading its messages — not a partial history
     * wipe), scoped to their enrollment. Requires authentication.
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Conversation deleted successfully",
        [Locale.Vi]: "Đã xoá hội thoại",
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
