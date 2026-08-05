import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds two columns to `ai_models`:
 * - `credit` (integer) -- the credit cost charged to the user when this model
 *   serves a grading run (BILLING; replaces the hardcoded `MODEL_CREDIT` map,
 *   single source = the catalog). Free models = 0.
 * - `weight` (double precision) -- the within-category Auto try-order key (higher
 *   tried first, then climb to the next category). Accepts decimals so models in
 *   the same credit tier order distinctly (e.g. credit 5 -> 5.3 / 5.2 / 5.1).
 *
 * Dev runs schema via `synchronize` (adds the columns); this migration applies
 * the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddWeightToAiModels1720100000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddWeightToAiModels1720100000000"

    /**
     * Forward migration: add `credit` + `weight` columns (default 0, idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "credit" integer NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "weight" double precision NOT NULL DEFAULT 0;
        `)
    }

    /**
     * Reverse migration: drop both columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "weight";
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "credit";
        `)
    }
}
