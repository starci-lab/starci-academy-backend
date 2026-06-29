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
     * Resolve the billing `credit` of the model that served a run, by its
     * concrete name. The single source of grading cost (replaces the hardcoded
     * `MODEL_CREDIT` map). Unknown / disabled model → {@link fallback}.
     *
     * NOTE: this is the BILLING value (`credit`), NOT the ordering `weight`.
     *
     * @param params - the served model `name` and a `fallback` credit.
     * @returns the model's catalog credit, or `fallback` when not found.
     */
    async creditForModel(
        {
            name,
            fallback,
        }: {
            name: string
            fallback: number
        },
    ): Promise<number> {
        const models = await this.enabledModels()
        const found = models.find((model) => model.name === name)
        return found ? found.credit : fallback
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
