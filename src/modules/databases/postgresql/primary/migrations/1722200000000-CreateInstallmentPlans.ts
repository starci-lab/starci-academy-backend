import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `installment_plans` table backing installment
 * payment -- a `Fixed` new-purchase schedule or a `FlexiblePool` legacy
 * Pioneer arrears balance, both enforced by the same daily cron. See
 * `docs/installment-payment-plan.md` for the full design.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration
 * exists so the same change can be applied deterministically where
 * `synchronize` is disabled (prod).
 */
export class CreateInstallmentPlans1722200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateInstallmentPlans1722200000000"

    /**
     * Forward migration: create both enums, the table, its FKs and indexes.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // discriminator enums first -- the table's columns reference them by type
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_plan_type') THEN
                    CREATE TYPE "installment_plan_type" AS ENUM ('fixed', 'flexible_pool');
                END IF;
            END
            $$;
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'installment_plan_status') THEN
                    CREATE TYPE "installment_plan_status" AS ENUM ('active', 'overdue', 'defaulted', 'completed');
                END IF;
            END
            $$;
        `)

        await queryRunner.query(`
            CREATE TABLE "installment_plans" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "origin_transaction_id" uuid,
                "locked_course_ids" jsonb NOT NULL DEFAULT '[]'::jsonb,
                "plan_type" "installment_plan_type" NOT NULL,
                "status" "installment_plan_status" NOT NULL DEFAULT 'active',
                "months" int,
                "monthly_amount_vnd" int,
                "total_amount_vnd" int,
                "markup_percent" int,
                "installments_paid" int NOT NULL DEFAULT 0,
                "remaining_vnd" int,
                "min_payment_floor_vnd" int NOT NULL DEFAULT 500000,
                "min_payment_percent" int NOT NULL DEFAULT 10,
                "next_due_at" TIMESTAMPTZ NOT NULL,
                "second_reminder_after_days" int NOT NULL DEFAULT 7,
                "lockout_after_days" int NOT NULL DEFAULT 14,
                "due_reminded_at" TIMESTAMPTZ,
                "second_reminded_at" TIMESTAMPTZ,
                CONSTRAINT "pk_installment_plans_id" PRIMARY KEY ("id")
            );
        `)

        // per-user lookup (surface "My installment plan") + cron's daily due-scan
        await queryRunner.query(`
            CREATE INDEX "idx_installment_plans_user_id"
            ON "installment_plans" ("user_id");
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_installment_plans_next_due_at"
            ON "installment_plans" ("next_due_at")
            WHERE "status" IN ('active', 'overdue');
        `)

        await queryRunner.query(`
            ALTER TABLE "installment_plans"
            ADD CONSTRAINT "fk_user_id_installment_plans_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
        // nullable -- a backfilled FlexiblePool (legacy Pioneer arrears) has no originating checkout
        await queryRunner.query(`
            ALTER TABLE "installment_plans"
            ADD CONSTRAINT "fk_origin_transaction_id_installment_plans_transactions"
            FOREIGN KEY ("origin_transaction_id") REFERENCES "transactions" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop FKs, indexes, table and both enums in dependency order.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "installment_plans"
            DROP CONSTRAINT IF EXISTS "fk_origin_transaction_id_installment_plans_transactions";
        `)
        await queryRunner.query(`
            ALTER TABLE "installment_plans"
            DROP CONSTRAINT IF EXISTS "fk_user_id_installment_plans_users";
        `)
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_installment_plans_next_due_at\";")
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_installment_plans_user_id\";")
        await queryRunner.query("DROP TABLE IF EXISTS \"installment_plans\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"installment_plan_status\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"installment_plan_type\";")
    }
}
