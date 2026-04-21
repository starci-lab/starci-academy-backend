import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

export class RefactorCvSubmissionsVersionedAttempts1776729900000 implements MigrationInterface {
    public name = "RefactorCvSubmissionsVersionedAttempts1776729900000"

    public async up(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"short_feedback\" text",
        )

        await queryRunner.query(
            `DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'cv_submissions' AND column_name = 'feedback'
                ) AND NOT EXISTS (
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_name = 'cv_submissions' AND column_name = 'short_feedback'
                ) THEN
                    ALTER TABLE "cv_submissions" RENAME COLUMN "feedback" TO "short_feedback";
                END IF;
            END $$`,
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "cv_submission_attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "file_url" character varying(2048) NOT NULL,
                "original_text" text,
                "status" "public"."cv_submission_status" NOT NULL DEFAULT 'pending',
                "attempt_number" integer NOT NULL,
                "processed_at" TIMESTAMPTZ,
                "cv_submission_id" uuid NOT NULL,
                CONSTRAINT "pk_cv_submission_attempts_id" PRIMARY KEY ("id"),
                CONSTRAINT "fk_cv_submission_id_cv_submission_attempts_cv_submissions" FOREIGN KEY ("cv_submission_id") REFERENCES "cv_submissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )`,
        )

        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"idx_cv_submission_attempts_cv_submission_id\" ON \"cv_submission_attempts\" (\"cv_submission_id\")",
        )

        await queryRunner.query(
            `CREATE TABLE IF NOT EXISTS "cv_submission_feedbacks" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "summary" text NOT NULL,
                "strength" jsonb,
                "weakness" jsonb,
                "suggested_jobs" jsonb,
                "spell_errors" jsonb,
                "score" double precision,
                "order_index" integer NOT NULL DEFAULT 0,
                "cv_submission_attempt_id" uuid NOT NULL,
                CONSTRAINT "pk_cv_submission_feedbacks_id" PRIMARY KEY ("id"),
                CONSTRAINT "fk_cv_submission_attempt_id_cv_submission_feedbacks_cv_submission_attempts" FOREIGN KEY ("cv_submission_attempt_id") REFERENCES "cv_submission_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION
            )`,
        )

        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"idx_cv_submission_feedbacks_attempt_id\" ON \"cv_submission_feedbacks\" (\"cv_submission_attempt_id\")",
        )

        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"file_url\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"original_text\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"summary\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"strength\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"weakness\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"suggested_jobs\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"spell_errors\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"score\"",
        )
    }

    public async down(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"file_url\" character varying(2048)",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"original_text\" text",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"status\" \"public\".\"cv_submission_status\" NOT NULL DEFAULT 'pending'",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"summary\" text",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"strength\" jsonb",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"weakness\" jsonb",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"suggested_jobs\" jsonb",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"spell_errors\" jsonb",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" ADD COLUMN IF NOT EXISTS \"score\" double precision",
        )

        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_cv_submission_feedbacks_attempt_id\"",
        )
        await queryRunner.query(
            "DROP TABLE IF EXISTS \"cv_submission_feedbacks\"",
        )
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_cv_submission_attempts_cv_submission_id\"",
        )
        await queryRunner.query(
            "DROP TABLE IF EXISTS \"cv_submission_attempts\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"cv_submissions\" DROP COLUMN IF EXISTS \"short_feedback\"",
        )
    }
}
