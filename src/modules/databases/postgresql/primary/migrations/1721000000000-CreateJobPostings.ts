import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates `job_postings` — structured "IT job" listings (title, salary,
 * location, apply method), distinct from the freestyle headhunter/consultant
 * relationship (`headhunting_companies` / `consultants`). Rows come from
 * either the `.mount/data/jobs` curated seed pipeline or the public
 * `submitJobPosting` mutation (tagged via `source`); both are live
 * immediately, there is no approval workflow.
 *
 * Also creates the three supporting enums this feature introduces
 * (`job_employment_type`, `job_apply_method`, `job_posting_source`), and
 * guards the `work_mode` enum reused from the profile "open to work" feature
 * in case this migration runs before that enum exists (dev relies on
 * `synchronize` for it; this keeps prod migrations self-sufficient).
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class CreateJobPostings1721000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateJobPostings1721000000000"

    /**
     * Forward migration: create the supporting enums (guarded, `work_mode`
     * included defensively), then the `job_postings` table with its foreign
     * keys to `headhunting_companies` (CASCADE) and `users` (SET NULL).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // reused from the profile "open to work" feature; guarded because dev
        // creates it via `synchronize` and no prior migration owns it
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'work_mode') THEN
                    CREATE TYPE "work_mode" AS ENUM ('remote', 'hybrid', 'onsite');
                END IF;
            END
            $$;
        `)

        // employment arrangement advertised on the posting
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_employment_type') THEN
                    CREATE TYPE "job_employment_type" AS ENUM ('fulltime', 'parttime', 'internship', 'contract');
                END IF;
            END
            $$;
        `)

        // discriminator for which of applyUrl / applyEmail is populated
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_apply_method') THEN
                    CREATE TYPE "job_apply_method" AS ENUM ('external_url', 'email');
                END IF;
            END
            $$;
        `)

        // provenance tag (seeded vs. publicly submitted); not a moderation state
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'job_posting_source') THEN
                    CREATE TYPE "job_posting_source" AS ENUM ('seeded', 'submitted');
                END IF;
            END
            $$;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "job_postings" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "title" varchar(255) NOT NULL,
                "display_id" varchar(255) NOT NULL,
                "description" text,
                "requirements" text,
                "location" varchar(255),
                "work_mode" "work_mode",
                "employment_type" "job_employment_type",
                "salary_min" int,
                "salary_max" int,
                "apply_method" "job_apply_method",
                "apply_url" varchar(2048),
                "apply_email" varchar(255),
                "source" "job_posting_source" NOT NULL DEFAULT 'submitted',
                "expires_at" timestamptz,
                "company_id" uuid NOT NULL,
                "posted_by_user_id" uuid,
                "order_index" int NOT NULL DEFAULT 0,
                "sort_index" int NOT NULL DEFAULT 0,
                CONSTRAINT "pk_job_postings" PRIMARY KEY ("id"),
                CONSTRAINT "uq_job_postings_display_id" UNIQUE ("display_id"),
                CONSTRAINT "fk_company_id_job_postings_headhunting_companies"
                    FOREIGN KEY ("company_id") REFERENCES "headhunting_companies" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_posted_by_user_id_job_postings_users"
                    FOREIGN KEY ("posted_by_user_id") REFERENCES "users" ("id") ON DELETE SET NULL
            );
        `)

        // company-scoped listing + newest-first browse are the two hot paths
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_job_postings_company_id" ON "job_postings" ("company_id");
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_job_postings_created_at" ON "job_postings" ("created_at");
        `)
    }

    /**
     * Reverse migration: drop the table (indexes + FKs go with it), then the
     * three enums this migration owns. `work_mode` is left in place since it
     * is shared with the profile feature and not owned by this migration.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "job_postings";
        `)
        await queryRunner.query("DROP TYPE IF EXISTS \"job_posting_source\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"job_apply_method\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"job_employment_type\";")
    }
}
