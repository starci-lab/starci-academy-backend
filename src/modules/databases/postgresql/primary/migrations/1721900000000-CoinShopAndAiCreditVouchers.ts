import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Coin-shop rename + the two new reward effects (voucher, AI-credit top-up):
 *
 *  1. Renames `users.reward_points` -> `users.coin_balance` (same column, same
 *     data -- the spendable balance is now called "Coin").
 *  2. Renames `daily_quest_completions.reward_points` -> `coin_reward` (the
 *     per-claim snapshot of the same currency).
 *  3. Adds `ai_subscriptions.bonus_credit_5h` / `bonus_credit_week` (int,
 *     default 0) -- the Coin-shop `aiCredit` reward's top-up, additive to the
 *     tier/free allowance for the CURRENT window only.
 *  4. Adds `transactions.voucher_code` (nullable varchar) -- the Coin-shop
 *     voucher applied at checkout, if any.
 *  5. Creates the `voucher_discount_type` (`percent`/`flat`) and
 *     `voucher_status` (`unused`/`reserved`/`used`/`expired`) enums.
 *  6. Creates the `course_vouchers` table -- one row per voucher minted by
 *     redeeming a `kind: "voucher"` reward.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change applies deterministically where `synchronize` is disabled.
 */
export class CoinShopAndAiCreditVouchers1721900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CoinShopAndAiCreditVouchers1721900000000"

    /**
     * Forward migration.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. users.reward_points -> coin_balance
        await queryRunner.query(`
            ALTER TABLE "users"
            RENAME COLUMN "reward_points" TO "coin_balance";
        `)

        // 2. daily_quest_completions.reward_points -> coin_reward
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            RENAME COLUMN "reward_points" TO "coin_reward";
        `)

        // 3. ai_subscriptions bonus-credit columns (default 0 = no top-up yet)
        await queryRunner.query(`
            ALTER TABLE "ai_subscriptions"
            ADD COLUMN IF NOT EXISTS "bonus_credit_5h" int NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS "bonus_credit_week" int NOT NULL DEFAULT 0;
        `)

        // 4. transactions.voucher_code (nullable -- most checkouts use none)
        await queryRunner.query(`
            ALTER TABLE "transactions"
            ADD COLUMN IF NOT EXISTS "voucher_code" varchar(32);
        `)

        // 5. voucher enums
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_discount_type') THEN
                    CREATE TYPE "voucher_discount_type" AS ENUM ('percent', 'flat');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'voucher_status') THEN
                    CREATE TYPE "voucher_status" AS ENUM ('unused', 'reserved', 'used', 'expired');
                END IF;
            END
            $$;
        `)

        // 6. course_vouchers table
        await queryRunner.query(`
            CREATE TABLE "course_vouchers" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "redemption_id" uuid NOT NULL,
                "course_id" uuid,
                "code" varchar(32) NOT NULL,
                "discount_type" "voucher_discount_type" NOT NULL,
                "value" int NOT NULL,
                "status" "voucher_status" NOT NULL DEFAULT 'unused',
                "expires_at" TIMESTAMPTZ NOT NULL,
                "used_at" TIMESTAMPTZ,
                "reserved_transaction_id" uuid,
                CONSTRAINT "pk_course_vouchers_id" PRIMARY KEY ("id")
            );
        `)

        await queryRunner.query(`
            CREATE UNIQUE INDEX "uq_course_vouchers_code"
            ON "course_vouchers" ("code");
        `)
        await queryRunner.query(`
            CREATE INDEX "idx_course_vouchers_user_id"
            ON "course_vouchers" ("user_id");
        `)

        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            ADD CONSTRAINT "fk_user_id_course_vouchers_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            ADD CONSTRAINT "fk_redemption_id_course_vouchers_reward_redemptions"
            FOREIGN KEY ("redemption_id") REFERENCES "reward_redemptions" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            ADD CONSTRAINT "fk_course_id_course_vouchers_courses"
            FOREIGN KEY ("course_id") REFERENCES "courses" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop the voucher table/enums/columns, then undo both renames.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            DROP CONSTRAINT IF EXISTS "fk_course_id_course_vouchers_courses";
        `)
        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            DROP CONSTRAINT IF EXISTS "fk_redemption_id_course_vouchers_reward_redemptions";
        `)
        await queryRunner.query(`
            ALTER TABLE "course_vouchers"
            DROP CONSTRAINT IF EXISTS "fk_user_id_course_vouchers_users";
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_course_vouchers_user_id";
        `)
        await queryRunner.query(`
            DROP INDEX IF EXISTS "uq_course_vouchers_code";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"course_vouchers\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"voucher_status\";")
        await queryRunner.query("DROP TYPE IF EXISTS \"voucher_discount_type\";")

        await queryRunner.query(`
            ALTER TABLE "transactions"
            DROP COLUMN IF EXISTS "voucher_code";
        `)
        await queryRunner.query(`
            ALTER TABLE "ai_subscriptions"
            DROP COLUMN IF EXISTS "bonus_credit_week",
            DROP COLUMN IF EXISTS "bonus_credit_5h";
        `)
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            RENAME COLUMN "coin_reward" TO "reward_points";
        `)
        await queryRunner.query(`
            ALTER TABLE "users"
            RENAME COLUMN "coin_balance" TO "reward_points";
        `)
    }
}
