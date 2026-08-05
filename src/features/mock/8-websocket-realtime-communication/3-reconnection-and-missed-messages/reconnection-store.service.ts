import {
    Injectable,
} from "@nestjs/common"
import {
    CHAT_RING_CAP,
} from "./constants"
import type {
    ChatMessage,
} from "./types"

@Injectable()
/**
 * In-memory ring-buffer chat store for lesson `3-reconnection-and-missed-messages`.
 *
 * Each room keeps a fixed-size history (`CHAT_RING_CAP`) and a monotonic seq
 * counter that never resets while the process is alive. `replaySince` returns
 * the messages a reconnecting client missed, capped to the ring size.
 */
export class ReconnectionStoreService {
    /** room -> fixed-size message history (oldest first). */
    private readonly history = new Map<string, Array<ChatMessage>>()

    /** room -> last assigned sequence number. */
    private readonly seqByRoom = new Map<string, number>()

    /**
     * Append a message to a room, assigning the next sequence number and
     * trimming the buffer to the ring cap.
     *
     * @returns The stored message including its assigned seq + timestamp.
     */
    append(roomId: string, userId: string, text: string): ChatMessage {
        // advance the room's monotonic counter
        const seq = (this.seqByRoom.get(roomId) ?? 0) + 1
        this.seqByRoom.set(roomId,
            seq)
        // build the stored message with a server timestamp
        const message: ChatMessage = {
            seq, userId, text, timestamp: Date.now() 
        }
        // lazily create the room buffer and push the new message
        const buffer = this.history.get(roomId) ?? []
        buffer.push(message)
        // drop the oldest entries until the buffer fits the ring cap
        while (buffer.length > CHAT_RING_CAP) buffer.shift()
        this.history.set(roomId,
            buffer)
        return message
    }

    /**
     * Return the room's latest sequence number (0 if the room has no messages).
     */
    lastSeq(roomId: string): number {
        // a room with no messages reports seq 0
        return this.seqByRoom.get(roomId) ?? 0
    }

    /**
     * Return messages newer than `lastSeq`, oldest first, capped to the ring size.
     */
    replaySince(roomId: string, lastSeq: number): Array<ChatMessage> {
        // unknown room → nothing to replay
        const buffer = this.history.get(roomId)
        if (!buffer) return []
        // keep only messages the client has not seen yet
        const missed = buffer.filter((message) => message.seq > lastSeq)
        // cap the slice so a lastSeq=0 client cannot pull more than the ring holds
        return missed.slice(-CHAT_RING_CAP)
    }
}
