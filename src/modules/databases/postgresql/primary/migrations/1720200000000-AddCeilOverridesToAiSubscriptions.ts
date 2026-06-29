import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `ceil_overrides` (jsonb, nullable) to `ai_subscriptions` — the per-user,
 * per-surface model CEILING the learner sets in AI settings (cost control).
 * Shape: `{ default?, chatbot?, grading?, interview? }` of AiModelCategory.
 * Null = no caps (only the plan ceiling applies).
 *
 * Dev runs schema via `synchronize` (adds the column); this migration applies
 * the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddCeilOverridesToAiSubscriptions1720200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddCeilOverridesToAiSubscriptions1720200000000"

    /**
     * Forward migration: add the nullable `ceil_overrides` jsonb column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_subscriptions"
            ADD COLUMN IF NOT EXISTS "ceil_overrides" jsonb;
        `)
    }

    /**
     * Reverse migration: drop the column.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "ai_subscriptions" DROP COLUMN IF EXISTS "ceil_overrides";
        `)
    }
}
