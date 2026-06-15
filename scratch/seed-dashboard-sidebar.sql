-- Seed the dashboard right-rail content (advertisement banner + changelog) so the
-- rail renders without the mount-data seeder (init is disabled for fast boot).
-- Idempotent (ON CONFLICT on the natural slug). Run:
--   docker exec -i -e PGPASSWORD=... <pg> psql -U postgres -d starci-academy < scratch/seed-dashboard-sidebar.sql

-- 1) house advertisement (the internal "advertise here" promo, shown when no paid
--    ad is active in the slot)
INSERT INTO advertisements
    (slug, placement, media_type, media, title, cta_text, link_url, sponsor_name, is_house_ad, priority, is_active)
VALUES
    (
        'house-advertise-here',
        'dashboard_right',
        'image',
        '{"url": "https://placehold.co/1280x720/0F6E56/FFFFFF/png?text=%20"}'::jsonb,
        '{"en": "Advertise here", "vi": "Đặt quảng cáo tại đây"}'::jsonb,
        '{"en": "Contact us", "vi": "Liên hệ ngay"}'::jsonb,
        '/vi/lien-he',
        NULL,
        true,
        0,
        true
    )
ON CONFLICT (slug) DO UPDATE SET
    media      = EXCLUDED.media,
    title      = EXCLUDED.title,
    cta_text   = EXCLUDED.cta_text,
    link_url   = EXCLUDED.link_url,
    is_active  = EXCLUDED.is_active,
    updated_at = now();

-- 2) changelog entries (newest first via published_at)
INSERT INTO changelog_entries
    (slug, title, body, category, published_at, link_url, is_published)
VALUES
    (
        'dashboard-rail-redesign',
        '{"en": "New dashboard rail", "vi": "Thanh điều hướng mới"}'::jsonb,
        '{"en": "Courses, weekly streak and recent activity, all in one rail.", "vi": "Khóa học, streak tuần và hoạt động gần đây gộp chung một thanh."}'::jsonb,
        'feature',
        now() - interval '1 day',
        NULL,
        true
    ),
    (
        'weekly-streak-widget',
        '{"en": "Weekly streak & XP", "vi": "Streak & XP theo tuần"}'::jsonb,
        '{"en": "Track your 7-day streak, XP and lessons read.", "vi": "Theo dõi streak 7 ngày, XP và số bài đã đọc."}'::jsonb,
        'feature',
        now() - interval '3 days',
        NULL,
        true
    ),
    (
        'faster-dashboard-load',
        '{"en": "Faster dashboard", "vi": "Dashboard tải nhanh hơn"}'::jsonb,
        '{"en": "Each rail block now loads independently.", "vi": "Mỗi khối trong thanh giờ tải độc lập."}'::jsonb,
        'fix',
        now() - interval '6 days',
        NULL,
        true
    )
ON CONFLICT (slug) DO UPDATE SET
    title        = EXCLUDED.title,
    body         = EXCLUDED.body,
    category     = EXCLUDED.category,
    published_at = EXCLUDED.published_at,
    is_published = EXCLUDED.is_published,
    updated_at   = now();

SELECT count(*) AS advertisements FROM advertisements;
SELECT count(*) AS changelog FROM changelog_entries;
