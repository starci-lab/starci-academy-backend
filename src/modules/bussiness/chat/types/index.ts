import type {
    ChatConversationEntity,
} from "@modules/databases/postgresql/primary/entities/chat-conversation.entity"
import type {
    ChatMessageEntity,
} from "@modules/databases/postgresql/primary/entities/chat-message.entity"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"

/** Params to get-or-create a member's founder DM conversation. */
export interface GetOrCreateFounderDmParams {
    /** The member who owns the DM thread with the founder. */
    memberId: string
}

/** Params to list a page of a conversation's messages. */
export interface ListChatMessagesParams {
    /** Conversation whose messages are listed. */
    conversationId: string
    /** The requesting user (for the member + DM-ownership access check). */
    user: UserEntity
    /** Rows to skip (offset pagination, newest-first). */
    offset: number
    /** Max rows to return. */
    limit: number
}

/** Result of a chat messages listing. */
export interface ListChatMessagesResult {
    /** The page of messages (author relation loaded), newest-first. */
    messages: Array<ChatMessageEntity>
    /** Total messages in the conversation (for pagination). */
    total: number
}

/** Params to send a chat message. */
export interface SendChatMessageParams {
    /** Conversation the message is sent to. */
    conversationId: string
    /** Raw message body authored by the user. */
    body: string
    /** The sending user (for the member + DM-ownership access check). */
    user: UserEntity
}

/** Params to assert a user may participate in a conversation. */
export interface AssertChatAccessParams {
    /** The conversation being accessed. */
    conversation: ChatConversationEntity
    /** The user attempting to read/send. */
    user: UserEntity
}
