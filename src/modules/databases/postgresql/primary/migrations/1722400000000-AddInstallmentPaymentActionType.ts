import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `installmentPayment` to the `action_type` Postgres enum + a nullable
 * `transactions.installment_plan_id` column so a "pay next installment cycle"
 * checkout can be linked back to its `installment_plans` row (read by
 * `ReconcileTransactionWorker.finalize()` to call `InstallmentPlanService.
 * recordPayment`). See `docs/installment-payment-plan.md`.
 *
 * ⚠️ `action_type` is used by ≥2 columns (`transactions.action_type`,
 * `jobs.action_type`) — on an existing DB `synchronize` would try to recreate
 * the shared enum type and crash boot. Run this `ALTER TYPE … ADD VALUE`
 * (migration or psql) BEFORE booting. `ADD VALUE IF NOT EXISTS` is idempotent
 * (Postgres 12+).
 */
export class AddInstallmentPaymentActionType1722400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddInstallmentPaymentActionType1722400000000"

    /**
     * Forward migration: add the enum value, then the linking column + its FK.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TYPE "action_type" ADD VALUE IF NOT EXISTS 'installmentPayment';
        `)
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN IF NOT EXISTS "installment_plan_id" uuid;
        `)
        // SET NULL (not CASCADE) — a plan being deleted should never wipe the
        // buyer's payment history
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD CONSTRAINT "fk_installment_plan_id_transactions_installment_plans"
            FOREIGN KEY ("installment_plan_id") REFERENCES "installment_plans" ("id")
            ON DELETE SET NULL ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop the FK + column. Postgres cannot drop a single
     * enum value without recreating the type, so `installmentPayment` is left
     * in `action_type` (harmless no-op, matches the other `ADD VALUE`
     * migrations in this codebase).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP CONSTRAINT IF EXISTS "fk_installment_plan_id_transactions_installment_plans";
        `)
        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP COLUMN IF EXISTS "installment_plan_id";
        `)
    }
}
