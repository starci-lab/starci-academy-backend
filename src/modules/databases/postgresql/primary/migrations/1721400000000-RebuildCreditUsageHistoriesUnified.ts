import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Rebuilds `credit_usage_histories` around the UNIFIED credit system: the
 * table is now written from exactly ONE place — `AiEntitlementService.consume`,
 * atomically alongside the `ai_subscriptions` debit — instead of being written
 * ad-hoc from several grade-step services while a SEPARATE, tier-blind gate
 * (`CreditUsageService`, deleted) read it back for quota decisions.
 *
 * Changes:
 * - DROP the `attempt`/`user_challenge_submission_attempt_id` FK — a charge can
 *   happen before the attempt row exists (grade-time, before the complete step
 *   persists it), so the relation was frequently null anyway; the ledger now
 *   correlates by `userId` + `createdAt` + `surface`/`task` instead.
 * - `surface` becomes NOT NULL — every charge now always has one (consume()
 *   requires it).
 * - Add `task` (finer-grained than `surface`, e.g. `challenge_grading` vs
 *   `task_grading`), `prompt_tokens`, `completion_tokens`, `attempts` for a
 *   richer, more useful history entry per the product's request.
 * - Existing rows are CLEARED (`TRUNCATE`) — they were written by the old,
 *   inconsistent multi-writer system and are not meaningfully comparable to
 *   the new unified rows (this is an explicit, intentional reset of the
 *   "Lịch sử dùng AI" history, not a data-loss bug).
 *
 * Dev runs schema via `synchronize`; this migration applies the same change
 * where `synchronize` is disabled (prod).
 */
export class RebuildCreditUsageHistoriesUnified1721400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "RebuildCreditUsageHistoriesUnified1721400000000"

    /**
     * Forward migration.
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // explicit, intentional reset — old rows came from a multi-writer, partially
        // tier-blind system and are not worth carrying forward into the unified ledger
        await queryRunner.query("TRUNCATE TABLE \"credit_usage_histories\";")

        // drop the attempt FK — a charge can happen before the attempt row exists
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            DROP CONSTRAINT IF EXISTS "fk_attempt_id_credit_usage_histories_attempts";
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            DROP COLUMN IF EXISTS "user_challenge_submission_attempt_id";
        `)

        // surface is now always known — make it required
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ALTER COLUMN "surface" SET NOT NULL;
        `)

        // finer-grained task than surface
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_model_task') THEN
                    CREATE TYPE "ai_model_task" AS ENUM (
                        'chatting', 'grading', 'embedding', 'cv_generating',
                        'task_grading', 'challenge_grading'
                    );
                END IF;
            END
            $$;
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ADD COLUMN IF NOT EXISTS "task" "ai_model_task";
        `)

        // richer per-charge detail
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ADD COLUMN IF NOT EXISTS "prompt_tokens" int,
            ADD COLUMN IF NOT EXISTS "completion_tokens" int,
            ADD COLUMN IF NOT EXISTS "attempts" int;
        `)
    }

    /**
     * Reverse migration: restore the old shape (nullable surface, attempt FK,
     * drop the new columns). Data cleared by `up` is NOT recoverable.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            DROP COLUMN IF EXISTS "prompt_tokens",
            DROP COLUMN IF EXISTS "completion_tokens",
            DROP COLUMN IF EXISTS "attempts",
            DROP COLUMN IF EXISTS "task";
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ALTER COLUMN "surface" DROP NOT NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ADD COLUMN IF NOT EXISTS "user_challenge_submission_attempt_id" uuid;
        `)
        await queryRunner.query(`
            ALTER TABLE "credit_usage_histories"
            ADD CONSTRAINT "fk_attempt_id_credit_usage_histories_attempts"
            FOREIGN KEY ("user_challenge_submission_attempt_id")
            REFERENCES "user_challenge_submission_attempts" ("id")
            ON DELETE CASCADE;
        `)
    }
}
