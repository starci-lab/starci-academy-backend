import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Registers the `"embedding"` value of {@link AiModelTask} at the schema level.
 *
 * Unlike `ai_model_category` / `model_provider` (true Postgres enum types that
 * need `ALTER TYPE ... ADD VALUE`), `AiModelTask` is stored inside the JSONB
 * array column `ai_models.supported_tasks` — so adding the `"embedding"` member
 * is a pure TS-side change with **no enum DDL and no `ALTER TYPE`** (running one
 * here would fail, since there is no `ai_model_task` Postgres enum type). This
 * migration therefore only *backfills*: it tags any model that should serve
 * embeddings (the Local `nomic-embed-text` + the OpenAI fallback embedding
 * model, seeded from the AI catalog) with `"embedding"` in `supported_tasks` so
 * the balancer's Auto-lane task filter (`task = embedding`) keeps them and drops
 * chat/grade-only models. Fully idempotent: the `@>` guard skips rows that are
 * already tagged.
 *
 * Dev runs the catalog seeder on boot (which writes `supported_tasks` directly),
 * so this is the equivalent for environments where the seeder is not re-run.
 */
export class AddEmbeddingAiModelTask1720700000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddEmbeddingAiModelTask1720700000000"

    /**
     * Forward migration: backfill `"embedding"` onto known embedding models
     * (by their catalog `name`) — no DDL, idempotent via the `@>` guard.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" || '["embedding"]'::jsonb
            WHERE "name" IN ('nomic-embed-text', 'text-embedding-3-small')
              AND NOT ("supported_tasks" @> '["embedding"]'::jsonb);
        `)
    }

    /**
     * Reverse migration: strip `"embedding"` back off those models.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_models"
            SET "supported_tasks" = "supported_tasks" - 'embedding'
            WHERE "name" IN ('nomic-embed-text', 'text-embedding-3-small');
        `)
    }
}
