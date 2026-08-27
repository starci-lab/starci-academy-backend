import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Adds durable lifecycle, optimistic sync, and PostgreSQL-authoritative grading work. */
export class AddDurableMockInterviewPracticeLoop1727200000000 implements MigrationInterface {
    name = "AddDurableMockInterviewPracticeLoop1727200000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "revision" int NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "rubric_version" varchar NOT NULL DEFAULT 'mock-interview-v1',
            ADD COLUMN IF NOT EXISTS "expires_at" timestamptz,
            ADD COLUMN IF NOT EXISTS "grading_requested_at" timestamptz,
            ADD COLUMN IF NOT EXISTS "completed_at" timestamptz,
            ADD COLUMN IF NOT EXISTS "abandoned_at" timestamptz
        `)
        await queryRunner.query(`
            UPDATE "mock_interview_sessions"
            SET "expires_at" = "created_at" + interval '1 hour'
            WHERE "expires_at" IS NULL
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ALTER COLUMN "expires_at" SET NOT NULL
        `)
        await queryRunner.query(`
            UPDATE "mock_interview_sessions"
            SET "status" = 'expired'
            WHERE "status" = 'in_progress' AND "expires_at" <= CURRENT_TIMESTAMP
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_mock_interview_sessions_unfinished_enrollment"
            ON "mock_interview_sessions" ("enrollment_id")
            WHERE "status" IN ('in_progress', 'grading', 'grading_failed')
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_attempts"
            ADD COLUMN IF NOT EXISTS "rubric_version" varchar NOT NULL DEFAULT 'mock-interview-v1',
            ADD COLUMN IF NOT EXISTS "recommendation_status" varchar NOT NULL DEFAULT 'no_match'
        `)
        await queryRunner.query(`
            UPDATE "mock_interview_attempts"
            SET "recommendation_status" = CASE
                WHEN jsonb_array_length(COALESCE("matched_content_ids", '[]'::jsonb)) > 0 THEN 'available'
                ELSE 'no_match'
            END
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mock_interview_grading_jobs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "session_id" uuid NOT NULL,
                "status" varchar NOT NULL DEFAULT 'queued',
                "attempt_count" int NOT NULL DEFAULT 0,
                "max_attempts" int NOT NULL DEFAULT 3,
                "available_at" timestamptz NOT NULL DEFAULT now(),
                "lease_token" uuid,
                "lease_expires_at" timestamptz,
                "last_dispatched_at" timestamptz,
                "selected_model" varchar,
                "selected_model_provider" varchar,
                "provider_request_id" varchar,
                "prompt_fingerprint" varchar,
                "usage" jsonb,
                "last_error" text,
                "completed_at" timestamptz,
                CONSTRAINT "pk_mock_interview_grading_jobs" PRIMARY KEY ("id"),
                CONSTRAINT "fk_session_id_mock_interview_grading_jobs" FOREIGN KEY ("session_id")
                    REFERENCES "mock_interview_sessions"("id") ON DELETE CASCADE
            )
        `)
        await queryRunner.query("CREATE UNIQUE INDEX IF NOT EXISTS \"uq_mock_interview_grading_jobs_session_id\" ON \"mock_interview_grading_jobs\" (\"session_id\")")
        await queryRunner.query("CREATE INDEX IF NOT EXISTS \"idx_mock_interview_grading_jobs_dispatch\" ON \"mock_interview_grading_jobs\" (\"status\", \"available_at\")")
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS \"mock_interview_grading_jobs\"")
        await queryRunner.query("DROP INDEX IF EXISTS \"uq_mock_interview_sessions_unfinished_enrollment\"")
        await queryRunner.query("ALTER TABLE \"mock_interview_attempts\" DROP COLUMN IF EXISTS \"recommendation_status\", DROP COLUMN IF EXISTS \"rubric_version\"")
        await queryRunner.query("ALTER TABLE \"mock_interview_sessions\" DROP COLUMN IF EXISTS \"abandoned_at\", DROP COLUMN IF EXISTS \"completed_at\", DROP COLUMN IF EXISTS \"grading_requested_at\", DROP COLUMN IF EXISTS \"expires_at\", DROP COLUMN IF EXISTS \"rubric_version\", DROP COLUMN IF EXISTS \"revision\"")
    }
}
