import {
    AiModelLatencyCacheService,
    AiPingCacheService,
    isPingEntryEligible,
} from "@modules/cache"
import {
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
    BuildProbeRequestParams,
    GeminiApiKey,
    InvokeWithCacheParams,
    LocalApiKey,
    OpenAiApiKey,
    OpenRouterApiKey,
    ProbeModelParams,
    ProbeModelResult,
    UseApiActionContext,
    UseApiAutoParams,
    UseApiParams,
    UseApiPremiumParams,
    UseApiResult,
} from "./types"

/** Category ladder cheapest -> strongest -- the macro fallback order. */
const CATEGORY_RANK: ReadonlyArray<AiModelCategory> = [
    AiModelCategory.Low,
    AiModelCategory.Medium,
    AiModelCategory.High,
]

/**
 * How long a per-model latency probe stays trusted by the Auto chain. Beyond
 * this the snapshot is ignored (advisory only) and the static order stands, so
 * a stale "down" can never permanently bury a recovered model.
 */
const LATENCY_FRESHNESS_MS = 5 * 60_000

@Injectable()
/**
 * High-level AI invoke wrapper -- routes pooled keys through round-robin and
 * persists every success/failure into {@link AiPingCacheService} so the next
 * request skips unhealthy keys and admin UI stays in sync.
 */
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
     * Single entry point -- dispatch to the right lane implementation by `lane`.
     *
     * @param params - Discriminated lane params (auto / premium).
     * @returns The action result plus which model/provider/attempts served it.
     */
    async useApi<TResult>(
        params: UseApiParams<TResult>,
    ): Promise<UseApiResult<TResult>> {
        // route by lane -- each lane has different fallback / rotation semantics
        switch (params.lane) {
        case "pinned":
            return this.runPremium(params)
        default:
            return this.runAuto(params)
        }
    }

    /**
     * Auto lane -- model fallback chain, round-robin keys, cache update on every
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

        // `categories` (the entitled tier set) climbs low->high by priority within
        // entitlement; otherwise fall back to the single-category filter. enabledModels
        // is ordered by priority DESC, so the filtered list is already Free -> Economy
        // -> Balanced -> Premium order.
        const catalog = await this.aiModelCatalogService.enabledModels(
            categories ? {
            } : {
                category
            },
        )
        // when a `categories` chain is given it is ORDERED (floor -> tier ceiling):
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
        // (chat -> chatting, grade -> grading). A model with no `supportedTasks`
        // (stale seed) is kept (back-compat). Unset task -> every model.
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
            // track per-pass progress -- if a full sweep over `models` finds no
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
                    // prompt/content/abort fault -- another key won't help, surface now
                    if (outcome.kind === AiErrorKind.NonKey) {
                        throw outcome.error
                    }
                }
            }

            // a full sweep produced no eligible key -- all models are exhausted,
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
     * it (a) push probe-"down" models to the back of their tier, (b) inside the
     * FREE tier put a healthy self-hosted (Local) model first -- $0 on our GPU, so
     * try it before any cloud free model -- and (c) for chatting, put the
     * lowest-latency models first. Stale / unprobed models keep
     * their static position -- the probe never hard-excludes, so the original
     * order is always the safe fallback (e.g. when the whole tier is "down").
     *
     * @param models - the task-filtered chain (already in category-chain order).
     * @param categories - the entitlement chain order (else the category ladder).
     * @param task - chat -> latency-first; grading keeps weight order.
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
        // macro order key -- entitlement chain order, else the category ladder
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
        // FREE tier is LOCAL-FIRST: a self-hosted (Local provider) model runs on our
        // own GPU at $0, so when it's healthy try it BEFORE any cloud free model --
        // then the chain climbs the rest by the usual latency/weight order ("local
        // first, then the best cloud model"). Only inside the Free category; paid tiers keep
        // weight order. A DOWN local already loses to a healthy cloud at `downRank`
        // above, so an offline GPU falls back to the cloud chain automatically.
        const freeLocalRank = (row: AiModelEntity): number =>
            row.category === AiModelCategory.Low
                && row.provider === ModelProvider.Local
                ? 0
                : 1

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
            // within the Free tier: a healthy local (self-hosted) model goes first
            const localDelta = freeLocalRank(left) - freeLocalRank(right)
            if (localDelta !== 0) {
                return localDelta
            }
            // chat is latency-sensitive -> fastest first; grading keeps weight order
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
     * Premium lane -- user-selected model only (no model fallback). Keys still
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
            // prompt/content/abort fault -- another key won't help, surface now
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
     * Run `action` once and mirror the outcome into Redis ping cache.
     */
    private async invokeWithCache<TResult>({
        provider,
        key,
        model,
        action,
    }: InvokeWithCacheParams<TResult>): Promise<
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
            // key -- and the caller stops retrying (other keys would fail too)
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
     * dashboard -- a SEPARATE layer from the per-provider key ping that feeds
     * balancer eligibility.
     *
     * Unlike {@link useApi} this does NOT climb the model fallback chain (we want
     * this exact model) and does NOT mutate the ping cache (status/UI only --
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

        // acquire one key for the provider -- same pool a real call would use.
        // null = no eligible key right now -> the model is effectively down for us
        const acquired = await this.tryAcquire(provider)
        if (!acquired) {
            return {
                ok: false,
                latencyMs: 0,
                errorMessage: "No eligible key for provider",
            }
        }

        // build the raw HTTP request for THIS exact model + acquired key. We hit the
        // provider endpoint DIRECTLY (no LangChain) so the HTTP STATUS CODE is the
        // verdict: a 2xx -- even an EMPTY / reasoning-truncated 1-token completion --
        // means the model is reachable + the key is valid. Only a non-2xx / network
        // failure is "down". (LangChain threw on empty completions, so reasoning
        // models -- which burn the 1-token budget on hidden reasoning, returning no
        // content -- were marked falsely down even though they serve fine.)
        const request = this.buildProbeRequest({
            provider,
            model,
            apiKey: acquired.value,
        })

        // time the round-trip; AbortSignal.timeout enforces the hard per-probe budget
        const startedAt = Date.now()
        try {
            const response = await fetch(
                request.url,
                {
                    method: "POST",
                    headers: request.headers,
                    body: JSON.stringify(request.body),
                    signal: AbortSignal.timeout(timeoutMs),
                },
            )
            const latencyMs = Date.now() - startedAt
            // 2xx -> reachable + authed (content is irrelevant for a liveness probe)
            if (response.ok) {
                return {
                    ok: true,
                    latencyMs,
                    errorMessage: null,
                }
            }
            // non-2xx -> down; surface the status CODE + provider error detail so the
            // reason is legible (401/403 bad key - 404 model gone - 429 throttled - 5xx)
            return {
                ok: false,
                latencyMs,
                errorMessage: `[${response.status}] ${await this.readProbeError(response)}`,
            }
        } catch (err) {
            // network failure or AbortSignal.timeout -> down with a short reason
            const error = err instanceof Error ? err : new Error(String(err))
            const reason = error.name === "TimeoutError" || error.name === "AbortError"
                ? `timeout after ${timeoutMs}ms`
                : error.message
            return {
                ok: false,
                latencyMs: Date.now() - startedAt,
                errorMessage: reason,
            }
        }
    }

    /**
     * Count pool keys that are eligible right now -- not hard-disabled and not
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
     * Resolve the single model row for premium -- user pick wins, else highest priority in category.
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
     * Build the RAW HTTP probe request for one model -- a minimal 1-token completion
     * POSTed DIRECTLY to the provider endpoint (no LangChain / SDK), so the caller
     * can read the HTTP STATUS CODE for up/down. Per provider: native OpenAI uses
     * `max_completion_tokens` (gpt-5.x reject `max_tokens`); the OpenAI-compatible
     * gateways (OpenRouter / Local) POST `/chat/completions`; Gemini hits
     * `:generateContent` with the key in the query string; Anthropic posts
     * `/v1/messages` with its versioned headers.
     *
     * @param params - The resolved provider, model name, and acquired key.
     * @returns `{ url, headers, body }` ready for `fetch`.
     * @throws UnsupportedAiProviderException when the provider has no endpoint.
     */
    private buildProbeRequest(
        {
            provider,
            model,
            apiKey,
        }: BuildProbeRequestParams,
    ): { url: string, headers: Record<string, string>, body: unknown } {
        // shared OpenAI-style chat body -- reused by every OpenAI-compatible gateway.
        // `tokens` defaults to 1 (cheapest possible probe) but REASONING-family
        // models (gpt-5.x native + OpenRouter reasoning routes) burn part of that
        // budget on hidden reasoning before emitting a single visible token -- with
        // `=1` they return a hard 400 ("could not finish the message") instead of an
        // empty 2xx, which falsely marks a live model DOWN. 16 is the community/
        // litellm-verified floor that lets reasoning finish before hitting the cap.
        const openAiBody = (
            capKey: "max_completion_tokens" | "max_tokens",
            tokens: number = 1,
        ) => ({
            model,
            messages: [
                {
                    role: "user",
                    content: "ping",
                },
            ],
            [capKey]: tokens,
        })
        switch (provider) {
        case ModelProvider.OpenAI:
            // native OpenAI -- `max_completion_tokens` (gpt-5.x reject `max_tokens`);
            // 16 tokens so reasoning-family models (gpt-5.4-nano/mini) clear their
            // hidden reasoning pass instead of false-DOWN-ing on a 1-token cap
            return {
                url: "https://api.openai.com/v1/chat/completions",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: openAiBody(
                    "max_completion_tokens",
                    16,
                ),
            }
        case ModelProvider.OpenRouter:
            // OpenRouter aggregator gateway (OpenAI-compatible) -- reasoning models
            // here also reject `max_tokens` AND need the same reasoning headroom,
            // so use `max_completion_tokens` with the same 16-token floor
            return {
                url: `${envConfig().ai.openrouter.baseUrl}/chat/completions`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: openAiBody(
                    "max_completion_tokens",
                    16,
                ),
            }
        case ModelProvider.Local:
            // self-hosted OpenAI-compatible endpoint (Ollama / vLLM) -- non-reasoning
            // models, `max_tokens`, 1 token is enough (cheapest probe)
            return {
                url: `${envConfig().ai.local.baseUrl}/chat/completions`,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: openAiBody("max_tokens"),
            }
        case ModelProvider.Gemini:
            // Google Gemini -- key in the query string, `maxOutputTokens` cap
            return {
                url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                headers: {
                    "Content-Type": "application/json",
                },
                body: {
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: "ping",
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: 1,
                    },
                },
            }
        case ModelProvider.Anthropic:
            // native Anthropic Claude -- versioned API, key in `x-api-key`
            return {
                url: "https://api.anthropic.com/v1/messages",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: {
                    model,
                    max_tokens: 1,
                    messages: [
                        {
                            role: "user",
                            content: "ping",
                        },
                    ],
                },
            }
        default:
            // unknown provider has no endpoint wiring -> typed failure
            throw new UnsupportedAiProviderException({
                provider: provider as string,
            })
        }
    }

    /**
     * Pull a short reason out of a non-2xx probe response -- the provider's
     * `{ error: { message } }` / `{ error }` / `{ message }` body, falling back to
     * the HTTP status text. Best-effort: a body that is not JSON just yields the
     * status text (never throws).
     *
     * @param response - The non-2xx `fetch` response.
     * @returns A short reason string for the down snapshot.
     */
    private async readProbeError(response: Response): Promise<string> {
        try {
            const data = await response.json() as {
                error?: { message?: string } | string
                message?: string
            }
            const error = data?.error
            if (typeof error === "string") {
                return error
            }
            if (error?.message) {
                return error.message
            }
            if (typeof data?.message === "string") {
                return data.message
            }
            return response.statusText || "request failed"
        } catch {
            return response.statusText || "request failed"
        }
    }

    /**
     * Wrap {@link AiBalancerService.acquire} -- returns null when no eligible key remains.
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
