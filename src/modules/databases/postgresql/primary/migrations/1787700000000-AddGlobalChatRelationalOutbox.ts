import type {
    MigrationInterface, QueryRunner 
} from "typeorm"

/** Add the academy Global Chat aggregate, moderation and transactional outbox schema. */
export class AddGlobalChatRelationalOutbox1787700000000 implements MigrationInterface {
    name = "AddGlobalChatRelationalOutbox1787700000000"

    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE \"chat_conversations\" ADD COLUMN IF NOT EXISTS \"room_key\" varchar(64) NULL",
        )
        await queryRunner.query(`
            WITH ranked AS (
                SELECT id, row_number() OVER (ORDER BY created_at, id) AS row_number
                FROM chat_conversations WHERE type = 'community'
            )
            UPDATE chat_conversations SET room_key = 'academy-global'
            WHERE id = (SELECT id FROM ranked WHERE row_number = 1)
        `)
        await queryRunner.query(
            "CREATE UNIQUE INDEX IF NOT EXISTS \"UQ_chat_conversations_room_key\" ON \"chat_conversations\" (\"room_key\") WHERE \"room_key\" IS NOT NULL",
        )

        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"reply_to_id\" uuid NULL",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"version\" int NOT NULL DEFAULT 1",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"edited_at\" timestamptz NULL",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"removed_at\" timestamptz NULL",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"removed_by_moderator\" boolean NOT NULL DEFAULT false",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" ADD COLUMN IF NOT EXISTS \"removal_reason\" text NULL",
        )
        await queryRunner.query(
            "DO $$ BEGIN ALTER TABLE \"chat_messages\" ADD CONSTRAINT \"FK_chat_messages_reply_to\" FOREIGN KEY (\"reply_to_id\") REFERENCES \"chat_messages\"(\"id\") ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$",
        )
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_messages_conversation_cursor\" ON \"chat_messages\" (\"conversation_id\", \"created_at\" DESC, \"id\" DESC)",
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_participations" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "conversation_id" uuid NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "access_state" varchar(16) NOT NULL DEFAULT 'active', "role" varchar(16) NOT NULL DEFAULT 'member',
                "muted_until" timestamptz NULL, "notifications_muted" boolean NOT NULL DEFAULT false,
                CONSTRAINT "UQ_chat_participations_conversation_user" UNIQUE ("conversation_id", "user_id")
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_participations_access\" ON \"chat_participations\" (\"conversation_id\", \"access_state\")",
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_read_states" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "conversation_id" uuid NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "last_read_message_id" uuid NULL REFERENCES "chat_messages"("id") ON DELETE SET NULL,
                "last_read_at" timestamptz NULL,
                CONSTRAINT "UQ_chat_read_states_conversation_user" UNIQUE ("conversation_id", "user_id")
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_message_reactions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "message_id" uuid NOT NULL REFERENCES "chat_messages"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "emoji" varchar(32) NOT NULL,
                CONSTRAINT "UQ_chat_message_reactions_message_user_emoji" UNIQUE ("message_id", "user_id", "emoji")
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_message_reactions_message\" ON \"chat_message_reactions\" (\"message_id\")",
        )
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_message_mentions" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "message_id" uuid NOT NULL REFERENCES "chat_messages"("id") ON DELETE CASCADE,
                "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_chat_message_mentions_message_user" UNIQUE ("message_id", "user_id")
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_message_mentions_user\" ON \"chat_message_mentions\" (\"user_id\", \"created_at\")",
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_reports" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "conversation_id" uuid NOT NULL REFERENCES "chat_conversations"("id") ON DELETE CASCADE,
                "message_id" uuid NULL REFERENCES "chat_messages"("id") ON DELETE SET NULL,
                "reported_user_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "reporter_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "category" varchar(64) NOT NULL, "details" text NULL, "status" varchar(24) NOT NULL DEFAULT 'open',
                "reporter_hidden" boolean NOT NULL DEFAULT true
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_reports_reporter_message\" ON \"chat_reports\" (\"reporter_id\", \"message_id\")",
        )
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_reports_status_created\" ON \"chat_reports\" (\"status\", \"created_at\")",
        )
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_moderation_cases" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "report_id" uuid NOT NULL UNIQUE REFERENCES "chat_reports"("id") ON DELETE CASCADE,
                "assignee_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "status" varchar(24) NOT NULL DEFAULT 'open', "outcome" varchar(32) NULL, "reason" text NULL,
                "evidence" jsonb NOT NULL, "version" int NOT NULL DEFAULT 1, "resolved_at" timestamptz NULL
            )
        `)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_moderation_audits" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "case_id" uuid NOT NULL REFERENCES "chat_moderation_cases"("id") ON DELETE CASCADE,
                "actor_id" uuid NULL REFERENCES "users"("id") ON DELETE SET NULL,
                "action" varchar(32) NOT NULL, "reason" text NOT NULL, "metadata" jsonb NOT NULL DEFAULT '{}'
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_moderation_audits_case_created\" ON \"chat_moderation_audits\" (\"case_id\", \"created_at\")",
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_command_receipts" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "actor_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "command_id" varchar(128) NOT NULL, "command_type" varchar(48) NOT NULL, "response" jsonb NOT NULL,
                CONSTRAINT "UQ_chat_command_receipts_actor_command" UNIQUE ("actor_id", "command_id")
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_command_receipts_created\" ON \"chat_command_receipts\" (\"created_at\")",
        )
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "chat_outbox" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(),
                "event_key" varchar(160) NOT NULL UNIQUE, "event_type" varchar(48) NOT NULL, "aggregate_id" uuid NOT NULL,
                "payload" jsonb NOT NULL, "available_at" timestamptz NOT NULL DEFAULT now(), "published_at" timestamptz NULL,
                "locked_at" timestamptz NULL, "attempts" int NOT NULL DEFAULT 0, "last_error" text NULL
            )
        `)
        await queryRunner.query(
            "CREATE INDEX IF NOT EXISTS \"IDX_chat_outbox_pending\" ON \"chat_outbox\" (\"published_at\", \"available_at\", \"created_at\")",
        )
    }

    async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of [
            "chat_outbox",
            "chat_command_receipts",
            "chat_moderation_audits",
            "chat_moderation_cases",
            "chat_reports",
            "chat_message_mentions",
            "chat_message_reactions",
            "chat_read_states",
            "chat_participations",
        ]) {
            await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`)
        }
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"IDX_chat_messages_conversation_cursor\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_messages\" DROP CONSTRAINT IF EXISTS \"FK_chat_messages_reply_to\"",
        )
        for (const column of [
            "removal_reason",
            "removed_by_moderator",
            "removed_at",
            "edited_at",
            "version",
            "reply_to_id",
        ]) {
            await queryRunner.query(
                `ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "${column}"`,
            )
        }
        await queryRunner.query(
            "DROP INDEX IF EXISTS \"UQ_chat_conversations_room_key\"",
        )
        await queryRunner.query(
            "ALTER TABLE \"chat_conversations\" DROP COLUMN IF EXISTS \"room_key\"",
        )
    }
}
