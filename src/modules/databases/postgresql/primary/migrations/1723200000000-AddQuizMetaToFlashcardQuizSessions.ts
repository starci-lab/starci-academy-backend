import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds quiz-meta columns to `flashcard_quiz_sessions` — "history + stats"
 * (2026-07-08): `myFlashcardQuizHistory` / `myFlashcardQuizStats` read these
 * columns straight off a completed row instead of re-deriving them, so the
 * session's mode/level (chosen at setup) and its coverage/xpEarned/weakTags
 * (only known at `completeFlashcardQuizSession` time) are snapshotted here.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddQuizMetaToFlashcardQuizSessions1723200000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD COLUMN IF NOT EXISTS "mode" varchar NOT NULL DEFAULT 'quick';
        `)
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD COLUMN IF NOT EXISTS "level" varchar NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD COLUMN IF NOT EXISTS "coverage" real NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD COLUMN IF NOT EXISTS "xp_earned" int NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "flashcard_quiz_sessions"
            ADD COLUMN IF NOT EXISTS "weak_tags" jsonb NULL DEFAULT '[]';
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"flashcard_quiz_sessions\" DROP COLUMN IF EXISTS \"weak_tags\";",
        )
        await queryRunner.query(
            "ALTER TABLE \"flashcard_quiz_sessions\" DROP COLUMN IF EXISTS \"xp_earned\";",
        )
        await queryRunner.query(
            "ALTER TABLE \"flashcard_quiz_sessions\" DROP COLUMN IF EXISTS \"coverage\";",
        )
        await queryRunner.query(
            "ALTER TABLE \"flashcard_quiz_sessions\" DROP COLUMN IF EXISTS \"level\";",
        )
        await queryRunner.query(
            "ALTER TABLE \"flashcard_quiz_sessions\" DROP COLUMN IF EXISTS \"mode\";",
        )
    }
}
