import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `user_challenge_progress_projections` CQRS read-model table -- one
 * row per enrollment, holding the per-challenge progress aggregate
 * (`{ completionTasks: [...] }`) in the jsonb `value`. The inherited `updated_at`
 * drives the read-time TTL lazy-refresh; this projection table replaces the old
 * Redis `challenge.submission.progress` cache (the table IS the cache now).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateUserChallengeProgressProjection1719600000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        // one row per enrollment (the per-course progress anchor going forward)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_challenge_progress_projections" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "default_locale" "locale" NOT NULL DEFAULT 'en',
                "enrollment_id" uuid NOT NULL,
                CONSTRAINT "pk_user_challenge_progress_projections_enrollment_id" PRIMARY KEY ("enrollment_id")
            );
        `)

        // FK to enrollments -- deleting an enrollment removes its progress projection row
        await queryRunner.query(`
            ALTER TABLE "user_challenge_progress_projections"
            ADD CONSTRAINT "fk_enrollment_id_user_challenge_progress_projections"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "user_challenge_progress_projections"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_user_challenge_progress_projections";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"user_challenge_progress_projections\";")
    }
}
