import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `interview_session_id` (nullable uuid) to `interview_attempts` — the
 * client-generated id that groups all answers from one interview run (5/10
 * questions) back into a single session, so cross-session history can list runs
 * rather than individual answers. Nullable so legacy rows (logged before
 * session grouping) keep working; they simply don't surface in the run list.
 *
 * Dev runs schema via `synchronize` (adds the column + index); this migration
 * applies the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddSessionIdToInterviewAttempts1720500000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddSessionIdToInterviewAttempts1720500000000"

    /**
     * Forward migration: add the nullable `interview_session_id` column + its index.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "interview_attempts"
            ADD COLUMN IF NOT EXISTS "interview_session_id" uuid;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_interview_attempts_session"
            ON "interview_attempts" ("interview_session_id");
        `)
    }

    /**
     * Reverse migration: drop the index + the `interview_session_id` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_interview_attempts_session";
        `)
        await queryRunner.query(`
            ALTER TABLE "interview_attempts" DROP COLUMN IF EXISTS "interview_session_id";
        `)
    }
}
