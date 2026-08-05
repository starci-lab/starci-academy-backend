import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the QUIZ anchor to content-AI sessions: `origin_quiz_id` (nullable, FK ->
 * flashcard_decks) so a quiz-scope conversation persists alongside content / task /
 * challenge / foundation / course sessions. A StarCi quiz is drawn from a flashcard
 * deck, so the anchor references `flashcard_decks`. Additive + nullable only.
 *
 * Dev + prod run schema via TypeORM `synchronize` (which applies the entity change
 * at boot); this migration exists so the SAME change applies deterministically
 * where `synchronize` is off. Nullable, no PG enum -- synchronize-safe. Idempotent.
 */
export class AddQuizAnchorToContentAiSessions1724400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddQuizAnchorToContentAiSessions1724400000000"

    /**
     * Forward migration: add the nullable `origin_quiz_id` column + FK + index.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
                ADD COLUMN IF NOT EXISTS "origin_quiz_id" uuid;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_sessions"
                ADD CONSTRAINT "fk_origin_quiz_id_content_ai_sessions_flashcard_decks"
                FOREIGN KEY ("origin_quiz_id") REFERENCES "flashcard_decks"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_origin_quiz_id"
            ON "content_ai_sessions" ("origin_quiz_id");
        `)
    }

    /**
     * Reverse migration: drop the index, FK and column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_sessions_origin_quiz_id\";")
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP CONSTRAINT IF EXISTS "fk_origin_quiz_id_content_ai_sessions_flashcard_decks";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions" DROP COLUMN IF EXISTS "origin_quiz_id";
        `)
    }
}
