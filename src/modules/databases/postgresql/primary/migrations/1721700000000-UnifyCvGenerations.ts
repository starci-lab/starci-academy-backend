import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Evolves `cv_generations` into the unified "user CV" entity (WF-03a): adds a
 * `source` enum (generated | uploaded), a place to hold the score/feedback
 * (`score`, `feedback` — filled later by WF-03b), an optional link to a track
 * (`course_id` → `courses`, `SET NULL`), and user customization fields
 * (`label`, `target_role`, `language`, `uploaded_cdn_key`).
 *
 * All added columns are nullable or defaulted so existing rows stay valid:
 * pre-existing generation rows backfill to `source = 'generated'`. No scoring
 * logic and no consumer changes here (those are WF-03b / WF-03c).
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Guarded / idempotent.
 */
export class UnifyCvGenerations1721700000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "UnifyCvGenerations1721700000000"

    /**
     * Forward migration: create the `cv_source` enum (guarded), then add the
     * `source` column (default `generated` so existing rows backfill), the
     * score/feedback holders, the optional `course_id` foreign key (SET NULL),
     * and the customization columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // origin of the CV: system-generated vs. user-uploaded
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cv_source') THEN
                    CREATE TYPE "cv_source" AS ENUM ('generated', 'uploaded');
                END IF;
            END
            $$;
        `)

        // source — default 'generated' backfills every existing generation row
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                ADD COLUMN IF NOT EXISTS "source" "cv_source" NOT NULL DEFAULT 'generated';
        `)

        // shared scoring holders (filled by WF-03b)
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                ADD COLUMN IF NOT EXISTS "score" integer,
                ADD COLUMN IF NOT EXISTS "feedback" jsonb;
        `)

        // optional link to a track + user customization fields
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                ADD COLUMN IF NOT EXISTS "course_id" uuid,
                ADD COLUMN IF NOT EXISTS "label" varchar(255),
                ADD COLUMN IF NOT EXISTS "target_role" varchar(255),
                ADD COLUMN IF NOT EXISTS "language" varchar(64),
                ADD COLUMN IF NOT EXISTS "uploaded_cdn_key" varchar(2048);
        `)

        // optional FK to courses — deleting the course nulls the link (SET NULL),
        // the CV row survives. Guarded so the migration is idempotent.
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_course_id_cv_generations_courses'
                ) THEN
                    ALTER TABLE "cv_generations"
                        ADD CONSTRAINT "fk_course_id_cv_generations_courses"
                        FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE SET NULL;
                END IF;
            END
            $$;
        `)

        // per-track CV lookups (MAX(score) WHERE course_id = track) are a hot path
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_cv_generations_course_id" ON "cv_generations" ("course_id");
        `)
    }

    /**
     * Reverse migration: drop the index + FK, the added columns, then the
     * `cv_source` enum this migration owns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_cv_generations_course_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                DROP CONSTRAINT IF EXISTS "fk_course_id_cv_generations_courses";
        `)
        await queryRunner.query(`
            ALTER TABLE "cv_generations"
                DROP COLUMN IF EXISTS "uploaded_cdn_key",
                DROP COLUMN IF EXISTS "language",
                DROP COLUMN IF EXISTS "target_role",
                DROP COLUMN IF EXISTS "label",
                DROP COLUMN IF EXISTS "course_id",
                DROP COLUMN IF EXISTS "feedback",
                DROP COLUMN IF EXISTS "score",
                DROP COLUMN IF EXISTS "source";
        `)
        await queryRunner.query("DROP TYPE IF EXISTS \"cv_source\";")
    }
}
