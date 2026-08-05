import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates `rag_playground_sessions` -- tracks the lifecycle of a PUBLIC (no
 * login) RAG Playground session's ephemeral Qdrant collection
 * (`playground-${sessionId}`), so a cron can drop idle sessions instead of
 * leaking collections. Q&A turns themselves are NOT persisted (in-memory only).
 *
 * Dev runs schema via `synchronize` (creates the table); this migration
 * applies the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class CreateRagPlaygroundSessions1720700000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "CreateRagPlaygroundSessions1720700000000"

    /**
     * Forward migration: create the table + the idle-scan index.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "rag_playground_sessions" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "created_at" timestamptz NOT NULL DEFAULT now(),
                "updated_at" timestamptz NOT NULL DEFAULT now(),
                "session_id" varchar NOT NULL,
                "source_kind" varchar NOT NULL,
                "source_label" varchar,
                "chunk_count" int NOT NULL,
                "last_accessed_at" timestamptz NOT NULL,
                CONSTRAINT "pk_rag_playground_sessions" PRIMARY KEY ("id"),
                CONSTRAINT "uq_rag_playground_sessions_session_id" UNIQUE ("session_id")
            );
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_rag_playground_sessions_last_accessed"
            ON "rag_playground_sessions" ("last_accessed_at");
        `)
    }

    /**
     * Reverse migration: drop the table (index goes with it).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "rag_playground_sessions";
        `)
    }
}
