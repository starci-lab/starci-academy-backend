import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Relaxes `content_comments.content_id` to nullable and adds a nullable `course_id`
 * FK so a comment can be either a per-lesson question (content set, course null) or
 * a course-general question with no specific lesson (course-wide question -- course set,
 * content null). A CHECK constraint enforces exactly one of the two is ever set.
 *
 * Dev runs schema via `synchronize` (relaxes the column + adds course_id + index);
 * this migration applies the same change where `synchronize` is disabled (prod).
 * Idempotent. No existing rows are affected (all have content_id set, course_id null
 * -- satisfies the CHECK by construction).
 */
export class AllowCourseGeneralContentComments1722900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AllowCourseGeneralContentComments1722900000000"

    /**
     * Forward migration: relax content_id, add course_id + FK + index + CHECK.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_comments"
            ALTER COLUMN "content_id" DROP NOT NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_comments"
            ADD COLUMN IF NOT EXISTS "course_id" uuid;
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'fk_course_id_content_comments_courses'
                ) THEN
                    ALTER TABLE "content_comments"
                    ADD CONSTRAINT "fk_course_id_content_comments_courses"
                    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE;
                END IF;
            END $$;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_content_comments_course_parent"
            ON "content_comments" ("course_id", "parent_comment_id");
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'chk_content_comments_exactly_one_scope'
                ) THEN
                    ALTER TABLE "content_comments"
                    ADD CONSTRAINT "chk_content_comments_exactly_one_scope"
                    CHECK (
                        (content_id IS NOT NULL AND course_id IS NULL)
                        OR (content_id IS NULL AND course_id IS NOT NULL)
                    );
                END IF;
            END $$;
        `)
    }

    /**
     * Reverse migration: drop the CHECK, index, course_id column, and restore
     * content_id NOT NULL (only safe if no course-general rows exist).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_comments"
            DROP CONSTRAINT IF EXISTS "chk_content_comments_exactly_one_scope";
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_content_comments_course_parent";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_comments"
            DROP CONSTRAINT IF EXISTS "fk_course_id_content_comments_courses";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_comments" DROP COLUMN IF EXISTS "course_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_comments"
            ALTER COLUMN "content_id" SET NOT NULL;
        `)
    }
}
