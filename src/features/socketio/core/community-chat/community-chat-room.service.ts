import {
    Injectable,
} from "@nestjs/common"

/** Builds the Socket.IO room name for a chat conversation. */
@Injectable()
export class CommunityChatRoomService {
    /**
     * Room name for a conversation. All participants of one conversation share it.
     * @param conversationId - Conversation primary id.
     * @returns The deterministic room name, e.g. `community_chat:abc-123`.
     */
    name(conversationId: string): string {
        // namespace the id so it never collides with other room conventions
        return `community_chat:${conversationId}`
    }
}
