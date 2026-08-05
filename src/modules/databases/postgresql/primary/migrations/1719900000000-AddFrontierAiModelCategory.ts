import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `frontier` to the `ai_model_category` Postgres enum -- the top tier above
 * `premium` (Claude Opus 4.8, GPT-5) used for grading `insane` tasks.
 *
 * Dev runs schema via `synchronize` (a fresh DB creates the enum with all
 * values); this migration applies the same value where `synchronize` is
 * disabled (prod). `ADD VALUE IF NOT EXISTS` is idempotent (Postgres 12+).
 */
export class AddFrontierAiModelCategory1719900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddFrontierAiModelCategory1719900000000"

    /**
     * Forward migration: add the `frontier` enum value (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "ai_model_category" ADD VALUE IF NOT EXISTS 'frontier';
        `)
    }

    /**
     * Reverse migration: Postgres cannot drop a single enum value without
     * recreating the type, so this is intentionally a no-op.
     */
    async down(): Promise<void> {
        // no-op -- see doc comment
    }
}
