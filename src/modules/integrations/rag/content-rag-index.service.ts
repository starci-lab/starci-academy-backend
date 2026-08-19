import {
    createHash,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    QdrantClient,
} from "@qdrant/qdrant-js"
import {
    Document,
} from "@langchain/core/documents"
import type {
    Embeddings,
} from "@langchain/core/embeddings"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    TranslationResolverService,
} from "@modules/databases/postgresql/primary/resolvers/translation.service"
import {
    InjectQdrantClient,
} from "@modules/databases/qdrant/qdrant.decorators"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    S3Provider,
} from "@modules/integrations/s3/enums/s3"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    extToLang,
} from "./utils"

/** Sandpack file-map value as stored in MinIO (`repo/<repoName>/<githubDir>.json`). */
interface SandpackFile {
    /** Raw file contents. */
    code: string
}

/**
 * One enumerated row (of ANY kind -- content, challenge, flashcard deck, or
 * milestone task) the index build processes uniformly: the diff/hash/delete/
 * batch-embed pipeline never needs to know which kind `id` belongs to, only
 * that `collect()` resolves its current documents (empty array = nothing to
 * index this round, e.g. an empty lesson body).
 */
interface RagIndexItem {
    /** The row's own id -- shared id-space across all 4 kinds (UUIDs). */
    id: string
    /** Resolve this row's current documents (unchunked, pre-hash). */
    collect: () => Promise<Array<Document>>
}

/**
 * Chunks per embed+upsert round. See the batching comment in {@link build} for
 * why the whole corpus is never embedded in one `fromDocuments` call.
 */
const CONTENT_RAG_EMBED_BATCH_SIZE = 200

/**
 * Result of {@link ContentRagIndexService.build}.
 */
export interface BuildContentRagIndexResult {
    /** Number of chunks embedded + upserted into the collection. */
    indexed: number
}

/** The four independently-toggleable enumerated corpora {@link build} indexes. */
interface ContentRagCorpus {
    contents: Array<ContentEntity>
    challenges: Array<ChallengeEntity>
    flashcardDecks: Array<FlashcardDeckEntity>
    milestoneTasks: Array<MilestoneTaskEntity>
    foundations: Array<FoundationEntity>
}

/** Outcome of hashing/diffing a single {@link RagIndexItem} against `existingHashes`. */
type RagIndexItemScanOutcome =
    | { kind: "empty" }
    | { kind: "unchanged" }
    | { kind: "errored" }
    | { kind: "changed", docs: Array<Document>, wasPreviouslyIndexed: boolean }

/** Result of scanning every {@link RagIndexItem} for a source-hash change. */
interface RagIndexScanResult {
    /** Fresh/changed documents, ready to chunk + embed. */
    docs: Array<Document>
    /** Ids of every row whose source changed (new or edited) this run. */
    dirtyContentIds: Array<string>
    /** Subset of `dirtyContentIds` that already had points in the collection. */
    dirtyPreviouslyIndexedIds: Array<string>
    /** Count of rows whose source hash matched the existing payload (skipped). */
    unchangedCount: number
}

/** Params to embed + batch-upsert a chunk list into the persistent collection. */
interface EmbedAndUpsertChunksParams {
    chunks: Array<Document>
    collectionName: string
    embeddingModel: Embeddings
}

/** Params to log the "nothing changed" summary line for a no-op build. */
interface LogContentRagUnchangedParams {
    corpus: ContentRagCorpus
    itemCount: number
    unchangedCount: number
    removedCount: number
}

/** Params to log the completed-build summary line. */
interface LogContentRagCompletedParams {
    corpus: ContentRagCorpus
    chunkCount: number
    dirtyCount: number
    unchangedCount: number
    removedCount: number
}

@Injectable()
/**
 * Builds the persistent, course-wide RAG index in Qdrant at init.
 *
 * Indexes 4 kinds (each independently toggleable -- see `envConfig().services.
 * contentRag.index*`):
 * - lesson **content** -- body (one document per locale, MinIO
 *   `contents/<id>/<locale>.json`) + sandbox **code** (each file, MinIO
 *   `repo/<repoName>/<githubDir>.json`).
 * - **challenge** -- title+description+hint (MinIO `challenges/<id>/<locale>.json`).
 * - **flashcard deck** -- title+description + every card's question/answer/
 *   explanation (pure Postgres, no MinIO snapshot).
 * - **milestone task** -- title+description+hint + one brief body (MinIO
 *   `milestone-tasks/<id>/<locale>.json`).
 *
 * The documents are chunked, embedded via the balancer-routed embedder
 * ({@link EmbeddingModelService.getViaBalancer} -- local-first, cloud fallback),
 * and upserted into ONE persistent collection (`content_rag`) via
 * `QdrantVectorStore.fromDocuments`, which auto-creates the collection with the
 * embedder's vector size (the dim is never hard-coded -- same idiom as the
 * grading RAG stack). Each chunk carries the payload
 * `{ contentId, courseId, kind, filePath, lang, sourceHash }` -- `contentId` is
 * really "this row's own id" regardless of kind (content/code/challenge/
 * flashcard/milestone all share the same UUID id-space) -- so content-AI chat
 * can filter by a single lesson's `contentId`, `CourseRagRetrievalService.
 * searchCourse` can filter by `courseId` across every kind, and this service
 * can tell whether a row's source changed since it was last indexed.
 *
 * DIFF-AWARE: like the ES/CDN sync, this never blindly rebuilds. Every run
 * bulk-loads the `{contentId -> sourceHash}` pairs already sitting in the
 * collection's payloads (one cheap no-vector scroll), then per content:
 * unchanged hash -> skip entirely (no re-embedding); changed/new -> delete its
 * stale points + re-embed; content no longer enumerated (deleted/renamed) ->
 * delete its stale points. A first run (empty/missing collection) naturally
 * falls out of the same diff as "everything is new" -- no separate full-rebuild
 * flag needed.
 */
export class ContentRagIndexService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly winstonService: WinstonService,
        private readonly translationResolver: TranslationResolverService,
    ) { }

    /**
     * Enumerate every seeded content, gather its body (per locale) + sandbox code
     * from MinIO, chunk + embed, then upsert into the persistent `content_rag`
     * collection.
     *
     * Must run AFTER the seed phase (contents enumerable) and AFTER the
     * synchronizers phase (`contents/<id>/<locale>.json` + `repo/.../*.json` are
     * in MinIO) -- i.e. as a post-sync init phase inside the runtime-context window.
     *
     * @returns The number of chunks indexed.
     */
    async build(): Promise<BuildContentRagIndexResult> {
        const collectionName = envConfig().services.contentRag.collection

        // indexing the platform's own content corpus stays on the LOCAL lane ->
        // the self-hosted 8B model (cost 0, throughput over latency); no cloud
        // fallback on this lane
        const embeddingModel = await this.embeddingModelService.getViaBalancer(
            AiModelCategory.EmbeddingLocal,
        )
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.contentRag.chunkSize,
            chunkOverlap: envConfig().services.contentRag.chunkOverlap,
        })

        const corpus = await this.loadContentRagCorpus()
        // one uniform "item" per enumerated row (any of the 4 kinds), each already
        // knowing its own id/courseId/collector -- lets the diff+embed pipeline
        // below stay kind-agnostic (the SAME hash-diff/delete/batch-upsert
        // mechanics that used to only ever see `ContentEntity` rows).
        const items = this.buildRagIndexItems(corpus)

        // diff baseline: {contentId -> sourceHash} already sitting in the
        // collection's payloads (empty on a first/missing-collection run, which
        // then falls out of the scan below as "everything is new" for free)
        const existingHashes = await this.loadExistingHashes(collectionName)
        const currentContentIds = new Set(items.map((item) => item.id))

        // rows that vanished since the last run (deleted/renamed, of ANY kind)
        // leave their vectors orphaned in Qdrant -- drop them up front
        const removedContentIds = [...existingHashes.keys()].filter(
            (contentId) => !currentContentIds.has(contentId),
        )
        await this.deleteByContentIdsConcurrently(collectionName,
            removedContentIds)

        const {
            docs,
            dirtyContentIds,
            dirtyPreviouslyIndexedIds,
            unchangedCount,
        } = await this.scanRagIndexItems(items,
            existingHashes)

        // nothing changed and nothing was removed -> the collection is already
        // up to date, skip the (expensive) embed+upsert step entirely
        if (docs.length === 0 && removedContentIds.length === 0) {
            this.logContentRagUnchanged({
                corpus,
                itemCount: items.length,
                unchangedCount,
                removedCount: removedContentIds.length,
            })
            return {
                indexed: 0,
            }
        }

        // delete the STALE points of PREVIOUSLY-INDEXED changed content BEFORE
        // re-inserting fresh ones -- otherwise a content whose chunk count shrank
        // (or split differently after an edit) would leave orphaned old chunks
        // behind alongside the new ones. Brand-new ids are excluded (see the
        // comment where `dirtyPreviouslyIndexedIds` is built) -- nothing to delete.
        await this.deleteByContentIdsConcurrently(collectionName,
            dirtyPreviouslyIndexedIds)

        const chunks = docs.length > 0 ? await splitter.splitDocuments(docs) : []
        this.winstonService.log(WinstonLog.RagIndexProgress,
            {
                op: "rag.content.embedding",
                count: chunks.length,
                meta: {
                    changed: dirtyContentIds.length,
                    unchanged: unchangedCount,
                    removed: removedContentIds.length,
                },
            })

        await this.embedAndUpsertChunks({
            chunks,
            collectionName,
            embeddingModel,
        })

        this.logContentRagCompleted({
            corpus,
            chunkCount: chunks.length,
            dirtyCount: dirtyContentIds.length,
            unchangedCount,
            removedCount: removedContentIds.length,
        })
        return {
            indexed: chunks.length,
        }
    }

    /**
     * Enumerate the four independently-toggleable corpora this build indexes
     * (contents always; challenges/flashcard decks/milestone tasks/foundations
     * each only when their `contentRag.index*` flag is on).
     */
    private async loadContentRagCorpus(): Promise<ContentRagCorpus> {
        // the DB is seeded by the time this runs -> enumerate contents + owning course
        const contents = await this.entityManager.find(
            ContentEntity,
            {
                relations: {
                    module: {
                        course: true,
                    },
                },
                select: {
                    id: true,
                    isSandbox: true,
                    githubBaseUrl: true,
                    githubDir: true,
                    module: {
                        id: true,
                        course: {
                            id: true,
                        },
                    },
                },
            },
        )
        // "search course content" expansion (2026-07-10): challenges, flashcard
        // decks, and milestone tasks are each independently toggleable -- a
        // corpus can be skipped entirely (empty array) while iterating without
        // re-embedding the other three.
        const challenges = envConfig().services.contentRag.indexChallenges
            ? await this.entityManager.find(
                ChallengeEntity,
                {
                    relations: {
                        content: {
                            module: {
                                course: true,
                            },
                        },
                    },
                    select: {
                        id: true,
                        content: {
                            id: true,
                            module: {
                                id: true,
                                course: {
                                    id: true,
                                },
                            },
                        },
                    },
                },
            )
            : []
        const flashcardDecks = envConfig().services.contentRag.indexFlashcards
            ? await this.entityManager.find(
                FlashcardDeckEntity,
                {
                    relations: {
                        cards: {
                            translations: true,
                        },
                        translations: true,
                    },
                },
            )
            : []
        const milestoneTasks = envConfig().services.contentRag.indexMilestoneTasks
            ? await this.entityManager.find(
                MilestoneTaskEntity,
                {
                    relations: {
                        milestone: {
                            course: true,
                        },
                    },
                    select: {
                        id: true,
                        milestone: {
                            id: true,
                            course: {
                                id: true,
                            },
                        },
                    },
                },
            )
            : []
        // foundations (2026-07-21) are NOT course-scoped -- they hang off a
        // foundation-category, not a course -- so their documents carry no
        // `courseId`. Content lives in Postgres (the `foundation_translations`
        // EAV table, per-locale field/value), not a MinIO snapshot, so the
        // translations relation is eager-loaded here for the collector.
        const foundations = envConfig().services.contentRag.indexFoundations
            ? await this.entityManager.find(
                FoundationEntity,
                {
                    relations: {
                        translations: true,
                    },
                },
            )
            : []
        return {
            contents,
            challenges,
            flashcardDecks,
            milestoneTasks,
            foundations,
        }
    }

    /**
     * Flatten the four corpora into one uniform, kind-agnostic list of
     * {@link RagIndexItem}s for the diff/hash/delete/batch-embed pipeline.
     */
    private buildRagIndexItems(
        {
            contents,
            challenges,
            flashcardDecks,
            milestoneTasks,
            foundations,
        }: ContentRagCorpus,
    ): Array<RagIndexItem> {
        const items: Array<RagIndexItem> = []
        for (const content of contents) {
            const courseId = content.module?.course?.id ?? ""
            items.push({
                id: content.id,
                collect: async () => {
                    const contentDocs: Array<Document> = []
                    await this.collectBodyDocs(content.id,
                        courseId,
                        contentDocs)
                    await this.collectCodeDocs(content,
                        courseId,
                        contentDocs)
                    return contentDocs
                },
            })
        }
        for (const challenge of challenges) {
            const courseId = challenge.content?.module?.course?.id ?? ""
            items.push({
                id: challenge.id,
                collect: () => this.collectChallengeDocs(challenge.id,
                    courseId),
            })
        }
        for (const deck of flashcardDecks) {
            items.push({
                id: deck.id,
                collect: () => Promise.resolve(this.collectFlashcardDeckDocs(deck,
                    deck.courseId ?? "")),
            })
        }
        for (const task of milestoneTasks) {
            const courseId = task.milestone?.course?.id ?? ""
            items.push({
                id: task.id,
                collect: () => this.collectMilestoneTaskDocs(task.id,
                    courseId),
            })
        }
        for (const foundation of foundations) {
            items.push({
                id: foundation.id,
                collect: () => Promise.resolve(this.collectFoundationDocs(foundation)),
            })
        }
        return items
    }

    /**
     * Resolve every item's current documents, diffing against `existingHashes`
     * to find what actually changed. Per-item isolation: a MinIO read / parse
     * failure for ONE row must NOT abort the whole index build -- log it + skip
     * to the next one (mirrors the non-fatal swallow policy of the asset-mirror
     * + init phases).
     * @param items - Every enumerated row (any of the 4 kinds) to scan.
     * @param existingHashes - The `{contentId -> sourceHash}` diff baseline.
     */
    private async scanRagIndexItems(
        items: Array<RagIndexItem>,
        existingHashes: Map<string, string>,
    ): Promise<RagIndexScanResult> {
        const docs: Array<Document> = []
        const dirtyContentIds: Array<string> = []
        // subset of dirtyContentIds that were ALREADY in the collection (a real
        // edit, might have stale/shrunk chunks to clean) -- a brand-new id (first
        // time this row is ever indexed, e.g. the "search course content"
        // expansion's first run over challenges/decks/tasks) is GUARANTEED to have
        // nothing to delete, so skipping its delete call entirely avoids a wasted
        // full collection scan (`on_disk_payload` makes each filter-delete call
        // ~1-1.5s once the collection holds hundreds of thousands of points --
        // multiplied by thousands of brand-new rows this was the dominant cost of
        // a first build, observed directly while testing the 3-kind expansion).
        const dirtyPreviouslyIndexedIds: Array<string> = []
        let unchangedCount = 0
        for (const [
            index,
            item,
        ] of items.entries()) {
            const outcome = await this.diffRagIndexItem(item,
                existingHashes)
            if (outcome.kind === "unchanged") {
                unchangedCount += 1
            } else if (outcome.kind === "changed") {
                dirtyContentIds.push(item.id)
                if (outcome.wasPreviouslyIndexed) {
                    dirtyPreviouslyIndexedIds.push(item.id)
                }
                docs.push(...outcome.docs)
            }
            this.logRagIndexScanHeartbeat(index,
                items.length,
                dirtyContentIds.length)
        }
        return {
            docs,
            dirtyContentIds,
            dirtyPreviouslyIndexedIds,
            unchangedCount,
        }
    }

    /**
     * Decide what a single {@link RagIndexItem} means for this scan: empty
     * (nothing to index), unchanged (hash matches the baseline), changed (new
     * or edited -- carries the hashed docs + whether it already had points in
     * the collection), or errored (per-item isolation: a MinIO read / parse
     * failure for ONE row must NOT abort the whole index build -- log it and
     * let the caller skip to the next one).
     */
    private async diffRagIndexItem(
        item: RagIndexItem,
        existingHashes: Map<string, string>,
    ): Promise<RagIndexItemScanOutcome> {
        try {
            const itemDocs = await item.collect()
            if (itemDocs.length === 0) {
                return {
                    kind: "empty" 
                }
            }
            // content-hash the RAW (unsplit) source text -- cheaper than
            // chunking/embedding just to find out nothing changed
            const sourceHash = this.hashDocs(itemDocs)
            if (existingHashes.get(item.id) === sourceHash) {
                return {
                    kind: "unchanged" 
                }
            }
            for (const doc of itemDocs) {
                doc.metadata.sourceHash = sourceHash
            }
            return {
                kind: "changed",
                docs: itemDocs,
                wasPreviouslyIndexed: existingHashes.has(item.id),
            }
        } catch (error) {
            this.winstonService.log(WinstonLog.RagIndexProgress,
                {
                    op: "rag.content.item-skipped",
                    referenceId: item.id,
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                kind: "errored" 
            }
        }
    }

    /**
     * Log a scan progress heartbeat every 50 items and on the final item --
     * this loop reads MinIO per item; without it a large corpus looks
     * indistinguishable from "hung" for many minutes.
     */
    private logRagIndexScanHeartbeat(
        index: number,
        totalItems: number,
        changedSoFar: number,
    ): void {
        const isHeartbeatDue = (index + 1) % 50 === 0 || index === totalItems - 1
        if (!isHeartbeatDue) {
            return
        }
        this.winstonService.log(WinstonLog.RagIndexProgress,
            {
                op: "rag.content.scan-progress",
                count: index + 1,
                meta: {
                    total: totalItems,
                    changedSoFar,
                },
            })
    }

    /**
     * `QdrantVectorStore.fromDocuments` never wipes an existing collection --
     * it only creates one when missing (`ensureCollection`) then upserts --
     * so it is safe to call every run without a preceding collection drop.
     * Embed + upsert in BATCHES rather than one `fromDocuments` call over the
     * whole corpus: a single call embeds every chunk (queued through the
     * embedder's AsyncCaller) before issuing ANY upsert, so a large corpus
     * (thousands of chunks) can run long enough to outlast every downstream
     * client/library timeout with zero visibility into progress. Batching
     * bounds each embed+upsert round AND gives a heartbeat between rounds.
     * @param params - The chunks to embed, the target collection, and the model.
     */
    private async embedAndUpsertChunks(
        {
            chunks,
            collectionName,
            embeddingModel,
        }: EmbedAndUpsertChunksParams,
    ): Promise<void> {
        if (chunks.length === 0) {
            return
        }
        const firstBatch = chunks.slice(0,
            CONTENT_RAG_EMBED_BATCH_SIZE)
        const vectorStore = await QdrantVectorStore.fromDocuments(
            firstBatch,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )
        this.winstonService.log(WinstonLog.RagIndexProgress,
            {
                op: "rag.content.batch-embedded",
                count: firstBatch.length,
                meta: {
                    totalChunks: chunks.length,
                },
            })
        for (let start = CONTENT_RAG_EMBED_BATCH_SIZE; start < chunks.length; start += CONTENT_RAG_EMBED_BATCH_SIZE) {
            const batch = chunks.slice(start,
                start + CONTENT_RAG_EMBED_BATCH_SIZE)
            await vectorStore.addDocuments(batch)
            this.winstonService.log(WinstonLog.RagIndexProgress,
                {
                    op: "rag.content.batch-embedded",
                    count: Math.min(start + batch.length,
                        chunks.length),
                    meta: {
                        totalChunks: chunks.length,
                    },
                })
        }
    }

    /** Log the "nothing changed" summary line for a no-op build. */
    private logContentRagUnchanged(
        {
            corpus,
            itemCount,
            unchangedCount,
            removedCount,
        }: LogContentRagUnchangedParams,
    ): void {
        this.winstonService.log(WinstonLog.RagIndexProgress,
            {
                op: "rag.content.unchanged",
                count: itemCount,
                meta: {
                    unchanged: unchangedCount,
                },
            })
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: "init",
                step: "content-rag-index",
                success: true,
                meta: {
                    contents: corpus.contents.length,
                    challenges: corpus.challenges.length,
                    flashcardDecks: corpus.flashcardDecks.length,
                    milestoneTasks: corpus.milestoneTasks.length,
                    foundations: corpus.foundations.length,
                    chunks: 0,
                    unchanged: unchangedCount,
                    removed: removedCount,
                },
            },
        )
    }

    /** Log the completed-build summary line. */
    private logContentRagCompleted(
        {
            corpus,
            chunkCount,
            dirtyCount,
            unchangedCount,
            removedCount,
        }: LogContentRagCompletedParams,
    ): void {
        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: "init",
                step: "content-rag-index",
                success: true,
                meta: {
                    contents: corpus.contents.length,
                    challenges: corpus.challenges.length,
                    flashcardDecks: corpus.flashcardDecks.length,
                    milestoneTasks: corpus.milestoneTasks.length,
                    foundations: corpus.foundations.length,
                    chunks: chunkCount,
                    changed: dirtyCount,
                    unchanged: unchangedCount,
                    removed: removedCount,
                },
            },
        )
    }

    /**
     * Read a content's body for each locale from MinIO and push one document per
     * non-empty locale into `docs`.
     *
     * @param contentId - The content id.
     * @param courseId - The owning course id (payload field; "" when unknown).
     * @param docs - Accumulator the body documents are pushed into.
     */
    private async collectBodyDocs(
        contentId: string,
        courseId: string,
        docs: Array<Document>,
    ): Promise<void> {
        for (const locale of [
            Locale.Vi,
            Locale.En,
        ]) {
            const body = await this.s3ReadService.json<ContentEntity>({
                key: this.s3NameResolverService.content(contentId,
                    locale),
                provider: S3Provider.Minio,
            })
            if (!body) {
                continue
            }
            const text = this.extractBodyText(body,
                locale)
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    contentId,
                    courseId,
                    kind: "content",
                    filePath: "",
                    lang: locale,
                },
            }))
        }
    }

    /**
     * Read a sandbox lesson's code file map from MinIO and push one document per
     * file into `docs`. No-op for non-sandbox content (no code in MinIO).
     *
     * The repo synchronizer writes the Sandpack file map to
     * `repo/<repoName>/<githubDir>.json` where `repoName` is the last path segment
     * of `githubBaseUrl` -- mirror that exactly to read it back.
     *
     * @param content - The content row (needs `isSandbox` / `githubBaseUrl` / `githubDir`).
     * @param courseId - The owning course id (payload field).
     * @param docs - Accumulator the code documents are pushed into.
     */
    private async collectCodeDocs(
        content: ContentEntity,
        courseId: string,
        docs: Array<Document>,
    ): Promise<void> {
        if (!content.isSandbox || !content.githubBaseUrl || !content.githubDir) {
            return
        }
        const repoName = content.githubBaseUrl.split("/").at(-1)
        if (!repoName) {
            return
        }
        const files = await this.s3ReadService.json<Record<string, SandpackFile>>({
            key: this.s3NameResolverService.repo(repoName,
                content.githubDir),
            provider: S3Provider.Minio,
        })
        for (const [
            filePath,
            file,
        ] of Object.entries(files ?? {
            })) {
            if (!file.code.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: file.code,
                metadata: {
                    contentId: content.id,
                    courseId,
                    kind: "code",
                    filePath,
                    lang: extToLang(filePath),
                },
            }))
        }
    }

    /**
     * Read a challenge's title/description/hint (MinIO snapshot -- the SAME
     * flattened, translation-resolved shape the public `challenge(id)` query
     * reads, so nothing internal ever leaks: `outcomeCriteria`/`approachCriteria`
     * are grading rubrics that are never `@Field`-exposed and never make it into
     * this snapshot in the first place) for each locale, one document per
     * non-empty locale.
     *
     * Deliberately SKIPS per-language scaffolding (`requirements`/`steps`/
     * `outputs`/`prerequisites`) -- those are near-identical boilerplate across
     * the ts/java/csharp/go variants of the SAME challenge and would just
     * multiply near-duplicate chunks without adding real search signal; the
     * title+description+hint is what a learner would actually ask/search about.
     *
     * @param challengeId - The challenge id.
     * @param courseId - The owning course id (payload field; "" when unknown).
     * @returns The challenge's body documents (one per non-empty locale).
     */
    private async collectChallengeDocs(
        challengeId: string,
        courseId: string,
    ): Promise<Array<Document>> {
        const docs: Array<Document> = []
        for (const locale of [
            Locale.Vi,
            Locale.En,
        ]) {
            const snapshot = await this.s3ReadService.json<ChallengeEntity>({
                key: this.s3NameResolverService.challenge(challengeId,
                    locale),
                provider: S3Provider.Minio,
            })
            if (!snapshot) {
                continue
            }
            const text = [
                snapshot.title,
                snapshot.description,
                snapshot.hint,
            ]
                .filter((part): part is string => Boolean(part?.trim()))
                .join("\n\n")
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    contentId: challengeId,
                    courseId,
                    kind: "challenge",
                    filePath: "",
                    lang: locale,
                },
            }))
        }
        return docs
    }

    /**
     * Assemble a flashcard deck's title/description + every card's question/
     * answer/explanation for each locale, one document per non-empty locale --
     * pure Postgres (no MinIO snapshot exists for decks), resolved directly via
     * {@link TranslationResolverService} rather than the mutating
     * `FlashcardDeckResolverService.transform` (which deletes `translations` in
     * place -- unusable for resolving BOTH locales off the same loaded row).
     *
     * ONE document per deck (not per card) -- the splitter chunks it naturally;
     * a deck's cards are typically short enough that most decks fit in 1-2
     * chunks anyway, and this keeps citation/search results at "deck" granularity
     * (which has a real URL -- `/learn/flashcards/review/decks/<id>` -- unlike a
     * single card).
     *
     * @param deck - The deck, eager-loaded with `cards.translations` + `translations`.
     * @param courseId - The owning course id (payload field; "" when unknown).
     * @returns The deck's documents (one per non-empty locale).
     */
    private collectFlashcardDeckDocs(
        deck: FlashcardDeckEntity,
        courseId: string,
    ): Array<Document> {
        const docs: Array<Document> = []
        const deckFallback = deck.defaultLocale ?? Locale.En
        for (const locale of [
            Locale.Vi,
            Locale.En,
        ]) {
            const title = this.translationResolver.resolve({
                translations: deck.translations,
                field: "title",
                locale,
                fallbackLocale: deckFallback,
            }) || deck.title
            const description = this.translationResolver.resolve({
                translations: deck.translations,
                field: "description",
                locale,
                fallbackLocale: deckFallback,
            }) || deck.description
            const cardTexts = (deck.cards ?? []).map((card) => {
                const cardFallback = card.defaultLocale ?? deckFallback
                const question = this.translationResolver.resolve({
                    translations: card.translations,
                    field: "question",
                    locale,
                    fallbackLocale: cardFallback,
                }) || card.question
                const answer = this.translationResolver.resolve({
                    translations: card.translations,
                    field: "answer",
                    locale,
                    fallbackLocale: cardFallback,
                }) || card.answer
                const explanation = this.translationResolver.resolve({
                    translations: card.translations,
                    field: "explanation",
                    locale,
                    fallbackLocale: cardFallback,
                }) || card.explanation
                return [
                    question,
                    answer,
                    explanation,
                ]
                    .filter((part): part is string => Boolean(part?.trim()))
                    .join("\n")
            })
            const text = [
                title,
                description,
                ...cardTexts,
            ]
                .filter((part) => Boolean(part?.trim()))
                .join("\n\n")
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    contentId: deck.id,
                    courseId,
                    kind: "flashcard",
                    filePath: "",
                    lang: locale,
                },
            }))
        }
        return docs
    }

    /**
     * Read a milestone task's title/description/hint + ONE brief body (MinIO
     * snapshot -- same flattened shape the `task(id)` query reads; internal
     * `outcomeCriteria`/`approachCriteria` grading rubrics are never `@Field`-
     * exposed and never make it into this snapshot) for each locale.
     *
     * Only ONE brief is embedded (prefers the language-agnostic one; else the
     * first available) -- like challenge requirements, the 4 per-language
     * (ts/java/csharp/go) brief variants are near-identical instructions and
     * would just multiply near-duplicate chunks.
     *
     * @param taskId - The milestone task id.
     * @param courseId - The owning course id (payload field; "" when unknown).
     * @returns The task's body documents (one per non-empty locale).
     */
    private async collectMilestoneTaskDocs(
        taskId: string,
        courseId: string,
    ): Promise<Array<Document>> {
        const docs: Array<Document> = []
        for (const locale of [
            Locale.Vi,
            Locale.En,
        ]) {
            const snapshot = await this.s3ReadService.json<MilestoneTaskEntity>({
                key: this.s3NameResolverService.milestoneTask(taskId,
                    locale),
                provider: S3Provider.Minio,
            })
            if (!snapshot) {
                continue
            }
            const brief = snapshot.briefs?.find((candidate) => candidate.lang === "agnostic")
                ?? snapshot.briefs?.[0]
            const text = [
                snapshot.title,
                snapshot.description,
                snapshot.hint,
                brief?.body,
            ]
                .filter((part): part is string => Boolean(part?.trim()))
                .join("\n\n")
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    contentId: taskId,
                    courseId,
                    kind: "milestone",
                    filePath: "",
                    lang: locale,
                },
            }))
        }
        return docs
    }

    /**
     * Assemble a foundation's title + description + value for each locale, one
     * document per non-empty locale -- pure Postgres (foundations have no MinIO
     * snapshot; their localized text lives in the `foundation_translations` EAV
     * table as per-field/locale rows), resolved directly via
     * {@link TranslationResolverService} off the eager-loaded `translations`
     * relation, falling back to the base column when a locale/field is missing.
     *
     * Foundations are NOT course-scoped (they belong to a foundation-category),
     * so the emitted document carries `kind: "content"` with NO `courseId` -- the
     * foundation-grounding rail (slice 2) filters these by `contentId` alone.
     *
     * @param foundation - The foundation, eager-loaded with `translations`.
     * @returns The foundation's documents (one per non-empty locale).
     */
    private collectFoundationDocs(
        foundation: FoundationEntity,
    ): Array<Document> {
        const docs: Array<Document> = []
        const fallback = foundation.defaultLocale ?? Locale.En
        for (const locale of [
            Locale.Vi,
            Locale.En,
        ]) {
            const title = this.translationResolver.resolve({
                translations: foundation.translations,
                field: "title",
                locale,
                fallbackLocale: fallback,
            }) || foundation.title
            const description = this.translationResolver.resolve({
                translations: foundation.translations,
                field: "description",
                locale,
                fallbackLocale: fallback,
            }) || foundation.description || ""
            const value = this.translationResolver.resolve({
                translations: foundation.translations,
                field: "value",
                locale,
                fallbackLocale: fallback,
            }) || foundation.value || ""
            const text = [
                title,
                description,
                value,
            ]
                .filter((part) => Boolean(part?.trim()))
                .join("\n\n")
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    contentId: foundation.id,
                    kind: "content",
                    filePath: "",
                    lang: locale,
                },
            }))
        }
        return docs
    }

    /**
     * Resolve a content snapshot's lesson markdown. SCHEMA V2 content keeps the
     * scalar `body` empty and stores the lesson under the V2 `bodies[]` buckets
     * (each with per-locale `translations`) -- mirror `ContentAiService` exactly so
     * the same text the chat grounds on is what gets indexed.
     *
     * @param content - The content snapshot read from MinIO.
     * @param locale - The locale whose translation is preferred.
     * @returns The lesson markdown, or "" when none is available.
     */
    private extractBodyText(
        content: ContentEntity,
        locale: Locale,
    ): string {
        if (content.body?.trim()) {
            return content.body
        }
        for (const bucket of content.bodies ?? []) {
            const translated = (bucket.translations ?? [])
                .find((translation) => translation.locale === locale)?.body
            const text = translated ?? bucket.body
            if (text?.trim()) {
                return text
            }
        }
        return ""
    }

    /**
     * Bulk-load the `{contentId -> sourceHash}` pairs already indexed in the
     * collection, from payload alone (no vectors) -- the whole diff baseline in a
     * handful of paginated scroll calls instead of one lookup per content.
     *
     * @param collectionName - The collection to read markers from.
     * @returns Map of `contentId` to the `sourceHash` recorded when it was last
     * indexed. Empty when the collection does not exist yet (first build).
     */
    private async loadExistingHashes(
        collectionName: string,
    ): Promise<Map<string, string>> {
        const hashes = new Map<string, string>()
        let offset: string | number | undefined
        for (; ;) {
            let page
            try {
                page = await this.qdrantClient.scroll(collectionName,
                    {
                        limit: 1000,
                        offset,
                        // LangChain nests doc metadata under a `metadata` payload
                        // sub-object -> select that, not top-level keys (which are
                        // undefined). Reading the wrong keys made this baseline
                        // ALWAYS empty -> every content re-embedded + appended every
                        // run -> 28x duplicate points accumulated (2026-07-11 fix).
                        with_payload: [
                            "metadata",
                        ],
                        with_vector: false,
                    })
            } catch {
                // collection does not exist yet (first build) -- empty baseline,
                // every content is treated as new
                return hashes
            }
            for (const point of page.points) {
                const metadata = point.payload?.metadata as { contentId?: unknown, sourceHash?: unknown } | undefined
                const contentId = metadata?.contentId
                const sourceHash = metadata?.sourceHash
                if (typeof contentId === "string" && typeof sourceHash === "string" && !hashes.has(contentId)) {
                    hashes.set(contentId,
                        sourceHash)
                }
            }
            if (page.next_page_offset === null || page.next_page_offset === undefined) {
                return hashes
            }
            offset = page.next_page_offset as string | number
        }
    }

    /**
     * Run {@link safeDeleteByContentId} over many ids with BOUNDED concurrency --
     * a sequential `for...await` here is the dominant cost once the collection
     * holds hundreds of thousands of points (`on_disk_payload: true` makes each
     * filter-delete a ~1-1.5s scan, observed directly while testing the 3-kind
     * "search course content" expansion: 1671 items x ~1.5s sequential ≈ 40min).
     * A small worker pool keeps Qdrant load bounded while still running many
     * deletes at once.
     *
     * @param collectionName - The collection to delete points from.
     * @param contentIds - The ids whose points should be dropped (may be empty).
     */
    private async deleteByContentIdsConcurrently(
        collectionName: string,
        contentIds: Array<string>,
    ): Promise<void> {
        const CONCURRENCY = 20
        let cursor = 0
        const worker = async (): Promise<void> => {
            for (;;) {
                const index = cursor
                cursor += 1
                if (index >= contentIds.length) {
                    return
                }
                await this.safeDeleteByContentId(collectionName,
                    contentIds[index])
            }
        }
        await Promise.all(
            Array.from({
                length: Math.min(CONCURRENCY,
                    contentIds.length),
            },
            () => worker()),
        )
    }

    /**
     * Delete every point tagged with `contentId` in its payload, swallowing
     * "missing collection" / transient errors -- a filter-delete against an
     * absent collection (first build) or a content with nothing indexed yet
     * must never fail the build.
     *
     * @param collectionName - The collection to delete points from.
     * @param contentId - The content whose stale points should be dropped.
     */
    private async safeDeleteByContentId(
        collectionName: string,
        contentId: string,
    ): Promise<void> {
        try {
            await this.qdrantClient.delete(collectionName,
                {
                    filter: {
                        must: [
                            {
                                // LangChain nests metadata under `metadata` -> filter
                                // on `metadata.contentId` (same key retrieval uses).
                                // Was `contentId` (top-level) -> matched 0 points, so
                                // stale points were never deleted before re-insert ->
                                // duplicates piled up every run (2026-07-11 fix).
                                key: "metadata.contentId",
                                match: {
                                    value: contentId,
                                },
                            },
                        ],
                    },
                })
        } catch {
            // collection may not exist yet, or nothing to delete for this content -- fine
        }
    }

    /**
     * Content-hash a content's freshly-collected documents (body + code, before
     * chunking) so it can be compared against the marker recorded when it was
     * last indexed. sha1 over the concatenated page contents -- order-stable
     * because {@link collectBodyDocs}/{@link collectCodeDocs} always push in the
     * same order (vi body, en body, then code files in MinIO map order).
     *
     * @param docs - The content's body + code documents (unsplit).
     * @returns A sha1 hex digest of the content's current source text.
     */
    private hashDocs(
        docs: Array<Document>,
    ): string {
        const hash = createHash("sha1")
        for (const doc of docs) {
            hash.update(doc.pageContent)
            hash.update(" ")
        }
        return hash.digest("hex")
    }
}
