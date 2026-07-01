import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the REAL USD price per 1M tokens to `ai_models`:
 * - `price_in_usd_per_mtok` (double precision) — real input `$/M` price.
 * - `price_out_usd_per_mtok` (double precision) — real output `$/M` price.
 *
 * These are the COST source of truth (audit / margin). The `credit_per_mtok_*`
 * billing rates are DERIVED from them at seed (`round(price × 5000)`, i.e.
 * 1 credit ≡ $0.0002 real cost). Free / self-hosted models = 0.
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent.
 */
export class AddUsdPriceToAiModels1720600000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddUsdPriceToAiModels1720600000000"

    /**
     * Forward migration: add both per-million-token USD price columns (default 0).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "price_in_usd_per_mtok" double precision NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models"
            ADD COLUMN IF NOT EXISTS "price_out_usd_per_mtok" double precision NOT NULL DEFAULT 0;
        `)
    }

    /**
     * Reverse migration: drop both USD price columns.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "price_out_usd_per_mtok";
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_models" DROP COLUMN IF EXISTS "price_in_usd_per_mtok";
        `)
    }
}
