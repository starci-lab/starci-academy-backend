import type {
    MigrationInterface, QueryRunner 
} from "typeorm"

/** Add the durable idempotency journal used by course-scoped content-AI turns. */
export class AddDurableContentAiTurns1787600000000 implements MigrationInterface {
    name = "AddDurableContentAiTurns1787600000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "content_ai_turns" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "session_id" uuid NOT NULL,
                "stream_id" varchar(128) NOT NULL,
                "request_hash" varchar(64) NOT NULL,
                "state" varchar(16) NOT NULL DEFAULT 'processing',
                "response" text,
                "error_code" varchar(200),
                "attempt_count" integer NOT NULL DEFAULT 1,
                "completed_at" timestamptz,
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                CONSTRAINT "pk_content_ai_turns" PRIMARY KEY ("id"),
                CONSTRAINT "uq_content_ai_turns_session_stream" UNIQUE ("session_id", "stream_id"),
                CONSTRAINT "fk_content_ai_turns_session_id"
                    FOREIGN KEY ("session_id") REFERENCES "content_ai_sessions"("id")
                    ON DELETE CASCADE ON UPDATE NO ACTION
            )
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_turns_session_state"
                ON "content_ai_turns" ("session_id", "state")
        `)
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS \"content_ai_turns\"")
    }
}
