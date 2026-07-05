import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `matched_content_ids` to `mock_interview_attempts` — a point-in-time
 * jsonb snapshot of the distinct content (lesson) ids the RAG grounding
 * excerpt was retrieved from at grade time, so a re-opened past attempt
 * (history) can deep-link "study this" without re-running retrieval.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is
 * off. Backfills existing rows with an empty array (no historical retrieval
 * data existed before this column).
 */
export class AddMatchedContentIdsToMockInterviewAttempts1722100000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD COLUMN IF NOT EXISTS "matched_content_ids" jsonb NOT NULL DEFAULT '[]';
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            DROP COLUMN IF EXISTS "matched_content_ids";
        `)
    }
}
