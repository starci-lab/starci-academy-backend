import {
    Injectable,
} from "@nestjs/common"
import {
    ChatService,
} from "@modules/bussiness/chat/chat.service"
import type {
    ChatConversationObject,
} from "../../../shared/chat/object-types/chat-conversation.object"

@Injectable()
/**
 * Query service returning the global community chat conversation handle
 * (lazily created on first access).
 */
export class CommunityChatConversationService {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    /**
     * Gets (or creates) the community conversation and maps it to a handle.
     * @returns The community conversation handle (id + type).
     */
    async execute(): Promise<ChatConversationObject> {
        // resolve the singleton community room (create on first access)
        const conversation = await this.chatService.getOrCreateCommunityConversation()
        return {
            id: conversation.id,
            type: conversation.type,
        }
    }
}
