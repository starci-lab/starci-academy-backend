import {
    Injectable,
} from "@nestjs/common"
import {
    type EntityManager,
} from "typeorm"
import {
    AiModelEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import type {
    EnabledModelsParams,
} from "./types"
import {
    CACHE_READ_RATE_MULTIPLIER,
    DEFAULT_ESTIMATE_COMPLETION_TOKENS,
    DEFAULT_ESTIMATE_PROMPT_TOKENS,
} from "../constants/credit-cost"

/** TypeORM query-cache identifier for the enabled-models lookup. */
export const AI_MODEL_CATALOG_CACHE_KEY = "ai-model-catalog:enabled"

/**
 * How long (ms) the enabled-models query is served from the in-memory query
 * cache before TypeORM re-reads the DB. Short enough that an admin enable/
 * disable toggle takes effect within a minute.
 */
export const AI_MODEL_CATALOG_CACHE_MS = 60_000

/**
 * Read-side catalog of the rotation models, backed by the `ai_models` table
 * (seeded from `.mount/data/ai-models/*` by the catalog seeder).
 *
 * Replaces the old `appConfig().ai.models` mount read: the catalog now lives
 * in the DB so the admin UI can mutate it. Hot reads are served from the
 * primary DataSource's in-memory query cache (keyed by
 * {@link AI_MODEL_CATALOG_CACHE_KEY}) to avoid hitting Postgres on every LLM
 * call.
 */
@Injectable()
export class AiModelCatalogService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) { }

    /**
     * Enabled models ordered by `priority` descending (highest tried first),
     * optionally filtered by category. Cached in-memory for
     * {@link AI_MODEL_CATALOG_CACHE_MS}.
     *
     * @param params - optional category filter
     * @returns the enabled model rows, highest priority first
     */
    async enabledModels(
        {
            category,
        }: EnabledModelsParams = {
        },
    ): Promise<Array<AiModelEntity>> {
        const models = await this.entityManager.find(
            AiModelEntity,
            {
                where: {
                    enabled: true,
                },
                order: {
                    priority: "DESC",
                },
                cache: {
                    id: AI_MODEL_CATALOG_CACHE_KEY,
                    milliseconds: AI_MODEL_CATALOG_CACHE_MS,
                },
            },
        )
        if (!category) {
            return models
        }
        return models.filter((model) => model.category === category)
    }

    /**
     * TOKEN-BASED billing for one run: `ceil((promptTok·rateIn + completionTok·
     * rateOut) / 1e6)`, where the per-million-token rates come from the served
     * model's catalog row (proportional to its real `$/M` price). Falls back to
     * the model's flat `credit` when the model has no rates OR the provider did
     * not report token usage (so a run is never billed 0 by accident). Unknown /
     * disabled model → {@link fallback}.
     *
     * @param params - served model `name`, observed token counts, fallback credit.
     * @returns the credits to charge for this run.
     */
    async creditForRun(
        {
            name,
            promptTokens,
            completionTokens,
            cachedTokens,
            fallback,
        }: {
            name: string
            promptTokens?: number
            completionTokens?: number
            cachedTokens?: number
            fallback: number
        },
    ): Promise<number> {
        const models = await this.enabledModels()
        const found = models.find((model) => model.name === name)
        if (!found) {
            return fallback
        }
        const inputTokens = promptTokens ?? 0
        const outputTokens = completionTokens ?? 0
        const hasRates = found.creditPerMTokIn > 0 || found.creditPerMTokOut > 0
        // A model WITHOUT per-token rates (e.g. a free self-hosted model, credit 0)
        // charges its flat `credit`.
        if (!hasRates) {
            return found.credit
        }
        // Rated model: bill by tokens. When the provider reported no usage at all,
        // ESTIMATE with typical token counts × this model's rates rather than the
        // flat per-model `credit` — the flat is a coarse cap that massively over-
        // charges (Balanced flat 211 vs a real ~24), which would drain a free
        // user's whole 5h pool on a single un-metered call.
        const noUsage = inputTokens === 0 && outputTokens === 0
        const billedInput = noUsage ? DEFAULT_ESTIMATE_PROMPT_TOKENS : inputTokens
        const billedOutput = noUsage ? DEFAULT_ESTIMATE_COMPLETION_TOKENS : outputTokens
        // Prompt-cache hits are counted INSIDE `promptTokens` but the provider
        // re-prices them (roughly 0.1x-0.2x of a fresh input token) and
        // OpenRouter passes that discount on to us. Charging the learner the full
        // input rate for them would make a credit represent the list price rather
        // than what we actually paid, so the cached share bills at the model's own
        // recorded cache rate.
        const cachedInput = noUsage
            ? 0
            : Math.min(Math.max(cachedTokens ?? 0,
                0),
            billedInput)
        const freshInput = billedInput - cachedInput
        // no recorded cache price → fall back to the conservative multiplier
        // rather than inventing a discount the provider may not give
        const cachedRate = found.creditPerMTokCached
            ?? found.creditPerMTokIn * CACHE_READ_RATE_MULTIPLIER
        const credits = (
            freshInput * found.creditPerMTokIn
            + cachedInput * cachedRate
            + billedOutput * found.creditPerMTokOut
        ) / 1_000_000
        return Math.ceil(credits)
    }

    /**
     * Drop the cached enabled-models result so the next {@link enabledModels}
     * read hits the DB. Call after a reseed / admin mutation so changes are
     * visible immediately instead of after the TTL elapses.
     */
    async invalidate(): Promise<void> {
        await this.entityManager.connection.queryResultCache?.remove([
            AI_MODEL_CATALOG_CACHE_KEY,
        ])
    }
}
