-- Backfill the user_course_progress_projections read-model from current data
-- (jsonb `value` storage). Run ONCE after the backend boots (so `synchronize`
-- has created the table):
--   docker exec -i -e PGPASSWORD=... <pg> psql -U postgres -d starci-academy < scratch/backfill-progress-projection.sql
-- Idempotent: ON CONFLICT updates. The projector keeps it fresh afterwards.

INSERT INTO user_course_progress_projections (user_id, course_id, value)
WITH per_submission_max AS (
    SELECT ucs.user_id,
           m.course_id,
           cs.challenge_id,
           cs.id AS submission_id,
           COALESCE(MAX(a.score), 0) AS max_score
    FROM user_challenge_submissions ucs
    JOIN challenge_submissions cs ON cs.id = ucs.submission_id
    JOIN challenges c            ON c.id = cs.challenge_id
    JOIN contents ct             ON ct.id = c.content_id
    JOIN modules m               ON m.id = ct.module_id
    LEFT JOIN user_challenge_submission_attempts a
        ON a.user_challenge_submission_id = ucs.id
    GROUP BY ucs.user_id, m.course_id, cs.challenge_id, cs.id
),
per_challenge AS (
    SELECT user_id, course_id, challenge_id, SUM(max_score) AS challenge_score
    FROM per_submission_max
    GROUP BY user_id, course_id, challenge_id
),
per_user AS (
    SELECT pc.user_id,
           pc.course_id,
           SUM(pc.challenge_score)::bigint AS total_score,
           SUM(CASE WHEN pc.challenge_score >= c.score AND c.score > 0 THEN 1 ELSE 0 END)::bigint
               AS completed_challenges
    FROM per_challenge pc
    JOIN challenges c ON c.id = pc.challenge_id
    GROUP BY pc.user_id, pc.course_id
),
read_per_user AS (
    SELECT uc.user_id, m.course_id, COUNT(*)::bigint AS lessons_read
    FROM user_contents uc
    JOIN contents ct ON ct.id = uc.content_id
    JOIN modules m  ON m.id  = ct.module_id
    WHERE uc.is_read = true
    GROUP BY uc.user_id, m.course_id
),
milestone_per_user AS (
    SELECT e.user_id, e.course_id, COUNT(DISTINCT umt.id)::bigint AS milestone_progress
    FROM enrollments e
    JOIN user_milestone_tasks umt ON umt.enrollment_id = e.id
    JOIN user_milestone_task_attempts umta
        ON umta.user_milestone_task_id = umt.id AND umta.passed = true
    GROUP BY e.user_id, e.course_id
)
SELECT e.user_id,
       e.course_id,
       jsonb_build_object(
           'totalScore',          COALESCE(pu.total_score, 0)::int,
           'completedChallenges', COALESCE(pu.completed_challenges, 0)::int,
           'lessonsRead',         COALESCE(rpu.lessons_read, 0)::int,
           'milestoneProgress',   COALESCE(mpu.milestone_progress, 0)::int,
           'totalXp',             (COALESCE(pu.total_score, 0)
                                    + COALESCE(rpu.lessons_read, 0) * 3
                                    + COALESCE(mpu.milestone_progress, 0) * 10)::int
       ) AS value
FROM enrollments e
LEFT JOIN per_user pu            ON pu.user_id = e.user_id  AND pu.course_id = e.course_id
LEFT JOIN read_per_user rpu      ON rpu.user_id = e.user_id AND rpu.course_id = e.course_id
LEFT JOIN milestone_per_user mpu ON mpu.user_id = e.user_id AND mpu.course_id = e.course_id
ON CONFLICT (user_id, course_id) DO UPDATE SET
    value      = EXCLUDED.value,
    updated_at = now();

-- Functional index backing the leaderboard ORDER BY (TypeORM synchronize does
-- not emit expression indexes, so create it here).
CREATE INDEX IF NOT EXISTS idx_ucpp_course_total_xp
    ON user_course_progress_projections (course_id, ((value->>'totalXp')::int) DESC);

-- Check: SELECT count(*), sum((value->>'totalXp')::int) FROM user_course_progress_projections;
