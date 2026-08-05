import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `local` to the `model_provider` Postgres enum so `ai_models` rows (and
 * any other `model_provider` column) can reference the self-hosted,
 * OpenAI-compatible provider (Ollama / vLLM / LM Studio). Routed at runtime
 * through `ChatOpenAI` with a custom `baseURL` (`OLLAMA_BASE_URL`).
 *
 * The repo runs schema via TypeORM `synchronize` in dev (a fresh DB creates the
 * enum with all values); this migration exists so the same value can be added
 * deterministically where `synchronize` is disabled (prod). `ADD VALUE IF NOT
 * EXISTS` is idempotent (Postgres 12+).
 */
export class AddLocalModelProvider1719100000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddLocalModelProvider1719100000000"

    /**
     * Forward migration: add the `local` enum value (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "model_provider" ADD VALUE IF NOT EXISTS 'local';
        `)
    }

    /**
     * Reverse migration: Postgres cannot drop a single enum value without
     * recreating the type, so this is intentionally a no-op. Leaving `local`
     * in the enum is harmless when no row references it.
     */
    async down(): Promise<void> {
        // no-op -- see doc comment
    }
}
