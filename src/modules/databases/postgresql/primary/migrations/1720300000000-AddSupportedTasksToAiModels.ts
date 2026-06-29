import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `supported_tasks` (JSONB) to `ai_models` — the set of tasks a model is
 * suited for (`"chatting"` / `"grading"`). Stored as a JSONB array of plain
 * strings (NOT a Postgres enum type, so adding a task value never requires an
 * enum `ALTER TYPE`). Drives FE picker visibility (a grading-only model is
 * hidden from the chat picker, etc.).
 *
 * Dev runs schema via `synchronize` (adds the column); this migration applies
 * the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddSupportedTasksToAiModels1720300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddSupportedTasksToAiModels1720300000000"

    /**
     * Forward migration: add the `supported_tasks` JSONB column (default `[]`).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "supported_tasks" jsonb NOT NULL DEFAULT '[]'::jsonb;
        `)
    }

    /**
     * Reverse migration: drop the `supported_tasks` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "supported_tasks";
        `)
    }
}
