import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `flashcard_quiz_sessions` table — one row per resumable
 * flashcard quick-quiz ("Hỏi nhanh") draw, mirroring the SAME resumable-
 * session shape as `mock_interview_sessions`
 * (`CreateMockInterviewSessions` / `AddResumeSupportToMockInterviewSessions`):
 * `startFlashcardQuizSession` persists the drawn card set,
 * `syncFlashcardQuizSessionProgress` periodically snapshots the in-flight
 * position + per-card results, `myInProgressFlashcardQuizSession` reads the
 * resumable draw back, and `completeFlashcardQuizSession` flips it to
 * "completed" once its XP grant succeeds.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateFlashcardQuizSessions1723100000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flashcard_quiz_sessions" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "card_ids" jsonb NOT NULL,
                "current_index" int NOT NULL DEFAULT 0,
                "results" jsonb DEFAULT '[]',
                "status" varchar NOT NULL DEFAULT 'in_progress',
                CONSTRAINT "pk_flashcard_quiz_sessions_id" PRIMARY KEY ("id")
            );
        `)

        // FK to enrollments — deleting an enrollment removes its drawn sessions
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD CONSTRAINT "fk_enrollment_id_flashcard_quiz_sessions"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // fast per-enrollment session scan (mirrors mock_interview_sessions' own index)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flashcard_quiz_sessions_enrollment"
            ON "flashcard_quiz_sessions" ("enrollment_id");
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_flashcard_quiz_sessions_enrollment\";",
        )
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_flashcard_quiz_sessions";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"flashcard_quiz_sessions\";")
    }
}
