import {
    SocketIoPayload,
} from "@modules/platform/socketio/types/ws-payload"

/** Data a client sends to join a conversation's chat room. */
export interface SubscribeCommunityChatData {
    /** Conversation whose room the client wants to join. */
    conversationId: string
}

/** Client -> server payload to join a conversation's chat room. */
export type SubscribeCommunityChatSocketIoPayload = SocketIoPayload<SubscribeCommunityChatData>

/** Server -> client message when a chat message is created in a conversation. */
export interface ChatMessageCreatedSocketIoMessage {
    /** Conversation the message belongs to. */
    conversationId: string
    /** The message that was created. */
    messageId: string
    /** Author of the message. */
    authorId: string
}

/** Successful authorization and join result for a conversation room. */
export interface CommunityChatSubscriptionSocketIoMessage {
    /** Conversation whose authorized room was joined. */
    conversationId: string
}
