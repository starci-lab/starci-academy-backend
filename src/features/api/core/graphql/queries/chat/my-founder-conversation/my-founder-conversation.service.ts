import {
    Injectable,
} from "@nestjs/common"
import {
    ChatService,
} from "@modules/bussiness/chat/chat.service"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import type {
    ChatConversationObject,
} from "../../../shared/chat/object-types/chat-conversation.object"

@Injectable()
/**
 * Query service returning the viewer's private founder DM conversation handle
 * (lazily created on first open).
 */
export class MyFounderConversationService {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    /**
     * Gets (or creates) the viewer's founder DM and maps it to a handle.
     * @param user - The viewing user (the DM's owning member).
     * @returns The founder DM conversation handle (id + type).
     */
    async execute(user: UserEntity): Promise<ChatConversationObject> {
        // resolve this member's DM thread with the founder (create on first open)
        const conversation = await this.chatService.getOrCreateFounderDm({
            memberId: user.id,
        })
        return {
            id: conversation.id,
            type: conversation.type,
        }
    }
}
