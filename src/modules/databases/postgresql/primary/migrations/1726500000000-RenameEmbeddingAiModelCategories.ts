import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Renames the two embedding members of the `ai_model_category` Postgres enum
 * to name the axis by WHERE the work runs and WHOSE documents it touches,
 * rather than by the old bulk-vs-on-demand framing:
 * `embedding_bulk` -> `embedding_local`, `embedding_doc` -> `embedding_cloud`.
 *
 * WHY `RENAME VALUE`, not the add-new/backfill-rows/drop-old-type dance this
 * repo used for the five-tier -> three-tier fold (see
 * `.claude/context/starci/states/ai/migration-category-low-medium-high.sql`):
 * that dance is only needed when several old labels FOLD into one new label
 * (free+economy -> low), which forces a per-row `CASE` remap. A straight 1:1
 * rename has no fold, and Postgres enum values are stored on each row as the
 * `pg_enum` OID, not as the label text -- `RENAME VALUE` rewrites the catalog
 * label for that OID once and every existing `ai_models.category` row reads
 * as the new label immediately, with no `UPDATE` needed on the enum column
 * itself and no window where the type is dropped.
 *
 * That sidesteps both hazards this project has already been burned by:
 * - `typeorm-synchronize-enum-add-value-trap` -- dev `synchronize` detecting a
 *   value diff does its own rename-to-`_old`/recreate/`DROP TYPE _old` dance,
 *   which fails once ANY column still depends on `_old`. Running this
 *   migration first, before the entity ships, means `synchronize` sees no
 *   diff at boot and never attempts that dance.
 * - `prod-synchronize-drop-type-crashloop` -- prod runs with `synchronize`
 *   on; a `DROP TYPE` on a value/type still referenced by a live column
 *   crash-loops `DataSource.initialize`. `RENAME VALUE` never drops the type
 *   or the value, so there is nothing for a live column to lose.
 *
 * `ai_model_category` is a native Postgres enum on exactly one column
 * (`ai_models.category`), which the two renames above cover completely. It
 * is also referenced, as a plain JSON string (not a Postgres enum, so
 * `RENAME VALUE` cannot reach it), inside `ai_subscriptions.ceil_overrides`
 * jsonb (`{ default?, chatbot?, grading?, interview? }` -- see
 * `AiCeilOverrides`); the two guarded `UPDATE`s below carry any stored
 * `"embedding_bulk"` / `"embedding_doc"` override forward to its new spelling
 * so a still-open ceiling does not silently point at a value the enum no
 * longer has.
 *
 * Each statement is guarded so the migration is safe to re-run: the `DO`
 * blocks check `pg_enum` before renaming (Postgres has no
 * `RENAME VALUE IF EXISTS`), and the `UPDATE`s are scoped with `LIKE` so a
 * second pass touches zero rows.
 */
export class RenameEmbeddingAiModelCategories1726500000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "RenameEmbeddingAiModelCategories1726500000000"

    /**
     * Forward migration: rename both enum labels, then carry forward any
     * `ceil_overrides` jsonb text that still spells the old label.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'ai_model_category' AND e.enumlabel = 'embedding_bulk'
                ) THEN
                    ALTER TYPE "ai_model_category" RENAME VALUE 'embedding_bulk' TO 'embedding_local';
                END IF;
            END $$;
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'ai_model_category' AND e.enumlabel = 'embedding_doc'
                ) THEN
                    ALTER TYPE "ai_model_category" RENAME VALUE 'embedding_doc' TO 'embedding_cloud';
                END IF;
            END $$;
        `)
        await queryRunner.query(`
            UPDATE "ai_subscriptions"
            SET "ceil_overrides" = REPLACE("ceil_overrides"::text, '"embedding_bulk"', '"embedding_local"')::jsonb
            WHERE "ceil_overrides"::text LIKE '%embedding_bulk%';
        `)
        await queryRunner.query(`
            UPDATE "ai_subscriptions"
            SET "ceil_overrides" = REPLACE("ceil_overrides"::text, '"embedding_doc"', '"embedding_cloud"')::jsonb
            WHERE "ceil_overrides"::text LIKE '%embedding_doc%';
        `)
    }

    /**
     * Reverse migration: a straight 1:1 rename has an exact inverse, unlike
     * the fold this repo could not reverse for the five-tier -> three-tier
     * migration -- so `down()` genuinely restores the old labels rather than
     * refusing.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE "ai_subscriptions"
            SET "ceil_overrides" = REPLACE("ceil_overrides"::text, '"embedding_local"', '"embedding_bulk"')::jsonb
            WHERE "ceil_overrides"::text LIKE '%embedding_local%';
        `)
        await queryRunner.query(`
            UPDATE "ai_subscriptions"
            SET "ceil_overrides" = REPLACE("ceil_overrides"::text, '"embedding_cloud"', '"embedding_doc"')::jsonb
            WHERE "ceil_overrides"::text LIKE '%embedding_cloud%';
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'ai_model_category' AND e.enumlabel = 'embedding_local'
                ) THEN
                    ALTER TYPE "ai_model_category" RENAME VALUE 'embedding_local' TO 'embedding_bulk';
                END IF;
            END $$;
        `)
        await queryRunner.query(`
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM pg_enum e
                    JOIN pg_type t ON t.oid = e.enumtypid
                    WHERE t.typname = 'ai_model_category' AND e.enumlabel = 'embedding_cloud'
                ) THEN
                    ALTER TYPE "ai_model_category" RENAME VALUE 'embedding_cloud' TO 'embedding_doc';
                END IF;
            END $$;
        `)
    }
}
