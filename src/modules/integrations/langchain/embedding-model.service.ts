import {
    Injectable,
} from "@nestjs/common"
import {
    GetEmbeddingModelParams,
} from "./types/model"
import {
    Embeddings,
} from "@langchain/core/embeddings"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    AiModelTask,
} from "@modules/databases/postgresql/primary/enums/ai-model-task"
import {
    ModelProvider,
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    UseApiService,
} from "@modules/ai/balancer/use-api.service"
import type {
    UseApiActionContext,
} from "@modules/ai/balancer/types/use-api"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    OpenAIEmbeddings,
} from "@langchain/openai"
import {
    GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai"
import {
    OllamaEmbeddings,
} from "@langchain/community/embeddings/ollama"
import {
    UnsupportedEmbeddingProviderException,
} from "@modules/platform/exceptions/errors/ai/unsupported-embedding-provider"

type EmbeddingCategory = AiModelCategory.EmbeddingLocal | AiModelCategory.EmbeddingCloud

/**
 * LangChain-facing adapter whose SDK work is deliberately deferred until
 * `embedDocuments` / `embedQuery`. Qdrant receives this stable object, while
 * every actual provider request still runs inside the production balancer
 * action and can therefore rotate keys or fall through to another model.
 */
class BalancerEmbeddings extends Embeddings {
    constructor(
        private readonly embedDocumentsAction: (documents: Array<string>) => Promise<Array<Array<number>>>,
        private readonly embedQueryAction: (document: string) => Promise<Array<number>>,
    ) {
        super({
        })
    }

    embedDocuments(documents: Array<string>): Promise<Array<Array<number>>> {
        return this.embedDocumentsAction(documents)
    }

    embedQuery(document: string): Promise<Array<number>> {
        return this.embedQueryAction(document)
    }
}

/**
 * `OllamaEmbeddings` hardcodes `maxConcurrency: 1` internally (fully
 * sequential embed calls) unless overridden. For any bulk embed job (e.g. the
 * lesson RAG index -- hundreds of lessons split into thousands of chunks),
 * strictly sequential requests at ~300-500ms each take tens of minutes and
 * can outlast every downstream client timeout. The local Ollama host (RTX
 * 5060) comfortably serves several concurrent small embed requests, so raise
 * this to parallelize the embed phase.
 */
const OLLAMA_EMBED_MAX_CONCURRENCY = 8

@Injectable()
/**
 * Service for getting embedding models.
 *
 * Two ways to obtain an {@link Embeddings} client:
 *
 * - {@link EmbeddingModelService.get} -- synchronous, pins an exact
 *   `{ model, provider }` and resolves the key from the provider pool file
 *   directly (first key). Used by the grading RAG stack (which passes the
 *   embedder straight into `QdrantVectorStore.fromDocuments`).
 * - {@link EmbeddingModelService.getViaBalancer} -- async, routes through the AI
 *   balancer's Auto lane (`task = embedding`, FREE floor). Picks the
 *   health/latency-ordered embedding model -- **local self-hosted first** when
 *   the GPU is up ($0), falling back to a cloud embedding model otherwise.
 */
export class EmbeddingModelService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly useApiService: UseApiService,
    ) {}

    /**
     * Get an embedding model for an exact `{ model, provider }` (synchronous).
     *
     * Resolves the provider key from the same newline-separated pool file the AI
     * balancer uses (first key of the pool) -- NOT the legacy single-key mount --
     * so there is one key file per provider across the whole app.
     *
     * @param params - The exact model + provider to build.
     * @returns The LangChain {@link Embeddings} client.
     */
    get(
        {
            model,
            provider,
        }: GetEmbeddingModelParams,
    ): Embeddings {
        switch (provider) {
        /** OpenAI embedding model. */
        case ModelProvider.OpenAI: {
            return new OpenAIEmbeddings({
                model,
                apiKey: this.mountFilesystemService.openAiApiKeys()[0] ?? "",
            })
        }
        /** Gemini embedding model. */
        case ModelProvider.Gemini: {
            return new GoogleGenerativeAIEmbeddings({
                model,
                apiKey: this.mountFilesystemService.geminiApiKeys()[0] ?? "",
            })
        }
        /** Local (self-hosted Ollama) embedding model -- runs on our own GPU at $0. */
        case ModelProvider.Local: {
            return new OllamaEmbeddings({
                model,
                baseUrl: this.localOllamaBaseUrl(),
                maxConcurrency: OLLAMA_EMBED_MAX_CONCURRENCY,
                headers: this.localOllamaAuthHeaders(),
            })
        }
        default: {
            throw new UnsupportedEmbeddingProviderException({
                provider: String(provider),
            })
        }
        }
    }

    /**
     * Get an embedding model via the AI balancer's Auto lane.
     *
     * Routes `task = embedding` with a FREE floor through {@link UseApiService}
     * so the balancer's health/latency ordering picks the model: a healthy
     * self-hosted (Local) embedding model first (free, on our GPU), then climbing
     * to a cloud embedding model when the local host is down. The `action` builds
     * a lazy {@link Embeddings} adapter. The adapter runs the actual SDK
     * `embedDocuments` / `embedQuery` request inside the balancer action; merely
     * constructing a provider client cannot prove that provider is reachable.
     *
     * Use this for RAG indexing/retrieval that should follow the same local-first
     * fallback as the rest of the AI stack. Grading call sites that pin an exact
     * `{ model, provider }` keep using {@link EmbeddingModelService.get}.
     *
     * @returns A promise of the resolved {@link Embeddings} client (local-first).
     */
    async getViaBalancer(
        category: EmbeddingCategory
        = AiModelCategory.EmbeddingCloud,
    ): Promise<Embeddings> {
        return Promise.resolve(new BalancerEmbeddings(
            (documents) => this.embedDocumentsViaBalancer(
                documents,
                category,
            ),
            (document) => this.embedQueryViaBalancer(
                document,
                category,
            ),
        ))
    }

    /** Run one document batch inside the fallback action. */
    private async embedDocumentsViaBalancer(
        documents: Array<string>,
        category: EmbeddingCategory,
    ): Promise<Array<Array<number>>> {
        const { result } = await this.useApiService.useApi<Array<Array<number>>>({
            lane: "chain",
            task: AiModelTask.Embedding,
            // Two embedding lanes on the same axis: `embedding_local` (self-hosted
            // 8B, cost 0) for the platform's own corpus, `embedding_cloud` (billed
            // API) for a customer-uploaded document / learner code on demand. The
            // caller picks which; within the lane the cheapest model wins.
            categories: this.fallbackCategories(category),
            action: (context) => this.buildEmbeddings(context).embedDocuments(documents),
        })
        return result
    }

    /** Run one query embedding inside the fallback action. */
    private async embedQueryViaBalancer(
        document: string,
        category: EmbeddingCategory,
    ): Promise<Array<number>> {
        const { result } = await this.useApiService.useApi<Array<number>>({
            lane: "chain",
            task: AiModelTask.Embedding,
            categories: this.fallbackCategories(category),
            action: (context) => this.buildEmbeddings(context).embedQuery(document),
        })
        return result
    }

    /**
     * Interactive/customer RAG may try the zero-cost local model first and then
     * the width-compatible cloud model. Platform-owned bulk indexing explicitly
     * requests `EmbeddingLocal` and must never leak its corpus to cloud.
     */
    private fallbackCategories(category: EmbeddingCategory): Array<EmbeddingCategory> {
        return category === AiModelCategory.EmbeddingLocal
            ? [AiModelCategory.EmbeddingLocal]
            : [
                AiModelCategory.EmbeddingLocal,
                AiModelCategory.EmbeddingCloud,
            ]
    }

    /**
     * Build the per-provider {@link Embeddings} client from a balancer-resolved
     * action context. Mirrors the chat `buildClient` switch -- the balancer picks
     * the model/provider/key, this turns it into a LangChain embedder.
     *
     * @param context - The discriminated key/model context from the balancer.
     * @returns The matching {@link Embeddings} client.
     */
    private buildEmbeddings(context: UseApiActionContext): Embeddings {
        switch (context.provider) {
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible host (Ollama) -- native embeddings API
            return new OllamaEmbeddings({
                model: context.model,
                baseUrl: this.localOllamaBaseUrl(),
                maxConcurrency: OLLAMA_EMBED_MAX_CONCURRENCY,
                headers: this.authHeaders(context.key),
            })
        case ModelProvider.OpenAI:
            return new OpenAIEmbeddings({
                model: context.model,
                apiKey: context.key,
            })
        case ModelProvider.Gemini:
            return new GoogleGenerativeAIEmbeddings({
                model: context.model,
                apiKey: context.key,
            })
        default:
            // OpenRouter / Anthropic do not serve an embeddings endpoint here
            throw new UnsupportedEmbeddingProviderException({
                provider: String(context.provider),
            })
        }
    }

    /**
     * Ollama root base URL for {@link OllamaEmbeddings}. `envConfig().ai.local.baseUrl`
     * carries the `/v1` suffix for OpenAI-compatible chat; the native Ollama
     * embeddings API wants the root (`http://localhost:11434`), so strip `/v1`.
     *
     * @returns The Ollama server root URL (no `/v1`).
     */
    private localOllamaBaseUrl(): string {
        return envConfig().ai.local.baseUrl.replace(
            /\/v1$/,
            "",
        )
    }

    /**
     * Bearer-auth header for the Local (self-hosted Ollama) provider -- resolves the
     * token from the SAME key pool the chat lane's `Authorization: Bearer <token>`
     * uses. Local dev's Ollama is ungated (any token is harmless there), but prod
     * reaches Ollama through a Cloudflare-tunneled gate that rejects unauthenticated
     * requests -- `OllamaEmbeddings` talks to the native `/api/embed` endpoint
     * directly (not through `ChatOpenAI`), so it needs this header wired explicitly.
     *
     * @returns `{ Authorization: "Bearer <token>" }` for the first pooled key.
     */
    private localOllamaAuthHeaders(): Record<string, string> {
        return this.authHeaders(this.mountFilesystemService.localApiKeys()[0] ?? "")
    }

    /**
     * Build the Bearer-auth header for a resolved Local-provider token.
     *
     * @param token - The acquired token (empty when no key is configured).
     * @returns The header map to pass as `OllamaEmbeddings.headers`.
     */
    private authHeaders(token: string): Record<string, string> {
        return {
            Authorization: `Bearer ${token}`,
        }
    }
}
