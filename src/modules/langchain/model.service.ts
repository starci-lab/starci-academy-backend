import {
    Injectable,
} from "@nestjs/common"
import {
    GetEmbeddingModelParams 
} from "./types"
import {
    ModelProvider 
} from "@modules/databases"
import {
    MountStorageService 
} from "@modules/filesystem"
import {
    ChatOpenAI 
} from "@langchain/openai"
import {
    ChatGoogleGenerativeAI,
} from "@langchain/google-genai"

        
/**
 * Service for getting models.
 */
@Injectable()
export class ModelService {
    constructor(
        private readonly mountStorageService: MountStorageService,
    ) {}

    /**
     * Get the model for the given context.
     * @param context - The context of the step.
     * @returns A promise that resolves when the model is retrieved.
     */
    get(
        {
            model,
            provider,
        }: GetEmbeddingModelParams,
    ): ChatOpenAI | ChatGoogleGenerativeAI {
        switch (provider) {
        /** OpenAI embedding model. */
        case ModelProvider.OpenAI: {
            return new ChatOpenAI(
                {
                    model,
                    apiKey: this.mountStorageService.openAiApiKey,
                }
            )
        }
        /** Gemini embedding model. */
        case ModelProvider.Gemini: {
            return new ChatGoogleGenerativeAI(
                {
                    model,
                    apiKey: this.mountStorageService.geminiApiKey,
                }
            )
        }
        /** Any other provider (e.g. self-hosted Local) is not wired here yet. */
        default: {
            throw new Error(
                `Unsupported chat model provider: ${String(provider)}`,
            )
        }
        }
    }
}