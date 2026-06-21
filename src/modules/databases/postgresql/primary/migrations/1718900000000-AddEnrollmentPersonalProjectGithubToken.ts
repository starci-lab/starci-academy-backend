import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the encrypted private-repo GitHub token columns to `enrollments`:
 * `personal_project_github_token_encrypted` (AES-256-GCM JSON payload, server-only) and
 * `personal_project_github_token_last4` (masked UI hint). Lets the milestone-task grader clone a
 * PRIVATE personal-project repo with the learner's own token (falling back to the org token).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so the same change
 * can be applied deterministically in environments where `synchronize` is disabled.
 */
export class AddEnrollmentPersonalProjectGithubToken1718900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddEnrollmentPersonalProjectGithubToken1718900000000"

    /**
     * Forward migration: add the two nullable columns (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD COLUMN IF NOT EXISTS "personal_project_github_token_encrypted" text;
        `)
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD COLUMN IF NOT EXISTS "personal_project_github_token_last4" varchar(4);
        `)
    }

    /**
     * Reverse migration: drop the columns in reverse order (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            DROP COLUMN IF EXISTS "personal_project_github_token_last4";
        `)
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            DROP COLUMN IF EXISTS "personal_project_github_token_encrypted";
        `)
    }
}
