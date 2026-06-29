import {
    AiModelLatencyCacheService,
    AiPingCacheService,
    isPingEntryEligible,
} from "@modules/cache"
import {
    AiMode,
    AiModelCategory,
    AiModelTask,
    ModelProvider,
} from "@modules/databases"
import type {
    AiModelEntity,
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
    ChatOpenAI,
} from "@langchain/openai"
import {
    ChatGoogleGenerativeAI,
} from "@langchain/google-genai"
import {
    ChatAnthropic,
} from "@langchain/anthropic"
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
    AnthropicApiKey,
    GeminiApiKey,
    LocalApiKey,
    OpenAiApiKey,
    OpenRouterApiKey,
    ProbeModelParams,
    ProbeModelResult,
    UseApiAction,
    UseApiActionContext,
    UseApiAutoParams,
    UseApiByokParams,
    UseApiParams,
    UseApiPremiumParams,
    UseApiResult,
} from "./types"

/** Category ladder cheapest → strongest — the macro fallback order. */
const CATEGORY_RANK: ReadonlyArray<AiModelCategory> = [
    AiModelCategory.Free,
    AiModelCategory.Economy,
    AiModelCategory.Balanced,
    AiModelCategory.Premium,
    AiModelCategory.Frontier,
]

/**
 * How long a per-model latency probe stays trusted by the Auto chain. Beyond
 * this the snapshot is ignored (advisory only) and the static order stands, so
 * a stale "down" can never permanently bury a recovered model.
 */
const LATENCY_FRESHNESS_MS = 5 * 60_000

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
        private readonly aiModelLatencyCacheService: AiModelLatencyCacheService,
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
        task,
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
        // when a `categories` chain is given it is ORDERED (floor → tier ceiling):
        // try each category in chain order (climb on exhaustion), and within a
        // category try the highest-`weight` model first.
        const ordered = categories
            ? catalog
                .filter((row) => categories.includes(row.category))
                .sort((left, right) => {
                    const leftRank = categories.indexOf(left.category)
                    const rightRank = categories.indexOf(right.category)
                    if (leftRank !== rightRank) {
                        return leftRank - rightRank
                    }
                    return right.weight - left.weight
                })
            : catalog
        // task-filter: the Auto chain only considers models suited for this task
        // (chat → chatting, grade → grading). A model with no `supportedTasks`
        // (stale seed) is kept (back-compat). Unset task → every model.
        const taskFiltered = task
            ? ordered.filter(
                (row) => !row.supportedTasks?.length
                    || row.supportedTasks.includes(task),
            )
            : ordered
        // health/latency-aware reorder WITHIN each category (advisory): push
        // probe-"down" models to the back of their tier; for chat, fastest first.
        const models = await this.orderByHealthAndLatency(
            taskFiltered,
            categories,
            task,
        )
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
     * Reorder the Auto chain using the per-model latency probe (ADVISORY). The
     * macro category/priority order is preserved; only WITHIN each category does
     * it (a) push probe-"down" models to the back of their tier, and (b) for
     * chatting, put the lowest-latency models first. Stale / unprobed models keep
     * their static position — the probe never hard-excludes, so the original
     * order is always the safe fallback (e.g. when the whole tier is "down").
     *
     * @param models - the task-filtered chain (already in category-chain order).
     * @param categories - the entitlement chain order (else the category ladder).
     * @param task - chat → latency-first; grading keeps weight order.
     * @returns the reordered chain.
     */
    private async orderByHealthAndLatency(
        models: Array<AiModelEntity>,
        categories: Array<AiModelCategory> | undefined,
        task: AiModelTask | undefined,
    ): Promise<Array<AiModelEntity>> {
        if (models.length <= 1) {
            return models
        }

        const snapshot = await this.aiModelLatencyCacheService.getAll()
        const now = Date.now()
        // a probe entry is trusted only while fresh (advisory window)
        const freshEntry = (name: string) => {
            const entry = snapshot[name]
            if (!entry) {
                return undefined
            }
            const age = now - Date.parse(entry.checkedAt)
            return Number.isFinite(age) && age <= LATENCY_FRESHNESS_MS
                ? entry
                : undefined
        }
        // macro order key — entitlement chain order, else the category ladder
        const rankOf = (row: AiModelEntity): number => categories
            ? categories.indexOf(row.category)
            : CATEGORY_RANK.indexOf(row.category)
        // original index = the static within-category order (weight / priority)
        const baseIndex = new Map<AiModelEntity, number>(
            models.map((row, index) => [
                row,
                index,
            ]),
        )
        const downRank = (row: AiModelEntity): number => {
            const entry = freshEntry(row.name)
            return entry && !entry.ok ? 1 : 0
        }
        const latencyOf = (row: AiModelEntity): number => {
            const entry = freshEntry(row.name)
            return entry && entry.ok ? entry.latencyMs : Number.POSITIVE_INFINITY
        }

        return [
            ...models,
        ].sort((left, right) => {
            // keep the macro category order intact (never reorder across tiers)
            const rankDelta = rankOf(left) - rankOf(right)
            if (rankDelta !== 0) {
                return rankDelta
            }
            // within a tier: healthy (up / unprobed) before fresh-"down"
            const downDelta = downRank(left) - downRank(right)
            if (downDelta !== 0) {
                return downDelta
            }
            // chat is latency-sensitive → fastest first; grading keeps weight order
            if (task === AiModelTask.Chatting) {
                const latencyDelta = latencyOf(left) - latencyOf(right)
                if (latencyDelta !== 0) {
                    return latencyDelta
                }
            }
            // tiebreak: preserve the original (weight / priority) order
            return (baseIndex.get(left) ?? 0) - (baseIndex.get(right) ?? 0)
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
     * Probe ONE specific model with a minimal 1-token completion to measure
     * round-trip latency + up/down. For the public status page / realtime
     * dashboard — a SEPARATE layer from the per-provider key ping that feeds
     * balancer eligibility.
     *
     * Unlike {@link useApi} this does NOT climb the model fallback chain (we want
     * this exact model) and does NOT mutate the ping cache (status/UI only —
     * a slow/failing probe must not penalize the key pool). One key is acquired
     * for the provider (so we hit the same pool a real call would); when none is
     * eligible the model is reported down.
     *
     * @param params - The provider, model, and per-probe timeout.
     * @returns Timing outcome: `{ ok, latencyMs, errorMessage }`.
     *
     * @example
     * const { ok, latencyMs } = await useApiService.probeModel({
     *     provider: ModelProvider.Local,
     *     model: "qwen2.5-coder:7b",
     *     timeoutMs: 8000,
     * })
     */
    async probeModel(
        {
            provider,
            model,
            timeoutMs,
        }: ProbeModelParams,
    ): Promise<ProbeModelResult> {
        // make sure the key pools are loaded before we try to acquire one
        await this.keyStoreService.ensureLoaded()

        // acquire one key for the provider — same pool a real call would use.
        // null = no eligible key right now → the model is effectively down for us
        const acquired = await this.tryAcquire(provider)
        if (!acquired) {
            return {
                ok: false,
                latencyMs: 0,
                errorMessage: "No eligible key for provider",
            }
        }

        // build the provider client for THIS exact model + acquired key
        const chatModel = this.buildProbeClient({
            provider,
            model,
            apiKey: acquired.value,
        })

        // time the round-trip with Date.now() around a 1-token completion;
        // AbortSignal.timeout enforces the hard per-probe budget (fail fast)
        const startedAt = Date.now()
        try {
            // minimal prompt + maxTokens:1 — cheapest call that still exercises
            // the model end-to-end (auth, routing, inference)
            await chatModel.invoke(
                "ping",
                {
                    signal: AbortSignal.timeout(timeoutMs),
                },
            )
            // success → report the measured latency, no error
            return {
                ok: true,
                latencyMs: Date.now() - startedAt,
                errorMessage: null,
            }
        } catch (err) {
            // failure (timeout / auth / network) → record down with a short reason;
            // intentionally do NOT touch the ping cache (status-only layer)
            const error = err instanceof Error ? err : new Error(String(err))
            return {
                ok: false,
                latencyMs: Date.now() - startedAt,
                errorMessage: error.message,
            }
        }
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
        case ModelProvider.OpenRouter:
            return {
                provider: ModelProvider.OpenRouter,
                key: key as OpenRouterApiKey,
                model,
            }
        case ModelProvider.Anthropic:
            return {
                provider: ModelProvider.Anthropic,
                key: key as AnthropicApiKey,
                model,
            }
        default:
            throw new UnsupportedAiProviderException({
                provider: provider as string,
            })
        }
    }

    /**
     * Build a minimal LangChain chat client for a latency probe. Mirrors the
     * per-provider client construction in `AiInvokeService.buildClient` (same
     * base URLs for Local / OpenRouter) but pins `maxTokens: 1` + `temperature: 0`
     * so the probe is the cheapest call that still exercises the model.
     *
     * Kept inside {@link UseApiService} (not reusing the private `buildContext`,
     * which only yields the discriminated context, not a chat client) so the
     * probe lives next to key acquisition.
     *
     * @param params - The resolved provider, model name, and acquired key.
     * @returns A provider-specific chat model wired with the given key.
     * @throws UnsupportedAiProviderException when the provider has no client.
     */
    private buildProbeClient(
        {
            provider,
            model,
            apiKey,
        }: {
            provider: ModelProvider
            model: string
            apiKey: string
        },
    ): ChatOpenAI | ChatGoogleGenerativeAI | ChatAnthropic {
        switch (provider) {
        case ModelProvider.OpenAI:
            // native OpenAI — cap via `max_completion_tokens` (newer models e.g. gpt-5.x
            // REJECT `max_tokens`); omit temperature (some models only allow the default)
            return new ChatOpenAI({
                model,
                apiKey,
                modelKwargs: {
                    max_completion_tokens: 1,
                },
            })
        case ModelProvider.Gemini:
            // Google Gemini — `maxOutputTokens` is the Gemini-side cap name
            return new ChatGoogleGenerativeAI({
                model,
                apiKey,
                maxOutputTokens: 1,
            })
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible endpoint (Ollama / vLLM / LM Studio):
            // reuse ChatOpenAI pointed at the local baseURL; key is a placeholder
            return new ChatOpenAI({
                model,
                apiKey,
                maxTokens: 1,
                configuration: {
                    baseURL: envConfig().ai.local.baseUrl,
                },
            })
        case ModelProvider.OpenRouter:
            // OpenRouter aggregator gateway (OpenAI-compatible) with the pooled key
            return new ChatOpenAI({
                model,
                apiKey,
                maxTokens: 1,
                configuration: {
                    baseURL: envConfig().ai.openrouter.baseUrl,
                },
            })
        case ModelProvider.Anthropic:
            // native Anthropic Claude — only model + key + maxTokens; setting temperature
            // here made the SDK send an invalid `top_p: -1`, so omit it
            return new ChatAnthropic({
                model,
                apiKey,
                maxTokens: 1,
            })
        default:
            // unknown provider has no client wiring → typed failure
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
