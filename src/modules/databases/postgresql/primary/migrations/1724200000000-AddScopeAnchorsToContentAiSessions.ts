import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Widens content-AI conversations to the SESSION-PER-SCOPE model: a session (and
 * its turns) can now be anchored to a capstone TASK, a global FOUNDATION doc, or a
 * whole COURSE — not only a lesson content. Additive + widening only:
 *
 * `content_ai_sessions`:
 * - `+ scope` varchar(16) NOT NULL DEFAULT 'content' — which surface the
 *   conversation grounds on (`content` | `task` | `foundation` | `course`).
 * - `origin_content_id` / `enrollment_id` → **nullable** (task/foundation/course
 *   sessions have no content anchor; a GLOBAL foundation session has no enrollment).
 * - `+ origin_task_id` (FK milestone_tasks), `+ origin_foundation_id` (FK
 *   foundations) — the typed anchor for task/foundation sessions.
 * - `+ user_id` (FK users) — owner of a course-agnostic (foundation) session, which
 *   has no enrollment to key off. Course-scoped sessions keep keying off enrollment.
 *
 * `content_ai_messages`:
 * - `content_id` / `enrollment_id` → **nullable** (a task/foundation/course turn has
 *   no content/enrollment anchor).
 * - `+ user_id` (FK users) — owner of a foundation turn.
 *
 * Dev runs schema via TypeORM `synchronize` (and prod runs `synchronize=true`),
 * which applies these entity changes at boot; this migration exists so the SAME
 * change can be applied deterministically where `synchronize` is off. Additive,
 * nullable/widening, no PG enum (scope is varchar) — synchronize-safe, no
 * enum-ADD-VALUE / DROP-TYPE boot trap. Idempotent.
 */
export class AddScopeAnchorsToContentAiSessions1724200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddScopeAnchorsToContentAiSessions1724200000000"

    /**
     * Forward migration: add scope + typed anchors + user owner, relax the
     * content/enrollment NOT NULLs, wire the new FKs and indexes.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        // --- content_ai_sessions -------------------------------------------------
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
                ADD COLUMN IF NOT EXISTS "scope" varchar(16) NOT NULL DEFAULT 'content',
                ADD COLUMN IF NOT EXISTS "origin_task_id" uuid,
                ADD COLUMN IF NOT EXISTS "origin_foundation_id" uuid,
                ADD COLUMN IF NOT EXISTS "user_id" uuid;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions" ALTER COLUMN "origin_content_id" DROP NOT NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions" ALTER COLUMN "enrollment_id" DROP NOT NULL;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_sessions"
                ADD CONSTRAINT "fk_origin_task_id_content_ai_sessions_milestone_tasks"
                FOREIGN KEY ("origin_task_id") REFERENCES "milestone_tasks"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_sessions"
                ADD CONSTRAINT "fk_origin_foundation_id_content_ai_sessions_foundations"
                FOREIGN KEY ("origin_foundation_id") REFERENCES "foundations"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_sessions"
                ADD CONSTRAINT "fk_user_id_content_ai_sessions_users"
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_user_id"
            ON "content_ai_sessions" ("user_id");
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_origin_task_id"
            ON "content_ai_sessions" ("origin_task_id");
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_origin_foundation_id"
            ON "content_ai_sessions" ("origin_foundation_id");
        `)

        // --- content_ai_messages -------------------------------------------------
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
                ADD COLUMN IF NOT EXISTS "user_id" uuid;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages" ALTER COLUMN "content_id" DROP NOT NULL;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages" ALTER COLUMN "enrollment_id" DROP NOT NULL;
        `)
        await queryRunner.query(`
            DO $$ BEGIN
                ALTER TABLE "content_ai_messages"
                ADD CONSTRAINT "fk_user_id_content_ai_messages_users"
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
            EXCEPTION WHEN duplicate_object THEN NULL; END $$;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_messages_user_id"
            ON "content_ai_messages" ("user_id");
        `)
    }

    /**
     * Reverse migration: drop the added FKs/indexes/columns and restore the NOT
     * NULLs. Reversing is only safe when no task/foundation/course sessions exist
     * (those rows have null content/enrollment) — rows created under the new model
     * would violate the restored NOT NULL, so the constraint restore is guarded to
     * run only when no such rows remain.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        // content_ai_messages
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_messages_user_id\";")
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            DROP CONSTRAINT IF EXISTS "fk_user_id_content_ai_messages_users";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages" DROP COLUMN IF EXISTS "user_id";
        `)

        // content_ai_sessions
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_sessions_origin_foundation_id\";")
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_sessions_origin_task_id\";")
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_sessions_user_id\";")
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP CONSTRAINT IF EXISTS "fk_user_id_content_ai_sessions_users";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP CONSTRAINT IF EXISTS "fk_origin_foundation_id_content_ai_sessions_foundations";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            DROP CONSTRAINT IF EXISTS "fk_origin_task_id_content_ai_sessions_milestone_tasks";
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
                DROP COLUMN IF EXISTS "user_id",
                DROP COLUMN IF EXISTS "origin_foundation_id",
                DROP COLUMN IF EXISTS "origin_task_id",
                DROP COLUMN IF EXISTS "scope";
        `)
        // restore NOT NULLs only when no new-model rows would violate them
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM "content_ai_messages" WHERE "content_id" IS NULL) THEN
                    ALTER TABLE "content_ai_messages" ALTER COLUMN "content_id" SET NOT NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM "content_ai_messages" WHERE "enrollment_id" IS NULL) THEN
                    ALTER TABLE "content_ai_messages" ALTER COLUMN "enrollment_id" SET NOT NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM "content_ai_sessions" WHERE "origin_content_id" IS NULL) THEN
                    ALTER TABLE "content_ai_sessions" ALTER COLUMN "origin_content_id" SET NOT NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM "content_ai_sessions" WHERE "enrollment_id" IS NULL) THEN
                    ALTER TABLE "content_ai_sessions" ALTER COLUMN "enrollment_id" SET NOT NULL;
                END IF;
            END $$;
        `)
    }
}
