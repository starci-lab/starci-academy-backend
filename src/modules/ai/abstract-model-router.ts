import {
    ModelProvider,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    AiPingService,
} from "./ping.service"
import {
    modelTierMatrix,
} from "./model-tier"
import {
    AiTaskKind,
    ModelChoice,
    ModelRecommendation,
} from "./types/model"

/**
 * Abstract base class for AI model routers.
 *
 * Provides:
 * - Tier-based model selection from {@link modelTierMatrix}
 * - Provider availability tracking with reactive `failure()` + proactive cron re-check
 * - Automatic fallback to the next provider in the chain
 *
 * Subclasses must set {@link taskKind} and call {@link resolve} on init.
 */
export abstract class AbstractModelRouterService {
    /** Current active model name (e.g. "gpt-4o-mini"). */
    public model: string
    /** Current active provider. */
    public provider: ModelProvider

    /** Providers marked unavailable (quota exhausted, auth error, etc.). */
    protected readonly unavailable = new Set<ModelProvider>()

    /** Which task kind this router serves — determines the tier matrix row. */
    protected abstract readonly taskKind: AiTaskKind

    constructor(
        protected readonly winstonService: WinstonService,
        protected readonly aiPingService: AiPingService,
    ) { }

    /**
     * Resolve the current tier from env and pick the first available model.
     * Called on init and on cron re-check.
     */
    resolve(): void {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation
        const chain = modelTierMatrix[this.taskKind][tier]
            ?? modelTierMatrix[this.taskKind][ModelRecommendation.Low]

        const chosen = this.pickAvailable(chain)
        if (chosen) {
            this.model = chosen.model
            this.provider = chosen.provider
        } else {
            /** All providers unavailable — force first in chain and hope for the best. */
            this.model = chain[0].model
            this.provider = chain[0].provider
        }

        this.winstonService.log(
            WinstonLog.AiModelRouterResolved,
            {
                taskKind: this.taskKind,
                model: this.model,
                provider: this.provider,
                tier,
            },
        )
    }

    /**
     * Reactive failure handler — call this when a real AI request
     * returns a quota/rate-limit error (HTTP 429 or provider-specific).
     *
     * Marks the provider as unavailable and immediately switches
     * to the next fallback in the chain.
     */
    failure(provider: ModelProvider): void {
        this.unavailable.add(provider)
        this.winstonService.log(
            WinstonLog.AiModelRouterFailure,
            {
                taskKind: this.taskKind,
                provider,
            },
        )
        this.resolve()
    }

    /**
     * Proactive quota check — pings every provider in the current tier's
     * fallback chain using native SDKs (zero or minimal token cost).
     *
     * - If the ping succeeds → provider is available (removed from unavailable set)
     * - If the ping fails → provider stays/becomes unavailable
     *
     * After checking all providers, re-resolves to pick the best available model.
     * Called from a cron job in concrete subclasses.
     */
    async checkQuota(): Promise<void> {
        const tier = envConfig().ai.modelRecommendation as ModelRecommendation
        const chain = modelTierMatrix[this.taskKind][tier]
            ?? modelTierMatrix[this.taskKind][ModelRecommendation.Low]

        /** Collect unique providers from the fallback chain. */
        const providers = [...new Set(chain.map((c) => c.provider))]

        for (const provider of providers) {
            const ok = await this.aiPingService.ping(provider)
            if (ok) {
                this.unavailable.delete(provider)
            } else {
                this.unavailable.add(provider)
                this.winstonService.log(
                    WinstonLog.AiModelRouterFailure,
                    {
                        taskKind: this.taskKind,
                        provider,
                    },
                )
            }
        }

        this.resolve()
    }

    /**
     * Get the current model choice as a {@link ModelChoice} object.
     */
    get current(): ModelChoice {
        return {
            model: this.model,
            provider: this.provider,
        }
    }

    /**
     * Pick the first available model from the fallback chain.
     */
    private pickAvailable(
        chain: Array<ModelChoice>,
    ): ModelChoice | undefined {
        return chain.find(
            (choice) => !this.unavailable.has(choice.provider),
        )
    }
}
