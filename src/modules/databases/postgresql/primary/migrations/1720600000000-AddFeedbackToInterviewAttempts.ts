import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Persists per-answer grade feedback on `interview_attempts` so a past run's
 * detail can show it: `strengths` + `gaps` (JSONB string arrays) and
 * `model_answer_hint` (nullable text). The feedback was previously transient
 * (returned by the grade mutation, never stored). Legacy rows keep `[]` / null.
 *
 * Dev runs schema via `synchronize` (adds the columns); this migration applies
 * the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddFeedbackToInterviewAttempts1720600000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddFeedbackToInterviewAttempts1720600000000"

    /**
     * Forward migration: add `strengths` + `gaps` (jsonb) and `model_answer_hint`.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "interview_attempts"
            ADD COLUMN IF NOT EXISTS "strengths" jsonb NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS "gaps" jsonb NOT NULL DEFAULT '[]'::jsonb,
            ADD COLUMN IF NOT EXISTS "model_answer_hint" varchar;
        `)
    }

    /**
     * Reverse migration: drop the feedback columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "interview_attempts"
            DROP COLUMN IF EXISTS "strengths",
            DROP COLUMN IF EXISTS "gaps",
            DROP COLUMN IF EXISTS "model_answer_hint";
        `)
    }
}
