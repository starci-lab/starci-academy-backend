import {
    Injectable,
} from "@nestjs/common"
import {
    GetEmbeddingModelParams,
} from "./types"
import {
    Embeddings,
} from "@langchain/core/embeddings"
import {
    AiMode,
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import {
    UseApiService,
} from "@modules/ai"
import type {
    UseApiActionContext,
} from "@modules/ai"
import {
    envConfig,
} from "@modules/env"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    OpenAIEmbeddings,
} from "@langchain/openai"
import {
    GoogleGenerativeAIEmbeddings,
} from "@langchain/google-genai"
import {
    OllamaEmbeddings,
} from "@langchain/community/embeddings/ollama"

/**
 * Service for getting embedding models.
 *
 * Two ways to obtain an {@link Embeddings} client:
 *
 * - {@link EmbeddingModelService.get} — synchronous, pins an exact
 *   `{ model, provider }` and resolves the key from the provider pool file
 *   directly (first key). Used by the grading RAG stack (which passes the
 *   embedder straight into `QdrantVectorStore.fromDocuments`).
 * - {@link EmbeddingModelService.getViaBalancer} — async, routes through the AI
 *   balancer's Auto lane (`task = embedding`, FREE floor). Picks the
 *   health/latency-ordered embedding model — **local self-hosted first** when
 *   the GPU is up ($0), falling back to a cloud embedding model otherwise.
 */
@Injectable()
export class EmbeddingModelService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly useApiService: UseApiService,
    ) {}

    /**
     * Get an embedding model for an exact `{ model, provider }` (synchronous).
     *
     * Resolves the provider key from the same newline-separated pool file the AI
     * balancer uses (first key of the pool) — NOT the legacy single-key mount —
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
        /** Local (self-hosted Ollama) embedding model — runs on our own GPU at $0. */
        case ModelProvider.Local: {
            return new OllamaEmbeddings({
                model,
                baseUrl: this.localOllamaBaseUrl(),
            })
        }
        default: {
            throw new Error(`Unsupported provider: ${provider}`)
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
     * the per-provider {@link Embeddings} client from the discriminated context
     * the balancer hands back and returns it as the result.
     *
     * Use this for RAG indexing/retrieval that should follow the same local-first
     * fallback as the rest of the AI stack. Grading call sites that pin an exact
     * `{ model, provider }` keep using {@link EmbeddingModelService.get}.
     *
     * @returns A promise of the resolved {@link Embeddings} client (local-first).
     */
    async getViaBalancer(): Promise<Embeddings> {
        const { result } = await this.useApiService.useApi<Embeddings>({
            lane: AiMode.Auto,
            task: AiModelTask.Embedding,
            // FREE floor — prefer the $0 self-hosted embedding model; the Auto
            // chain climbs to a cloud embedding model only when it is unavailable.
            categories: [
                AiModelCategory.Free,
                AiModelCategory.Economy,
            ],
            // build (not invoke): hand back the embeddings client the resolved
            // provider/key/model selects. Per-call key rotation is sacrificed for
            // a long-lived client the vector store can reuse.
            action: (context) => Promise.resolve(this.buildEmbeddings(context)),
        })
        return result
    }

    /**
     * Build the per-provider {@link Embeddings} client from a balancer-resolved
     * action context. Mirrors the chat `buildClient` switch — the balancer picks
     * the model/provider/key, this turns it into a LangChain embedder.
     *
     * @param context - The discriminated key/model context from the balancer.
     * @returns The matching {@link Embeddings} client.
     */
    private buildEmbeddings(context: UseApiActionContext): Embeddings {
        switch (context.provider) {
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible host (Ollama) — native embeddings API
            return new OllamaEmbeddings({
                model: context.model,
                baseUrl: this.localOllamaBaseUrl(),
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
            throw new Error(`Unsupported embedding provider: ${context.provider}`)
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
}
