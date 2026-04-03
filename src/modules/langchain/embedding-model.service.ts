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
    MountStorageService 
} from "@modules/filesystem"
import {
    OpenAIEmbeddings 
} from "@langchain/openai"
import {
    GoogleGenerativeAIEmbeddings 
} from "@langchain/google-genai"
        
/**
 * Service for getting embedding models.
 */
@Injectable()
export class EmbeddingModelService {
    constructor(
        private readonly mountStorageService: MountStorageService,
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
                apiKey: this.mountStorageService.openAiApiKey,
            })
        }
        /** Gemini embedding model. */
        case ModelProvider.Gemini: {
            return new GoogleGenerativeAIEmbeddings({
                model,
                apiKey: this.mountStorageService.geminiApiKey,
            })
        }
        default: {
            throw new Error(`Unsupported provider: ${provider}`)
        }
        }
    }
}