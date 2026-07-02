import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates `cv_generations` — one row per **CV generation run**, where the user
 * asks the system to build a new CV from free-text input (`mode` = `generate`)
 * or revise an existing uploaded submission (`mode` = `revise`, referencing the
 * legacy `cv_submissions` row via `source_cv_submission_id`). Distinct from the
 * legacy upload/review tables (`cv_submissions` / `cv_submission_attempts`),
 * which stay in place — this is a generation, not a graded review, so there is
 * no score / detail feedback here.
 *
 * Also creates the two enums this feature introduces (`cv_generation_mode`,
 * `cv_generation_status`), each guarded so the migration is idempotent and
 * self-sufficient in prod.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class CreateUserCvGenerations1721100000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateUserCvGenerations1721100000000"

    /**
     * Forward migration: create the two supporting enums (guarded), then the
     * `cv_generations` table with its foreign key to `users` (CASCADE) and an
     * index on `user_id`.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // whether the run builds a new CV or revises an existing submission
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cv_generation_mode') THEN
                    CREATE TYPE "cv_generation_mode" AS ENUM ('generate', 'revise');
                END IF;
            END
            $$;
        `)

        // processing status of the generation run
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'cv_generation_status') THEN
                    CREATE TYPE "cv_generation_status" AS ENUM ('pending', 'processing', 'done', 'failed');
                END IF;
            END
            $$;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "cv_generations" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "user_id" uuid NOT NULL,
                "mode" "cv_generation_mode" NOT NULL,
                "status" "cv_generation_status" NOT NULL DEFAULT 'pending',
                "source_cv_submission_id" uuid,
                "extra_prompts" text,
                "structured_data" jsonb,
                "latex_cdn_key" varchar(2048),
                "processed_at" timestamptz,
                "error_message" text,
                CONSTRAINT "pk_cv_generations" PRIMARY KEY ("id"),
                CONSTRAINT "fk_user_id_cv_generations_users"
                    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
            );
        `)

        // user-scoped listing (a user's generation history) is the hot path
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_cv_generations_user_id" ON "cv_generations" ("user_id");
        `)
    }

    /**
     * Reverse migration: drop the table (indexes + FK go with it), then the
     * two enums this migration owns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "cv_generations";
        `)
        await queryRunner.query("DROP TYPE IF EXISTS \"cv_generation_status\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"cv_generation_mode\";")
    }
}
