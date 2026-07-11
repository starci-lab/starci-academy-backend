import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the nullable `sample_id` column to `rag_playground_sessions` — records
 * which curated catalog entry a visitor picked when indexing via
 * `RagPlaygroundSourceKind.Sample` (see `PublicRagPlaygroundService`'s
 * `SAMPLE_CATALOG`). Null for every other source kind, and for existing rows.
 * Fully backward-compatible — no backfill needed.
 *
 * Dev runs schema via TypeORM `synchronize` (adds the column); this migration
 * applies the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddSampleIdToRagPlaygroundSessions1723800000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddSampleIdToRagPlaygroundSessions1723800000000"

    /**
     * Forward migration: add the nullable `sample_id` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "rag_playground_sessions"
            ADD COLUMN IF NOT EXISTS "sample_id" varchar;
        `)
    }

    /**
     * Reverse migration: drop the `sample_id` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "rag_playground_sessions"
            DROP COLUMN IF EXISTS "sample_id";
        `)
    }
}
