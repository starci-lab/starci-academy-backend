import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import type {
    Document,
} from "@langchain/core/documents"
import {
    InjectQdrantClient,
} from "@modules/databases"
import {
    EmbeddingModelService,
} from "@modules/langchain"

/**
 * Kinds of CV RAG reference material, used to scope a retrieval to a slice of the
 * `cv_rag` collection (a `kind` payload filter):
 * - `rubric`  — CV quality rubric / expectations per seniority level.
 * - `catalog` — skill & technology catalog (canonical naming).
 * - `sample`  — sample CV phrasing / exemplars per role & level.
 */
export type CvRagKind = "rubric" | "catalog" | "sample"

/** Params for {@link CvRagRetrievalService.retrieveCvContext}. */
export interface RetrieveCvContextParams {
    /** The retrieval query (built from the inferred level / role / tech stack). */
    query: string
    /** Which reference slices to search (payload `kind` filter). */
    kinds: Array<CvRagKind>
    /** How many chunks to pull (defaults to {@link DEFAULT_CV_RAG_TOP_K}). */
    topK?: number
}

/** Result of {@link CvRagRetrievalService.retrieveCvContext}. */
export interface RetrieveCvContextResult {
    /** Assembled excerpt (empty when retrieval missed / failed / index absent). */
    excerpt: string
    /** Number of chunks included in the excerpt. */
    retrievedChunks: number
}

/** Default retrieval depth when the caller does not override `topK`. */
const DEFAULT_CV_RAG_TOP_K = 4

/**
 * Qdrant collection holding the CV RAG reference vectors (rubric / catalog /
 * sample). Kept as a constant (no env dependency) so this read-only service is
 * self-contained. Exported so {@link CvRagIndexService} (the write side, which
 * builds this same collection) imports the identical literal — one source of
 * truth for the collection name shared by both halves of the CV RAG stack.
 */
export const CV_RAG_COLLECTION = "cv_rag"

@Injectable()
/**
 * Retrieves CV-authoring reference material (rubric / skill catalog / sample
 * phrasing) most relevant to a query from the persistent `cv_rag` Qdrant
 * collection. Read-only + persistent (mirrors {@link CourseRagRetrievalService}
 * rather than the per-run ephemeral grading retrieval).
 *
 * Opens the existing collection, runs ONE similarity search scoped to the
 * requested `kinds` (payload `metadata.kind` filter), and joins the hits into a
 * single excerpt. Degrades to an EMPTY excerpt on any failure (collection
 * missing, embedder/Qdrant down) so the CV compose step's prompt is advisory —
 * retrieval never blocks CV generation.
 */
export class CvRagRetrievalService {
    /** Scoped logger for (non-fatal) retrieval failures. */
    private readonly logger = new Logger(CvRagRetrievalService.name)

    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly embeddingModelService: EmbeddingModelService,
    ) { }

    /**
     * Retrieve the top-k CV reference chunks for a query, scoped to `kinds`, and
     * assemble them into one excerpt. Returns an empty excerpt when the index is
     * absent or retrieval fails.
     *
     * @param params - {@link RetrieveCvContextParams}.
     * @returns The assembled excerpt + how many chunks it includes.
     */
    async retrieveCvContext(
        {
            query,
            kinds,
            topK,
        }: RetrieveCvContextParams,
    ): Promise<RetrieveCvContextResult> {
        const trimmed = query.trim()
        if (!trimmed || kinds.length === 0) {
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
        const k = topK ?? DEFAULT_CV_RAG_TOP_K
        try {
            // must match the embedder the index was built with so query + stored
            // vectors share the embedding space
            const embeddingModel = await this.embeddingModelService.getViaBalancer()
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName: CV_RAG_COLLECTION,
                },
            )
            // LangChain stores doc metadata under a `metadata` payload sub-object →
            // filter the `kind` field with a `match.any` over the requested kinds
            const hits = await vectorStore.similaritySearch(
                trimmed,
                k,
                {
                    must: [
                        {
                            key: "metadata.kind",
                            match: {
                                any: kinds,
                            },
                        },
                    ],
                },
            )
            return {
                excerpt: this.assemble(hits),
                retrievedChunks: hits.length,
            }
        } catch (error) {
            // index missing / Qdrant or embedder down → empty excerpt (advisory RAG)
            this.logger.warn(
                `CV RAG retrieval failed for kinds [${kinds.join(", ")}] (continuing without context): ${
                    error instanceof Error ? error.message : String(error)
                }`,
            )
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
    }

    /**
     * Join retrieved chunk contents into one excerpt, de-duplicating identical
     * chunk text.
     *
     * @param hits - The retrieved documents in similarity order.
     * @returns The joined excerpt.
     */
    private assemble(
        hits: Array<Document>,
    ): string {
        const seen = new Set<string>()
        const parts: Array<string> = []
        for (const hit of hits) {
            const text = hit.pageContent
            if (seen.has(text)) {
                continue
            }
            seen.add(text)
            parts.push(text)
        }
        return parts.join("\n\n")
    }
}
