import type {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/** Prevent more than one persisted grade for the same mock-interview session. */
export class EnforceMockInterviewGradeIdempotency1726900000000 implements MigrationInterface {
    name = "EnforceMockInterviewGradeIdempotency1726900000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_mock_interview_attempts_session_id"
            ON "mock_interview_attempts" ("session_id")
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "uq_mock_interview_attempts_session_id"
        `)
    }
}
