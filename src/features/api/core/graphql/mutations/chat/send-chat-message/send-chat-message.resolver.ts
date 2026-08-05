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
    ChatMessageNodeObject,
} from "../../../shared/chat"
import {
    SendChatMessageRequest,
    SendChatMessageResponse,
} from "./graphql-types"
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
