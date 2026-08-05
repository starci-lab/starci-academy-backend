import {
    Injectable,
} from "@nestjs/common"
import {
    ChatService,
} from "@modules/bussiness"
import {
    UserNotFoundException,
} from "@modules/exceptions"
import type {
    ExecuteParams,
} from "@features/api/core/types"
import {
    ChatMessageNodeObject,
    mapChatMessageNode,
} from "../../../shared/chat"
import type {
    SendChatMessageRequest,
} from "./graphql-types"

@Injectable()
/**
 * Mutation service that sends a chat message and returns its client-facing node.
 * Access (member-only + DM ownership) is enforced in the domain service.
 */
export class SendChatMessageService {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    /**
     * Sends a chat message to a conversation.
     * @param params - Execute params carrying the {@link SendChatMessageRequest} + user.
     * @returns The sent message node.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<SendChatMessageRequest>): Promise<ChatMessageNodeObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // send via the domain service (access check + event fan-out inside)
        const message = await this.chatService.sendMessage({
            conversationId: request.conversationId,
            body: request.body,
            user,
        })
        // map from the sender's perspective (isMine = true)
        return mapChatMessageNode({
            message,
            viewerId: user.id,
        })
    }
}
