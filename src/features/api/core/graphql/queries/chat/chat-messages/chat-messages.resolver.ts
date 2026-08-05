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
    ChatMessagesPageObject,
} from "../../../shared/chat/object-types/chat-messages-page.object"
import {
    ChatMessagesRequest,
} from "./graphql-types/request"
import {
    ChatMessagesResponse,
} from "./graphql-types/response"
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
