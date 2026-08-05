import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Registers the `"task_grading"` and `"challenge_grading"` values of
 * {@link AiModelTask} at the schema level.
 *
 * Same shape as {@link AddCvGeneratingAiModelTask1721200000000}: `AiModelTask`
 * is stored inside the JSONB array column `ai_models.supported_tasks`, so this
 * is a pure backfill -- **no DDL, no `ALTER TYPE`**. Every model that already
 * serves generic `"grading"` is grading-quality, so both new dedicated grading
 * tasks (milestone-task review, challenge submission grading) are tagged onto
 * the same set. Fully idempotent via the `@>` guard.
 */
export class AddTaskAndChallengeGradingAiModelTasks1721300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddTaskAndChallengeGradingAiModelTasks1721300000000"

    /**
     * Forward migration: backfill `"task_grading"` and `"challenge_grading"`
     * onto every model that already supports `"grading"` -- no DDL, idempotent
     * via the `@>` guard.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" || '["task_grading"]'::jsonb
            WHERE "supported_tasks" @> '["grading"]'::jsonb
              AND NOT ("supported_tasks" @> '["task_grading"]'::jsonb);
        `)
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" || '["challenge_grading"]'::jsonb
            WHERE "supported_tasks" @> '["grading"]'::jsonb
              AND NOT ("supported_tasks" @> '["challenge_grading"]'::jsonb);
        `)
    }

    /**
     * Reverse migration: strip both values back off every model.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" - 'task_grading';
        `)
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" - 'challenge_grading';
        `)
    }
}
