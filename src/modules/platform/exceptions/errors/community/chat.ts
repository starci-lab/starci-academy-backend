import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata when a non-member tries to use member-only chat. */
export interface ChatMembershipRequiredExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the user who lacks an active membership. */
    userId: string
}

/** Thrown when a user without an active membership tries to read/send chat. */
export class ChatMembershipRequiredException extends AbstractException {
    constructor(
        {
            userId,
            originalError,
        }: ChatMembershipRequiredExceptionMetadata,
    ) {
        super(
            "An active membership is required to use community chat",
            "CHAT_MEMBERSHIP_REQUIRED_EXCEPTION",
            {
                userId,
                originalError,
            },
        )
    }
}

/** Metadata when a chat conversation row cannot be located. */
export interface ChatConversationNotFoundExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the conversation that was not found. */
    conversationId: string
}

/** Thrown when a conversation id does not resolve to a row. */
export class ChatConversationNotFoundException extends AbstractException {
    constructor(
        {
            conversationId,
            originalError,
        }: ChatConversationNotFoundExceptionMetadata,
    ) {
        super(
            "Chat conversation not found",
            "CHAT_CONVERSATION_NOT_FOUND_EXCEPTION",
            {
                conversationId,
                originalError,
            },
        )
    }
}

/** Metadata when a user may not participate in a conversation. */
export interface ChatForbiddenExceptionMetadata extends AbstractExceptionMetadata {
    /** Id of the conversation the action targeted. */
    conversationId: string
    /** Id of the user who attempted the action. */
    userId: string
}

/** Thrown when a user tries to read/send in a DM that is not theirs. */
export class ChatForbiddenException extends AbstractException {
    constructor(
        {
            conversationId,
            userId,
            originalError,
        }: ChatForbiddenExceptionMetadata,
    ) {
        super(
            "You are not allowed to participate in this conversation",
            "CHAT_FORBIDDEN_EXCEPTION",
            {
                conversationId,
                userId,
                originalError,
            },
        )
    }
}
