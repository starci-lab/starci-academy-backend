import type {
    Document,
} from "@langchain/core/documents"
import type {
    EmbeddingsInterface,
} from "@langchain/core/embeddings"

/** One yes/no criterion whose prose steers retrieval toward the evidence that satisfies it. */
export interface GradingRetrievalCriterion {
    /** Criterion prose used as the similarity query. */
    body: string
}

/** Params for {@link GradingRetrievalService.retrieveSourceExcerpt}. */
export interface RetrieveGradingSourceParams {
    /**
     * Unique key for THIS grading run (e.g. `${userChallengeSubmissionId}-${fencingToken}`).
     * Used as the Qdrant collection namespace so a stalled, re-dispatched job (which carries a
     * different fencing token) can never delete or overwrite the live owner's vectors
     * mid-search — each run owns an isolated collection.
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
