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
    ChatMessagesPageObject,
} from "../../../shared/chat"
import {
    ChatMessagesRequest,
    ChatMessagesResponse,
} from "./graphql-types"
import {
    ChatMessagesService,
} from "./chat-messages.service"

@Resolver()
/** GraphQL resolver for the `chatMessages` query. */
export class ChatMessagesResolver {
    constructor(
        private readonly chatMessagesService: ChatMessagesService,
    ) {}

    /**
     * Lists a cursor-paginated page of a conversation's messages (member-only;
     * a founder DM is restricted to its member + the founder).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Messages fetched successfully",
        [Locale.Vi]: "Lấy tin nhắn thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Query(
        () => ChatMessagesResponse,
        {
            name: "chatMessages",
            description: "Cursor-paginated messages of a chat conversation.",
        },
    )
    async execute(
        @Args("request")
            request: ChatMessagesRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ChatMessagesPageObject> {
        return this.chatMessagesService.execute({
            request,
            user,
        })
    }
}
