import {
    AiPingCacheService,
    isPingEntryEligible,
} from "@modules/cache"
import {
    AiMode,
    ModelProvider,
} from "@modules/databases"
import {
    envConfig,
} from "@modules/env"
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
    Injectable,
} from "@nestjs/common"
import {
    AiModelCatalogService,
} from "./ai-model-catalog.service"
import {
    AiBalancerService,
} from "./ai-balancer.service"
import {
    KeyStoreService,
} from "./key-store.service"
import {
    AiErrorKind,
} from "./enums"
import {
    classifyAiError,
    extractRetryAfterMs,
} from "./utils/classify-ai-error"
import type {
    AcquireKeyResult,
    GeminiApiKey,
    LocalApiKey,
    OpenAiApiKey,
    UseApiAction,
    UseApiActionContext,
    UseApiAutoParams,
    UseApiByokParams,
    UseApiParams,
    UseApiPremiumParams,
    UseApiResult,
} from "./types"

/**
 * High-level AI invoke wrapper — routes pooled keys through round-robin and
 * persists every success/failure into {@link AiPingCacheService} so the next
 * request skips unhealthy keys and admin UI stays in sync.
 */
@Injectable()
export class UseApiService {
    constructor(
        private readonly aiModelCatalogService: AiModelCatalogService,
        private readonly aiBalancerService: AiBalancerService,
        private readonly aiPingCacheService: AiPingCacheService,
        private readonly keyStoreService: KeyStoreService,
        private readonly winstonService: WinstonService,
    ) { }

    /**
     * Single entry point — dispatch to the right lane implementation by `lane`.
     *
     * @param params - Discriminated lane params (auto / premium / byok).
     * @returns The action result plus which model/provider/attempts served it.
     */
    async useApi<TResult>(
        params: UseApiParams<TResult>,
    ): Promise<UseApiResult<TResult>> {
        // route by lane — each lane has different fallback / rotation semantics
        switch (params.lane) {
        case AiMode.Byok:
            return this.runByok(params)
        case AiMode.Premium:
            return this.runPremium(params)
        default:
            return this.runAuto(params)
        }
    }

    /**
     * Auto lane — model fallback chain, round-robin keys, cache update on every
     * failure, retry until {@link envConfig().aiBalancer.maxAutoAttempts}.
     */
    private async runAuto<TResult>({
        action,
        category,
        categories,
        model: selectedModel,
        provider: selectedProvider,
    }: UseApiAutoParams<TResult>): Promise<UseApiResult<TResult>> {
        await this.keyStoreService.ensureLoaded()

        // `categories` (the entitled tier set) climbs low→high by priority within
        // entitlement; otherwise fall back to the single-category filter. enabledModels
        // is ordered by priority DESC, so the filtered list is already Free → Economy
        // → Balanced → Premium order.
        const catalog = await this.aiModelCatalogService.enabledModels(
            categories ? {
            } : {
                category 
            },
        )
        const models = categories
            ? catalog.filter((row) => categories.includes(row.category))
            : catalog
        const maxAttempts = envConfig().aiBalancer.maxAutoAttempts

        let attempts = 0
        let lastError: Error | undefined

        while (attempts < maxAttempts) {
            // track per-pass progress — if a full sweep over `models` finds no
            // eligible key (e.g. every key flagged unhealthy in the ping cache),
            // there is nothing left to try and looping again would spin forever.
            let madeProgress = false

            for (const model of models) {
                if (
                    selectedModel
                    && selectedProvider
                    && (model.name !== selectedModel
                        || model.provider !== selectedProvider)
                ) {
                    continue
                }

                const eligibleCount = await this.countEligibleKeys(model.provider)
                if (eligibleCount === 0) {
                    continue
                }

                madeProgress = true

                for (let i = 0; i < eligibleCount; i++) {
                    if (attempts >= maxAttempts) {
                        break
                    }

                    attempts++
                    const acquired = await this.tryAcquire(model.provider)
                    if (!acquired) {
                        lastError = new NoActiveBalancerKeyException({
                            provider: model.provider,
                            totalKeysCount: eligibleCount,
                        })
                        break
                    }

                    const outcome = await this.invokeWithCache({
                        provider: model.provider,
                        key: acquired.value,
                        model: model.name,
                        action,
                    })

                    if (outcome.ok) {
                        return {
                            result: outcome.result,
                            model: model.name,
                            provider: model.provider,
                            attempts,
                        }
                    }

                    lastError = outcome.error
                    // prompt/content/abort fault — another key won't help, surface now
                    if (outcome.kind === AiErrorKind.NonKey) {
                        throw outcome.error
                    }
                }
            }

            // a full sweep produced no eligible key — all models are exhausted,
            // so stop here instead of re-scanning the same empty pools forever.
            if (!madeProgress) {
                break
            }
        }

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
     * Premium lane — user-selected model only (no model fallback). Keys still
     * rotate round-robin; each failure updates cache; throws when exhausted.
     */
    private async runPremium<TResult>({
        action,
        category,
        model: selectedModel,
        provider: selectedProvider,
    }: UseApiPremiumParams<TResult>): Promise<UseApiResult<TResult>> {
        await this.keyStoreService.ensureLoaded()

        // a user-PINNED model wins over the category filter: the picker already gated it
        // by availability and the lane itself is entitlement-gated, so search the FULL
        // enabled catalog. The category filter only picks the default model when none is
        // pinned. Without this, pinning a model whose category differs from the tier's top
        // category (e.g. gpt-4o = "balanced" graded on a Premium tier whose best category
        // is "premium") throws `Unsupported AI provider` even though the model is enabled.
        const catalog = await this.aiModelCatalogService.enabledModels(
            selectedModel && selectedProvider
                ? {
                }
                : {
                    category 
                },
        )
        const target = this.resolvePremiumModel(
            catalog,
            selectedModel,
            selectedProvider,
        )

        const eligibleCount = await this.countEligibleKeys(target.provider)
        if (eligibleCount === 0) {
            throw new NoActiveBalancerKeyException({
                provider: target.provider,
                totalKeysCount: this.keyStoreService.getPool(target.provider).length,
            })
        }

        let attempts = 0
        let lastError: Error | undefined

        for (let i = 0; i < eligibleCount; i++) {
            attempts++
            const acquired = await this.tryAcquire(target.provider)
            if (!acquired) {
                break
            }

            const outcome = await this.invokeWithCache({
                provider: target.provider,
                key: acquired.value,
                model: target.name,
                action,
            })

            if (outcome.ok) {
                return {
                    result: outcome.result,
                    model: target.name,
                    provider: target.provider,
                    attempts,
                }
            }

            lastError = outcome.error
            // prompt/content/abort fault — another key won't help, surface now
            if (outcome.kind === AiErrorKind.NonKey) {
                throw outcome.error
            }
        }

        throw lastError ?? new NoActiveBalancerKeyException({
            provider: target.provider,
            totalKeysCount: eligibleCount,
        })
    }

    /**
     * BYOK lane — single invoke with the user's key. Failures propagate
     * immediately (no pooled cache update).
     */
    private async runByok<TResult>({
        action,
        provider,
        model,
        key,
    }: UseApiByokParams<TResult>): Promise<UseApiResult<TResult>> {
        const context = this.buildContext(
            provider,
            key,
            model,
        )
        const result = await action(context)
        return {
            result,
            model,
            provider,
            attempts: 1,
        }
    }

    /**
     * Run `action` once and mirror the outcome into Redis ping cache.
     */
    private async invokeWithCache<TResult>({
        provider,
        key,
        model,
        action,
    }: {
        provider: ModelProvider
        key: string
        model: string
        action: UseApiAction<TResult>
    }): Promise<
        | { ok: true, result: TResult }
        | { ok: false, error: Error, kind: AiErrorKind }
    > {
        try {
            const context = this.buildContext(
                provider,
                key,
                model,
            )
            const result = await action(context)
            await this.aiPingCacheService.recordKeySuccess({
                provider,
                key,
            })
            return {
                ok: true,
                result,
            }
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err))
            const kind = classifyAiError(error)
            // a non-key fault (prompt / content / abort) must NOT penalize the
            // key — and the caller stops retrying (other keys would fail too)
            if (kind !== AiErrorKind.NonKey) {
                // honor the provider's Retry-After on 429, else the class default
                const cooldownMs = kind === AiErrorKind.RateLimit
                    ? (extractRetryAfterMs(error) ?? this.cooldownMsFor(kind))
                    : this.cooldownMsFor(kind)
                await this.aiPingCacheService.recordKeyCooldown({
                    provider,
                    key,
                    cooldownMs,
                    disabled: kind === AiErrorKind.Auth,
                })
            }
            return {
                ok: false,
                error,
                kind,
            }
        }
    }

    /**
     * Cooldown window per error class. Auth uses the `disabled` flag instead, so
     * its numeric value is unused (0); rate-limit waits longer than a transient blip.
     */
    private cooldownMsFor(kind: AiErrorKind): number {
        switch (kind) {
        case AiErrorKind.RateLimit:
            return 60_000
        case AiErrorKind.Auth:
            return 0
        default:
            return 20_000
        }
    }

    /**
     * Providers that currently have at least one eligible (healthy) key. Drives
     * the model picker's "locked" state: a model whose provider is absent here
     * has no working key in the pool and is rendered locked (not selectable),
     * rather than failing only at call time with {@link NoActiveBalancerKeyException}.
     */
    async availableProviders(): Promise<Set<ModelProvider>> {
        await this.keyStoreService.ensureLoaded()
        const usable = new Set<ModelProvider>()
        for (const { provider } of this.keyStoreService.listProviders()) {
            if ((await this.countEligibleKeys(provider)) > 0) {
                usable.add(provider)
            }
        }
        return usable
    }

    /**
     * Count pool keys that are eligible right now — not hard-disabled and not
     * within their cooldown window (see {@link isPingEntryEligible}).
     */
    private async countEligibleKeys(provider: ModelProvider): Promise<number> {
        const pool = this.keyStoreService.getPool(provider)
        const providerCache = await this.aiPingCacheService.getProviderMap(provider)
        const now = new Date()
        return pool.filter(
            (key) => isPingEntryEligible(providerCache[key.value],
                now),
        ).length
    }

    /**
     * Resolve the single model row for premium — user pick wins, else highest priority in category.
     */
    private resolvePremiumModel(
        catalog: Awaited<ReturnType<AiModelCatalogService["enabledModels"]>>,
        selectedModel?: string,
        selectedProvider?: ModelProvider,
    ) {
        if (selectedModel && selectedProvider) {
            const found = catalog.find(
                (row) => row.name === selectedModel && row.provider === selectedProvider,
            )
            if (!found) {
                throw new UnsupportedAiProviderException({
                    provider: selectedProvider,
                })
            }
            return found
        }
        if (selectedModel) {
            const found = catalog.find((row) => row.name === selectedModel)
            if (!found) {
                throw new UnsupportedAiProviderException({
                    provider: "unknown",
                })
            }
            return found
        }
        const first = catalog[0]
        if (!first) {
            throw new AllModelsExhaustedException({
                attempts: 0,
                modelsTried: 0,
            })
        }
        return first
    }

    /**
     * Build the discriminated {@link UseApiActionContext} for a picked key.
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
        case ModelProvider.Local:
            return {
                provider: ModelProvider.Local,
                key: key as LocalApiKey,
                model,
            }
        default:
            throw new UnsupportedAiProviderException({
                provider: provider as string,
            })
        }
    }

    /**
     * Wrap {@link AiBalancerService.acquire} — returns null when no eligible key remains.
     */
    private async tryAcquire(
        provider: ModelProvider,
    ): Promise<AcquireKeyResult | null> {
        try {
            return await this.aiBalancerService.acquire({
                provider,
            })
        } catch {
            return null
        }
    }
}
