import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `mock_interview_sessions` table — one row per SERVER-PICKED
 * mock-interview prompt draw (`startMockInterviewSession`), so
 * `gradeMockInterviewSession` can look the draw back up by `id` + enrollment
 * and grade against the prompt/level the server actually handed out instead
 * of trusting the client-sent values (Pha 2 integrity fix). Mirrors the shape
 * of `mock_interview_attempts` (enrollment-anchored from day one, no legacy
 * user_id column) but is a much thinner PRE-grade row.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateMockInterviewSessions1722300000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mock_interview_sessions" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "prompt_id" varchar NOT NULL,
                "prompt_title" varchar NOT NULL,
                "level" varchar,
                "difficulty" varchar NOT NULL,
                "source" varchar NOT NULL,
                CONSTRAINT "pk_mock_interview_sessions_id" PRIMARY KEY ("id")
            );
        `)

        // FK to enrollments — deleting an enrollment removes its drawn sessions
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD CONSTRAINT "fk_enrollment_id_mock_interview_sessions"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)

        // fast per-enrollment session scan (mirrors mock_interview_attempts' index)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mock_interview_sessions_enrollment"
            ON "mock_interview_sessions" ("enrollment_id");
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"idx_mock_interview_sessions_enrollment\";",
        )
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP CONSTRAINT IF EXISTS "fk_enrollment_id_mock_interview_sessions";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"mock_interview_sessions\";")
    }
}
