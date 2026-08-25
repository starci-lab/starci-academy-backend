import type {
    MigrationInterface, QueryRunner 
} from "typeorm"

/** Add the Learn-owned course companion identity without converting legacy chats. */
export class AddLearnAiCompanionContinuity1730000000000 implements MigrationInterface {
    name = "AddLearnAiCompanionContinuity1730000000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            ADD COLUMN IF NOT EXISTS "experience" varchar(32)
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_content_ai_sessions_active_learn_companion"
                ON "content_ai_sessions" ("enrollment_id")
             WHERE "experience" = 'learn_companion'
               AND "archived_at" IS NULL
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX IF EXISTS "uq_content_ai_sessions_active_learn_companion"
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP COLUMN IF EXISTS "experience"
        `)
    }
}
