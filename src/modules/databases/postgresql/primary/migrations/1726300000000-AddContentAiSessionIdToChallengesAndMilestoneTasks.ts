import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds `content_ai_session_id` (nullable uuid, no FK -- mirrors the plain
 * `mock_interview_attempts.session_id` pattern, not a `@ManyToOne`) to
 * `challenges` and `milestone_tasks`: the content-AI conversation the learner
 * last used on that surface, so the FE can resume the remembered chat instead
 * of starting a fresh one every visit. Additive + nullable only.
 *
 * Dev + prod run schema via TypeORM `synchronize` (which applies the entity
 * change at boot); this migration exists so the SAME change applies
 * deterministically where `synchronize` is off. Idempotent.
 */
export class AddContentAiSessionIdToChallengesAndMilestoneTasks1726300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddContentAiSessionIdToChallengesAndMilestoneTasks1726300000000"

    /**
     * Forward migration: add the nullable `content_ai_session_id` column to
     * both tables.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "challenges"
                ADD COLUMN IF NOT EXISTS "content_ai_session_id" uuid;
        `)
        await queryRunner.query(`
            ALTER TABLE "milestone_tasks"
                ADD COLUMN IF NOT EXISTS "content_ai_session_id" uuid;
        `)
    }

    /**
     * Reverse migration: drop the column from both tables.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "milestone_tasks" DROP COLUMN IF EXISTS "content_ai_session_id";
        `)
        await queryRunner.query(`
            ALTER TABLE "challenges" DROP COLUMN IF EXISTS "content_ai_session_id";
        `)
    }
}
