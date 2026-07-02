import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `surface` (new `ai_ceil_surface` enum: `chatbot` / `grading` / `interview`)
 * to `credit_usage_histories` so each charge row records WHICH AI surface
 * triggered it — the "Lịch sử dùng AI" page couldn't tell an interview-grading
 * charge apart from a challenge-grading charge (both showed the same hardcoded
 * "Chấm challenge" label). Nullable: rows recorded before this column existed
 * (and rows from surfaces not yet passing it through) stay null.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class AddSurfaceToCreditUsageHistories1720900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddSurfaceToCreditUsageHistories1720900000000"

    /**
     * Forward migration: create the `ai_ceil_surface` enum (if absent), then add
     * the nullable `surface` column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_ceil_surface') THEN
                    CREATE TYPE "ai_ceil_surface" AS ENUM ('chatbot', 'grading', 'interview');
                END IF;
            END
            $$;
        `)

        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ADD COLUMN IF NOT EXISTS "surface" "ai_ceil_surface";
        `)
    }

    /**
     * Reverse migration: drop the column, then the enum type.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            DROP COLUMN IF EXISTS "surface";
        `)
        await queryRunner.query("DROP TYPE IF EXISTS \"ai_ceil_surface\";")
    }
}
