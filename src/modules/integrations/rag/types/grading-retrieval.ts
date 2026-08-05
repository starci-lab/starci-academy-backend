import type {
    Document,
} from "@langchain/core/documents"
import type {
    EmbeddingsInterface,
} from "@langchain/core/embeddings"
import type {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"

/** One yes/no criterion whose prose steers retrieval toward the evidence that satisfies it. */
export interface GradingRetrievalCriterion {
    /** Criterion prose used as the similarity query. */
    body: string
}

/**
 * Params for {@link GradingRetrievalService.retrieveGradingExcerpt} -- the
 * high-level entry point that owns the WHOLE retrieval pipeline (chunk -> embed ->
 * vector-retrieve -> assemble). Callers (grading workers) hand over the raw
 * gathered source documents plus their retrieval config; no chunking, embedding,
 * or vector-store code leaks into the caller.
 */
export interface RetrieveGradingExcerptParams {
    /** {@link RetrieveGradingSourceParams.runKey} -- per-run Qdrant collection namespace. */
    runKey: string
    /** Raw, UN-split source documents (repo files / document text) -- the service chunks them. */
    documents: Array<Document>
    /** Per-language yes/no criteria the retrieval is steered toward. */
    criteria: Array<GradingRetrievalCriterion>
    /** Chunk size for the recursive splitter. */
    chunkSize: number
    /** Chunk overlap for the recursive splitter. */
    chunkOverlap: number
    /** The exact embedding `{ model, provider }` to vectorize chunks + queries (kept fixed so dims match). */
    embedding: {
        /** Embedding model name. */
        model: string
        /** Embedding provider. */
        provider: ModelProvider
    }
    /** Hard ceiling on the assembled excerpt length (characters). */
    maxChars: number
    /** Job id, for log correlation. */
    jobId: string
    /** Per-criterion retrieval depth (defaults to the service default). */
    perCriterionTopK?: number
}

/** Params for {@link GradingRetrievalService.retrieveSourceExcerpt}. */
export interface RetrieveGradingSourceParams {
    /**
     * Unique key for THIS grading run (e.g. `${userChallengeSubmissionId}-${fencingToken}`).
     * Used as the Qdrant collection namespace so a stalled, re-dispatched job (which carries a
     * different fencing token) can never delete or overwrite the live owner's vectors
     * mid-search -- each run owns an isolated collection.
     */
    runKey: string
    /** Pre-split source chunks (code files / document text). */
    chunks: Array<Document>
    /** Per-language yes/no criteria the retrieval is steered toward. */
    criteria: Array<GradingRetrievalCriterion>
    /** Resolved embedding model used to vectorize the chunks + queries. */
    embeddingModel: EmbeddingsInterface
    /** Hard ceiling on the assembled excerpt length (characters). */
    maxChars: number
    /** Job id, for log correlation. */
    jobId: string
    /** Per-criterion retrieval depth (defaults to {@link DEFAULT_PER_CRITERION_TOP_K}). */
    perCriterionTopK?: number
}

/** Params for {@link GradingRetrievalService.retrieveWithVectorStore}. */
export interface RetrieveWithVectorStoreParams {
    /** Per-run Qdrant collection namespace. */
    runKey: string
    /** Pre-split source chunks (code files / document text). */
    chunks: Array<Document>
    /** Per-criterion similarity queries (one per {@link GradingRetrievalCriterion}). */
    queries: Array<string>
    /** Resolved embedding model used to vectorize the chunks + queries. */
    embeddingModel: EmbeddingsInterface
    /** Hard ceiling on the assembled excerpt length (characters). */
    maxChars: number
    /** Job id, for log correlation. */
    jobId: string
    /** Per-criterion retrieval depth. */
    perCriterionTopK: number
}

/** Result of a retrieval run: the excerpt plus observability stats. */
export interface RetrieveGradingSourceResult {
    /** The assembled, budget-bounded source excerpt to feed the grader. */
    excerpt: string
    /** Whether the excerpt was truncated to fit {@link RetrieveGradingSourceParams.maxChars}. */
    truncated: boolean
    /** Number of distinct chunks included in the excerpt. */
    retrievedChunks: number
    /** Whether retrieval degraded to raw chunks (e.g. a vector-store failure). */
    degraded: boolean
}
