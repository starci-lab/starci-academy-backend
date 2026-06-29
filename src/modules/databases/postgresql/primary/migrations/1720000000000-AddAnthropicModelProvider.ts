import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `anthropic` to the `model_provider` Postgres enum so `ai_models` rows
 * (and other `model_provider` columns) can reference the native Anthropic Claude
 * API (Claude Opus 4.8 — frontier tier). Routed at runtime through
 * `ChatAnthropic` with the Anthropic key pool.
 *
 * ⚠️ `model_provider` is used by ≥2 columns (`ai_models.provider`,
 * `ai_subscriptions.byok_provider`, the `served_provider` columns) — on an
 * existing DB `synchronize` would try to recreate the shared enum type and crash
 * boot. Run this `ALTER TYPE … ADD VALUE` (migration or psql) BEFORE booting.
 * `ADD VALUE IF NOT EXISTS` is idempotent (Postgres 12+).
 */
export class AddAnthropicModelProvider1720000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddAnthropicModelProvider1720000000000"

    /**
     * Forward migration: add the `anthropic` enum value (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "model_provider" ADD VALUE IF NOT EXISTS 'anthropic';
        `)
    }

    /**
     * Reverse migration: Postgres cannot drop a single enum value without
     * recreating the type, so this is intentionally a no-op.
     */
    async down(): Promise<void> {
        // no-op — see doc comment
    }
}
