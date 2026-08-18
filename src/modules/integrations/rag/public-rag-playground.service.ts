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
import type {
    Document,
} from "@langchain/core/documents"
import {
    RecursiveCharacterTextSplitter,
} from "langchain/text_splitter"
import {
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    RagPlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/rag-playground-session.entity"
import {
    RagPlaygroundSourceKind,
} from "@modules/databases/postgresql/primary/enums/rag-playground-source-kind"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    InjectQdrantClient,
} from "@modules/databases/qdrant/qdrant.decorators"
import {
    EmbeddingModelService,
} from "@modules/integrations/langchain/embedding-model.service"
import {
    RagPlaygroundImportException,
} from "@modules/platform/exceptions/errors/rag-playground/import-failed"
import {
    RagPlaygroundSampleNotFoundException,
} from "@modules/platform/exceptions/errors/rag-playground/sample-not-found"
import {
    RagPlaygroundSessionNotFoundException,
} from "@modules/platform/exceptions/errors/rag-playground/session-not-found"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    GithubRepoImportService,
} from "./github-repo-import.service"
import type {
    BuildAskMessagesParams,
    IndexRagPlaygroundParams,
    IndexRagPlaygroundResult,
    RagPlaygroundSampleEntry,
    RagPlaygroundSampleSummary,
    RagPlaygroundSourceChunk,
    ResolveRagPlaygroundDocumentsResult,
    RetrieveRagPlaygroundContextParams,
    RetrieveRagPlaygroundContextResult,
} from "./types/public-rag-playground"

/** Split size for pasted/uploaded/GitHub code -- smaller than lesson chunks (1000) since a code excerpt makes a tighter citation. */
const CHUNK_SIZE = 800

/** Overlap between adjacent chunks. */
const CHUNK_OVERLAP = 150

/** Hard cap on chunks per session (bounds Qdrant load from a public, unauthenticated endpoint). */
const MAX_CHUNKS = 60

/** Hard cap on pasted/uploaded code length (characters). */
const MAX_CODE_CHARS = 60_000

/** Default retrieval depth per question. */
const DEFAULT_TOP_K = 5

/** Chunk snippet length shown in the citation UI. */
const SNIPPET_DISPLAY_CHARS = 400

/**
 * The RAG Playground's built-in, curated sample catalog -- small, self-contained,
 * realistic code so a visitor can try the demo with zero typing. Only `id` +
 * `label` are ever sent to the client (see {@link PublicRagPlaygroundService.listSamples});
 * `code` stays server-side and is only revealed by indexing it.
 */
const SAMPLE_CATALOG: Array<RagPlaygroundSampleEntry> = [
    {
        id: "retrieval-helper",
        label: "Retrieval helper (cosine similarity top-k)",
        filePath: "sample.ts",
        // deliberately RAG-relevant (a retrieval helper + its caller) so the
        // first question ("how does retrieval work here?") has a real, groundable answer.
        code: `// A tiny retrieval-augmented search helper.
export interface Chunk {
  id: string
  text: string
  embedding: number[]
}

/** Cosine similarity between two equal-length vectors. */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/** Returns the top-k chunks most similar to the query embedding. */
export function retrieveTopK(
  query: number[],
  chunks: Chunk[],
  k: number,
): Chunk[] {
  return [...chunks]
    .map((chunk) => ({ chunk, score: cosineSimilarity(query, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((entry) => entry.chunk)
}
`,
    },
    {
        id: "express-todo-api",
        label: "Express REST API (todos CRUD)",
        filePath: "server.ts",
        code: `// A minimal Express REST API for managing "todos".
import express from "express"
import type { Request, Response } from "express"

interface Todo {
  id: string
  title: string
  done: boolean
}

const app = express()
app.use(express.json())

const todos = new Map<string, Todo>()

app.get("/todos", (_req: Request, res: Response) => {
  res.json(Array.from(todos.values()))
})

app.post("/todos", (req: Request, res: Response) => {
  const { title } = req.body as { title?: string }
  if (!title?.trim()) {
    return res.status(400).json({ error: "title is required" })
  }
  const todo: Todo = { id: crypto.randomUUID(), title, done: false }
  todos.set(todo.id, todo)
  res.status(201).json(todo)
})

app.patch("/todos/:id", (req: Request, res: Response) => {
  const todo = todos.get(req.params.id)
  if (!todo) {
    return res.status(404).json({ error: "todo not found" })
  }
  const { done } = req.body as { done?: boolean }
  if (typeof done === "boolean") {
    todo.done = done
  }
  res.json(todo)
})

app.delete("/todos/:id", (req: Request, res: Response) => {
  if (!todos.delete(req.params.id)) {
    return res.status(404).json({ error: "todo not found" })
  }
  res.status(204).end()
})

app.listen(3000, () => {
  console.log("Todo API listening on :3000")
})
`,
    },
    {
        id: "docker-compose-api",
        label: "Dockerfile + docker-compose (API + Postgres)",
        filePath: "Dockerfile, docker-compose.yml",
        code: `# Dockerfile — multi-stage build, runs a small Node.js API in production mode.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 3000
CMD ["node", "server.js"]

# docker-compose.yml — runs the API alongside a Postgres database.
version: "3.9"
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://postgres:postgres@db:5432/app
    depends_on:
      - db
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: app
    volumes:
      - db_data:/var/lib/postgresql/data

volumes:
  db_data:
`,
    },
]

@Injectable()
/**
 * The PUBLIC (anonymous, no login) RAG Playground core: chunk + embed (local
 * model, $0) + index into a per-session ephemeral Qdrant collection
 * (`playground-${sessionId}`), then retrieve grounded context for a question.
 *
 * Ephemeral by design: no user/enrollment scoping (there is none -- the
 * visitor is anonymous). {@link RagPlaygroundSessionEntity} tracks JUST the
 * collection's lifecycle (source label, chunk count, last-accessed) so the
 * cleanup cron can drop idle sessions -- no Q&A content is persisted anywhere.
 */
export class PublicRagPlaygroundService {
    constructor(
        @InjectQdrantClient()
        private readonly qdrantClient: QdrantClient,
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly embeddingModelService: EmbeddingModelService,
        private readonly githubRepoImportService: GithubRepoImportService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Index a code source into the session's ephemeral Qdrant collection,
     * (re)creating the collection so re-indexing the same session replaces its
     * prior source. Persists a lightweight session row (label + chunk count +
     * last-accessed) so the cleanup cron can find + drop it once idle.
     *
     * @param params - Session id + the source (paste / upload / sample / GitHub URL).
     * @returns The chunk count + a human-readable label of what was indexed.
     * @throws RagPlaygroundImportException on an empty/oversized paste or a rejected GitHub import.
     */
    async index(
        params: IndexRagPlaygroundParams,
    ): Promise<IndexRagPlaygroundResult> {
        const {
            sessionId,
            kind,
        } = params
        const {
            documents,
            sourceLabel,
            sampleId,
        } = await this.resolveDocuments(params)

        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
        })
        const chunks = (await splitter.splitDocuments(documents)).slice(0,
            MAX_CHUNKS)
        if (chunks.length === 0) {
            throw new RagPlaygroundImportException({
                reason: "Không có nội dung để index", // vn-ok: user-facing import error reason
            })
        }

        // local-first embedder ($0 on the healthy local GPU; climbs to a cloud
        // embedding model only if the local host is down)
        const embeddingModel = await this.embeddingModelService.getViaBalancer()
        const collectionName = this.collectionName(sessionId)

        // rebuild from scratch so re-indexing the same session replaces its source
        await this.safeDeleteCollection(collectionName)
        await QdrantVectorStore.fromDocuments(
            chunks,
            embeddingModel,
            {
                client: this.qdrantClient,
                collectionName,
            },
        )

        await this.entityManager.upsert(
            RagPlaygroundSessionEntity,
            {
                sessionId,
                sourceKind: kind,
                sourceLabel,
                sampleId: sampleId ?? null,
                chunkCount: chunks.length,
                lastAccessedAt: new Date(),
            },
            [
                "sessionId",
            ],
        )

        return {
            sessionId,
            chunkCount: chunks.length,
            sourceLabel,
        }
    }

    /**
     * Retrieve the chunks most relevant to a question from a session's indexed
     * source, and bump the session's `lastAccessedAt` (keeps it alive for the
     * idle-cleanup cron). Degrades to an EMPTY result (never throws) when the
     * Qdrant collection itself is unreachable/missing -- the caller still
     * answers, just without grounding, rather than blackholing the ask.
     *
     * @param params - Session id, the visitor's question, and an optional top-k.
     * @returns The retrieved chunks (possibly empty on a degraded retrieval).
     * @throws RagPlaygroundSessionNotFoundException when the session was never indexed / was cleaned up.
     */
    async retrieveContext(
        {
            sessionId,
            question,
            topK = DEFAULT_TOP_K,
        }: RetrieveRagPlaygroundContextParams,
    ): Promise<RetrieveRagPlaygroundContextResult> {
        const session = await this.entityManager.findOne(
            RagPlaygroundSessionEntity,
            {
                where: {
                    sessionId,
                },
            },
        )
        if (!session) {
            throw new RagPlaygroundSessionNotFoundException({
                sessionId,
            })
        }

        // best-effort -- a stale/dropped collection must not blackhole the ask
        try {
            const embeddingModel = await this.embeddingModelService.getViaBalancer()
            const vectorStore = await QdrantVectorStore.fromExistingCollection(
                embeddingModel,
                {
                    client: this.qdrantClient,
                    collectionName: this.collectionName(sessionId),
                },
            )
            const hits = await vectorStore.similaritySearch(
                question,
                topK,
            )
            await this.entityManager.update(
                RagPlaygroundSessionEntity,
                {
                    id: session.id,
                },
                {
                    lastAccessedAt: new Date(),
                },
            )
            return {
                chunks: hits.map((hit) => this.toSourceChunk(hit)),
            }
        } catch (error) {
            this.winstonService.log(WinstonLog.RagRetrievalFailed,
                {
                    op: "rag.playground.retrieval-failed",
                    sessionId,
                    error: error instanceof Error ? error.message : String(error),
                })
            return {
                chunks: [],
            }
        }
    }

    /**
     * Build the system + human messages for a grounded ask -- the retrieved
     * chunks are stuffed into the system prompt with file-path citations, and
     * the model is instructed to answer only from them.
     *
     * @param params - The visitor's question + the retrieved chunks.
     * @returns Ordered chat messages ready for {@link import("@modules/ai").AiInvokeService.stream}.
     */
    buildAskMessages(
        {
            question,
            chunks,
        }: BuildAskMessagesParams,
    ): [SystemMessage, HumanMessage] {
        const context = chunks.length > 0
            ? chunks
                .map((chunk, index) => `[${index + 1}] ${chunk.filePath ?? "snippet"}\n${chunk.snippet}`)
                .join("\n\n")
            : "(không tìm thấy đoạn code liên quan)" // vn-ok: vi-locale RAG prompt fallback
        const system = new SystemMessage(
            "Bạn là trợ lý kỹ thuật của StarCi Academy, trả lời câu hỏi về đoạn code người dùng cung cấp bên dưới. " // vn-ok: vi-locale RAG system prompt
            + "CHỈ trả lời dựa trên các đoạn trích — nếu câu trả lời không có trong đó, hãy nói rõ là không tìm thấy. " // vn-ok: vi-locale RAG system prompt
            + "Khi liên quan, trích dẫn theo dạng [số] hoặc tên file. Trả lời ngắn gọn, đúng ngôn ngữ của câu hỏi.\n\n" // vn-ok: vi-locale RAG system prompt
            + `Các đoạn code liên quan:\n${context}`, // vn-ok: vi-locale RAG system prompt
        )
        return [
            system,
            new HumanMessage(question),
        ]
    }

    /**
     * Lists the built-in curated sample catalog for the sample picker -- id +
     * label only, never the code itself (the code stays server-side and is
     * only revealed once a session actually indexes it).
     */
    listSamples(): Array<RagPlaygroundSampleSummary> {
        return SAMPLE_CATALOG.map(
            ({ id, label }): RagPlaygroundSampleSummary => ({
                id,
                label,
            }),
        )
    }

    /**
     * Resolve the LangChain documents + a display label for the requested source.
     */
    private async resolveDocuments(
        {
            kind,
            code,
            language,
            fileName,
            githubUrl,
            sampleId,
        }: IndexRagPlaygroundParams,
    ): Promise<ResolveRagPlaygroundDocumentsResult> {
        switch (kind) {
        case RagPlaygroundSourceKind.Sample: {
            const sample = this.findSample(sampleId)
            return {
                documents: [
                    {
                        pageContent: sample.code,
                        metadata: {
                            filePath: sample.filePath,
                        },
                    } as Document,
                ],
                sourceLabel: `Repo mẫu · ${sample.label}`, // vn-ok: vi-locale source label emitted to clients
                sampleId: sample.id,
            }
        }
        case RagPlaygroundSourceKind.Github: {
            if (!githubUrl?.trim()) {
                throw new RagPlaygroundImportException({
                    reason: "Thiếu link GitHub", // vn-ok: user-facing import error reason
                })
            }
            const documents = await this.githubRepoImportService.importRepo(githubUrl)
            return {
                documents,
                sourceLabel: githubUrl.replace(/^https:\/\/github\.com\//,
                    ""),
            }
        }
        case RagPlaygroundSourceKind.Paste:
        case RagPlaygroundSourceKind.Upload:
        default: {
            const trimmed = code?.trim() ?? ""
            if (!trimmed) {
                throw new RagPlaygroundImportException({
                    reason: "Chưa có code để index", // vn-ok: user-facing import error reason
                })
            }
            if (trimmed.length > MAX_CODE_CHARS) {
                throw new RagPlaygroundImportException({
                    reason: `Code quá lớn cho bản demo (tối đa ${MAX_CODE_CHARS.toLocaleString()} ký tự)`, // vn-ok: user-facing import error reason
                })
            }
            return {
                documents: [
                    {
                        pageContent: trimmed,
                        metadata: {
                            filePath: fileName ?? null,
                        },
                    } as Document,
                ],
                sourceLabel: fileName ?? (language ? `Đoạn code · ${language}` : "Đoạn code đã dán"), // vn-ok: vi-locale source label emitted to clients
            }
        }
        }
    }

    /**
     * Look up a catalog entry by id, defaulting to the first entry when
     * `sampleId` is omitted (backward-compatible with any in-flight client
     * that doesn't send it yet).
     *
     * @throws RagPlaygroundSampleNotFoundException when `sampleId` is set but unknown.
     */
    private findSample(
        sampleId?: string | null,
    ): RagPlaygroundSampleEntry {
        if (!sampleId) {
            return SAMPLE_CATALOG[0]
        }
        const sample = SAMPLE_CATALOG.find((entry) => entry.id === sampleId)
        if (!sample) {
            throw new RagPlaygroundSampleNotFoundException({
                sampleId,
            })
        }
        return sample
    }

    /**
     * The per-session ephemeral Qdrant collection name.
     */
    private collectionName(
        sessionId: string,
    ): string {
        return `playground-${sessionId}`
    }

    /**
     * Map a retrieved LangChain document to the citation shape the client renders.
     */
    private toSourceChunk(
        hit: Document,
    ): RagPlaygroundSourceChunk {
        const filePath = typeof hit.metadata?.filePath === "string"
            ? hit.metadata.filePath
            : null
        return {
            filePath,
            snippet: hit.pageContent.slice(0,
                SNIPPET_DISPLAY_CHARS),
        }
    }

    /**
     * Delete a Qdrant collection, swallowing "missing collection" errors (first
     * index for a session, or a race with the cleanup cron).
     */
    private async safeDeleteCollection(
        collectionName: string,
    ): Promise<void> {
        try {
            await this.qdrantClient.deleteCollection(collectionName)
        } catch {
            // absent is fine -- nothing to clean up
        }
    }
}
