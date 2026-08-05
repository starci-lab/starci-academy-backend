import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `mode` + `seed_questions` to `mock_interview_sessions` -- the "mode
 * split" (2026-07-06): a mock-interview session now picks a TOP-LEVEL flow
 * ("qna" | "design") at setup, instead of a per-session cognitive frame.
 * "qna" draws N flashcard-card seeds, EACH carrying its own RANDOMLY-assigned
 * cognitive frame ("theory" | "reasoning" | "scenario") so a session mixes
 * question styles the way a real interviewer would; "design" keeps the
 * existing 5-phase flow entirely unchanged.
 *
 * `mode` is a plain varchar (not a pg enum) so a future mode never needs an
 * `ALTER TYPE ... ADD VALUE` migration. `seed_questions` is a nullable jsonb
 * array of `{ cardId, kind, title }` objects drawn for `mode="qna"`,
 * snapshotted at draw time so grading can fetch each seed card's authored
 * answer + keywords (for its "theory"-kind questions) without re-deriving the
 * reached-module/level pool.
 *
 * Both columns are nullable -- a session drawn before this migration has no
 * `mode` (readers treat a null `mode` as "design", the pre-existing 5-phase
 * flow) and no seeds (a "design" session never had flashcard seeds anyway).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddModeAndSeedQuestionsToMockInterviewSessions1722500000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "mode" varchar,
            ADD COLUMN IF NOT EXISTS "seed_questions" jsonb;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "mode",
            DROP COLUMN IF EXISTS "seed_questions";
        `)
    }
}
