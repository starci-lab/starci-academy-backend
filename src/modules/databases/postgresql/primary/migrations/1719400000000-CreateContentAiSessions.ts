import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Introduces named, searchable content-AI conversations (sessions). Creates the
 * `content_ai_sessions` table (a learner can keep many conversations per lesson,
 * e.g. one about nginx, one about kafka), adds a nullable `session_id` to
 * `content_ai_messages`, and backfills legacy flat `(enrollment, content)`
 * threads into one session each (titled from their first question).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class CreateContentAiSessions1719400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateContentAiSessions1719400000000"

    /**
     * Forward migration: create the sessions table + FKs/index, add the
     * `session_id` column + FK/index, then backfill legacy threads.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "content_ai_sessions" (
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "enrollment_id" uuid NOT NULL,
                "origin_content_id" uuid NOT NULL,
                "title" varchar(200),
                CONSTRAINT "pk_content_ai_sessions_id" PRIMARY KEY ("id")
            );
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            ADD CONSTRAINT "fk_enrollment_id_content_ai_sessions_enrollments"
            FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE;
        `)
        await queryRunner.query(`
            ALTER TABLE "content_ai_sessions"
            ADD CONSTRAINT "fk_origin_content_id_content_ai_sessions_contents"
            FOREIGN KEY ("origin_content_id") REFERENCES "contents"("id") ON DELETE CASCADE;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_sessions_enrollment_id_origin_content_id"
            ON "content_ai_sessions" ("enrollment_id", "origin_content_id");
        `)

        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            ADD COLUMN IF NOT EXISTS "session_id" uuid;
        `)

        // backfill: one session per legacy (enrollment, content) thread, titled
        // from that thread's first user question, then point the turns at it
        await queryRunner.query(`
            INSERT INTO "content_ai_sessions"
                ("id", "enrollment_id", "origin_content_id", "title", "created_at", "updated_at")
            SELECT uuid_generate_v4(), m."enrollment_id", m."content_id",
                   (SELECT LEFT(m2."message", 120) FROM "content_ai_messages" m2
                     WHERE m2."enrollment_id" = m."enrollment_id"
                       AND m2."content_id" = m."content_id"
                       AND m2."role" = 'user'
                     ORDER BY m2."created_at" LIMIT 1),
                   MIN(m."created_at"), MAX(m."created_at")
            FROM "content_ai_messages" m
            WHERE m."session_id" IS NULL
            GROUP BY m."enrollment_id", m."content_id";
        `)
        await queryRunner.query(`
            UPDATE "content_ai_messages" m
               SET "session_id" = s."id"
              FROM "content_ai_sessions" s
             WHERE m."session_id" IS NULL
               AND s."enrollment_id" = m."enrollment_id"
               AND s."origin_content_id" = m."content_id";
        `)

        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            ADD CONSTRAINT "fk_session_id_content_ai_messages_sessions"
            FOREIGN KEY ("session_id") REFERENCES "content_ai_sessions"("id") ON DELETE CASCADE;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_content_ai_messages_session_id"
            ON "content_ai_messages" ("session_id");
        `)
    }

    /**
     * Reverse migration: drop the `session_id` column (FK + index go with it) and
     * the sessions table. Legacy flat threads remain in `content_ai_messages`.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages"
            DROP CONSTRAINT IF EXISTS "fk_session_id_content_ai_messages_sessions";
        `)
        await queryRunner.query("DROP INDEX IF EXISTS \"idx_content_ai_messages_session_id\";")
        await queryRunner.query(`
            ALTER TABLE "content_ai_messages" DROP COLUMN IF EXISTS "session_id";
        `)
        await queryRunner.query("DROP TABLE IF EXISTS \"content_ai_sessions\";")
    }
}
