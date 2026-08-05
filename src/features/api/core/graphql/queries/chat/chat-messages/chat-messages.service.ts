import {
    Injectable,
} from "@nestjs/common"
import {
    ChatService,
} from "@modules/bussiness/chat/chat.service"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
import type {
    ExecuteParams,
} from "../../../../types/execute"
import {
    mapChatMessageNode,
} from "../../../shared/chat/mappers/chat-message-node"
import {
    ChatMessagesPageObject,
} from "../../../shared/chat/object-types/chat-messages-page.object"
import type {
    ChatMessagesRequest,
} from "./graphql-types/request"
import type {
    DecodedChatCursor,
} from "./types"

/** Hard cap on page size to bound the query regardless of client input. */
const MAX_LIMIT = 50

/** Default page size when the client omits `limit`. */
const DEFAULT_LIMIT = 30

@Injectable()
/**
 * Query service for a conversation's messages. Access is enforced in the domain
 * service (member-only + DM ownership); this layer pages + maps to client nodes.
 */
export class ChatMessagesService {
    constructor(
        private readonly chatService: ChatService,
    ) {}

    /**
     * Lists a page of a conversation's messages and assembles client-facing nodes.
     * @param params - Execute params carrying the {@link ChatMessagesRequest} + user.
     * @returns A page of message nodes + the next cursor.
     */
    async execute({
        request,
        user,
    }: ExecuteParams<ChatMessagesRequest>): Promise<ChatMessagesPageObject> {
        // narrow the optional user (guards already require auth)
        if (!user) {
            throw new UserNotFoundException({
            })
        }
        // clamp page size into a sane bound regardless of what the client asked for
        const limit = Math.min(Math.max(request.limit ?? DEFAULT_LIMIT,
            1),
        MAX_LIMIT)
        // decode the opaque cursor -> offset; absent/bad cursor means page 1 (offset 0)
        const offset = this.decodeCursor(request.cursor)?.offset ?? 0
        // the domain service access-checks (member + DM ownership) before reading
        const {
            messages,
            total,
        } = await this.chatService.listMessages({
            conversationId: request.conversationId,
            user,
            offset,
            limit,
        })
        // map each row into a node from this viewer's perspective
        const items = messages.map((message) => mapChatMessageNode({
            message,
            viewerId: user.id,
        }))
        // there is an older page iff we have not yet walked past the total
        const hasMore = offset + messages.length < total
        const nextCursor = hasMore
            ? this.encodeCursor(offset + limit)
            : null
        return {
            items,
            nextCursor,
        }
    }

    /**
     * Encode the next `offset` into an opaque base64url token.
     * @param offset - rows to skip on the next page
     * @returns the opaque cursor string
     */
    private encodeCursor(offset: number): string {
        // base64url-encoded JSON keeps the cursor opaque to the client
        return Buffer.from(JSON.stringify({
            offset,
        }),
        "utf8").toString("base64url")
    }

    /**
     * Decode an opaque cursor back to `{ offset }`. Returns null when absent or
     * malformed (treated as page 1 -> offset 0).
     * @param cursor - the opaque cursor, or undefined
     * @returns the decoded cursor, or null
     */
    private decodeCursor(cursor?: string): DecodedChatCursor | null {
        // no cursor -> page 1
        if (!cursor) {
            return null
        }
        // base64url -> JSON; bail to page 1 on any bad/partial token
        try {
            const raw = Buffer.from(cursor,
                "base64url").toString("utf8")
            const parsed = JSON.parse(raw) as Partial<DecodedChatCursor>
            // reject anything that is not a finite, non-negative offset
            if (typeof parsed.offset !== "number"
                || !Number.isFinite(parsed.offset)
                || parsed.offset < 0) {
                return null
            }
            return {
                offset: Math.floor(parsed.offset),
            }
        } catch {
            return null
        }
    }
}
