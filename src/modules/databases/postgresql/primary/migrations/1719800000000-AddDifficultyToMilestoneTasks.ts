import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds a nullable `difficulty` column to `milestone_tasks`, reusing the existing
 * `challenge_difficulty` Postgres enum type (easy/medium/hard/insane/expert).
 *
 * Drives the Auto grading lane's complexity routing for capstone task review --
 * harder tasks pick a stronger model category within the user's entitlement.
 * The enum type already exists (created with `challenges.difficulty`), so this
 * only adds a column -- no `ALTER TYPE ... ADD VALUE` (no enum trap).
 *
 * Dev runs schema via `synchronize` (adds the column automatically); this
 * migration applies the same change where `synchronize` is disabled (prod).
 * `ADD COLUMN IF NOT EXISTS` is idempotent.
 */
export class AddDifficultyToMilestoneTasks1719800000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddDifficultyToMilestoneTasks1719800000000"

    /**
     * Forward migration: add the nullable `difficulty` column (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "milestone_tasks"
            ADD COLUMN IF NOT EXISTS "difficulty" "challenge_difficulty";
        `)
    }

    /**
     * Reverse migration: drop the column (the shared enum type is left intact).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "milestone_tasks" DROP COLUMN IF EXISTS "difficulty";
        `)
    }
}
