import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Registers the `"cv_generating"` value of {@link AiModelTask} at the schema
 * level.
 *
 * Same shape as {@link AddEmbeddingAiModelTask1720700000000}: `AiModelTask` is
 * stored inside the JSONB array column `ai_models.supported_tasks`, so this is
 * a pure backfill -- **no DDL, no `ALTER TYPE`**. Every model that already
 * serves `"grading"` is grading-quality (Balanced-tier floor), which is exactly
 * the bar the CV-generation lane wants, so `"cv_generating"` is tagged onto the
 * same set. Fully idempotent via the `@>` guard.
 */
export class AddCvGeneratingAiModelTask1721200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddCvGeneratingAiModelTask1721200000000"

    /**
     * Forward migration: backfill `"cv_generating"` onto every model that
     * already supports `"grading"` -- no DDL, idempotent via the `@>` guard.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" || '["cv_generating"]'::jsonb
            WHERE "supported_tasks" @> '["grading"]'::jsonb
              AND NOT ("supported_tasks" @> '["cv_generating"]'::jsonb);
        `)
    }

    /**
     * Reverse migration: strip `"cv_generating"` back off every model.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" - 'cv_generating';
        `)
    }
}
