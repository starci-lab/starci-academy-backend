import {
    Injectable,
} from "@nestjs/common"
import {
    GetEmbeddingModelParams 
} from "./types"
import {
    Embeddings 
} from "@langchain/core/embeddings"
import {
    ModelProvider
} from "@modules/databases"
import {
    MountFilesystemService
} from "@modules/filesystem"
import {
    OpenAIEmbeddings
} from "@langchain/openai"
import {
    GoogleGenerativeAIEmbeddings
} from "@langchain/google-genai"

/**
 * Service for getting embedding models.
 *
 * Resolves the provider key from the same newline-separated pool file the AI
 * balancer uses (first key of the pool) — NOT the legacy single-key mount —
 * so there is one key file per provider across the whole app.
 */
@Injectable()
export class EmbeddingModelService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
    ) {}

    /**
     * Get the embedding model for the given context.
     * @param context - The context of the step.
     * @returns A promise that resolves when the embedding model is retrieved.
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
        default: {
            throw new Error(`Unsupported provider: ${provider}`)
        }
        }
    }
}