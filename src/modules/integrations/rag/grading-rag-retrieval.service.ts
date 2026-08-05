import {
    Injectable,
} from "@nestjs/common"
import {
    InjectQdrantClient,
} from "@modules/databases/qdrant/qdrant.decorators"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    Document,
} from "@langchain/core/documents"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import type {
    RetrieveGradingExcerptParams,
    RetrieveGradingSourceParams,
    RetrieveGradingSourceResult,
    RetrieveWithVectorStoreParams,
} from "./types/grading-retrieval"

/** Default per-criterion retrieval depth -- each criterion pulls its own top matches. */
const DEFAULT_PER_CRITERION_TOP_K = 6

@Injectable()
/**
 * Shared, hardened RAG retrieval for criteria-based grading (git + google-docs submissions).
 *
 * Hardening over the naive inline version:
 * - **Per-run isolation**: the Qdrant collection is namespaced by `runKey` (submission +
 *   fencing token), so a zombie re-dispatch can't corrupt the live owner's vectors.
 * - **Guaranteed cleanup**: the collection is dropped in a `finally`, so collections never leak.
 * - **Safe delete**: deleting a missing collection (first grade) is swallowed, not thrown.
 * - **Recall**: one similarity query PER criterion, round-robin merged + de-duplicated, instead
 *   of a single blended query that can starve individual criteria.
 * - **Graceful degradation**: a vector-store/embedding failure falls back to a raw-chunk excerpt
 *   (grading still proceeds) and is logged, rather than blackholing the job.
 */
export class GradingRetrievalService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * High-level grading retrieval: own the WHOLE pipeline so callers never touch
     * chunking, embedding, or the vector store.
     *
     * Chunks the raw `documents` with the caller's split config, resolves the FIXED
     * embedding model for the given `{ model, provider }` (kept fixed so the index +
     * query dimensions always match), then delegates to {@link retrieveSourceExcerpt}.
     * The grading workers (challenge git / google-docs + milestone-task review) all
     * call THIS instead of re-implementing the split -> embed -> retrieve dance.
     *
     * @param params - Run key, raw source documents, criteria, split + embedding config, budget.
     * @returns The excerpt plus retrieval stats (truncated / degraded / chunk count).
     */
    async retrieveGradingExcerpt(
        params: RetrieveGradingExcerptParams,
    ): Promise<RetrieveGradingSourceResult> {
        const {
            runKey,
            documents,
            criteria,
            chunkSize,
            chunkOverlap,
            embedding,
            maxChars,
            jobId,
            perCriterionTopK,
        } = params

        // split the caller's raw source into retrieval chunks
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        })
        const chunks = await splitter.splitDocuments(documents)

        // resolve the FIXED embedding model (not balancer-picked, so index + query dims match)
        const embeddingModel = this.embeddingModelService.get(embedding)

        return this.retrieveSourceExcerpt({
            runKey,
            chunks,
            criteria,
            embeddingModel,
            maxChars,
            jobId,
            perCriterionTopK,
        })
    }

    /**
     * Build a per-run vector index over `chunks`, retrieve the chunks most relevant to the
     * grading `criteria`, and assemble them into a single budget-bounded excerpt.
     *
     * Lower-level entry point (pre-split chunks + a resolved embedding model). Most
     * callers should use {@link retrieveGradingExcerpt} instead, which owns the
     * chunk + embed steps too.
     *
     * @param params - Run key, source chunks, criteria, embedding model, and char budget.
     * @returns The excerpt plus retrieval stats (truncated / degraded / chunk count).
     */
    async retrieveSourceExcerpt(
        params: RetrieveGradingSourceParams,
    ): Promise<RetrieveGradingSourceResult> {
        const {
            runKey,
            chunks,
            criteria,
            embeddingModel,
            maxChars,
            jobId,
            perCriterionTopK = DEFAULT_PER_CRITERION_TOP_K,
        } = params

        // nothing to retrieve from -> empty excerpt (the grader renders an "(empty)" placeholder)
        if (chunks.length === 0) {
            return {
                excerpt: "",
                truncated: false,
                retrievedChunks: 0,
                degraded: false,
            }
        }

        // criterion prose drives retrieval; blank criteria are dropped
        const queries = criteria
            .map((criterion) => criterion.body.trim())
            .filter((body) => body.length > 0)

        let result: RetrieveGradingSourceResult
        if (queries.length === 0) {
            // no criteria to steer retrieval -> feed budget-bounded raw chunks, no vector store needed
            const assembled = this.assembleWithinBudget(
                chunks,
                maxChars,
            )
            result = {
                excerpt: assembled.excerpt,
                truncated: assembled.truncated,
                retrievedChunks: assembled.count,
                degraded: false,
            }
        } else {
            result = await this.retrieveWithVectorStore({
                runKey,
                chunks,
                queries,
                embeddingModel,
                maxChars,
                jobId,
                perCriterionTopK,
            })
        }

        // structured observability for the retrieval (reuses the generic step-executed log)
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId,
                step: "grading-retrieval",
                success: !result.degraded,
                meta: {
                    totalChunks: chunks.length,
                    criteriaCount: criteria.length,
                    retrievedChunks: result.retrievedChunks,
                    excerptChars: result.excerpt.length,
                    truncated: result.truncated,
                    degraded: result.degraded,
                },
            },
        )
        return result
    }

    /**
     * Build the per-run collection, retrieve per criterion, and assemble. Degrades to a
     * raw-chunk excerpt on any vector-store failure, and always drops the collection.
     */
    private async retrieveWithVectorStore(
        {
            runKey,
            chunks,
            queries,
            embeddingModel,
            maxChars,
            jobId,
            perCriterionTopK,
        }: RetrieveWithVectorStoreParams,
    ): Promise<RetrieveGradingSourceResult> {
        const collectionName = `grading-${runKey}`
        try {
            // rebuild this run's collection from scratch; fromDocuments returns a ready store,
            // so there is no need to re-open it via fromExistingCollection
            await this.safeDeleteCollection(collectionName)
            const vectorStore = await QdrantVectorStore.fromDocuments(
                chunks,
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName,
                },
            )
            const selected = await this.retrievePerCriterion(
                vectorStore,
                queries,
                perCriterionTopK,
            )
            // an empty retrieval still falls back to raw chunks so the grader is never starved
            const assembled = this.assembleWithinBudget(
                selected.length > 0
                    ? selected
                    : chunks,
                maxChars,
            )
            return {
                excerpt: assembled.excerpt,
                truncated: assembled.truncated,
                retrievedChunks: assembled.count,
                degraded: false,
            }
        } catch (error) {
            // a vector-store / embedding failure must not blackhole grading: degrade to a
            // raw-chunk excerpt so the grader still sees the source, and surface a warning
            this.winstonService.log(
                WinstonLog.ProcessStepExecuted,
                {
                    jobId,
                    step: "grading-retrieval",
                    success: false,
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                    meta: {
                        degraded: true,
                        totalChunks: chunks.length,
                    },
                },
            )
            const assembled = this.assembleWithinBudget(
                chunks,
                maxChars,
            )
            return {
                excerpt: assembled.excerpt,
                truncated: assembled.truncated,
                retrievedChunks: assembled.count,
                degraded: true,
            }
        } finally {
            // never leak the per-run collection -- drop it once the excerpt is in memory
            await this.safeDeleteCollection(collectionName)
        }
    }

    /**
     * Retrieve top-k chunks per criterion and merge them round-robin (rank-0 of every criterion
     * first, then rank-1, ...) so every criterion contributes evidence before the char budget is
     * spent. Duplicates (a chunk matched by multiple criteria) are dropped.
     *
     * @param vectorStore - The per-run vector store to search.
     * @param queries - One non-empty query string per criterion.
     * @param topK - How many matches to pull per criterion.
     * @returns De-duplicated chunks in fair round-robin order.
     */
    private async retrievePerCriterion(
        vectorStore: QdrantVectorStore,
        queries: Array<string>,
        topK: number,
    ): Promise<Array<Document>> {
        // criterion searches are independent reads -> run them concurrently
        const perCriterionHits = await Promise.all(
            queries.map((query) => vectorStore.similaritySearch(
                query,
                topK,
            )),
        )
        const seen = new Set<string>()
        const ordered: Array<Document> = []
        const deepest = perCriterionHits.reduce(
            (max, hits) => Math.max(
                max,
                hits.length,
            ),
            0,
        )
        for (let rank = 0; rank < deepest; rank++) {
            for (const hits of perCriterionHits) {
                const hit = hits[rank]
                if (!hit) {
                    continue
                }
                const key = this.chunkKey(hit)
                if (seen.has(key)) {
                    continue
                }
                seen.add(key)
                ordered.push(hit)
            }
        }
        return ordered
    }

    /**
     * Join chunk contents up to `maxChars`, never exceeding the budget. The last chunk that
     * would overflow is included only up to the remaining budget and the result is flagged
     * truncated.
     *
     * @param chunks - Chunks to assemble, in priority order.
     * @param maxChars - Hard character ceiling.
     * @returns The excerpt, whether it was truncated, and how many chunks were included.
     */
    private assembleWithinBudget(
        chunks: Array<Document>,
        maxChars: number,
    ): {
        excerpt: string
        truncated: boolean
        count: number
    } {
        const separator = "\n\n"
        const parts: Array<string> = []
        let used = 0
        let truncated = false
        let count = 0
        for (const chunk of chunks) {
            const text = chunk.pageContent
            const prefix = parts.length > 0
                ? separator.length
                : 0
            if (used + prefix + text.length > maxChars) {
                const remaining = maxChars - used - prefix
                if (remaining > 0) {
                    parts.push(text.slice(
                        0,
                        remaining,
                    ))
                    count++
                }
                truncated = true
                break
            }
            parts.push(text)
            used += prefix + text.length
            count++
        }
        return {
            excerpt: parts.join(separator),
            truncated,
            count,
        }
    }

    /**
     * Stable identity for a retrieved chunk so the same chunk isn't included twice. Content is
     * the ultimate discriminator; source + location keep identical-content chunks from different
     * files distinct.
     *
     * @param chunk - The retrieved document.
     * @returns A dedupe key.
     */
    private chunkKey(
        chunk: Document,
    ): string {
        const source = typeof chunk.metadata?.source === "string"
            ? chunk.metadata.source
            : ""
        const loc = chunk.metadata?.loc
            ? JSON.stringify(chunk.metadata.loc)
            : ""
        return `${source}|${loc}|${chunk.pageContent}`
    }

    /**
     * Delete a Qdrant collection, swallowing "missing collection" / transient errors so a first
     * grade (collection absent) and best-effort cleanup never throw.
     *
     * @param collectionName - The collection to drop.
     */
    private async safeDeleteCollection(
        collectionName: string,
    ): Promise<void> {
        try {
            await this.qdrantClient.deleteCollection(collectionName)
        } catch {
            // collection may not exist yet (first grade) or already be gone -- both are fine
        }
    }
}
