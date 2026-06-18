import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `daily_quest_completions` table backing the daily-quest feature
 * (one claimed quest per user per Asia/Ho_Chi_Minh calendar day), with the user
 * foreign key (ON DELETE CASCADE), the per-user lookup index, and the
 * `(user_id, quest_date)` unique constraint that makes a claim idempotent.
 *
 * It also extends the `xp_source` enum with the `dailyQuest` value the claim
 * grant uses as its ledger source. `ALTER TYPE ... ADD VALUE` cannot run inside
 * a transaction block, so this migration opts out of the wrapping transaction.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists
 * so the same change can be applied deterministically in environments where
 * `synchronize` is disabled.
 */
export class CreateDailyQuestCompletions1718800000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateDailyQuestCompletions1718800000000"

    /**
     * Disable the wrapping transaction: `ALTER TYPE ... ADD VALUE` is not allowed
     * inside a transaction block.
     */
    transaction = false as const

    /**
     * Forward migration: extend the xp_source enum, create the table, FK, index
     * and unique constraint.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // extend the xp_source enum with the daily-quest grant source (idempotent)
        await queryRunner.query(`
            ALTER TYPE "xp_source" ADD VALUE IF NOT EXISTS 'dailyQuest';
        `)

        // create the table; quest_date is the VN calendar day (no time component)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "daily_quest_completions" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_id" uuid NOT NULL,
                "quest_date" date NOT NULL,
                "reward_points" int NOT NULL,
                "completed_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                CONSTRAINT "pk_daily_quest_completions_id" PRIMARY KEY ("id")
            );
        `)

        // per-user index — every read filters by user_id
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_daily_quest_completions_user_id"
            ON "daily_quest_completions" ("user_id");
        `)

        // one claim per user per VN day — the idempotency backstop for the claim mutation
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            ADD CONSTRAINT "uq_daily_quest_completions_user_id_quest_date"
            UNIQUE ("user_id", "quest_date");
        `)

        // FK to users — deleting a user removes their completions
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            ADD CONSTRAINT "fk_user_id_daily_quest_completions_users"
            FOREIGN KEY ("user_id") REFERENCES "users" ("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
    }

    /**
     * Reverse migration: drop FK, unique constraint, index and table.
     *
     * The added `xp_source` enum value is intentionally NOT removed — Postgres
     * cannot drop a single enum value, and dropping it could orphan ledger rows.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // drop FK + unique constraint before the table so they do not block the drop
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            DROP CONSTRAINT IF EXISTS "fk_user_id_daily_quest_completions_users";
        `)
        await queryRunner.query(`
            ALTER TABLE "daily_quest_completions"
            DROP CONSTRAINT IF EXISTS "uq_daily_quest_completions_user_id_quest_date";
        `)

        // drop the lookup index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_daily_quest_completions_user_id";
        `)

        // drop the table
        await queryRunner.query("DROP TABLE IF EXISTS \"daily_quest_completions\";")
    }
}
