import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `user_flashcard_course_stats_projections` CQRS read-model table
 * — one row per enrollment, shared by BOTH the flashcard quick-quiz and
 * review recap surfaces, holding `{ quizTrend, quizByTag, quizByDeck,
 * reviewByDeck }` in the inherited jsonb `value`. The inherited `updated_at`
 * drives the read-time TTL lazy-refresh — mirrors
 * `1719600000000-CreateUserChallengeProgressProjection`'s enrollment-keyed
 * shape exactly.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is
 * off.
 */
export class CreateUserFlashcardCourseStatsProjections1723400000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // one row per enrollment (quiz + review share the same grain)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_flashcard_course_stats_projections" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "default_locale" "locale" NOT NULL DEFAULT 'en',
                "enrollment_id" uuid NOT NULL,
                CONSTRAINT "pk_user_flashcard_course_stats_projections_enrollment_id" PRIMARY KEY ("enrollment_id")
            );
        `)

        // FK to enrollments — deleting an enrollment removes its flashcard-course-stats projection row
        await queryRunner.query(`
            ALTER TABLE "user_flashcard_course_stats_projections"
            ADD CONSTRAINT "fk_enrollment_id_user_flashcard_course_stats_projections"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_flashcard_course_stats_projections"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_user_flashcard_course_stats_projections";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"user_flashcard_course_stats_projections\";")
    }
}
