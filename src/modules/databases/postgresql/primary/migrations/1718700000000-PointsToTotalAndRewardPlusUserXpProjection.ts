import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Splits the single `users.points` balance into two semantically distinct
 * columns and lands the supporting XP machinery:
 *
 *  1. Renames `users.points` → `users.total_points` (now = total lifetime XP).
 *  2. Adds `users.reward_points` (int, default 0) — the spendable balance.
 *  3. Backfills from the `xp_histories` ledger:
 *       - `total_points`  = COALESCE(SUM(amount), 0) per user;
 *       - `reward_points` = COALESCE(SUM(points), 0) per user.
 *     (A user with no ledger rows keeps total_points = 0 and reward_points = 0.)
 *  4. Adds the `'coding'` value to the `xp_source` enum so coding solves can be
 *     ledgered through `writeXpHistory`.
 *  5. Creates the `user_xp_projections` CQRS read-model table.
 *
 * NOTE: `transaction = false` — Postgres `ALTER TYPE ... ADD VALUE` cannot run
 * inside a transaction block, so this migration manages its own statements.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class PointsToTotalAndRewardPlusUserXpProjection1718700000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "PointsToTotalAndRewardPlusUserXpProjection1718700000000"

    /** ALTER TYPE ADD VALUE forbids a surrounding transaction. */
    transaction = false as const

    /**
     * Forward migration: rename + add column, backfill, extend the enum, create
     * the projection table.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // 1. rename the existing balance column to its total-XP meaning (idempotent guard)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'points'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'total_points'
                ) THEN
                    ALTER TABLE "users" RENAME COLUMN "points" TO "total_points";
                END IF;
            END
            $$;
        `)

        // 2. add the spendable reward-points column (default 0)
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "reward_points" int NOT NULL DEFAULT 0;
        `)

        // 3. backfill both balances from the xp_histories ledger:
        //    total_points = SUM(amount), reward_points = SUM(points), per user.
        await queryRunner.query(`
            UPDATE "users" u
            SET "total_points"  = COALESCE(agg.sum_amount, 0),
                "reward_points" = COALESCE(agg.sum_points, 0)
            FROM (
                SELECT x.user_id,
                       SUM(x.amount) AS sum_amount,
                       SUM(x.points) AS sum_points
                FROM "xp_histories" x
                GROUP BY x.user_id
            ) agg
            WHERE agg.user_id = u.id;
        `)

        // 4. extend the xp_source enum with 'coding' (idempotent; outside a tx)
        await queryRunner.query(`
            ALTER TYPE "xp_source" ADD VALUE IF NOT EXISTS 'coding';
        `)

        // 5. create the user_xp_projections read-model table (one row per user)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "user_xp_projections" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "value" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "default_locale" "locale" NOT NULL DEFAULT 'en',
                "user_id" uuid NOT NULL,
                CONSTRAINT "pk_user_xp_projections_user_id" PRIMARY KEY ("user_id")
            );
        `)

        // FK to users — deleting a user removes their XP projection row
        await queryRunner.query(`
            ALTER TABLE "user_xp_projections"
            ADD CONSTRAINT "fk_user_id_user_xp_projections_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop the projection table, the reward column, and rename
     * total_points back to points. The enum value 'coding' is intentionally NOT
     * removed (Postgres cannot drop an enum value once added).
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // drop the projection table (FK falls with it)
        await queryRunner.query(`
            ALTER TABLE "user_xp_projections"
            DROP CONSTRAINT IF EXISTS "fk_user_id_user_xp_projections_users";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"user_xp_projections\";")

        // drop the reward-points column
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "reward_points";
        `)

        // rename total_points back to points (idempotent guard)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'total_points'
                ) AND NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'users' AND column_name = 'points'
                ) THEN
                    ALTER TABLE "users" RENAME COLUMN "total_points" TO "points";
                END IF;
            END
            $$;
        `)
    }
}
