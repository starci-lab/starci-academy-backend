-- Backfill the content-engagement / user-stats / course-stats read-models from
-- current data (jsonb `value` storage). Run ONCE after the backend boots (so
-- `synchronize` has created the projection tables):
--   docker exec -i -e PGPASSWORD=... <pg> psql -U postgres -d starci-academy < scratch/backfill-projections.sql
-- Idempotent (ON CONFLICT updates). Inline recompute + CDC keep them fresh after.

-- 1) content_engagement_projections — one row per content that has any engagement.
INSERT INTO content_engagement_projections (content_id, value)
SELECT c.id,
       jsonb_build_object(
           'totalReactions',  COALESCE(rt.total, 0),
           'reactionsByType', COALESCE(rt.by_type, '{}'::jsonb),
           'viewCount',       COALESCE(vw.views, 0),
           'shareCount',      0,
           'commentCount',    COALESCE(cc.cnt, 0)
       )
FROM contents c
LEFT JOIN (
    SELECT content_id,
           SUM(cnt)::int AS total,
           jsonb_object_agg(type, cnt) AS by_type
    FROM (
        SELECT content_id, type, COUNT(*)::int AS cnt
        FROM content_reactions GROUP BY content_id, type
    ) g
    GROUP BY content_id
) rt ON rt.content_id = c.id
LEFT JOIN (
    SELECT content_id, COUNT(*)::int AS views
    FROM user_contents WHERE is_read = true GROUP BY content_id
) vw ON vw.content_id = c.id
LEFT JOIN (
    SELECT content_id, COUNT(*)::int AS cnt FROM content_comments GROUP BY content_id
) cc ON cc.content_id = c.id
WHERE rt.content_id IS NOT NULL OR vw.content_id IS NOT NULL OR cc.content_id IS NOT NULL
ON CONFLICT (content_id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 2) user_stats_projections — one row per user with any edge, notification, or
--    recent XP. Mirrors UserStatsProjectionService.buildUpsertSql (social/inbox
--    counters + rolling 7-day XP/lessons + consecutive-day streak).
INSERT INTO user_stats_projections (user_id, value)
SELECT u.id,
       jsonb_build_object(
           'followerCount',           COALESCE(fr.cnt, 0),
           'followingCount',          COALESCE(fg.cnt, 0),
           'unreadNotificationCount', COALESCE(nt.cnt, 0),
           'weeklyXp',                COALESCE(wx.xp, 0),
           'weeklyLessons',           COALESCE(wl.cnt, 0),
           'streak',                  COALESCE(st.streak, 0)
       )
FROM users u
LEFT JOIN (SELECT following_id AS id, COUNT(*)::int AS cnt FROM user_follows GROUP BY following_id) fr ON fr.id = u.id
LEFT JOIN (SELECT follower_id  AS id, COUNT(*)::int AS cnt FROM user_follows GROUP BY follower_id)  fg ON fg.id = u.id
LEFT JOIN (SELECT user_id AS id, COUNT(*)::int AS cnt FROM notifications WHERE read_at IS NULL GROUP BY user_id) nt ON nt.id = u.id
LEFT JOIN (SELECT user_id AS id, SUM(amount)::int AS xp FROM xp_histories WHERE created_at >= now() - interval '7 days' GROUP BY user_id) wx ON wx.id = u.id
LEFT JOIN (SELECT user_id AS id, COUNT(*)::int AS cnt FROM xp_histories WHERE source = 'lessonRead' AND created_at >= now() - interval '7 days' GROUP BY user_id) wl ON wl.id = u.id
LEFT JOIN LATERAL (
    WITH days AS (
        SELECT DISTINCT created_at::date AS d FROM xp_histories WHERE user_id = u.id
    ),
    islands AS (
        SELECT d, (d - (ROW_NUMBER() OVER (ORDER BY d))::int) AS island FROM days
    )
    SELECT COUNT(*)::int AS streak FROM islands
    WHERE island = (SELECT island FROM islands ORDER BY d DESC LIMIT 1)
      AND (SELECT MAX(d) FROM days) >= CURRENT_DATE - 1
) st ON true
WHERE fr.id IS NOT NULL OR fg.id IS NOT NULL OR nt.id IS NOT NULL
   OR wx.id IS NOT NULL OR wl.id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 3) course_stats_projections — one row per course.
INSERT INTO course_stats_projections (course_id, value)
SELECT c.id,
       jsonb_build_object('enrollmentCount', COALESCE(e.cnt, 0))
FROM courses c
LEFT JOIN (SELECT course_id, COUNT(*)::int AS cnt FROM enrollments GROUP BY course_id) e ON e.course_id = c.id
ON CONFLICT (course_id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
