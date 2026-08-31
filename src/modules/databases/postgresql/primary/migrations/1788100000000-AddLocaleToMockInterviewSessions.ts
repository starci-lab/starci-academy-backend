import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Persists the UI locale so asynchronous interview grading uses the learner's language. */
export class AddLocaleToMockInterviewSessions1788100000000 implements MigrationInterface {
    name = "AddLocaleToMockInterviewSessions1788100000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            ADD COLUMN IF NOT EXISTS "locale" varchar NOT NULL DEFAULT 'en'
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "mock_interview_sessions"
            DROP COLUMN IF EXISTS "locale"
        `)
    }
}
