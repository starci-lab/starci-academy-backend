import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Drops the legacy `users.total_points` column. It was a manually-maintained
 * counter (incremented on every XP-earning event) that has been superseded —
 * the global "Points" figure (`SUM(amount) FROM xp_histories`, no filter) is
 * now computed LIVE by {@link UserXpProjectionService}, matching how the
 * per-source XP breakdowns (`challengeXp`/`milestoneXp`/`codingXp`/`lessonXp`)
 * were already computed. Nothing in the codebase reads `total_points` anymore
 * (`writeXpHistory` stopped incrementing it; `loyalty-discount.service.ts` now
 * reads the projection instead) — safe to drop.
 *
 * Down migration re-adds the column and backfills it one last time from the
 * ledger, so a rollback restores a value consistent with the (now-unused)
 * historical formula, in case anything outside this codebase still expects it.
 */
export class DropLegacyUserTotalPoints1723900000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "DropLegacyUserTotalPoints1723900000000"

    /**
     * Forward migration: drop the unused column.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "total_points";
        `)
    }

    /**
     * Reverse migration: re-add the column and backfill it from the ledger
     * (same formula the original migration used), so a rollback lands on a
     * consistent snapshot rather than a column full of zeros.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users"
            ADD COLUMN IF NOT EXISTS "total_points" int NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            UPDATE "users" u
            SET "total_points" = COALESCE(agg.sum_amount, 0)
            FROM (
                SELECT x.user_id, SUM(x.amount) AS sum_amount
                FROM "xp_histories" x
                GROUP BY x.user_id
            ) agg
            WHERE agg.user_id = u.id;
        `)
    }
}
