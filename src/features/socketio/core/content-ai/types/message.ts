import type {
    TypedSocket,
} from "@modules/socketio"

/**
 * Server -> client message carrying one streamed token delta for a content-AI
 * answer. The final emission of a stream sets `done: true`; a failed stream
 * sets `done: true` plus an `error` message.
 */
export interface ContentAiChunkSocketIoMessage {
    /** Stream this chunk belongs to (echoes the request `streamId`). */
    streamId: string
    /**
     * Incremental text produced since the previous chunk. Empty string on the
     * terminal `done` chunk.
     */
    delta: string
    /** Whether this is the final chunk of the stream. */
    done: boolean
    /** Error message when the stream failed (present only on a failed terminal chunk). */
    error?: string
}

/** Params for {@link import("../content-ai.gateway").ContentAiGateway.emitChunk}. */
export interface EmitChunkParams {
    /** The socket to emit the chunk to. */
    client: TypedSocket
    /** The chunk payload to send. */
    data: ContentAiChunkSocketIoMessage
}
