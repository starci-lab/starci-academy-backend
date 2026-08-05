import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the installment INTENT columns to `transactions` -- set on a
 * first-cycle `Enroll` transaction when the buyer chose to pay in installments,
 * so the enroll worker can create the `Fixed` installment plan on payment
 * success (see `docs/installment-payment-plan.md` §2.2). Null for every one-shot
 * purchase, so this is fully backward-compatible with existing rows.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically where `synchronize` is off.
 */
export class AddInstallmentIntentToTransactions1723700000000 implements MigrationInterface {
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN IF NOT EXISTS "installment_months" int,
            ADD COLUMN IF NOT EXISTS "installment_markup_percent" int,
            ADD COLUMN IF NOT EXISTS "installment_total_vnd" int;
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP COLUMN IF EXISTS "installment_total_vnd",
            DROP COLUMN IF EXISTS "installment_markup_percent",
            DROP COLUMN IF EXISTS "installment_months";
        `)
    }
}
