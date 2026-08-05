import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `question_reviews` to `mock_interview_attempts` -- a jsonb snapshot of
 * the per-question model-answer review built at grade time for a
 * `mode="qna"` session (the anti-ChatGPT "moat" feature: pairs the
 * candidate's own answer against the course's authored flashcard-seed answer
 * for the exact same question). Always an empty array for `mode="design"`
 * attempts (no single seed flashcard to source a model answer from).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is
 * off. Backfills existing rows with an empty array (no historical
 * per-question review existed before this column).
 */
export class AddQuestionReviewsToMockInterviewAttempts1722800000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD COLUMN IF NOT EXISTS "question_reviews" jsonb NOT NULL DEFAULT '[]';
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            DROP COLUMN IF EXISTS "question_reviews";
        `)
    }
}
