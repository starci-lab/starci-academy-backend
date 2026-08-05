import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `mode` to `mock_interview_attempts` -- the "mode split" (2026-07-06)
 * snapshot of which TOP-LEVEL flow ("qna" | "design") a graded session ran
 * in, so interview history can distinguish them. Nullable (a null `mode` on
 * an existing/legacy row reads as "design", the only mode that existed
 * before this migration).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddModeToMockInterviewAttempts1722600000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD COLUMN IF NOT EXISTS "mode" varchar;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            DROP COLUMN IF EXISTS "mode";
        `)
    }
}
