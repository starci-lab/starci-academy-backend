-- Local seed for the dashboard right rail (advertisement banner + changelog),
-- mirroring .mount/data/advertisements/*.yaml + .mount/data/changelog/*.yaml.
-- Run after BE boot (so `synchronize` created the tables):
--   docker exec -i -e PGPASSWORD=... <pg> psql -U postgres -d starci-academy < scratch/seed-advertisements-changelog.sql
-- Idempotent: ON CONFLICT (slug) updates.

-- House ad: "Advertise here" image banner → teacher's Facebook.
INSERT INTO advertisements
    (slug, placement, media_type, media, title, cta_text, link_url,
     sponsor_name, is_house_ad, priority, is_active)
VALUES (
    'house-advertise-here',
    'dashboard_right',
    'image',
    '{"url":"https://placehold.co/1280x720/0F6E56/FFFFFF/png?text=%20"}'::jsonb,
    '{"en":"Advertise here","vi":"Quảng cáo ở đây"}'::jsonb,
    '{"en":"Contact to advertise","vi":"Liên hệ đặt quảng cáo"}'::jsonb,
    'https://www.facebook.com/starci183',
    NULL, true, 0, true
)
ON CONFLICT (slug) DO UPDATE SET
    placement = EXCLUDED.placement, media_type = EXCLUDED.media_type,
    media = EXCLUDED.media, title = EXCLUDED.title, cta_text = EXCLUDED.cta_text,
    link_url = EXCLUDED.link_url, sponsor_name = EXCLUDED.sponsor_name,
    is_house_ad = EXCLUDED.is_house_ad, priority = EXCLUDED.priority,
    is_active = EXCLUDED.is_active, updated_at = now();

-- Changelog entries (newest first by published_at).
INSERT INTO changelog_entries
    (slug, title, body, category, published_at, link_url, is_published)
VALUES
    ('cqrs-projection-layer',
     '{"en":"CQRS projection layer","vi":"Lớp projection CQRS"}'::jsonb,
     '{"en":"Heavy aggregates (leaderboard, engagement, stats) now read from flat projections kept fresh by CDC.","vi":"Các thống kê nặng (BXH, tương tác, chỉ số) giờ đọc từ projection phẳng, cập nhật qua CDC."}'::jsonb,
     'feature', '2026-06-14T00:00:00Z', NULL, true),
    ('github-style-dashboard',
     '{"en":"GitHub-style dashboard","vi":"Bảng điều khiển kiểu GitHub"}'::jsonb,
     '{"en":"A logged-in home with your activity feed, learning history and milestone progress.","vi":"Trang chủ sau đăng nhập: feed hoạt động, lịch sử học và tiến độ milestone."}'::jsonb,
     'feature', '2026-06-13T00:00:00Z', NULL, true),
    ('avatar-presigned-upload',
     '{"en":"Faster avatar uploads","vi":"Tải ảnh đại diện nhanh hơn"}'::jsonb,
     '{"en":"Avatars now upload straight to storage via a presigned URL.","vi":"Ảnh đại diện giờ tải thẳng lên kho lưu trữ qua URL ký sẵn."}'::jsonb,
     'fix', '2026-06-14T00:00:00Z', NULL, true)
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title, body = EXCLUDED.body, category = EXCLUDED.category,
    published_at = EXCLUDED.published_at, link_url = EXCLUDED.link_url,
    is_published = EXCLUDED.is_published, updated_at = now();
