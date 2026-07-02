import {
    createHash,
} from "crypto"
import {
    Injectable,
    Logger,
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
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    ContentEntity,
    InjectPrimaryPostgreSQLEntityManager,
    InjectQdrantClient,
    Locale,
} from "@modules/databases"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    S3NameResolverService,
    S3Provider,
    S3ReadService,
} from "@modules/s3"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    extToLang,
} from "./utils"

/** Sandpack file-map value as stored in MinIO (`repo/<repoName>/<githubDir>.json`). */
interface SandpackFile {
    /** Raw file contents. */
    code: string
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

/**
 * Builds the persistent per-lesson RAG index in Qdrant at init.
 *
 * For every seeded content it indexes:
 * - the lesson **body** (one document per locale, read from MinIO
 *   `contents/<id>/<locale>.json`), and
 * - the lesson **code** (each sandbox file, read from MinIO
 *   `repo/<repoName>/<githubDir>.json` — written by the repo synchronizer) for
 *   sandbox lessons.
 *
 * The documents are chunked, embedded via the balancer-routed embedder
 * ({@link EmbeddingModelService.getViaBalancer} — local-first, cloud fallback),
 * and upserted into ONE persistent collection (`content_rag`) via
 * `QdrantVectorStore.fromDocuments`, which auto-creates the collection with the
 * embedder's vector size (the dim is never hard-coded — same idiom as the
 * grading RAG stack). Each chunk carries the payload
 * `{ contentId, courseId, kind, filePath, lang, sourceHash }` so content-AI chat
 * can filter by `contentId` at retrieval time, and so this service can tell
 * whether a content's source changed since it was last indexed.
 *
 * DIFF-AWARE: like the ES/CDN sync, this never blindly rebuilds. Every run
 * bulk-loads the `{contentId -> sourceHash}` pairs already sitting in the
 * collection's payloads (one cheap no-vector scroll), then per content:
 * unchanged hash → skip entirely (no re-embedding); changed/new → delete its
 * stale points + re-embed; content no longer enumerated (deleted/renamed) →
 * delete its stale points. A first run (empty/missing collection) naturally
 * falls out of the same diff as "everything is new" — no separate full-rebuild
 * flag needed.
 */
@Injectable()
export class ContentRagIndexService {
    /** Scoped logger for the non-fatal index build. */
    private readonly logger = new Logger(ContentRagIndexService.name)

    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly s3ReadService: S3ReadService,
        private readonly s3NameResolverService: S3NameResolverService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Enumerate every seeded content, gather its body (per locale) + sandbox code
     * from MinIO, chunk + embed, then upsert into the persistent `content_rag`
     * collection.
     *
     * Must run AFTER the seed phase (contents enumerable) and AFTER the
     * synchronizers phase (`contents/<id>/<locale>.json` + `repo/.../*.json` are
     * in MinIO) — i.e. as a post-sync init phase inside the runtime-context window.
     *
     * @returns The number of chunks indexed.
     */
    async build(): Promise<BuildContentRagIndexResult> {
        const collectionName = envConfig().services.contentRag.collection

        // local-first embedder: a healthy self-hosted GPU embeds for $0, climbing
        // to a cloud embedding model only when the local host is down
        const embeddingModel = await this.embeddingModelService.getViaBalancer()
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.contentRag.chunkSize,
            chunkOverlap: envConfig().services.contentRag.chunkOverlap,
        })

        // the DB is seeded by the time this runs → enumerate contents + owning course
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

        // diff baseline: {contentId -> sourceHash} already sitting in the
        // collection's payloads (empty on a first/missing-collection run, which
        // then falls out of the loop below as "everything is new" for free)
        const existingHashes = await this.loadExistingHashes(collectionName)
        const currentContentIds = new Set(contents.map((content) => content.id))

        // content rows that vanished since the last run (deleted/renamed) leave
        // their vectors orphaned in Qdrant — drop them up front
        const removedContentIds = [...existingHashes.keys()].filter(
            (contentId) => !currentContentIds.has(contentId),
        )
        for (const contentId of removedContentIds) {
            await this.safeDeleteByContentId(collectionName,
                contentId)
        }

        const docs: Array<Document> = []
        const dirtyContentIds: Array<string> = []
        let unchangedCount = 0
        for (const [
            index,
            content,
        ] of contents.entries()) {
            const courseId = content.module?.course?.id ?? ""
            // per-content isolation: a MinIO read / parse failure for ONE lesson must
            // NOT abort the whole index build — log it + skip to the next content
            // (mirrors the non-fatal swallow policy of the asset-mirror + init phases)
            try {
                const contentDocs: Array<Document> = []
                await this.collectBodyDocs(content.id,
                    courseId,
                    contentDocs)
                await this.collectCodeDocs(content,
                    courseId,
                    contentDocs)
                if (contentDocs.length === 0) {
                    continue
                }
                // content-hash the RAW (unsplit) source text — cheaper than
                // chunking/embedding just to find out nothing changed
                const sourceHash = this.hashDocs(contentDocs)
                if (existingHashes.get(content.id) === sourceHash) {
                    unchangedCount += 1
                    continue // source unchanged since the last index — its vectors stay as-is
                }
                for (const doc of contentDocs) {
                    doc.metadata.sourceHash = sourceHash
                }
                dirtyContentIds.push(content.id)
                docs.push(...contentDocs)
            } catch (error) {
                this.logger.warn(
                    `Content RAG: skipped content ${content.id}: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
            // progress heartbeat — this loop reads MinIO per content; without it a
            // large corpus looks indistinguishable from "hung" for many minutes
            if ((index + 1) % 50 === 0 || index === contents.length - 1) {
                this.logger.log(
                    `Content RAG: scanned ${index + 1}/${contents.length} content(s), ${dirtyContentIds.length} changed so far`,
                )
            }
        }

        // nothing changed and nothing was removed → the collection is already
        // up to date, skip the (expensive) embed+upsert step entirely
        if (docs.length === 0 && removedContentIds.length === 0) {
            this.logger.log(
                `Content RAG: no content changed — skipped all ${contents.length} content(s)`,
            )
            this.winstonService.log(
                WinstonLog.ProcessStepExecuted,
                {
                    jobId: "init",
                    step: "content-rag-index",
                    success: true,
                    meta: {
                        contents: contents.length,
                        chunks: 0,
                        unchanged: unchangedCount,
                        removed: removedContentIds.length,
                    },
                },
            )
            return {
                indexed: 0,
            }
        }

        // delete the STALE points of changed content BEFORE re-inserting fresh
        // ones — otherwise a content whose chunk count shrank (or split
        // differently after an edit) would leave orphaned old chunks behind
        // alongside the new ones
        for (const contentId of dirtyContentIds) {
            await this.safeDeleteByContentId(collectionName,
                contentId)
        }

        const chunks = docs.length > 0 ? await splitter.splitDocuments(docs) : []
        this.logger.log(
            `Content RAG: embedding + upserting ${chunks.length} chunk(s) for ${dirtyContentIds.length} changed content(s) `
            + `(${unchangedCount} unchanged, ${removedContentIds.length} removed) in batches of ${CONTENT_RAG_EMBED_BATCH_SIZE}`,
        )

        // `QdrantVectorStore.fromDocuments` never wipes an existing collection —
        // it only creates one when missing (`ensureCollection`) then upserts —
        // so it is safe to call every run without a preceding collection drop.
        // Embed + upsert in BATCHES rather than one `fromDocuments` call over the
        // whole corpus: a single call embeds every chunk (queued through the
        // embedder's AsyncCaller) before issuing ANY upsert, so a large corpus
        // (thousands of chunks) can run long enough to outlast every downstream
        // client/library timeout with zero visibility into progress. Batching
        // bounds each embed+upsert round AND gives a heartbeat between rounds.
        if (chunks.length > 0) {
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
            this.logger.log(
                `Content RAG: embedded ${firstBatch.length}/${chunks.length} chunk(s)`,
            )
            for (let start = CONTENT_RAG_EMBED_BATCH_SIZE; start < chunks.length; start += CONTENT_RAG_EMBED_BATCH_SIZE) {
                const batch = chunks.slice(start,
                    start + CONTENT_RAG_EMBED_BATCH_SIZE)
                await vectorStore.addDocuments(batch)
                this.logger.log(
                    `Content RAG: embedded ${Math.min(start + batch.length,
                        chunks.length)}/${chunks.length} chunk(s)`,
                )
            }
        }

        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: "init",
                step: "content-rag-index",
                success: true,
                meta: {
                    contents: contents.length,
                    chunks: chunks.length,
                    changed: dirtyContentIds.length,
                    unchanged: unchangedCount,
                    removed: removedContentIds.length,
                },
            },
        )
        return {
            indexed: chunks.length,
        }
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
     * of `githubBaseUrl` — mirror that exactly to read it back.
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
     * Resolve a content snapshot's lesson markdown. SCHEMA V2 content keeps the
     * scalar `body` empty and stores the lesson under the V2 `bodies[]` buckets
     * (each with per-locale `translations`) — mirror `ContentAiService` exactly so
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
        if (content.body && content.body.trim()) {
            return content.body
        }
        for (const bucket of content.bodies ?? []) {
            const translated = (bucket.translations ?? [])
                .find((translation) => translation.locale === locale)?.body
            const text = translated ?? bucket.body
            if (text && text.trim()) {
                return text
            }
        }
        return ""
    }

    /**
     * Bulk-load the `{contentId -> sourceHash}` pairs already indexed in the
     * collection, from payload alone (no vectors) — the whole diff baseline in a
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
                        with_payload: [
                            "contentId",
                            "sourceHash",
                        ],
                        with_vector: false,
                    })
            } catch {
                // collection does not exist yet (first build) — empty baseline,
                // every content is treated as new
                return hashes
            }
            for (const point of page.points) {
                const contentId = point.payload?.contentId
                const sourceHash = point.payload?.sourceHash
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
     * Delete every point tagged with `contentId` in its payload, swallowing
     * "missing collection" / transient errors — a filter-delete against an
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
                                key: "contentId",
                                match: {
                                    value: contentId,
                                },
                            },
                        ],
                    },
                })
        } catch {
            // collection may not exist yet, or nothing to delete for this content — fine
        }
    }

    /**
     * Content-hash a content's freshly-collected documents (body + code, before
     * chunking) so it can be compared against the marker recorded when it was
     * last indexed. sha1 over the concatenated page contents — order-stable
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
