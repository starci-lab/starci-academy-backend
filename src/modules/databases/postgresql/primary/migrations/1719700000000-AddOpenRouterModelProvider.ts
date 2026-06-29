import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `openrouter` to the `model_provider` Postgres enum so `ai_models` rows
 * (and any other `model_provider` column — `ai_subscriptions.byok_provider`,
 * the `served_provider` columns on submission / milestone / ai-lab attempts)
 * can reference the OpenRouter aggregator gateway. Routed at runtime through
 * `ChatOpenAI` with a custom `baseURL` (`OPENROUTER_BASE_URL`).
 *
 * The repo runs schema via TypeORM `synchronize` in dev (a fresh DB creates the
 * enum with all values); this migration exists so the same value can be added
 * deterministically where `synchronize` is disabled (prod) — and so an existing
 * dev DB gets the value WITHOUT `synchronize` trying to recreate the shared enum
 * type and crashing boot. `ADD VALUE IF NOT EXISTS` is idempotent (Postgres 12+).
 */
export class AddOpenRouterModelProvider1719700000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddOpenRouterModelProvider1719700000000"

    /**
     * Forward migration: add the `openrouter` enum value (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "model_provider" ADD VALUE IF NOT EXISTS 'openrouter';
        `)
    }

    /**
     * Reverse migration: Postgres cannot drop a single enum value without
     * recreating the type, so this is intentionally a no-op. Leaving
     * `openrouter` in the enum is harmless when no row references it.
     */
    async down(): Promise<void> {
        // no-op — see doc comment
    }
}
