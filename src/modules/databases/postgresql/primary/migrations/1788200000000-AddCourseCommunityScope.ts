import type { MigrationInterface, QueryRunner } from "typeorm"

export class AddCourseCommunityScope1788200000000 implements MigrationInterface {
    name = "AddCourseCommunityScope1788200000000"

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DO $$ BEGIN CREATE TYPE "community_scope" AS ENUM ('GLOBAL', 'COURSE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
        await queryRunner.query(`ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "scope" "community_scope"`)
        await queryRunner.query(`ALTER TABLE "community_posts" ADD COLUMN IF NOT EXISTS "course_id" uuid`)
        await queryRunner.query(`UPDATE "community_posts" SET "scope" = 'GLOBAL' WHERE "scope" IS NULL`)
        await queryRunner.query(`ALTER TABLE "community_posts" ALTER COLUMN "scope" SET DEFAULT 'GLOBAL'`)
        await queryRunner.query(`ALTER TABLE "community_posts" ALTER COLUMN "scope" SET NOT NULL`)
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "community_posts" ADD CONSTRAINT "fk_community_posts_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "community_posts" ADD CONSTRAINT "chk_community_posts_scope_course" CHECK (("scope" = 'GLOBAL' AND "course_id" IS NULL) OR ("scope" = 'COURSE' AND "course_id" IS NOT NULL)) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "community_posts" ADD CONSTRAINT "chk_course_community_not_pinned" CHECK ("scope" <> 'COURSE' OR "is_pinned" = false) NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
        await queryRunner.query(`DO $$ BEGIN ALTER TABLE "community_posts" ADD CONSTRAINT "chk_course_community_general_channel" CHECK ("scope" <> 'COURSE' OR "channel" = 'general') NOT VALID; EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
        await queryRunner.query(`ALTER TABLE "community_posts" VALIDATE CONSTRAINT "chk_community_posts_scope_course"`)
        await queryRunner.query(`ALTER TABLE "community_posts" VALIDATE CONSTRAINT "chk_course_community_not_pinned"`)
        await queryRunner.query(`ALTER TABLE "community_posts" VALIDATE CONSTRAINT "chk_course_community_general_channel"`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_community_feed" ON "community_posts" ("course_id", "created_at" DESC, "id" DESC) WHERE "scope" = 'COURSE' AND "is_deleted" = false`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_community_mine" ON "community_posts" ("course_id", "author_id", "created_at" DESC, "id" DESC) WHERE "scope" = 'COURSE' AND "is_deleted" = false`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_course_community_search" ON "community_posts" USING gin (to_tsvector('simple', "body")) WHERE "scope" = 'COURSE' AND "is_deleted" = false`)

        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "community_command_receipts" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "actor_id" uuid NOT NULL,
            "course_id" uuid NOT NULL, "operation_kind" varchar(64) NOT NULL,
            "idempotency_key" varchar(128) NOT NULL, "request_hash" char(64) NOT NULL,
            "result_target_id" uuid, "created_at" timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT "pk_community_command_receipts" PRIMARY KEY ("id"),
            CONSTRAINT "uq_community_command_receipt" UNIQUE ("actor_id", "course_id", "operation_kind", "idempotency_key"),
            CONSTRAINT "fk_community_receipt_actor" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE CASCADE,
            CONSTRAINT "fk_community_receipt_course" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT
        )`)
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "community_outbox" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_key" varchar(255) NOT NULL,
            "kind" varchar(64) NOT NULL, "payload" jsonb NOT NULL, "attempts" integer NOT NULL DEFAULT 0,
            "available_at" timestamptz NOT NULL DEFAULT now(), "leased_until" timestamptz,
            "published_at" timestamptz, "last_error" text, "created_at" timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT "pk_community_outbox" PRIMARY KEY ("id"),
            CONSTRAINT "uq_community_outbox_event_key" UNIQUE ("event_key")
        )`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_community_outbox_pending" ON "community_outbox" ("available_at", "created_at") WHERE "published_at" IS NULL`)

        await queryRunner.query(`CREATE OR REPLACE FUNCTION enforce_community_reply_post() RETURNS trigger AS $$
        BEGIN
            IF NEW.parent_comment_id IS NOT NULL AND NOT EXISTS (
                SELECT 1 FROM community_post_comments p WHERE p.id = NEW.parent_comment_id AND p.post_id = NEW.post_id
            ) THEN RAISE EXCEPTION 'community reply parent must belong to the same post' USING ERRCODE = '23514'; END IF;
            RETURN NEW;
        END; $$ LANGUAGE plpgsql`)
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_community_reply_same_post" ON "community_post_comments"`)
        await queryRunner.query(`CREATE TRIGGER "trg_community_reply_same_post" BEFORE INSERT OR UPDATE OF "parent_comment_id", "post_id" ON "community_post_comments" FOR EACH ROW EXECUTE FUNCTION enforce_community_reply_post()`)
        await queryRunner.query(`CREATE OR REPLACE FUNCTION enforce_community_post_scope_immutable() RETURNS trigger AS $$
        BEGIN IF OLD.scope IS DISTINCT FROM NEW.scope OR OLD.course_id IS DISTINCT FROM NEW.course_id
            THEN RAISE EXCEPTION 'community post scope is immutable' USING ERRCODE = '23514'; END IF; RETURN NEW; END;
        $$ LANGUAGE plpgsql`)
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_community_post_scope_immutable" ON "community_posts"`)
        await queryRunner.query(`CREATE TRIGGER "trg_community_post_scope_immutable" BEFORE UPDATE OF "scope", "course_id" ON "community_posts" FOR EACH ROW EXECUTE FUNCTION enforce_community_post_scope_immutable()`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_community_reply_same_post" ON "community_post_comments"`)
        await queryRunner.query(`DROP TRIGGER IF EXISTS "trg_community_post_scope_immutable" ON "community_posts"`)
        await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_community_post_scope_immutable()`)
        await queryRunner.query(`DROP FUNCTION IF EXISTS enforce_community_reply_post()`)
        await queryRunner.query(`DROP TABLE IF EXISTS "community_outbox"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "community_command_receipts"`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_community_search"`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_community_mine"`)
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_course_community_feed"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP CONSTRAINT IF EXISTS "chk_course_community_not_pinned"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP CONSTRAINT IF EXISTS "chk_course_community_general_channel"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP CONSTRAINT IF EXISTS "chk_community_posts_scope_course"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP CONSTRAINT IF EXISTS "fk_community_posts_course_id"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "course_id"`)
        await queryRunner.query(`ALTER TABLE "community_posts" DROP COLUMN IF EXISTS "scope"`)
        await queryRunner.query(`DROP TYPE IF EXISTS "community_scope"`)
    }
}
