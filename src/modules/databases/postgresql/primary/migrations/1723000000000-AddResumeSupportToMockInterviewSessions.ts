import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds "resume mock interview session" support to `mock_interview_sessions` --
 * lets a learner who navigated away mid-session (tab close, refresh, network
 * drop) pick their in-progress draw back up instead of losing the transcript
 * and being forced into a fresh draw:
 *
 * - `status` -- plain varchar (not a pg enum, mirroring every other free-form
 *   column on this entity -- `source`/`mode`/`level` -- for the same
 *   TypeORM-synchronize `ADD VALUE` footgun reasoning), one of
 *   "in_progress" | "completed" | "abandoned". Defaults to "in_progress" so
 *   every historical row (all pre-dating this feature, all necessarily
 *   already finished one way or another) still reads as a valid status
 *   rather than an empty string; `startMockInterviewSession` immediately
 *   flips any PRIOR "in_progress" row for the same enrollment to "abandoned"
 *   before drawing a new one, and `gradeMockInterviewSession` flips the
 *   graded row to "completed" -- so in practice only a row that is genuinely
 *   mid-flight right now stays "in_progress".
 * - `turns` -- nullable jsonb snapshot of the in-flight transcript (same
 *   shape as the grading mutation's `MockInterviewTurnInput`), periodically
 *   synced by the new `syncMockInterviewSessionTurns` mutation so a resume
 *   can replay the conversation exactly where the learner left off.
 * - `question_index` / `phase_index` -- the learner's position within the
 *   session (which Q&A question, or which of the 5 design phases) at the
 *   last sync, NOT NULL defaulting to 0 (the position a session always
 *   starts at) so a resume always has a valid position to restart from even
 *   for rows written before this migration.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddResumeSupportToMockInterviewSessions1723000000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'in_progress';
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "turns" jsonb;
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "question_index" int NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "phase_index" int NOT NULL DEFAULT 0;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "phase_index";
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "question_index";
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "turns";
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "status";
        `)
    }
}
