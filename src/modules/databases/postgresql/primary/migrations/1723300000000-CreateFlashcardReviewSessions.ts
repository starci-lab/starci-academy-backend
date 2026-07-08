import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `flashcard_review_sessions` table — one row per resumable SM-2
 * flashcard reviewer ("Học thẻ") draw over a single deck, mirroring the SAME
 * resumable-session shape as `flashcard_quiz_sessions`
 * (`CreateFlashcardQuizSessions` / `AddQuizMetaToFlashcardQuizSessions`), but
 * scoped to a deck instead of a whole course and without any cloze-quiz
 * columns: `startFlashcardReviewSession` persists the deck's card order,
 * `syncFlashcardReviewSessionProgress` periodically snapshots the in-flight
 * position + reviewed count, `myInProgressFlashcardReviewSession` reads the
 * resumable draw back (scoped by deck), and `completeFlashcardReviewSession`
 * flips it to "completed".
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateFlashcardReviewSessions1723300000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flashcard_review_sessions" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "deck_id" uuid NOT NULL,
                "card_ids" jsonb NOT NULL,
                "current_index" int NOT NULL DEFAULT 0,
                "reviewed_count" int NOT NULL DEFAULT 0,
                "xp_earned" int NOT NULL DEFAULT 0,
                "status" varchar NOT NULL DEFAULT 'in_progress',
                CONSTRAINT "pk_flashcard_review_sessions_id" PRIMARY KEY ("id")
            );
        `)

        // FK to enrollments — deleting an enrollment removes its drawn sessions
        await queryRunner.query(`
            ALTER TABLE "flashcard_review_sessions"
            ADD CONSTRAINT "fk_enrollment_id_flashcard_review_sessions"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // FK to flashcard_decks — deleting a deck removes its drawn sessions
        await queryRunner.query(`
            ALTER TABLE "flashcard_review_sessions"
            ADD CONSTRAINT "fk_deck_id_flashcard_review_sessions"
            FOREIGN KEY ("deck_id") REFERENCES "flashcard_decks" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // fast per-enrollment session scan (mirrors flashcard_quiz_sessions' own index)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flashcard_review_sessions_enrollment"
            ON "flashcard_review_sessions" ("enrollment_id");
        `)

        // fast per-deck resume lookup — `myInProgressFlashcardReviewSession` is
        // scoped by (enrollment, deck), unlike quiz sessions which are scoped
        // by enrollment alone
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_flashcard_review_sessions_deck"
            ON "flashcard_review_sessions" ("deck_id");
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_flashcard_review_sessions_deck\";",
        )
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_flashcard_review_sessions_enrollment\";",
        )
        await queryRunner.query(`
            ALTER TABLE "flashcard_review_sessions"
            DROP CONSTRAINT IF EXISTS "fk_deck_id_flashcard_review_sessions";
        `)
        await queryRunner.query(`
            ALTER TABLE "flashcard_review_sessions"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_flashcard_review_sessions";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"flashcard_review_sessions\";")
    }
}
