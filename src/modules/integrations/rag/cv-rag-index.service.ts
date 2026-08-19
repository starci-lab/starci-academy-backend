import {
    Injectable,
} from "@nestjs/common"
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
    InjectQdrantClient,
} from "@modules/databases/qdrant/qdrant.decorators"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    ContextLoaderService,
} from "@modules/init/seeders/shared/contexts/loader.service"
import {
    PathResolverService,
} from "@modules/init/seeders/shared/path/resolver.service"
import {
    parseCvTemplateMarkdown,
} from "@modules/init/seeders/cv/parsers/utils/parse-cv-template-markdown"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    asStoredChangeFingerprint,
    CHANGE_FINGERPRINT_METADATA_KEY,
    computeChangeFingerprint,
} from "./change-fingerprint"
import type {
    ChangeFingerprint,
} from "./change-fingerprint"
import {
    CV_RAG_COLLECTION,
    CvRagKind,
} from "./cv-rag-retrieval.service"

/** Chunk size/overlap for splitting CV corpus markdown -- local constants (mirrors {@link CvRagRetrievalService}'s "no env dependency" choice, since this corpus is small and fixed, unlike the lesson-body corpus). */
const CV_RAG_CHUNK_SIZE = 1000
const CV_RAG_CHUNK_OVERLAP = 200

/** Chunks per embed+upsert round -- bounds each round so a corpus growth spike still gives progress heartbeats (mirrors {@link ContentRagIndexService}). */
const CV_RAG_EMBED_BATCH_SIZE = 200

/** One top-level folder under `.mount/data/cv/`, and the `kind` every entry found under it is tagged with. */
interface CvRagSourceDir {
    relativePath: string
    kind: CvRagKind
}

/** One corpus entry to index -- its diff/delete key (mount-relative path) plus its `kind`. */
interface CvRagEntry {
    entryId: string
    kind: CvRagKind
}

/**
 * One top-level folder under `.mount/data/cv/` scanned by {@link CvRagIndexService.build},
 * mapped to the `kind` payload filter {@link CvRagRetrievalService.retrieveCvContext} scopes on.
 * `refs/` (the teacher's cleaned real-world CVs) are tagged `sample` -- same retrieval role as
 * the authored samples (exemplar phrasing), `CvRagKind` has no separate `ref` bucket.
 */
const CV_RAG_SOURCE_DIRS: Array<CvRagSourceDir> = [
    {
        relativePath: "",
        kind: "rubric",
    },
    {
        relativePath: "catalogs",
        kind: "catalog",
    },
    {
        relativePath: "samples",
        kind: "sample",
    },
    {
        relativePath: "refs",
        kind: "sample",
    },
]

/** Result of {@link CvRagIndexService.build}. */
export interface BuildCvRagIndexResult {
    /** Number of chunks embedded + upserted into the collection. */
    indexed: number
}

/** Result of scanning every {@link CvRagEntry} for a source-hash change. */
interface CvRagScanResult {
    /** Fresh/changed documents, ready to chunk + embed. */
    docs: Array<Document>
    /** Ids of every entry whose source changed (new or edited) this run. */
    dirtyEntryIds: Array<string>
    /** Count of entries whose source hash matched the existing payload (skipped). */
    unchangedCount: number
}

@Injectable()
/**
 * Builds the persistent CV-authoring reference RAG index in Qdrant at init.
 *
 * Mirrors {@link ContentRagIndexService} exactly (same diff-aware
 * hash/batch/collection-auto-create shape) but reads its corpus from the
 * `.mount/data/cv/` mount tree via {@link ContextLoaderService}/{@link PathResolverService}
 * (the same services the `TemplateCVEntity` seeder uses) instead of from
 * MinIO snapshots -- the CV reference corpus (rubrics/catalogs/samples/refs)
 * lives in the data-repo mount, not in per-content snapshots.
 *
 * For every entry under each folder in {@link CV_RAG_SOURCE_DIRS} it reads
 * `en.md` (+ `vi.md` when present), parses the `# title / # description /
 * # body` sections via {@link parseCvTemplateMarkdown}, and indexes
 * `title + description + body` per locale as one document, tagged with the
 * `kind` payload {@link CvRagRetrievalService} filters retrieval by.
 *
 * DIFF-AWARE: identical strategy to {@link ContentRagIndexService} -- loads
 * the `{entryId -> ChangeFingerprint}` pairs already sitting in the
 * collection's payloads (persisted under the `sourceHash` payload key -- see
 * {@link CHANGE_FINGERPRINT_METADATA_KEY}), skips unchanged entries,
 * re-embeds changed/new ones, and drops points for entries no longer
 * enumerated (renamed/deleted corpus files). A first run (empty/missing
 * collection) falls out of the same diff as "everything is new". The
 * fingerprint is change-detection only, not an authenticity check -- see
 * {@link ChangeFingerprint}.
 */
export class CvRagIndexService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly contextLoaderService: ContextLoaderService,
        private readonly pathResolverService: PathResolverService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Enumerate every entry under the CV corpus folders, read + parse its
     * markdown (per locale), chunk + embed, then upsert into the persistent
     * `cv_rag` collection.
     *
     * Runs inside the runtime-context window (same as {@link ContentRagIndexService.build})
     * so {@link PathResolverService}/{@link ContextLoaderService} resolve
     * against the freshly-checked-out data-repo snapshot.
     *
     * @returns The number of chunks indexed.
     */
    async build(): Promise<BuildCvRagIndexResult> {
        const embeddingModel = await this.embeddingModelService.getViaBalancer()
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CV_RAG_CHUNK_SIZE,
            chunkOverlap: CV_RAG_CHUNK_OVERLAP,
        })

        const entries = await this.enumerateEntries()

        const existingHashes = await this.loadExistingHashes()
        const currentEntryIds = new Set(entries.map((entry) => entry.entryId))

        const removedEntryIds = [...existingHashes.keys()].filter(
            (entryId) => !currentEntryIds.has(entryId),
        )
        for (const entryId of removedEntryIds) {
            await this.safeDeleteByEntryId(entryId)
        }

        const {
            docs,
            dirtyEntryIds,
            unchangedCount,
        } = await this.scanCvRagEntries(entries,
            existingHashes)

        if (docs.length === 0 && removedEntryIds.length === 0) {
            this.winstonService.log(WinstonLog.RagIndexProgress,
                {
                    op: "rag.cv.unchanged",
                    count: entries.length,
                    meta: {
                        unchanged: unchangedCount,
                    },
                })
            this.winstonService.log(
                WinstonLog.ProcessStepExecuted,
                {
                    jobId: "init",
                    step: "cv-rag-index",
                    success: true,
                    meta: {
                        entries: entries.length,
                        chunks: 0,
                        unchanged: unchangedCount,
                        removed: removedEntryIds.length,
                    },
                },
            )
            return {
                indexed: 0,
            }
        }

        for (const entryId of dirtyEntryIds) {
            await this.safeDeleteByEntryId(entryId)
        }

        const chunks = docs.length > 0 ? await splitter.splitDocuments(docs) : []
        this.winstonService.log(WinstonLog.RagIndexProgress,
            {
                op: "rag.cv.embedding",
                count: chunks.length,
                meta: {
                    changed: dirtyEntryIds.length,
                    unchanged: unchangedCount,
                    removed: removedEntryIds.length,
                },
            })

        await this.embedAndUpsertCvChunks(chunks,
            embeddingModel)

        this.winstonService.log(
            WinstonLog.ProcessStepExecuted,
            {
                jobId: "init",
                step: "cv-rag-index",
                success: true,
                meta: {
                    entries: entries.length,
                    chunks: chunks.length,
                    changed: dirtyEntryIds.length,
                    unchanged: unchangedCount,
                    removed: removedEntryIds.length,
                },
            },
        )
        return {
            indexed: chunks.length,
        }
    }

    /**
     * Resolve every entry's current documents, diffing against `existingHashes`
     * to find what actually changed. Per-entry isolation: a read/parse failure
     * for ONE entry must NOT abort the whole index build -- log it + skip to
     * the next one (mirrors {@link ContentRagIndexService}'s swallow policy).
     * @param entries - Every enumerated corpus entry to scan.
     * @param existingHashes - The `{entryId -> ChangeFingerprint}` diff baseline
     * (change-detection only -- see {@link ChangeFingerprint}).
     */
    private async scanCvRagEntries(
        entries: Array<CvRagEntry>,
        existingHashes: Map<string, ChangeFingerprint>,
    ): Promise<CvRagScanResult> {
        const docs: Array<Document> = []
        const dirtyEntryIds: Array<string> = []
        let unchangedCount = 0
        for (const entry of entries) {
            try {
                const entryDocs = await this.collectEntryDocs(entry)
                if (entryDocs.length === 0) {
                    continue
                }
                const changeFingerprint = computeChangeFingerprint(entryDocs)
                if (existingHashes.get(entry.entryId) === changeFingerprint) {
                    unchangedCount += 1
                    continue
                }
                for (const doc of entryDocs) {
                    doc.metadata[CHANGE_FINGERPRINT_METADATA_KEY] = changeFingerprint
                }
                dirtyEntryIds.push(entry.entryId)
                docs.push(...entryDocs)
            } catch (error) {
                this.winstonService.log(WinstonLog.RagIndexProgress,
                    {
                        op: "rag.cv.item-skipped",
                        referenceId: entry.entryId,
                        error: error instanceof Error ? error.message : String(error),
                    })
            }
        }
        return {
            docs,
            dirtyEntryIds,
            unchangedCount,
        }
    }

    /**
     * Embed + batch-upsert the chunk list into the persistent `cv_rag`
     * collection (mirrors {@link ContentRagIndexService}'s batching shape).
     * @param chunks - The chunks to embed.
     * @param embeddingModel - The balancer-routed embedder.
     */
    private async embedAndUpsertCvChunks(
        chunks: Array<Document>,
        embeddingModel: Embeddings,
    ): Promise<void> {
        if (chunks.length === 0) {
            return
        }
        const firstBatch = chunks.slice(0,
            CV_RAG_EMBED_BATCH_SIZE)
        const vectorStore = await QdrantVectorStore.fromDocuments(
            firstBatch,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName: CV_RAG_COLLECTION,
            },
        )
        for (let start = CV_RAG_EMBED_BATCH_SIZE; start < chunks.length; start += CV_RAG_EMBED_BATCH_SIZE) {
            const batch = chunks.slice(start,
                start + CV_RAG_EMBED_BATCH_SIZE)
            await vectorStore.addDocuments(batch)
        }
    }

    /**
     * Resolve every `{index}-{slug}` entry under each folder in
     * {@link CV_RAG_SOURCE_DIRS} via {@link PathResolverService.filePaths},
     * tagged with its `kind`. The top-level rubric folders (`0-standard`,
     * `1-mid`, `2-senior`) live at `relativePath: ""`; the reference corpus
     * lives one level deeper (`catalogs/`, `samples/`, `refs/`).
     *
     * @returns Every corpus entry to index, each with a stable `entryId`
     * (its mount-relative path, e.g. `catalogs/01-skills`) used as the
     * diff/delete key.
     */
    private async enumerateEntries(): Promise<Array<CvRagEntry>> {
        const entries: Array<CvRagEntry> = []
        for (const dir of CV_RAG_SOURCE_DIRS) {
            const paths = await this.pathResolverService.filePaths("cv",
                dir.relativePath)
            for (const path of paths) {
                entries.push({
                    entryId: path.relativePath,
                    kind: dir.kind,
                })
            }
        }
        return entries
    }

    /**
     * Read + parse an entry's `en.md` (required) and `vi.md` (optional) and
     * build one document per available locale, tagged with the entry's `kind`.
     *
     * @param entry - The entry to read (`entryId` = mount-relative path).
     * @returns The entry's per-locale documents (empty when `en.md` is missing).
     */
    private async collectEntryDocs(
        entry: CvRagEntry,
    ): Promise<Array<Document>> {
        const docs: Array<Document> = []
        for (const [
            fileName,
            lang,
        ] of [
            [
                "en.md",
                "en",
            ],
            [
                "vi.md",
                "vi",
            ],
        ] as const) {
            let content: string | null = null
            try {
                content = await this.contextLoaderService.load("cv",
                    `${entry.entryId}/${fileName}`)
            } catch {
                continue // en.md missing -> entry unreadable; vi.md missing -> optional, skip
            }
            if (!content) {
                continue
            }
            const parsed = parseCvTemplateMarkdown(content)
            const text = [
                parsed.title,
                parsed.description ?? "",
                parsed.body,
            ].filter((part) => part.trim().length > 0).join("\n\n")
            if (!text.trim()) {
                continue
            }
            docs.push(new Document({
                pageContent: text,
                metadata: {
                    entryId: entry.entryId,
                    kind: entry.kind,
                    lang,
                },
            }))
        }
        return docs
    }

    /**
     * Bulk-load the `{entryId -> ChangeFingerprint}` pairs already indexed in
     * the `cv_rag` collection, from payload alone (no vectors).
     *
     * @returns Map of `entryId` to the {@link ChangeFingerprint} recorded when
     * it was last indexed (change-detection baseline only -- see
     * {@link ChangeFingerprint}). Empty when the collection does not exist yet
     * (first build).
     */
    private async loadExistingHashes(): Promise<Map<string, ChangeFingerprint>> {
        const hashes = new Map<string, ChangeFingerprint>()
        let offset: string | number | undefined
        for (; ;) {
            let page
            try {
                page = await this.qdrantClient.scroll(CV_RAG_COLLECTION,
                    {
                        limit: 1000,
                        offset,
                        // LangChain nests doc metadata under a `metadata` payload
                        // sub-object -> read that, not top-level keys (which are
                        // undefined). Same 28x-duplicate bug fixed in
                        // ContentRagIndexService (2026-07-11).
                        with_payload: [
                            "metadata",
                        ],
                        with_vector: false,
                    })
            } catch {
                return hashes
            }
            for (const point of page.points) {
                const metadata = point.payload?.metadata as { entryId?: unknown, sourceHash?: unknown } | undefined
                const entryId = metadata?.entryId
                const changeFingerprint = asStoredChangeFingerprint(metadata?.[CHANGE_FINGERPRINT_METADATA_KEY])
                if (typeof entryId === "string" && changeFingerprint !== undefined && !hashes.has(entryId)) {
                    hashes.set(entryId,
                        changeFingerprint)
                }
            }
            if (page.next_page_offset === null || page.next_page_offset === undefined) {
                return hashes
            }
            offset = page.next_page_offset as string | number
        }
    }

    /**
     * Delete every point tagged with `entryId` in its payload, swallowing
     * "missing collection" / transient errors.
     *
     * @param entryId - The entry whose stale points should be dropped.
     */
    private async safeDeleteByEntryId(
        entryId: string,
    ): Promise<void> {
        try {
            await this.qdrantClient.delete(CV_RAG_COLLECTION,
                {
                    filter: {
                        must: [
                            {
                                // LangChain nests metadata under `metadata` -> filter on
                                // `metadata.entryId`, not top-level (matched 0 -> never
                                // cleared stale -> duplicates piled up). Same fix as
                                // ContentRagIndexService (2026-07-11).
                                key: "metadata.entryId",
                                match: {
                                    value: entryId,
                                },
                            },
                        ],
                    },
                })
        } catch {
            // collection may not exist yet, or nothing to delete for this entry -- fine
        }
    }

}
