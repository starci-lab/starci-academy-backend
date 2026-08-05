import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `free` to the `ai_model_category` Postgres enum -- the no-credit tier for
 * the self-hosted local model (Qwen). Sits below `economy` so the Auto lane
 * climbs Free -> Economy -> Balanced -> Premium. No-plan users may use Free +
 * Economy; Balanced/Premium need a paid plan.
 *
 * The repo runs schema via TypeORM `synchronize` in dev (a fresh DB creates the
 * enum with all values); this migration exists so the same value can be added
 * deterministically where `synchronize` is disabled (prod). `ADD VALUE IF NOT
 * EXISTS` is idempotent (Postgres 12+); `BEFORE 'economy'` keeps the logical
 * low->high enum order.
 */
export class AddFreeAiModelCategory1719200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddFreeAiModelCategory1719200000000"

    /**
     * Forward migration: add the `free` enum value (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "ai_model_category" ADD VALUE IF NOT EXISTS 'free' BEFORE 'economy';
        `)
    }

    /**
     * Reverse migration: Postgres cannot drop a single enum value without
     * recreating the type, so this is intentionally a no-op.
     */
    async down(): Promise<void> {
        // no-op -- see doc comment
    }
}
