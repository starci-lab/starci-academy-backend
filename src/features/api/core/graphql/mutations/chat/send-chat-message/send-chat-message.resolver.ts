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
    ChatMessageNodeObject,
} from "../../../shared/chat/object-types/chat-message-node.object"
import {
    SendChatMessageRequest,
} from "./graphql-types/request"
import {
    SendChatMessageResponse,
} from "./graphql-types/response"
import {
    SendChatMessageService,
} from "./send-chat-message.service"

@Resolver()
/** GraphQL resolver for the `sendChatMessage` mutation. */
export class SendChatMessageResolver {
    constructor(
        private readonly sendChatMessageService: SendChatMessageService,
    ) {}

    /**
     * Sends a chat message (member-only; founder DM restricted to member + founder).
     */
    @UseThrottler(ThrottlerConfig.Soft)
    @GraphQLSuccessMessage({
        [Locale.En]: "Message sent successfully",
        [Locale.Vi]: "Gửi tin nhắn thành công", // vn-ok: vi-locale string emitted to clients
    })
    @UseGuards(
        KeycloakAuthGraphQLGuard,
    )
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SendChatMessageResponse,
        {
            name: "sendChatMessage",
            description: "Sends a chat message to a conversation.",
        },
    )
    async execute(
        @Args("request")
            request: SendChatMessageRequest,
        @KeycloakGraphQLUser()
            user: UserEntity,
    ): Promise<ChatMessageNodeObject> {
        return this.sendChatMessageService.execute({
            request,
            user,
        })
    }
}
