import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"
import {
    IrreversibleMigrationException,
} from "@modules/exceptions"

/**
 * Drops the four AI Lab EVAL tables -- the graded prompt-challenge feature that
 * sat alongside (but is distinct from) the AI Lab Playground. The eval feature
 * has been removed from the codebase (services, resolvers, entities, processor
 * pipeline, queue), so its tables are dropped here.
 *
 * Tables dropped (children before parents to respect FK constraints):
 * - `ai_lab_eval_case_results` -- per-case grading result (FK -> runs, cases)
 * - `ai_lab_eval_runs`         -- one graded submission (FK -> sets)
 * - `ai_lab_eval_cases`        -- one input + scoring metric (FK -> sets)
 * - `ai_lab_eval_sets`         -- the eval set (rubric + threshold), the parent
 *
 * Dev runs schema via TypeORM `synchronize` (which will itself drop the tables
 * once the entities are gone); this migration applies the same change where
 * `synchronize` is disabled (prod). Idempotent (`DROP TABLE IF EXISTS`).
 *
 * The Playground tables (`ai_lab_playgrounds`, `ai_lab_playground_translations`,
 * `ai_lab_runs`) are intentionally left untouched.
 */
export class DropAiLabEvalTables1726100000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "DropAiLabEvalTables1726100000000"

    /**
     * Forward migration: drop the four eval tables, children before parents so
     * the foreign-key constraints do not block the drop.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_eval_case_results";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_eval_runs";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_eval_cases";
        `)
        await queryRunner.query(`
            DROP TABLE IF EXISTS "ai_lab_eval_sets";
        `)
    }

    /**
     * Reverse migration: not supported. The eval feature has been removed from
     * the codebase, so there are no entities to recreate these tables from, and
     * dropping-then-recreating would in any case lose every graded submission.
     *
     * @param _queryRunner - Active TypeORM query runner (unused).
     * @throws Always -- this migration is not reversible.
     */
    async down(_queryRunner: QueryRunner): Promise<void> {
        throw new IrreversibleMigrationException({
            migrationName: "DropAiLabEvalTables1726100000000",
            reason: "the AI Lab eval feature has been removed and its data cannot be restored.",
        })
    }
}
