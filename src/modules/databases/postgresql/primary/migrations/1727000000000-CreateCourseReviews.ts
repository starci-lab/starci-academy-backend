import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Create the course review table and the projection that aggregates it.
 *
 * Two things here are deliberate and would be easy to "fix" later into a defect.
 *
 * There is NO unique constraint on `(user_id, course_id)`. A learner may review the same course
 * more than once, and adding the constraint later would not merely block new rows, it would fail
 * the migration against any database where somebody already did.
 *
 * `score` carries a CHECK rather than only a handler guard. The handler is the door callers come
 * through, but a seed, a backfill and a psql session are not callers, and an average is the shape
 * of value where one impossible row is invisible forever.
 */
export class CreateCourseReviews1727000000000 implements MigrationInterface {
    name = "CreateCourseReviews1727000000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "course_reviews" (
                "id"         uuid        NOT NULL DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "course_id"  uuid        NOT NULL,
                "user_id"    uuid        NOT NULL,
                "score"      smallint    NOT NULL,
                "body"       text        NULL,
                CONSTRAINT "pk_course_reviews" PRIMARY KEY ("id"),
                CONSTRAINT "ck_course_reviews_score" CHECK ("score" BETWEEN 1 AND 5),
                CONSTRAINT "fk_course_id_course_reviews_courses"
                    FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE,
                CONSTRAINT "fk_user_id_course_reviews_users"
                    FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
            )
        `)

        // the listing index is composite and ordered because the read path is always "this
        // course's reviews, newest first" -- a plain course_id index would sort every time
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_course_reviews_course_created"
            ON "course_reviews" ("course_id", "created_at" DESC)
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "course_review_stats_projections" (
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "course_id"  uuid        NOT NULL,
                "value"      jsonb       NOT NULL DEFAULT '{}'::jsonb,
                CONSTRAINT "pk_course_review_stats_projections" PRIMARY KEY ("course_id"),
                CONSTRAINT "fk_course_id_course_review_stats_projections_courses"
                    FOREIGN KEY ("course_id") REFERENCES "courses" ("id") ON DELETE CASCADE
            )
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        // the projection goes first: it is derived, so dropping it loses nothing that the review
        // rows cannot rebuild, and dropping it second would leave an aggregate of a table that no
        // longer exists if the second statement failed
        await queryRunner.query(`
            DROP TABLE IF EXISTS "course_review_stats_projections"
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_course_reviews_course_created"
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "course_reviews"
        `)
    }
}
