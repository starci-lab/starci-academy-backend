import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Drops `coding_submissions.client_telemetry` / `suspicion_score` /
 * `flagged_for_review`. They were written on every submission by the
 * anti-cheat scoring path (`AntiCheatService.evaluate()`, called from
 * `CodingSubmissionService.submit()`), but never read anywhere -- no
 * reviewer surface, no GraphQL field, no query, no job ever consumed them
 * (confirmed by a repo-wide grep across `src/` and `apps/`). The write path
 * itself was removed alongside this migration: `AntiCheatService` and its
 * `src/modules/bussiness/anti-cheat/` module (its only caller), and the
 * three field assignments in `CodingSubmissionService.submit()`.
 *
 * `ip_address` / `user_agent` / `device_fingerprint` on the same table are
 * NOT touched -- they still feed `DeviceService.recordDevice()` and stay live.
 *
 * Down migration re-adds all three columns with their original shape/defaults
 * (schema-only -- rows dropped by `up` are gone for good, and the removed
 * scoring code is not restored).
 */
export class DropAntiCheatSuspicionColumns1726200000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "DropAntiCheatSuspicionColumns1726200000000"

    /**
     * Forward migration: drop the three unread anti-cheat columns.
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "coding_submissions" DROP COLUMN IF EXISTS "client_telemetry";
        `)
        await queryRunner.query(`
            ALTER TABLE "coding_submissions" DROP COLUMN IF EXISTS "suspicion_score";
        `)
        await queryRunner.query(`
            ALTER TABLE "coding_submissions" DROP COLUMN IF EXISTS "flagged_for_review";
        `)
    }

    /**
     * Reverse migration: re-add the three columns with their original
     * shape/defaults (schema-only -- this does not restore the removed
     * scoring code or the values it would have written).
     *
     * @param queryRunner - Active TypeORM query runner.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "coding_submissions"
            ADD COLUMN IF NOT EXISTS "client_telemetry" text;
        `)
        await queryRunner.query(`
            ALTER TABLE "coding_submissions"
            ADD COLUMN IF NOT EXISTS "suspicion_score" int NOT NULL DEFAULT 0;
        `)
        await queryRunner.query(`
            ALTER TABLE "coding_submissions"
            ADD COLUMN IF NOT EXISTS "flagged_for_review" boolean NOT NULL DEFAULT false;
        `)
    }
}
