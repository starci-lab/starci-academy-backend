/**
 * Payload emitted when a chat message is created in a conversation.
 *
 * Kept minimal (refetch-on-event model): clients in the conversation's room use it
 * to refetch the latest messages rather than rendering from the payload directly.
 */
export interface ChatMessageChangedEventPayload {
  /** Conversation the message belongs to (targets the socket room + client filter). */
  conversationId: string;
  /** The message that was created. */
  messageId: string;
  /** Author of the message (lets a client skip its own echo if it wants). */
  authorId: string;
}

/** Non-confidential durable invalidation; clients refetch canonical actor projections. */
export interface GlobalChatInvalidatedEventPayload {
  conversationId: string;
  messageId: string | null;
  actorId: string;
}
