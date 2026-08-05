import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds token-based billing rates to `ai_models`:
 * - `credit_per_mtok_in` (integer) -- credits charged per 1,000,000 INPUT tokens.
 * - `credit_per_mtok_out` (integer) -- credits charged per 1,000,000 OUTPUT tokens.
 *
 * A grading run is billed `ceil((promptTok-in + completionTok-out)/1e6)`; the
 * flat `credit` column stays as the FALLBACK used only when token usage is
 * unreported by the provider.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class AddTokenCreditRatesToAiModels1720400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddTokenCreditRatesToAiModels1720400000000"

    /**
     * Forward migration: add the two per-million-token rate columns (default 0).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "credit_per_mtok_in" integer NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "credit_per_mtok_out" integer NOT NULL DEFAULT 0;
        `)
    }

    /**
     * Reverse migration: drop both rate columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "credit_per_mtok_out";
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "credit_per_mtok_in";
        `)
    }
}
