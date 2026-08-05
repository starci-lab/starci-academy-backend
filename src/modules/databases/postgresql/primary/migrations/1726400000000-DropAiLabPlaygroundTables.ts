import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"
import {
    IrreversibleMigrationException,
} from "@modules/exceptions"

/**
 * Drops the three AI Lab Playground tables — the prompt-sandbox lesson
 * surface that sat alongside (but was distinct from) the already-removed AI
 * Lab eval feature (see `DropAiLabEvalTables1726100000000`, which left these
 * three tables "intentionally untouched" at the time). The whole AI Lab
 * feature (playground + runs, its GraphQL queries/mutations, its Socket.IO
 * streaming gateway, its business-logic module) has now been removed from
 * the codebase, so these tables are dropped here too.
 *
 * Tables dropped (children before parent to respect FK constraints):
 * - `ai_lab_playground_translations` — localized label/description overrides (FK → playgrounds)
 * - `ai_lab_runs`                    — one learner playground run / run-cache cold store (FK → playgrounds, users)
 * - `ai_lab_playgrounds`             — the playground definition attached to a lesson content, the parent
 *
 * The `ai_lab_playground_kind` and `ai_lab_run_status` enum types (and the
 * `openrouter` value on the unrelated, still-live `model_provider` enum) are
 * intentionally left in place — Postgres enum types are cheap to leave
 * orphaned, and this mirrors the same choice made by
 * `DropAiLabEvalTables1726100000000` for its own enum columns.
 *
 * Dev runs schema via TypeORM `synchronize` (which will itself drop the
 * tables once the entities are gone); this migration applies the same change
 * where `synchronize` is disabled (prod). Idempotent (`DROP TABLE IF EXISTS`).
 */
export class DropAiLabPlaygroundTables1726400000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "DropAiLabPlaygroundTables1726400000000"

    /**
     * Forward migration: drop the three playground tables, children before
     * the parent so the foreign-key constraints do not block the drop.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_playground_translations";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_runs";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_playgrounds";
        `)
    }

    /**
     * Reverse migration: not supported. The AI Lab Playground feature has
     * been removed from the codebase, so there are no entities to recreate
     * these tables from, and dropping-then-recreating would in any case lose
     * every playground definition and learner run.
     *
     * @param _queryRunner - Active TypeORM query runner (unused).
     * @throws Always — this migration is not reversible.
     */
    async down(_queryRunner: QueryRunner): Promise<void> {
        throw new IrreversibleMigrationException({
            migrationName: "DropAiLabPlaygroundTables1726400000000",
            reason: "the AI Lab Playground feature has been removed and its data cannot be restored.",
        })
    }
}
