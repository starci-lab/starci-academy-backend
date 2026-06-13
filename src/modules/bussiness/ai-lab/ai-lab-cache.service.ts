import {
    createHash,
} from "node:crypto"
import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    AiLabRunEntity,
    AiLabRunStatus,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    CacheKey,
    CacheService,
} from "@modules/cache"
import type {
    ComputeInputHashParams,
    LookupCachedRunParams,
    LookupCachedRunResult,
    StoreCachedRunParams,
} from "./types"

/**
 * Two-tier cache for AI Lab playground runs: a Redis fast-path keyed by
 * `(playgroundId, userId, inputHash)` over the durable `ai_lab_runs` cold store
 * (whose unique constraint is the same triple). An identical re-run is served
 * from here instead of re-invoking the model.
 */
@Injectable()
export class AiLabCacheService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly cacheService: CacheService,
    ) { }

    /**
     * Compute the SHA-256 cache key for a run's inputs. The hash covers every
     * input that changes the output (prompts + sampling params + model +
     * provider) so two runs collide only when they would produce the same
     * answer.
     *
     * @param params - System / user prompts, params, model, provider.
     * @returns A 64-char hex digest used as the cache key.
     */
    computeInputHash(
        {
            systemPrompt,
            userPrompt,
            params,
            model,
            provider,
        }: ComputeInputHashParams,
    ): string {
        // serialize the full input set with stable key order so logically equal
        // runs produce an identical digest (JSON.stringify of a fixed-shape object)
        const canonical = JSON.stringify({
            systemPrompt: systemPrompt ?? "",
            userPrompt,
            // pull params fields out explicitly so undefined vs missing never differs
            temperature: params.temperature ?? null,
            topP: params.topP ?? null,
            maxTokens: params.maxTokens ?? null,
            model,
            provider,
        })
        // hex digest keeps the value safe as both a Redis key suffix and a varchar(64)
        return createHash("sha256")
            .update(canonical)
            .digest("hex")
    }

    /**
     * Look up a cached run by `(playgroundId, userId, inputHash)`. Tries the
     * Redis fast-path first, then falls back to the durable cold store and
     * re-warms Redis on a cold-store hit.
     *
     * @param params - Playground, user, and input hash to look up.
     * @returns The cached run on a hit; null on a miss.
     */
    async lookup(
        {
            playgroundId,
            userId,
            inputHash,
        }: LookupCachedRunParams,
    ): Promise<LookupCachedRunResult> {
        // Redis fast-path — args become the physical key suffix so the triple is the namespace
        const cached = await this.cacheService.get({
            key: CacheKey.AiLabRun,
            args: [
                playgroundId,
                userId,
                inputHash,
            ],
        })
        // fast-path hit → return immediately without touching Postgres
        if (cached) {
            return {
                cachedRun: {
                    runId: cached.runId,
                    output: cached.output,
                    model: cached.model,
                    provider: cached.provider,
                    mode: cached.mode,
                    promptTokens: cached.promptTokens,
                    completionTokens: cached.completionTokens,
                },
            }
        }

        // cold-store lookup on the unique triple, but only completed runs are reusable —
        // a streaming / failed row must not short-circuit a fresh run
        const run = await this.entityManager.findOne(
            AiLabRunEntity,
            {
                where: {
                    playground: {
                        id: playgroundId,
                    },
                    user: {
                        id: userId,
                    },
                    inputHash,
                },
            },
        )
        // miss, or a row that has no finished output yet → no usable cache entry
        if (!run || run.status !== AiLabRunStatus.Completed || run.output === null) {
            return {
                cachedRun: null,
            }
        }

        // re-warm Redis from the cold store so the next identical run is fast again
        await this.cacheService.set({
            key: CacheKey.AiLabRun,
            args: [
                playgroundId,
                userId,
                inputHash,
            ],
            cacheResult: {
                runId: run.id,
                output: run.output,
                model: run.model,
                provider: run.provider,
                mode: run.mode,
                promptTokens: run.promptTokens,
                completionTokens: run.completionTokens,
            },
        })
        return {
            cachedRun: {
                runId: run.id,
                output: run.output,
                model: run.model,
                provider: run.provider,
                mode: run.mode,
                promptTokens: run.promptTokens,
                completionTokens: run.completionTokens,
            },
        }
    }

    /**
     * Write a completed run into the Redis fast-path. The durable cold store is
     * the `ai_lab_runs` row itself (persisted by {@link AiLabRunService}); this
     * only warms Redis so subsequent identical runs skip the cold-store read.
     *
     * @param params - Playground, user, input hash, and the completed run.
     */
    async store(
        {
            playgroundId,
            userId,
            inputHash,
            run,
        }: StoreCachedRunParams,
    ): Promise<void> {
        // mirror the lookup key so a store immediately satisfies the next lookup
        await this.cacheService.set({
            key: CacheKey.AiLabRun,
            args: [
                playgroundId,
                userId,
                inputHash,
            ],
            cacheResult: {
                runId: run.runId,
                output: run.output,
                model: run.model,
                provider: run.provider,
                mode: run.mode,
                promptTokens: run.promptTokens,
                completionTokens: run.completionTokens,
            },
        })
    }
}
