import {
    Injectable,
} from "@nestjs/common"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    ModelProvider,
} from "@modules/databases"
import {
    AllModelsExhaustedException,
    NoActiveBalancerKeyException,
    UnsupportedAiProviderException,
} from "@modules/exceptions"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    KeyStatus,
} from "../enums"
import type {
    AcquireKeyResult,
    ClaudeApiKey,
    GeminiApiKey,
    OpenAiApiKey,
    UseApiActionContext,
    UseApiParams,
    UseApiResult,
} from "../types"
import {
    AiBalancerService,
} from "./ai-balancer.service"
import {
    KeyStoreService,
} from "./key-store.service"

/**
 * High-level wrapper that hides key rotation + model fallback from the caller.
 *
 * The flow for a single `useApi` call:
 *
 * 1. Read the AI catalog from `mountFilesystemService.appConfig().ai.models`,
 *    filter by `enabled` + (optional) `category`, sort by `priority` descending.
 * 2. For each model:
 *    a. Walk the provider's key pool — try one acquire per active key.
 *    b. Call the caller's `action(context)` with that key.
 *    c. Success → `markSuccess`, return.
 *    d. Failure → `markFailure` (counts toward auto-disable), try the next key.
 * 3. Pool exhausted → drop to the next model in the chain.
 * 4. Every model exhausted → throw {@link AllModelsExhaustedException}.
 *
 * Callers never see "no key for OpenAI" — they only see the final aggregate
 * exhaustion or the result. Use it whenever you want a "just give me a
 * working LLM call" semantic; use {@link AiBalancerService.acquire} directly
 * when you need to control the model yourself.
 *
 * @example
 * // any category — uses the highest-priority model first
 * const { result, model } = await useApiService.useApi<string>({
 *     action: async ({ key, model, provider }) => {
 *         const client = buildClient(provider, model, key)
 *         return (await client.invoke(prompt)).text
 *     },
 * })
 *
 * @example
 * // restrict to cheap models only
 * const { result } = await useApiService.useApi<string>({
 *     category: AiModelCategory.Economy,
 *     action: ({ key, model, provider }) => callLlm({ key, model, provider, prompt }),
 * })
 */
@Injectable()
export class UseApiService {
    constructor(
        private readonly mountFilesystemService: MountFilesystemService,
        private readonly aiBalancerService: AiBalancerService,
        private readonly keyStoreService: KeyStoreService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Run `action` against the highest-priority model + its key pool, falling
     * back through every model on exhaustion.
     *
     * @param params - the caller's worker callback
     * @returns Result + which `(model, provider)` finally served the request
     * @throws AllModelsExhaustedException when no key/model combination succeeds
     */
    async useApi<TResult>({
        action,
        category,
    }: UseApiParams<TResult>): Promise<UseApiResult<TResult>> {
        // build fallback chain — filtered by category when provided, sorted highest-priority first
        const {
            models: catalog,
        } = this.mountFilesystemService.appConfig().ai
        const models = catalog
            .filter((model) => model.enabled && (!category || model.category === category))
            .sort((prev, next) => next.priority - prev.priority)

        let attempts = 0
        let lastError: Error | undefined

        for (const model of models) {
            // count active keys for this model's provider — bounds the inner loop
            const activeKeys = this.keyStoreService
                .getPool(model.provider)
                .filter((key) => key.status === KeyStatus.Active)

            // try each active key at most once per model — rotator handles round-robin order
            for (let i = 0; i < activeKeys.length; i++) {
                attempts++

                // acquire next key — null = pool drained between iterations, drop to next model
                const acquired = await this.tryAcquire(model.provider)
                if (!acquired) {
                    lastError = new NoActiveBalancerKeyException({
                        provider: model.provider,
                        totalKeysCount: activeKeys.length,
                    })
                    break
                }

                // delegate to the caller; success ends the loop
                try {
                    const context = this.buildContext(
                        model.provider,
                        acquired.value,
                        model.name,
                    )
                    const result = await action(context)
                    this.aiBalancerService.markSuccess({
                        handle: acquired.handle,
                    })
                    return {
                        result,
                        model: model.name,
                        provider: model.provider,
                        attempts,
                    }
                } catch (err) {
                    // mark the key as failed (counts toward auto-disable) + try next key
                    lastError = err as Error
                    this.aiBalancerService.markFailure({
                        handle: acquired.handle,
                        reason: lastError.message,
                    })
                }
            }
        }

        // every model + every key failed
        this.winstonService.log(
            WinstonLog.AiBalancerNoActiveKey,
            {
                provider: "all",
                totalKeysCount: attempts,
            },
        )
        throw new AllModelsExhaustedException({
            attempts,
            modelsTried: models.length,
            originalError: lastError,
        })
    }

    /**
     * Build the discriminated {@link UseApiActionContext} for a picked key.
     *
     * Casts the raw string key into the right branded type per provider so
     * the action callback gets a strongly-typed `ctx.key` after narrowing
     * on `ctx.provider`.
     *
     * @throws Error when an unsupported provider is wired into the catalog
     */
    private buildContext(
        provider: ModelProvider,
        key: string,
        model: string,
    ): UseApiActionContext {
        switch (provider) {
        case ModelProvider.OpenAI:
            return {
                provider: ModelProvider.OpenAI,
                key: key as OpenAiApiKey,
                model,
            }
        case ModelProvider.Gemini:
            return {
                provider: ModelProvider.Gemini,
                key: key as GeminiApiKey,
                model,
            }
        case ModelProvider.Claude:
            return {
                provider: ModelProvider.Claude,
                key: key as ClaudeApiKey,
                model,
            }
        default:
            throw new UnsupportedAiProviderException({
                provider: provider as string,
            })
        }
    }

    /**
     * Wrap `AiBalancerService.acquire` to return `null` on pool-empty
     * instead of throwing — lets the loop decide control flow without an
     * uninitialised `let` + try/catch escape.
     *
     * Any other failure (network, Redis) is rethrown so it surfaces.
     */
    private async tryAcquire(
        provider: ModelProvider,
    ): Promise<AcquireKeyResult | null> {
        try {
            return await this.aiBalancerService.acquire({
                provider,
            })
        } catch {
            // pool drained between active-key count + acquire — caller drops to next model
            return null
        }
    }
}
