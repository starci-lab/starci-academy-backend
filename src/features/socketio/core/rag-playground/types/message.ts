import type {
    RagPlaygroundSourceChunk,
} from "@modules/rag"

/**
 * Server → client message carrying one streamed token delta for a RAG
 * Playground run. The final emission sets `done: true` and carries the
 * `sources` (retrieved chunks) so the client can render citations once the
 * answer is complete.
 */
export interface RagPlaygroundRunChunkSocketIoMessage {
    /** Run this chunk belongs to. */
    runId: string
    /** Incremental text produced since the previous chunk (empty on the terminal chunk). */
    delta: string
    /** Whether this is the final chunk of the stream. */
    done: boolean
    /** Retrieved chunks backing the answer — present on the terminal chunk. */
    sources?: Array<RagPlaygroundSourceChunk>
    /** Present on a failed/expired run — a short, visitor-facing reason. */
    error?: string
}

/** Params for {@link RagPlaygroundGateway.emitChunk}. */
export interface EmitChunkParams {
    /** Run room to emit the chunk into. */
    room: string
    /** The chunk message to broadcast. */
    data: RagPlaygroundRunChunkSocketIoMessage
}
