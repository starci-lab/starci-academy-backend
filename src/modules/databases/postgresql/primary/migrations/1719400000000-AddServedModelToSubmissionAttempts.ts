import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `served_model` + `served_provider` to `user_challenge_submission_attempts`
 * so each grading attempt records WHICH AI model actually graded it (the balancer's
 * served model, e.g. `qwen2.5-coder:7b` on `local`) -- surfaced on the submission
 * result page. Both nullable: attempts graded before this column existed stay null.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class AddServedModelToSubmissionAttempts1719400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddServedModelToSubmissionAttempts1719400000000"

    /**
     * Forward migration: add the two nullable served-model columns.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submission_attempts"
            ADD COLUMN IF NOT EXISTS "served_model" varchar(64),
            ADD COLUMN IF NOT EXISTS "served_provider" varchar(32);
        `)
    }

    /**
     * Reverse migration: drop the two columns.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submission_attempts"
            DROP COLUMN IF EXISTS "served_model",
            DROP COLUMN IF EXISTS "served_provider";
        `)
    }
}
