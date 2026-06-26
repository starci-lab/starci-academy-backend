import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Adds the `is_enrolled` boolean to `enrollments`. Splits "the user-course
 * relationship exists" from "the user has actually enrolled / paid": a row may
 * be created for a trial / preview learner (`is_enrolled = false`) and flips to
 * `true` on real enrollment. Gates that mean "is a paying member" read this
 * flag instead of mere row existence.
 *
 * Backfills every EXISTING row to `true` — until now an enrollment row was only
 * ever created after a successful payment, so all existing rows are real
 * enrollments. `DEFAULT true` keeps any creation path that does not explicitly
 * opt into a trial fail-safe (never locks out a payer).
 *
 * The repo runs schema via TypeORM `synchronize` in dev; this migration exists so
 * the same change can be applied deterministically where `synchronize` is off.
 */
export class AddIsEnrolledToEnrollments1719200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "AddIsEnrolledToEnrollments1719200000000"

    /**
     * Forward migration: add the NOT NULL boolean defaulting to `true`
     * (idempotent), backfilling existing rows as real enrollments.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            ADD COLUMN IF NOT EXISTS "is_enrolled" boolean NOT NULL DEFAULT true;
        `)
    }

    /**
     * Reverse migration: drop the column (idempotent).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "enrollments"
            DROP COLUMN IF EXISTS "is_enrolled";
        `)
    }
}
