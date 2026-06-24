import {
    Injectable,
} from "@nestjs/common"
import {
    ChatService,
} from "@modules/bussiness"
import type {
    ChatConversationObject,
} from "../../../shared/chat"

/**
 * Query service returning the global community chat conversation handle
 * (lazily created on first access).
 */
@Injectable()
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
