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
import {
    envConfig,
} from "@modules/env"

/** Params for {@link ContentRagRetrievalService.retrieveContentExcerpt}. */
export interface RetrieveContentExcerptParams {
    /** Content the chunks must belong to (payload filter). */
    contentId: string
    /** The learner's question — the retrieval query. */
    query: string
    /** Optional override for how many chunks to pull (defaults to env top-k). */
    topK?: number
}

/** Result of {@link ContentRagRetrievalService.retrieveContentExcerpt}. */
export interface RetrieveContentExcerptResult {
    /** Assembled excerpt (empty when retrieval missed / failed / index absent). */
    excerpt: string
    /** Number of chunks included in the excerpt. */
    retrievedChunks: number
}

/** Params for {@link ContentRagRetrievalService.retrieveCourseExcerpt}. */
export interface RetrieveCourseExcerptParams {
    /** Course the chunks must belong to (payload filter — spans every lesson of the course). */
    courseId: string
    /** The retrieval query (e.g. an interviewer's next probe, or a grading question). */
    query: string
    /** Optional override for how many chunks to pull (defaults to env top-k). */
    topK?: number
}

/** Result of {@link ContentRagRetrievalService.retrieveCourseExcerpt}. */
export interface RetrieveCourseExcerptResult {
    /** Assembled excerpt (empty when retrieval missed / failed / index absent). */
    excerpt: string
    /** Number of chunks included in the excerpt. */
    retrievedChunks: number
}

/**
 * Retrieves the lesson chunks most relevant to a content-AI question from the
 * persistent `content_rag` Qdrant collection (built by `ContentRagIndexService`).
 *
 * Opens the existing collection (no rebuild), runs ONE similarity search scoped
 * to the question's `contentId` (Qdrant payload filter on `metadata.contentId`),
 * and joins the hits into a single excerpt. Mirrors the grading RAG idioms
 * (`QdrantVectorStore` + similarity search) but is read-only + persistent rather
 * than per-run ephemeral.
 *
 * Degrades to an EMPTY excerpt on any failure (collection missing, embedder/
 * Qdrant down) so the caller can fall back to whole-body stuffing — retrieval is
 * never allowed to blackhole the chat.
 */
@Injectable()
export class ContentRagRetrievalService {
    /** Scoped logger for the (non-fatal) retrieval failures. */
    private readonly logger = new Logger(ContentRagRetrievalService.name)

    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly embeddingModelService: EmbeddingModelService,
    ) { }

    /**
     * Retrieve the top-k lesson chunks for a content-AI question and assemble them
     * into one excerpt. Returns an empty excerpt (so the caller falls back to
     * whole-body stuffing) when the index is absent or retrieval fails.
     *
     * @param params - The content id, the question, and an optional top-k.
     * @returns The assembled excerpt + how many chunks it includes.
     */
    async retrieveContentExcerpt(
        {
            contentId,
            query,
            topK,
        }: RetrieveContentExcerptParams,
    ): Promise<RetrieveContentExcerptResult> {
        const trimmed = query.trim()
        if (!trimmed) {
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
        const collectionName = envConfig().services.contentRag.collection
        const k = topK ?? envConfig().services.contentRag.retrievalTopK
        try {
            // local-first embedder (must match the one the index was built with so
            // query + stored vectors share the embedding space)
            const embeddingModel = await this.embeddingModelService.getViaBalancer()
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName,
                },
            )
            // LangChain stores doc metadata under a `metadata` payload sub-object →
            // filter keys are prefixed `metadata.`
            const hits = await vectorStore.similaritySearch(
                trimmed,
                k,
                {
                    must: [
                        {
                            key: "metadata.contentId",
                            match: {
                                value: contentId,
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
            // index missing / Qdrant or embedder down → empty excerpt, caller falls
            // back to whole-body stuffing (retrieval never blocks the chat)
            this.logger.warn(
                `Content RAG retrieval failed for content ${contentId} (falling back to whole body): ${error instanceof Error ? error.message : String(error)}`,
            )
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
    }

    /**
     * Retrieve the top-k chunks across an ENTIRE course (not one lesson) for a
     * query and assemble them into one excerpt — grounds the System Design mock
     * interview (interviewer probes + end-of-session grading) in "what this
     * course actually taught", spanning every lesson instead of one. Returns an
     * empty excerpt (caller degrades gracefully) when the index is absent or
     * retrieval fails — mirrors {@link retrieveContentExcerpt} exactly, just
     * filtered on `metadata.courseId` instead of `metadata.contentId` (both
     * fields are written by {@link import("./content-rag-index.service").ContentRagIndexService}
     * onto every indexed chunk).
     *
     * @param params - The course id, the retrieval query, and an optional top-k.
     * @returns The assembled excerpt + how many chunks it includes.
     */
    async retrieveCourseExcerpt(
        {
            courseId,
            query,
            topK,
        }: RetrieveCourseExcerptParams,
    ): Promise<RetrieveCourseExcerptResult> {
        const trimmed = query.trim()
        if (!trimmed) {
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
        const collectionName = envConfig().services.contentRag.collection
        const k = topK ?? envConfig().services.contentRag.retrievalTopK
        try {
            // same balancer-routed embedder the index was built with (query +
            // stored vectors must share the embedding space)
            const embeddingModel = await this.embeddingModelService.getViaBalancer()
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName,
                },
            )
            // filter on courseId (spans every content of the course) instead of
            // one contentId — the payload key is prefixed `metadata.` (LangChain
            // nests doc metadata under a `metadata` sub-object)
            const hits = await vectorStore.similaritySearch(
                trimmed,
                k,
                {
                    must: [
                        {
                            key: "metadata.courseId",
                            match: {
                                value: courseId,
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
            // index missing / Qdrant or embedder down → empty excerpt, caller falls
            // back gracefully (interviewer/grader still run, just un-grounded)
            this.logger.warn(
                `Content RAG course retrieval failed for course ${courseId} (falling back ungrounded): ${error instanceof Error ? error.message : String(error)}`,
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
