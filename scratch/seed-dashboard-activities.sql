-- Seed demo follow edges + activity-feed rows so the GitHub-style dashboard
-- renders with real-looking content. Idempotent: safe to re-run (every insert
-- is guarded by ON CONFLICT DO NOTHING on the unique keys).
--
-- Prereq: start the backend once first so `synchronize` creates the `activities`
-- and `user_follows` tables + the `activity_type` enum.
--
-- Run:
--   psql "postgresql://postgres:Cuong123_A@localhost:5432/starci-academy" \
--        -f scratch/seed-dashboard-activities.sql

BEGIN;

-- 1) Follow graph: EVERY user follows the 8 most-recent ("demo") users, so
--    whoever you log in as sees a populated feed (feed = followed users' activity).
WITH demo_users AS (
    SELECT id FROM users ORDER BY created_at DESC LIMIT 8
)
INSERT INTO user_follows (follower_id, following_id)
SELECT u.id, d.id
FROM users u
CROSS JOIN demo_users d
WHERE u.id <> d.id
ON CONFLICT DO NOTHING;

-- 1b) Read history for the demo users (the left rail reads `user_contents`,
--     NOT `activities`), so whoever logs in also sees a populated "learned" rail.
WITH demo_users AS (
    SELECT id FROM users ORDER BY created_at DESC LIMIT 8
),
demo_contents AS (
    SELECT ct.id AS content_id
    FROM contents ct
    JOIN modules m ON m.id = ct.module_id
    JOIN courses c ON c.id = m.course_id
    ORDER BY ct.created_at DESC
    LIMIT 8
)
INSERT INTO user_contents (user_id, content_id, is_read, is_favorite)
SELECT u.id, dc.content_id, true, false
FROM demo_users u
CROSS JOIN demo_contents dc
ON CONFLICT (user_id, content_id) DO UPDATE SET is_read = true;

-- 2) Learning activities for the demo users, referencing real lessons so the
--    feed text + deep-links resolve.
WITH demo_users AS (
    SELECT id FROM users ORDER BY created_at DESC LIMIT 8
),
demo_contents AS (
    SELECT ct.id            AS content_id,
           ct.title         AS title,
           m.id             AS module_id,
           c.display_id     AS course_display_id,
           row_number() OVER (ORDER BY ct.created_at DESC) AS rn
    FROM contents ct
    JOIN modules m ON m.id = ct.module_id
    JOIN courses c ON c.id = m.course_id
    LIMIT 8
),
templates(type, rn) AS (
    VALUES
        ('lessonRead', 1),
        ('lessonBookmarked', 2),
        ('challengePassed', 3),
        ('codingSolved', 4),
        ('milestonePassed', 5),
        ('courseEnrolled', 6),
        ('discussionCommented', 7),
        ('aiLabPassed', 8)
)
INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
SELECT u.id,
       t.type::activity_type,
       -- 32-char md5 dedup key, unique per (type, user, content)
       md5(t.type || ':' || u.id::text || ':' || dc.content_id::text),
       -- token-based target ref (resolved to a route lazily via resolveRoute);
       -- all learning activities point at a real content for the demo
       jsonb_build_object(
           'target', jsonb_build_object(
               'entityName', 'ContentEntity',
               'id', dc.content_id::text,
               'label', dc.title
           )
       ),
       now() - (floor(random() * 240)::text || ' hours')::interval,
       now()
FROM demo_users u
CROSS JOIN templates t
JOIN demo_contents dc ON dc.rn = t.rn
ON CONFLICT DO NOTHING;

-- 3) "Started following" activities so the feed also shows social events.
WITH demo_users AS (
    SELECT id, username FROM users ORDER BY created_at DESC LIMIT 8
)
INSERT INTO activities (user_id, type, idempotency_key, payload, created_at, updated_at)
SELECT a.id,
       'userFollowed'::activity_type,
       md5('userFollowed:' || a.id::text || ':' || b.id::text),
       jsonb_build_object(
           'target', jsonb_build_object(
               'entityName', 'UserEntity',
               'id', b.id::text,
               'label', b.username
           )
       ),
       now() - (floor(random() * 240)::text || ' hours')::interval,
       now()
FROM demo_users a
CROSS JOIN demo_users b
WHERE a.id <> b.id
ON CONFLICT DO NOTHING;

COMMIT;

-- Quick check:
--   SELECT type, count(*) FROM activities GROUP BY type ORDER BY 1;
--   SELECT count(*) FROM user_follows;
