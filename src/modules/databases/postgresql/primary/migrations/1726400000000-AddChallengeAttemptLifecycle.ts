import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Additive persistence for recoverable drafts and server-owned attempt lifecycle. */
export class AddChallengeAttemptLifecycle1726400000000 implements MigrationInterface {
    name = "AddChallengeAttemptLifecycle1726400000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submissions"
                ADD COLUMN IF NOT EXISTS "draft_revision" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "draft_updated_at" timestamptz;
        `)
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submission_attempts"
                ADD COLUMN IF NOT EXISTS "attempt_group_id" uuid,
                ADD COLUMN IF NOT EXISTS "status" varchar(32),
                ADD COLUMN IF NOT EXISTS "draft_revision" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "submitted_at" timestamptz,
                ADD COLUMN IF NOT EXISTS "platform_decision" varchar(32),
                ADD COLUMN IF NOT EXISTS "confidence" double precision,
                ADD COLUMN IF NOT EXISTS "uncertainty" text,
                ADD COLUMN IF NOT EXISTS "next_action" text,
                ADD COLUMN IF NOT EXISTS "finalization_revision" integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS "ai_advisory_evidence" jsonb;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_challenge_attempt_group"
            ON "user_challenge_submission_attempts" ("attempt_group_id");
        `)
        await queryRunner.query(`
            UPDATE "user_challenge_submission_attempts"
            SET "status" = CASE WHEN "processed_at" IS NULL THEN 'evaluating' ELSE 'completed' END,
                "submitted_at" = COALESCE("submitted_at", "created_at")
            WHERE "status" IS NULL OR "submitted_at" IS NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submission_attempts"
                ALTER COLUMN "status" SET DEFAULT 'evaluating',
                ALTER COLUMN "status" SET NOT NULL,
                ALTER COLUMN "submitted_at" SET DEFAULT CURRENT_TIMESTAMP,
                ALTER COLUMN "submitted_at" SET NOT NULL;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_challenge_attempt_group\";")
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submission_attempts"
                DROP COLUMN IF EXISTS "attempt_group_id",
                DROP COLUMN IF EXISTS "ai_advisory_evidence",
                DROP COLUMN IF EXISTS "finalization_revision",
                DROP COLUMN IF EXISTS "next_action",
                DROP COLUMN IF EXISTS "uncertainty",
                DROP COLUMN IF EXISTS "confidence",
                DROP COLUMN IF EXISTS "platform_decision",
                DROP COLUMN IF EXISTS "submitted_at",
                DROP COLUMN IF EXISTS "draft_revision",
                DROP COLUMN IF EXISTS "status";
        `)
        await queryRunner.query(`
            ALTER TABLE "user_challenge_submissions"
                DROP COLUMN IF EXISTS "draft_updated_at",
                DROP COLUMN IF EXISTS "draft_revision";
        `)
    }
}
