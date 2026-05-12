import {
    ModelProvider
} from "@modules/databases"
import {
    MountStorageService
} from "@modules/filesystem"
import {
    Injectable
} from "@nestjs/common"

/**
 * Service for getting AI secrets.
 */
@Injectable()
export class AISecretService {
    public constructor(
        private readonly mountStorageService: MountStorageService,
    ) { }

    /**
     * Get the secret for the given model.
     * @param model - The model to get the secret for.
     * @returns The secret for the given model.
     */
    public async get(
        model: ModelProvider,
    ): Promise<string> {
        switch (model) {
        case ModelProvider.OpenAI:
            return this.mountStorageService.openAiApiKey
        case ModelProvider.Gemini:
            return this.mountStorageService.geminiApiKey
        default:
            throw new Error(`Unsupported model: ${model}`)
        }
    }
}