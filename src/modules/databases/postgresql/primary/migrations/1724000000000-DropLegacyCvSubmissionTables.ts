import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Drops the legacy `cv_submissions` / `cv_submission_attempts` tables. They
 * were superseded by the unified `cv_generations` table (migration
 * `CreateUserCvGenerations1721100000000`), and every user's best-scored
 * legacy attempt was already copied over as a `source = 'uploaded'` row by
 * `BackfillLegacyCvIntoUnified1721800000000`.
 *
 * The remaining active consumers of the legacy tables were removed alongside
 * this migration: the `cvUrl` + `userCvSubmissionAttempts` queries and the
 * `verifySubmitCvPresignUrl` mutation (all confirmed dead -- no live FE
 * caller), the bookkeeping read/write inside `generateSubmitCvPresignUrl`
 * (simplified to pure presign-URL generation), and the "cv" branch of the
 * learner-CMS merged-feedback UNION (dropped -- `cv_generations.feedback` is a
 * differently-shaped jsonb column, not a drop-in replacement; can be
 * re-added as a new UNION branch later if needed).
 *
 * Down migration re-creates both tables' STRUCTURE (columns/FKs/the
 * `cv_submission_status` enum type) from the entities' last-known shape --
 * rows dropped by `up` are gone for good, this is schema-only.
 */
export class DropLegacyCvSubmissionTables1724000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "DropLegacyCvSubmissionTables1724000000000"

    /**
     * Forward migration: drop both legacy tables (attempts first, since it
     * references submissions via FK).
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "cv_submission_attempts";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "cv_submissions";
        `)
    }

    /**
     * Reverse migration: re-create both tables' STRUCTURE only (rows dropped
     * by `up` are gone for good -- this is a best-effort schema-only rollback,
     * not a data restore).
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // the enum type may already exist (never dropped by `up`) -- guard idempotently
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cv_submission_status') THEN
                    CREATE TYPE "cv_submission_status" AS ENUM ('pending', 'uploaded', 'processing', 'done', 'failed');
                END IF;
            END
            $$;
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cv_submissions" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "status" "cv_submission_status" NOT NULL DEFAULT 'pending',
                "file_url" varchar,
                CONSTRAINT "pk_cv_submissions_id" PRIMARY KEY ("id"),
                CONSTRAINT "fk_user_id_cv_submissions_users"
                    FOREIGN KEY ("user_id") REFERENCES "users" ("id")
                    ON DELETE CASCADE
            );
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cv_submission_attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "idempotency_key" varchar(64),
                "cdn_key" varchar(2048) NOT NULL,
                "original_text" text,
                "review_plan" text,
                "detail_feedback" text,
                "score" int,
                "attempt_number" int NOT NULL,
                "processed_at" TIMESTAMPTZ,
                "cv_submission_id" uuid NOT NULL,
                "template_cv_id" uuid,
                CONSTRAINT "pk_cv_submission_attempts_id" PRIMARY KEY ("id"),
                CONSTRAINT "uq_cv_submission_attempts_idempotency_key" UNIQUE ("idempotency_key"),
                CONSTRAINT "fk_cv_submission_id_cv_submission_attempts_cv_submissions"
                    FOREIGN KEY ("cv_submission_id") REFERENCES "cv_submissions" ("id")
                    ON DELETE CASCADE,
                CONSTRAINT "fk_template_cv_id_cv_submission_attempts_template_cvs"
                    FOREIGN KEY ("template_cv_id") REFERENCES "template_cvs" ("id")
                    ON DELETE SET NULL
            );
        `)
    }
}
