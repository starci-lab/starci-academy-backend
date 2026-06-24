import {
    envConfig,
} from "@modules/env"
import type {
    ChatMessageEntity,
} from "@modules/databases"
import type {
    ChatMessageNodeObject,
} from "../object-types"

/** Params to map a chat message entity into a client-facing node. */
export interface MapChatMessageNodeParams {
    /** The message entity (with `author` relation loaded). */
    message: ChatMessageEntity
    /** The viewing user's id, or null when unknown. */
    viewerId: string | null
}

/**
 * Maps a chat message entity into a {@link ChatMessageNodeObject}, stamping the
 * per-viewer `isMine` flag and the founder badge.
 * @param params - {@link MapChatMessageNodeParams}
 * @returns The client-facing message node.
 */
export const mapChatMessageNode = ({
    message,
    viewerId,
}: MapChatMessageNodeParams): ChatMessageNodeObject => ({
    // identity + content straight from the row
    id: message.id,
    conversationId: message.conversationId,
    body: message.body,
    createdAt: message.createdAt,
    // author relation must be loaded by the caller
    author: message.author,
    // only true for the authenticated author of this message
    isMine: viewerId ? message.authorId === viewerId : false,
    // founder badge: the author's username matches the configured founder handle
    isFounderAuthor: message.author.username === envConfig().community.founderUsername,
})
