import {
    Injectable,
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
} from "@modules/databases/qdrant/qdrant.decorators"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    envConfig,
} from "@modules/platform/env/config"

/** Params for {@link CourseRagRetrievalService.retrieveContentExcerpt}. */
export interface RetrieveContentExcerptParams {
    /** Content the chunks must belong to (payload filter). */
    contentId: string
    /** The learner's question -- the retrieval query. */
    query: string
    /** Optional override for how many chunks to pull (defaults to env top-k). */
    topK?: number
}

/** Result of {@link CourseRagRetrievalService.retrieveContentExcerpt}. */
export interface RetrieveContentExcerptResult {
    /** Assembled excerpt (empty when retrieval missed / failed / index absent). */
    excerpt: string
    /** Number of chunks included in the excerpt. */
    retrievedChunks: number
}

/** Params for {@link CourseRagRetrievalService.retrieveCourseExcerpt}. */
export interface RetrieveCourseExcerptParams {
    /** Course the chunks must belong to (payload filter -- spans every lesson of the course). */
    courseId: string
    /** The retrieval query (e.g. an interviewer's next probe, or a grading question). */
    query: string
    /** Optional override for how many chunks to pull (defaults to env top-k). */
    topK?: number
    /**
     * Content (lesson) ids to EXCLUDE from retrieval (Qdrant `must_not` on
     * `metadata.contentId`). The app-wide chat uses this to keep a course's
     * PREMIUM lessons out of the whole-course grounding for a viewer who has not
     * paid for them -- so a trial learner can chat course-wide over the free
     * material without the RAG surfacing locked content through the AI. Omit (or
     * empty) to retrieve across every lesson of the course.
     */
    excludeContentIds?: Array<string>
}

/** Result of {@link CourseRagRetrievalService.retrieveCourseExcerpt}. */
export interface RetrieveCourseExcerptResult {
    /** Assembled excerpt (empty when retrieval missed / failed / index absent). */
    excerpt: string
    /** Number of chunks included in the excerpt. */
    retrievedChunks: number
    /**
     * Distinct content (lesson) ids the retrieved chunks were pulled from, in
     * similarity order (best-matching chunk's content first). Empty when
     * retrieval missed / failed / index absent, or when a hit is missing its
     * `contentId` payload (defensive -- every chunk is written with one by
     * `ContentRagIndexService`, but retrieval never trusts payload shape
     * blindly). Lets a caller (e.g. mock-interview grading) deep-link "study
     * this" straight to the real lesson the grounding excerpt came from.
     */
    matchedContentIds: Array<string>
}

/** Params for {@link CourseRagRetrievalService.searchCourse}. */
export interface SearchCourseParams {
    /** Course the chunks must belong to (payload filter -- spans every kind indexed for the course). */
    courseId: string
    /** The learner's search query (keyword or natural-language question alike). */
    query: string
    /**
     * Optional corpus-kind filter (Qdrant payload `metadata.kind` -- any of these).
     * e.g. `["challenge"]` to search ONLY challenges, `["content", "code"]` for
     * lessons. Omit to span every indexed kind (the default "search everything").
     */
    kinds?: Array<string>
    /** Optional override for how many DISTINCT sources to return (defaults to env top-k). */
    topK?: number
}

/** One distinct source (lesson/challenge/flashcard-deck/milestone-task) matched by {@link CourseRagRetrievalService.searchCourse}. */
export interface SearchCourseHit {
    /** The matched row's own id (content/challenge/flashcard-deck/milestone-task -- shared UUID id-space). */
    contentId: string
    /** Which corpus this id belongs to -- `"content"` | `"code"` | `"challenge"` | `"flashcard"` | `"milestone"`. */
    kind: string
    /** Locale the matched chunk was embedded in. */
    lang: string
    /** Cosine similarity of the BEST-matching chunk for this source (0-1, higher = closer). */
    score: number
    /** The best-matching chunk's raw text (for a result-list snippet -- NOT html-safe, caller truncates/escapes). */
    snippet: string
}

/** Result of {@link CourseRagRetrievalService.searchCourse}. */
export interface SearchCourseResult {
    /** Distinct sources, best match first. Empty when the index is absent/failed or nothing matched. */
    hits: Array<SearchCourseHit>
}

@Injectable()
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
 * Qdrant down) so the caller can fall back to whole-body stuffing -- retrieval is
 * never allowed to blackhole the chat.
 */
export class CourseRagRetrievalService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly winstonService: WinstonService,
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
            // LangChain stores doc metadata under a `metadata` payload sub-object ->
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
            // index missing / Qdrant or embedder down -> empty excerpt, caller falls
            // back to whole-body stuffing (retrieval never blocks the chat)
            this.winstonService.log(WinstonLog.RagRetrievalFailed,
                {
                    op: "rag.content.retrieval-failed",
                    referenceId: contentId,
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                excerpt: "",
                retrievedChunks: 0,
            }
        }
    }

    /**
     * Retrieve the top-k chunks across an ENTIRE course (not one lesson) for a
     * query and assemble them into one excerpt -- grounds the System Design mock
     * interview (interviewer probes + end-of-session grading) in "what this
     * course actually taught", spanning every lesson instead of one. Returns an
     * empty excerpt (caller degrades gracefully) when the index is absent or
     * retrieval fails -- mirrors {@link retrieveContentExcerpt} exactly, just
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
            excludeContentIds,
        }: RetrieveCourseExcerptParams,
    ): Promise<RetrieveCourseExcerptResult> {
        const trimmed = query.trim()
        if (!trimmed) {
            return {
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
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
            // one contentId -- the payload key is prefixed `metadata.` (LangChain
            // nests doc metadata under a `metadata` sub-object). `must_not` is only
            // added when the caller actually asked to exclude something, so the
            // no-exclude path (the pre-existing callers) sends the exact same
            // filter shape it always has.
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
                    ...(excludeContentIds && excludeContentIds.length > 0
                        ? {
                            must_not: [
                                {
                                    key: "metadata.contentId",
                                    match: {
                                        any: excludeContentIds,
                                    },
                                },
                            ],
                        }
                        : {
                        }),
                },
            )
            return {
                excerpt: this.assemble(hits),
                retrievedChunks: hits.length,
                matchedContentIds: this.extractMatchedContentIds(hits),
            }
        } catch (error) {
            // index missing / Qdrant or embedder down -> empty excerpt, caller falls
            // back gracefully (interviewer/grader still run, just un-grounded)
            this.winstonService.log(WinstonLog.RagRetrievalFailed,
                {
                    op: "rag.course.retrieval-failed",
                    referenceId: courseId,
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                excerpt: "",
                retrievedChunks: 0,
                matchedContentIds: [],
            }
        }
    }

    /**
     * Course content search -- unlike {@link retrieveCourseExcerpt} (which
     * ASSEMBLES chunks into one prompt-ready string for an LLM), this returns
     * STRUCTURED per-source hits with a real similarity score, for rendering a
     * search-results list (title/breadcrumb resolved by the caller per `kind` --
     * this service only knows vectors, not entity metadata).
     *
     * Spans every kind indexed for the course (content/code/challenge/
     * flashcard/milestone -- {@link ContentRagIndexService} stamps `kind` on
     * every chunk), filtered on `metadata.courseId`. Multiple chunks from the
     * SAME source (e.g. 2 chunks of one long lesson) collapse to ONE hit
     * (its best-scoring chunk) -- a learner wants one result per lesson/
     * challenge/deck/task, not the same source competing for multiple slots in
     * a short top-k list.
     *
     * Degrades to an EMPTY result on any failure (collection missing, embedder/
     * Qdrant down) -- search is never allowed to 500 the panel, it just shows
     * "no results".
     *
     * @param params - The course id, the search query, and an optional top-k.
     * @returns The distinct matched sources, best match first.
     */
    async searchCourse(
        {
            courseId,
            query,
            kinds,
            topK,
        }: SearchCourseParams,
    ): Promise<SearchCourseResult> {
        const trimmed = query.trim()
        if (!trimmed) {
            return {
                hits: [],
            }
        }
        const collectionName = envConfig().services.contentRag.collection
        const k = topK ?? envConfig().services.contentRag.retrievalTopK
        try {
            const embeddingModel = await this.embeddingModelService.getViaBalancer()
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName,
                },
            )
            // over-fetch chunks (a source can have several) then collapse below --
            // 4x the requested distinct-source count is enough headroom without a
            // second round-trip in the common case
            const results = await vectorStore.similaritySearchWithScore(
                trimmed,
                k * 4,
                this.buildCourseSearchFilter(courseId,
                    kinds),
            )
            const bestByContentId = this.collapseSearchHits(results)
            return {
                hits: [...bestByContentId.values()]
                    .sort((left, right) => right.score - left.score)
                    .slice(0,
                        k),
            }
        } catch (error) {
            this.winstonService.log(WinstonLog.RagRetrievalFailed,
                {
                    op: "rag.course.search-failed",
                    referenceId: courseId,
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                hits: [],
            }
        }
    }

    /**
     * Build the Qdrant payload filter for a course search: always scoped to the
     * course, optionally narrowed to specific corpus kinds. A kind scope must be
     * applied at the vector-search level (not filtered after) -- else a topical
     * query returns a content-dominated top-k that the caller's kind filter empties.
     * @param courseId - The course the chunks must belong to.
     * @param kinds - Optional corpus-kind allowlist (e.g. `["challenge"]`).
     */
    private buildCourseSearchFilter(
        courseId: string,
        kinds: Array<string> | undefined,
    ) {
        return {
            must: [
                {
                    key: "metadata.courseId",
                    match: {
                        value: courseId,
                    },
                },
                ...(kinds && kinds.length > 0
                    ? [
                        {
                            key: "metadata.kind",
                            match: {
                                any: kinds,
                            },
                        },
                    ]
                    : []),
            ],
        }
    }

    /**
     * Collapse over-fetched chunk hits down to one best-scoring hit per distinct
     * source id (a source can contribute several chunks to the raw results).
     * @param results - Raw similarity-search hits, unordered w.r.t. source id.
     */
    private collapseSearchHits(
        results: Array<[Document, number]>,
    ): Map<string, SearchCourseHit> {
        const bestByContentId = new Map<string, SearchCourseHit>()
        for (const [
            doc,
            score,
        ] of results) {
            const contentId = doc.metadata?.contentId
            if (typeof contentId !== "string" || !contentId) {
                continue
            }
            const existing = bestByContentId.get(contentId)
            if (existing && existing.score >= score) {
                continue
            }
            bestByContentId.set(contentId,
                {
                    contentId,
                    kind: typeof doc.metadata?.kind === "string" ? doc.metadata.kind : "content",
                    lang: typeof doc.metadata?.lang === "string" ? doc.metadata.lang : "",
                    score,
                    snippet: doc.pageContent,
                })
        }
        return bestByContentId
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

    /**
     * Pull the distinct `contentId` each hit's chunk was written under
     * (`ContentRagIndexService` stamps this on every point's metadata),
     * preserving similarity order and de-duplicating repeats. Skips any hit
     * whose payload is missing/malformed rather than throwing -- a shape
     * surprise here must never break grading/interview flows that only need
     * the excerpt text.
     *
     * @param hits - The retrieved documents in similarity order.
     * @returns Distinct content ids, best match first.
     */
    private extractMatchedContentIds(
        hits: Array<Document>,
    ): Array<string> {
        const seen = new Set<string>()
        const ids: Array<string> = []
        for (const hit of hits) {
            const contentId = hit.metadata?.contentId
            if (typeof contentId !== "string" || !contentId || seen.has(contentId)) {
                continue
            }
            seen.add(contentId)
            ids.push(contentId)
        }
        return ids
    }
}
