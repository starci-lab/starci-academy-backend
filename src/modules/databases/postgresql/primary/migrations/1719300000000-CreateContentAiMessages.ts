import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates the `content_ai_messages` table backing persisted content-AI tutoring
 * conversations. Each row is one chat turn scoped to `(enrollment, content)` —
 * the conversation a learner has about one lesson within their course
 * enrollment — with FKs to `enrollments` + `contents` (ON DELETE CASCADE) and a
 * `(enrollment_id, content_id)` lookup index for rebuilding the thread on reopen.
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateContentAiMessages1719300000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateContentAiMessages1719300000000"

    /**
     * Forward migration: create the table, FKs, and the lookup index.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "content_ai_messages" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "content_id" uuid NOT NULL,
                "role" varchar(16) NOT NULL,
                "message" text NOT NULL,
                CONSTRAINT "pk_content_ai_messages_id" PRIMARY KEY ("id")
            );
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            ADD CONSTRAINT "fk_enrollment_id_content_ai_messages_enrollments"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            ADD CONSTRAINT "fk_content_id_content_ai_messages_contents"
            FOREIGN KEY ("content_id") REFERENCES "contents"("id") ON DELETE CASCADE;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_messages_enrollment_id_content_id"
            ON "content_ai_messages" ("enrollment_id", "content_id");
        `)
    }

    /**
     * Reverse migration: drop the table (FKs + index go with it).
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "content_ai_messages";`)
    }
}
