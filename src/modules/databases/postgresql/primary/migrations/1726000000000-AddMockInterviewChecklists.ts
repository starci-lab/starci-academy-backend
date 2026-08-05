import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Creates `mock_interview_checklists` -- the coverage checkpoints that succeed
 * `mock_interviews.rubric` as the grading anchor.
 *
 * A checkpoint gets a row rather than another jsonb array entry because it carries
 * structure the grader scores against: `dimension` (which axis it tests), `critical`
 * (missing it should sink the answer), and `score_band` (the points it is worth -- a
 * question's bands sum to 100). The old rubric could only smuggle the dimension in as a
 * `[technical]` text prefix.
 *
 * Purely additive: `rubric` stays untouched and the grading path falls back to it for any
 * question whose content has not been converted to `# checklist` yet, so this can land
 * ahead of the content migration with no coordination.
 *
 * Dev runs schema via TypeORM `synchronize` (creates the table); this migration applies
 * the same change where `synchronize` is disabled (prod). Idempotent.
 */
export class AddMockInterviewChecklists1726000000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddMockInterviewChecklists1726000000000"

    /**
     * Forward migration: create the table, its FK to the owning question, and the
     * lookup + uniqueness indexes.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "mock_interview_checklists" (
                "id" uuid NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "text" text NOT NULL,
                "dimension" character varying(32),
                "critical" boolean NOT NULL DEFAULT false,
                "score_band" integer NOT NULL DEFAULT 0,
                "order_index" integer NOT NULL DEFAULT 0,
                "sort_index" integer NOT NULL DEFAULT 0,
                "mock_interview_id" uuid,
                CONSTRAINT "pk_mock_interview_checklists" PRIMARY KEY ("id")
            );
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_checklists"
            DROP CONSTRAINT IF EXISTS "fk_mi_checklists_mi";
        `)
        await queryRunner.query(`
            ALTER TABLE "mock_interview_checklists"
            ADD CONSTRAINT "fk_mi_checklists_mi"
            FOREIGN KEY ("mock_interview_id") REFERENCES "mock_interviews"("id")
            ON DELETE CASCADE ON UPDATE NO ACTION;
        `)
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_mock_interview_checklists_interview"
            ON "mock_interview_checklists" ("mock_interview_id");
        `)
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "uq_mock_interview_checklists_interview_order"
            ON "mock_interview_checklists" ("mock_interview_id", "order_index");
        `)
    }

    /**
     * Reverse migration: drop the table (indexes and FK go with it).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE IF EXISTS "mock_interview_checklists";
        `)
    }
}
