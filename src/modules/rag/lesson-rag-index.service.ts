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
const LESSON_RAG_EMBED_BATCH_SIZE = 200

/**
 * Result of {@link LessonRagIndexService.build}.
 */
export interface BuildLessonRagIndexResult {
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
 * and upserted into ONE persistent collection (`lesson_rag`) via
 * `QdrantVectorStore.fromDocuments`, which auto-creates the collection with the
 * embedder's vector size (the dim is never hard-coded — same idiom as the
 * grading RAG stack). Each chunk carries the payload
 * `{ contentId, courseId, kind, filePath, lang }` so content-AI chat can filter
 * by `contentId` at retrieval time.
 *
 * The collection is dropped + rebuilt each run so stale lessons never linger.
 */
@Injectable()
export class LessonRagIndexService {
    /** Scoped logger for the non-fatal index build. */
    private readonly logger = new Logger(LessonRagIndexService.name)

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
     * from MinIO, chunk + embed, then upsert into the persistent `lesson_rag`
     * collection.
     *
     * Must run AFTER the seed phase (contents enumerable) and AFTER the
     * synchronizers phase (`contents/<id>/<locale>.json` + `repo/.../*.json` are
     * in MinIO) — i.e. as a post-sync init phase inside the runtime-context window.
     *
     * @returns The number of chunks indexed.
     */
    async build(): Promise<BuildLessonRagIndexResult> {
        const collectionName = envConfig().services.lessonRag.collection

        // local-first embedder: a healthy self-hosted GPU embeds for $0, climbing
        // to a cloud embedding model only when the local host is down
        const embeddingModel = await this.embeddingModelService.getViaBalancer()
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: envConfig().services.lessonRag.chunkSize,
            chunkOverlap: envConfig().services.lessonRag.chunkOverlap,
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

        const docs: Array<Document> = []
        for (const [
            index,
            content,
        ] of contents.entries()) {
            const courseId = content.module?.course?.id ?? ""
            // per-content isolation: a MinIO read / parse failure for ONE lesson must
            // NOT abort the whole index build — log it + skip to the next content
            // (mirrors the non-fatal swallow policy of the asset-mirror + init phases)
            try {
                await this.collectBodyDocs(content.id,
                    courseId,
                    docs)
                await this.collectCodeDocs(content,
                    courseId,
                    docs)
            } catch (error) {
                this.logger.warn(
                    `Lesson RAG: skipped content ${content.id}: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
            // progress heartbeat — this loop reads MinIO per content; without it a
            // large corpus looks indistinguishable from "hung" for many minutes
            if ((index + 1) % 50 === 0 || index === contents.length - 1) {
                this.logger.log(
                    `Lesson RAG: collected ${index + 1}/${contents.length} content(s), ${docs.length} doc(s) so far`,
                )
            }
        }

        // nothing to index (empty DB / MinIO not populated) → skip the upsert
        if (docs.length === 0) {
            this.winstonService.log(
                WinstonLog.ProcessStepExecuted,
                {
                    jobId: "init",
                    step: "lesson-rag-index",
                    success: true,
                    meta: {
                        contents: contents.length,
                        chunks: 0,
                    },
                },
            )
            return {
                indexed: 0,
            }
        }

        const chunks = await splitter.splitDocuments(docs)
        this.logger.log(
            `Lesson RAG: embedding + upserting ${chunks.length} chunk(s) in batches of ${LESSON_RAG_EMBED_BATCH_SIZE}`,
        )

        // drop + rebuild so a removed/renamed lesson does not leave stale vectors.
        // Embed + upsert in BATCHES rather than one `fromDocuments` call over the
        // whole corpus: a single call embeds every chunk (queued through the
        // embedder's AsyncCaller) before issuing ANY upsert, so a large corpus
        // (thousands of chunks) can run long enough to outlast every downstream
        // client/library timeout with zero visibility into progress. Batching
        // bounds each embed+upsert round AND gives a heartbeat between rounds.
        await this.safeDeleteCollection(collectionName)
        const firstBatch = chunks.slice(0,
            LESSON_RAG_EMBED_BATCH_SIZE)
        const vectorStore = await QdrantVectorStore.fromDocuments(
            firstBatch,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )
        this.logger.log(
            `Lesson RAG: embedded ${firstBatch.length}/${chunks.length} chunk(s)`,
        )
        for (let start = LESSON_RAG_EMBED_BATCH_SIZE; start < chunks.length; start += LESSON_RAG_EMBED_BATCH_SIZE) {
            const batch = chunks.slice(start,
                start + LESSON_RAG_EMBED_BATCH_SIZE)
            await vectorStore.addDocuments(batch)
            this.logger.log(
                `Lesson RAG: embedded ${Math.min(start + batch.length, chunks.length)}/${chunks.length} chunk(s)`,
            )
        }

        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: "init",
                step: "lesson-rag-index",
                success: true,
                meta: {
                    contents: contents.length,
                    chunks: chunks.length,
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
     * Delete a Qdrant collection, swallowing "missing collection" / transient
     * errors so the first build (collection absent) never throws. Mirrors the
     * grading RAG service's safe-delete.
     *
     * @param collectionName - The collection to drop.
     */
    private async safeDeleteCollection(
        collectionName: string,
    ): Promise<void> {
        try {
            await this.qdrantClient.deleteCollection(collectionName)
        } catch {
            // collection may not exist yet (first build) — fine
        }
    }
}
