import {
    AxiosService
} from "@modules/axios"
import {
    ModelProvider,
} from "@modules/databases"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    Injectable,
} from "@nestjs/common"
import OpenAI from "openai"
import type {
    AxiosInstance
} from "axios"

/**
 * Lightweight ping service for AI providers.
 * Uses native SDKs / REST calls to check provider availability
 * with zero token usage.
 */
@Injectable()
export class AiPingService {
    private readonly axiosInstance: AxiosInstance
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly axiosService: AxiosService
    ) {
        this.axiosInstance = this.axiosService.create(
            {
                key: "gemini-pro",
            }
        )
    }

    /**
     * Ping a provider to check if it is responsive and has quota.
     * @param provider - The provider to ping.
     * @returns `true` if the provider responded successfully, `false` otherwise.
     */
    async ping(provider: ModelProvider): Promise<boolean> {
        switch (provider) {
        case ModelProvider.OpenAI:
            return this.pingOpenAi()
        case ModelProvider.Gemini:
            return this.pingGemini()
        default:
            return false
        }
    }

    /**
     * Ping OpenAI using the native SDK.
     * Uses `models.list()` — zero tokens, validates API key + quota.
     */
    private async pingOpenAi(): Promise<boolean> {
        try {
            const client = new OpenAI({
                apiKey: this.mountFilesystemService.openAiApiKey(),
            })
            const models = await client.models.list()
            return models.data.length > 0
        } catch {
            return false
        }
    }

    /**
     * Ping Gemini using the REST API.
     * Uses `listModels` — zero tokens, validates API key + quota.
     */
    private async pingGemini(): Promise<boolean> {
        try {
            const { data } = await this.axiosInstance.get(
                `https://generativelanguage.googleapis.com/v1beta/models?key=${this.mountFilesystemService.geminiApiKey()}`,
            )
            return Boolean(data.ok)
        } catch {
            return false
        }
    }
}
