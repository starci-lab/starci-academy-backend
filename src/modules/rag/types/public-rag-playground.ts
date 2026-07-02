import type {
    BaseMessage,
} from "@langchain/core/messages"
import type {
    RagPlaygroundSourceKind,
} from "@modules/databases"

/** Params for {@link PublicRagPlaygroundService.index}. */
export interface IndexRagPlaygroundParams {
    /** Client-generated session id (anonymous; also names the Qdrant collection). */
    sessionId: string
    /** How the source was supplied. */
    kind: RagPlaygroundSourceKind
    /** Pasted/uploaded code (required for Paste/Upload). */
    code?: string | null
    /** Optional language hint for the pasted/uploaded code (display only). */
    language?: string | null
    /** Uploaded file name (Upload only; used as the source label). */
    fileName?: string | null
    /** Public GitHub repo URL (Github only), e.g. `https://github.com/owner/repo`. */
    githubUrl?: string | null
}

/** Result of {@link PublicRagPlaygroundService.index}. */
export interface IndexRagPlaygroundResult {
    /** Echoes the session id (FE convenience). */
    sessionId: string
    /** How many chunks were indexed. */
    chunkCount: number
    /** Human-readable label of the indexed source (file name / repo / "Repo mẫu"). */
    sourceLabel: string
}

/** Params for {@link PublicRagPlaygroundService.retrieveContext}. */
export interface RetrieveRagPlaygroundContextParams {
    /** The session whose indexed source to search. */
    sessionId: string
    /** The visitor's question, used as the retrieval query. */
    question: string
    /** How many chunks to retrieve. Defaults to 5. */
    topK?: number
}

/** One retrieved chunk, shaped for citation display. */
export interface RagPlaygroundSourceChunk {
    /** File path the chunk came from, or null for a single pasted snippet. */
    filePath: string | null
    /** The chunk's text (capped for display). */
    snippet: string
}

/** Result of {@link PublicRagPlaygroundService.retrieveContext}. */
export interface RetrieveRagPlaygroundContextResult {
    /** The retrieved chunks, most relevant first (empty on a degraded retrieval). */
    chunks: Array<RagPlaygroundSourceChunk>
}

/** One prepared (not-yet-streamed) ask, held in-memory by the run registry. */
export interface PreparedRagPlaygroundRun {
    /** The system + human messages ready for the model. */
    messages: Array<BaseMessage>
    /** The retrieved chunks, echoed back to the client once streaming completes. */
    sources: Array<RagPlaygroundSourceChunk>
}
