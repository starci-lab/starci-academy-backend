import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the `discount_percent` column to `transactions` (int, NOT NULL, default 0)
 * to persist the loyalty discount applied at checkout. A plain ADD COLUMN with a
 * constant default is transaction-safe, so this migration keeps the default
 * wrapping transaction. The `IF NOT EXISTS` guard makes a re-run idempotent.
 */
export class AddTransactionDiscountPercent1718900000000 implements MigrationInterface {
    name = "AddTransactionDiscountPercent1718900000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"transactions\" ADD COLUMN IF NOT EXISTS \"discount_percent\" int NOT NULL DEFAULT 0;",
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"transactions\" DROP COLUMN IF EXISTS \"discount_percent\";",
        )
    }
}
