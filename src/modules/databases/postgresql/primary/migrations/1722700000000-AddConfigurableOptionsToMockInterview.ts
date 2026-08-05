import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `counts_to_readiness` to BOTH `mock_interview_sessions` and
 * `mock_interview_attempts` -- the "configurable setup" split (2026-07-06):
 * `startMockInterviewSession` now accepts an optional `questionCount` /
 * `kinds` pair driving a deliberate-practice (Configurable) draw alongside the
 * existing Auto (random-everything) draw. A Configurable qna session is
 * REQUESTED by the learner (they pick which kinds to drill), so it must NOT
 * feed job-readiness (that pillar's whole point is a clean signal from a
 * random, exam-like run) -- `countsToReadiness` is the flag that keeps
 * targeted practice out of {@link import("../../../../features/api/core/graphql/queries/users/job-readiness/job-readiness.service").JobReadinessService}'s
 * rolling interview average.
 *
 * Both columns are nullable boolean, DEFAULTING to true for every existing
 * row (every session/attempt drawn before this migration was either an
 * "Auto" qna run or a "design" run -- both of which count) -- so backfill is a
 * no-op and no historical attempt silently drops out of the readiness
 * average.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddConfigurableOptionsToMockInterview1722700000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "counts_to_readiness" boolean NOT NULL DEFAULT true;
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD COLUMN IF NOT EXISTS "counts_to_readiness" boolean NOT NULL DEFAULT true;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            DROP COLUMN IF EXISTS "counts_to_readiness";
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "counts_to_readiness";
        `)
    }
}
