import {
    MigrationInterface, QueryRunner
} from "typeorm"

/** Adds the expand-first persistence and integrity boundary for cloze contract v1. */
export class AddClozeContractToFlashcardQuizSessions1787800000000 implements MigrationInterface {
    name = "AddClozeContractToFlashcardQuizSessions1787800000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM xp_histories
                     WHERE source = 'flashcardQuiz'
                     GROUP BY source, ref_id HAVING COUNT(*) > 1
                ) THEN
                    RAISE EXCEPTION 'duplicate flashcardQuiz XP references block cloze migration';
                END IF;
            END $$;
        `)
        await queryRunner.query(`
            ALTER TABLE flashcard_quiz_sessions
                ADD COLUMN IF NOT EXISTS contract_version integer,
                ADD COLUMN IF NOT EXISTS start_request_id uuid,
                ADD COLUMN IF NOT EXISTS start_request_fingerprint char(64),
                ADD COLUMN IF NOT EXISTS quiz_items jsonb,
                ADD COLUMN IF NOT EXISTS answer_state jsonb NOT NULL DEFAULT '[]'::jsonb,
                ADD COLUMN IF NOT EXISTS answer_version integer NOT NULL DEFAULT 0,
                ADD COLUMN IF NOT EXISTS score_snapshot jsonb,
                ADD COLUMN IF NOT EXISTS invalid_reason varchar
        `)
        await queryRunner.query(`
            WITH ranked AS (
                SELECT id,
                       row_number() OVER (
                           PARTITION BY enrollment_id
                           ORDER BY updated_at DESC, created_at DESC, id DESC
                       ) AS position
                  FROM flashcard_quiz_sessions
                 WHERE status = 'in_progress'
            )
            UPDATE flashcard_quiz_sessions session
               SET status = 'abandoned',
                   invalid_reason = 'legacy_duplicate_active'
              FROM ranked
             WHERE session.id = ranked.id
               AND ranked.position > 1
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_flashcard_quiz_v1_shape') THEN
                ALTER TABLE flashcard_quiz_sessions
                ADD CONSTRAINT chk_flashcard_quiz_v1_shape CHECK (
                    contract_version IS DISTINCT FROM 1 OR (
                        start_request_id IS NOT NULL
                        AND start_request_fingerprint ~ '^[0-9a-f]{64}$'
                        AND jsonb_typeof(quiz_items) = 'array'
                        AND jsonb_array_length(quiz_items) > 0
                        AND jsonb_typeof(answer_state) = 'array'
                        AND answer_version >= 0
                    )
                );
              END IF;
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_flashcard_quiz_v1_completed_score') THEN
                ALTER TABLE flashcard_quiz_sessions
                ADD CONSTRAINT chk_flashcard_quiz_v1_completed_score CHECK (
                    contract_version IS DISTINCT FROM 1
                    OR status <> 'completed'
                    OR score_snapshot IS NOT NULL
                );
              END IF;
            END $$;
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_flashcard_quiz_active_enrollment
                ON flashcard_quiz_sessions (enrollment_id)
                WHERE status = 'in_progress'
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_flashcard_quiz_start_request
                ON flashcard_quiz_sessions (enrollment_id, start_request_id)
                WHERE start_request_id IS NOT NULL
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS uq_xp_flashcard_quiz_session
                ON xp_histories (source, ref_id)
                WHERE source = 'flashcardQuiz'
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP INDEX IF EXISTS uq_xp_flashcard_quiz_session")
        await queryRunner.query("DROP INDEX IF EXISTS uq_flashcard_quiz_start_request")
        await queryRunner.query("DROP INDEX IF EXISTS uq_flashcard_quiz_active_enrollment")
        await queryRunner.query("ALTER TABLE flashcard_quiz_sessions DROP CONSTRAINT IF EXISTS chk_flashcard_quiz_v1_completed_score")
        await queryRunner.query("ALTER TABLE flashcard_quiz_sessions DROP CONSTRAINT IF EXISTS chk_flashcard_quiz_v1_shape")
    }
}
