import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `archived_at` (nullable timestamptz) to `content_ai_sessions`: an archived
 * conversation drops out of the default history list but is still returned by
 * search, and selection-passage sessions are born-archived so they never clutter
 * the list yet stay searchable. Legacy rows keep null (= active).
 *
 * Dev runs schema via `synchronize` (adds the column automatically); this
 * migration applies the same widening-only change where `synchronize` is disabled
 * (prod). Nullable, no default, no enum -- synchronize-safe. Idempotent.
 */
export class AddArchivedAtToContentAiSessions1724100000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddArchivedAtToContentAiSessions1724100000000"

    /**
     * Forward migration: add the nullable `archived_at` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            ADD COLUMN IF NOT EXISTS "archived_at" timestamptz;
        `)
    }

    /**
     * Reverse migration: drop the `archived_at` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP COLUMN IF EXISTS "archived_at";
        `)
    }
}
