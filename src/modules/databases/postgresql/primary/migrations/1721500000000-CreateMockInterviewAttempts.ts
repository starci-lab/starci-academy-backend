import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `mock_interview_attempts` table -- one row per GRADED mock
 * interview session (the whole 5-phase run, not one question). Persists
 * the scorecard the FE renders: `overall_score` + `verdict` + `phase_scores` /
 * `attribute_scores` (jsonb rubric breakdowns) + `strengths` / `gaps` /
 * `follow_up_question`, plus which capstone system (`prompt_id` / `prompt_title`)
 * and level the session was graded against.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateMockInterviewAttempts1721500000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // one row per graded interview SESSION, enrollment-anchored from day one
        // (no legacy user_id column -- this table is new, unlike interview_attempts
        // which predates the enrollment-centric re-key)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mock_interview_attempts" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "session_id" uuid NOT NULL,
                "prompt_id" varchar NOT NULL,
                "prompt_title" varchar NOT NULL,
                "level" varchar,
                "overall_score" int NOT NULL,
                "verdict" varchar NOT NULL,
                "phase_scores" jsonb NOT NULL DEFAULT '[]',
                "attribute_scores" jsonb NOT NULL DEFAULT '[]',
                "strengths" jsonb NOT NULL DEFAULT '[]',
                "gaps" jsonb NOT NULL DEFAULT '[]',
                "follow_up_question" varchar,
                CONSTRAINT "pk_mock_interview_attempts_id" PRIMARY KEY ("id")
            );
        `)

        // FK to enrollments -- deleting an enrollment removes its mock-interview history
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD CONSTRAINT "fk_enrollment_id_mock_interview_attempts"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // fast per-enrollment history scan (mirrors the interview_attempts index)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mock_interview_attempts_enrollment"
            ON "mock_interview_attempts" ("enrollment_id");
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_mock_interview_attempts_enrollment\";",
        )
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_mock_interview_attempts";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"mock_interview_attempts\";")
    }
}
