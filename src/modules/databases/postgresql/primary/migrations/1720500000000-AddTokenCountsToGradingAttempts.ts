import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds per-call token counts to the grading attempt tables so each graded
 * attempt records how many input/output tokens the model consumed:
 * - `user_challenge_submission_attempts.prompt_tokens` / `.completion_tokens`
 * - `user_milestone_task_attempts.prompt_tokens` / `.completion_tokens`
 *
 * Nullable (legacy attempts + attempts where the provider did not report usage
 * stay null). Populated from the LangChain `usage_metadata` returned by the run.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class AddTokenCountsToGradingAttempts1720500000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddTokenCountsToGradingAttempts1720500000000"

    /**
     * Forward migration: add nullable `prompt_tokens` + `completion_tokens` to
     * both grading attempt tables.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of [
            "user_challenge_submission_attempts",
            "user_milestone_task_attempts",
        ]) {
            await queryRunner.query(`
                ALTER TABLE "${table}"
                ADD COLUMN IF NOT EXISTS "prompt_tokens" integer;
            `)
            await queryRunner.query(`
                ALTER TABLE "${table}"
                ADD COLUMN IF NOT EXISTS "completion_tokens" integer;
            `)
        }
    }

    /**
     * Reverse migration: drop both token columns from both tables.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of [
            "user_challenge_submission_attempts",
            "user_milestone_task_attempts",
        ]) {
            await queryRunner.query(`
                ALTER TABLE "${table}" DROP COLUMN IF EXISTS "completion_tokens";
            `)
            await queryRunner.query(`
                ALTER TABLE "${table}" DROP COLUMN IF EXISTS "prompt_tokens";
            `)
        }
    }
}
