import {
    MigrationInterface,
    QueryRunner,
} from "typeorm"

/**
 * Backfills legacy scored CV uploads into the unified `cv_generations` table
 * (WF-03c). For every user, their BEST-scored legacy attempt (`cv_submission_attempts`
 * joined to `cv_submissions`) is copied into `cv_generations` as an
 * `source = 'uploaded'` row, carrying:
 *   - `score`            ← the legacy attempt's `score`
 *   - `uploaded_cdn_key` ← the legacy attempt's `cdn_key` (the uploaded file)
 *   - `mode = 'generate'`, `status = 'done'` (already scored), `course_id = NULL`
 *     (the legacy upload flow was never course-scoped, so there is no track to
 *     attach).
 *
 * `feedback` is intentionally left NULL: the legacy `detail_feedback` is a
 * markdown `text` blob whereas the unified `feedback` column is `jsonb`, so it
 * cannot be copied losslessly. Only `score` matters for the job-board gate + the
 * per-track / foundation CV pillars (WF-03c consumers), which read `score`.
 *
 * **Idempotent:** a user is skipped when the unified table already holds an
 * `uploaded` row with the SAME `uploaded_cdn_key` — so re-running the migration
 * never duplicates a backfilled CV.
 *
 * **Safety:** this migration is ADDITIVE ONLY — it never deletes or mutates any
 * legacy row. The legacy tables + review pipeline are retained; their safe
 * removal is deferred (see the `TODO(retire-legacy-cv)` markers in
 * `ConsultantContactGateService.getBestCvScore` +
 * `JobReadinessService.computeCvScore`), to be done only after this backfill is
 * verified in prod with a count check.
 *
 * Dev runs schema via `synchronize`; this data migration applies everywhere.
 */
export class BackfillLegacyCvIntoUnified1721800000000 implements MigrationInterface {
    /** Stable name surfaced in the TypeORM migrations table. */
    name = "BackfillLegacyCvIntoUnified1721800000000"

    /**
     * Forward migration: insert one `uploaded` unified CV per user from their
     * best-scored legacy attempt, skipping any already backfilled (same
     * `uploaded_cdn_key`).
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "cv_generations" (
                "id",
                "user_id",
                "mode",
                "status",
                "source",
                "score",
                "uploaded_cdn_key",
                "processed_at",
                "created_at",
                "updated_at"
            )
            SELECT
                uuid_generate_v4(),
                best."user_id",
                'generate',
                'done',
                'uploaded',
                best."score",
                best."cdn_key",
                now(),
                now(),
                now()
            FROM (
                -- one row per user: their highest-scored legacy attempt, with the
                -- cdn_key of that specific attempt (DISTINCT ON keeps the top row
                -- after ordering by score DESC)
                SELECT DISTINCT ON (s."user_id")
                    s."user_id"  AS "user_id",
                    a."score"    AS "score",
                    a."cdn_key"  AS "cdn_key"
                FROM "cv_submission_attempts" a
                JOIN "cv_submissions" s ON s."id" = a."cv_submission_id"
                WHERE a."score" IS NOT NULL
                ORDER BY s."user_id", a."score" DESC
            ) AS best
            -- idempotency: skip a user already backfilled with this same file key
            WHERE NOT EXISTS (
                SELECT 1 FROM "cv_generations" g
                WHERE g."user_id" = best."user_id"
                  AND g."source" = 'uploaded'
                  AND g."uploaded_cdn_key" = best."cdn_key"
            );
        `)
    }

    /**
     * Reverse migration: remove only the rows THIS backfill could have created —
     * `uploaded` CVs whose `uploaded_cdn_key` matches a legacy attempt's
     * `cdn_key`. Bounded to backfilled rows so genuine user uploads (added via
     * the app) are never touched.
     *
     * @param queryRunner - Active TypeORM query runner bound to the transaction.
     */
    async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM "cv_generations" g
            WHERE g."source" = 'uploaded'
              AND g."uploaded_cdn_key" IN (
                  SELECT a."cdn_key" FROM "cv_submission_attempts" a
                  WHERE a."cdn_key" IS NOT NULL
              );
        `)
    }
}
