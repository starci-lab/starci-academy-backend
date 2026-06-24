import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `email_digest_enabled` (boolean, default true) to `users`. Drives the
 * daily activity-digest email opt-out: the digest cron skips users who set it
 * to false. Backfills existing rows to true so current users keep receiving it.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is disabled.
 */
export class AddUserEmailDigestEnabled1719000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddUserEmailDigestEnabled1719000000000"

    /**
     * Forward migration: add the column with a default (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "email_digest_enabled" boolean NOT NULL DEFAULT true;
        `)
    }

    /**
     * Reverse migration: drop the column (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            DROP COLUMN IF EXISTS "email_digest_enabled";
        `)
    }
}
