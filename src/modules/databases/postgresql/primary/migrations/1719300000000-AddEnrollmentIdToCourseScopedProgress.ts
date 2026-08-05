import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Re-keys the course-scoped progress tables from `user_id` to `enrollment_id`,
 * making "enrollment" (the user x course relationship) the anchor for all
 * per-course progress -- mirroring `user_milestone_tasks`, which is already keyed
 * by `enrollment_id`.
 *
 * Six tables are affected:
 *  1. `user_contents`                    (lesson reads)
 *  2. `user_challenge_submissions`       (challenge submissions)
 *  3. `user_course_progress_projections` (per-course progress projection)
 *  4. `user_flashcard_reviews`           (SRS reviews)
 *  5. `interview_attempts`               (interview practice attempts)
 *  6. `content_reactions`                (per-lesson reactions)
 *
 * This is the SCHEMA phase of a big-bang migration and is intentionally
 * TRANSITIONAL: for each table it ADDs a NULLABLE `enrollment_id uuid` and
 * makes the existing `user_id` NULLABLE (DROP NOT NULL) so that both columns
 * coexist. `enrollment_id` is the column writes/reads use going forward; the
 * `user_id` column/relation is kept for now and dropped in a separate later
 * phase. Leaving `enrollment_id` nullable lets `synchronize`/existing rows that
 * have not yet been backfilled survive.
 *
 * Backfill of `enrollment_id` (including creating trial enrollments for legacy
 * rows) is done by the companion script `scratch/backfill-enrollment-id.sql`,
 * not inside this migration -- it depends on derivation joins per table and is
 * run/verified out of band.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is
 * disabled (prod). Every statement is idempotent (`IF [NOT] EXISTS`).
 */
export class AddEnrollmentIdToCourseScopedProgress1719300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddEnrollmentIdToCourseScopedProgress1719300000000"

    /**
     * The six course-scoped progress tables being re-keyed.
     *
     * `dropUserNotNull` is `false` only for `user_course_progress_projections`,
     * whose `user_id` is part of the composite primary key (user_id, course_id)
     * and therefore cannot be made nullable without rebuilding the PK -- that is
     * a separate later phase. The other five get `user_id` relaxed to nullable.
     */
    private readonly tables: ReadonlyArray<{
        name: string
        dropUserNotNull: boolean
    }> = [
            {
                name: "user_contents", dropUserNotNull: true,
            },
            {
                name: "user_challenge_submissions", dropUserNotNull: true,
            },
            {
                name: "user_course_progress_projections", dropUserNotNull: false,
            },
            {
                name: "user_flashcard_reviews", dropUserNotNull: true,
            },
            {
                name: "interview_attempts", dropUserNotNull: true,
            },
            {
                name: "content_reactions", dropUserNotNull: true,
            },
        ]

    /**
     * Forward migration: for each table add a nullable `enrollment_id uuid` and
     * relax `user_id` to nullable (both idempotent). `user_id` on
     * `user_course_progress_projections` is left NOT NULL because it is a PK
     * column. No data is moved here -- the backfill script populates
     * `enrollment_id` afterwards.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`
                ALTER TABLE "${table.name}"
                ADD COLUMN IF NOT EXISTS "enrollment_id" uuid;
            `)

            if (table.dropUserNotNull) {
                await queryRunner.query(`
                    ALTER TABLE "${table.name}"
                    ALTER COLUMN "user_id" DROP NOT NULL;
                `)
            }
        }
    }

    /**
     * Reverse migration: drop the `enrollment_id` columns (idempotent). The
     * `user_id` NOT NULL constraint is intentionally NOT re-added -- existing
     * rows may legitimately have a null `user_id` once writes switch to
     * `enrollment_id`, and restoring NOT NULL could fail.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`
                ALTER TABLE "${table.name}"
                DROP COLUMN IF EXISTS "enrollment_id";
            `)
        }
    }
}
