-- Local-dev upsert of the 13 achievement definitions (matches
-- .gitrefs/data/achievements/achievements.md). Bypasses the init pipeline so the
-- new 4-tier bars + 3 course badges land without a remote push. Idempotent by slug.
INSERT INTO achievements (slug, name, description, criteria_type, threshold, tier_thresholds, icon_key, sort_index) VALUES
('baby-duckling', '{"en":"Baby Duckling","vi":"Vịt Con Chập Chững"}', '{"en":"Read lessons — 1, then 10, 30, 60.","vi":"Đọc bài học — 1, rồi 10, 30, 60."}', 'lessonsRead', 1, '[1,10,30,60]', 'assets/badges/achievements/baby-duckling.png', 0),
('blazing-fox', '{"en":"Blazing Fox","vi":"Cáo Lửa Bền Bỉ"}', '{"en":"Keep a learning streak — 3, 7, 30, 100 days.","vi":"Giữ streak học — 3, 7, 30, 100 ngày."}', 'streakDays', 3, '[3,7,30,100]', 'assets/badges/achievements/blazing-fox.png', 1),
('sword-shark', '{"en":"Sword Shark","vi":"Cá Mập Kiếm Sĩ"}', '{"en":"Pass challenges — 5, 15, 30, 60.","vi":"Vượt challenge — 5, 15, 30, 60."}', 'challengesPassed', 5, '[5,15,30,60]', 'assets/badges/achievements/sword-shark.png', 2),
('crowned-owl', '{"en":"Crowned Owl","vi":"Cú Vương Đỉnh Cao"}', '{"en":"Pass milestone tasks — 1, 10, 30, 60.","vi":"Hoàn thành milestone — 1, 10, 30, 60."}', 'milestonesPassed', 1, '[1,10,30,60]', 'assets/badges/achievements/crowned-owl.png', 3),
('polyglot-parrot', '{"en":"Polyglot Parrot","vi":"Vẹt Đa Ngữ"}', '{"en":"Enroll in courses — 1, 2, 3, 4.","vi":"Ghi danh khóa học — 1, 2, 3, 4."}', 'coursesEnrolled', 1, '[1,2,3,4]', 'assets/badges/achievements/polyglot-parrot.png', 4),
('bug-hunting-chameleon', '{"en":"Bug-Hunting Chameleon","vi":"Tắc Kè Săn Bug"}', '{"en":"Solve coding problems — 3, 10, 25, 50.","vi":"Giải bài coding — 3, 10, 25, 50."}', 'codingSolved', 3, '[3,10,25,50]', 'assets/badges/achievements/bug-hunting-chameleon.png', 5),
('brainy-octopus', '{"en":"Brainy Octopus","vi":"Bạch Tuộc Trí Tuệ"}', '{"en":"Pass AI-Lab evals — 1, 3, 8, 15.","vi":"Vượt bài đánh giá AI Lab — 1, 3, 8, 15."}', 'aiLabPassed', 1, '[1,3,8,15]', 'assets/badges/achievements/brainy-octopus.png', 6),
('guiding-elephant', '{"en":"Guiding Elephant","vi":"Voi Dẫn Đường"}', '{"en":"Post discussion comments — 3, 10, 30, 75.","vi":"Đăng bình luận thảo luận — 3, 10, 30, 75."}', 'discussionComments', 3, '[3,10,30,75]', 'assets/badges/achievements/guiding-elephant.png', 7),
('busy-bee', '{"en":"Busy Bee","vi":"Ong Chăm Chỉ"}', '{"en":"Gain followers — 1, 5, 20, 50.","vi":"Có người theo dõi — 1, 5, 20, 50."}', 'followers', 1, '[1,5,20,50]', 'assets/badges/achievements/busy-bee.png', 8),
('champion-lion', '{"en":"Champion Lion","vi":"Sư Tử Quán Quân"}', '{"en":"Climb the league — Bronze, Silver, Gold, Platinum.","vi":"Leo hạng league — Đồng, Bạc, Vàng, Bạch Kim."}', 'leagueTier', 1, '[1,2,3,4]', 'assets/badges/achievements/champion-lion.png', 9),
('architect-rhino', '{"en":"Architect Rhino","vi":"Tê Giác Kiến Trúc"}', '{"en":"Read lessons in System Design Mastery — 3, 10, 25, 50.","vi":"Đọc bài trong khóa System Design — 3, 10, 25, 50."}', 'lessonsRead', 3, '[3,10,25,50]', 'assets/badges/achievements/architect-rhino.png', 10),
('fullstack-monkey', '{"en":"Fullstack Monkey","vi":"Khỉ Fullstack"}', '{"en":"Read lessons in Fullstack Mastery — 3, 10, 25, 50.","vi":"Đọc bài trong khóa Fullstack — 3, 10, 25, 50."}', 'lessonsRead', 3, '[3,10,25,50]', 'assets/badges/achievements/fullstack-monkey.png', 11),
('devops-wolf', '{"en":"DevOps Wolf","vi":"Sói DevOps"}', '{"en":"Read lessons in DevOps Mastery — 3, 10, 25, 50.","vi":"Đọc bài trong khóa DevOps — 3, 10, 25, 50."}', 'lessonsRead', 3, '[3,10,25,50]', 'assets/badges/achievements/devops-wolf.png', 12)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  criteria_type = EXCLUDED.criteria_type,
  threshold = EXCLUDED.threshold,
  tier_thresholds = EXCLUDED.tier_thresholds,
  icon_key = EXCLUDED.icon_key,
  sort_index = EXCLUDED.sort_index;

-- force every cached achievement projection to recompute on next read
DELETE FROM user_achievement_projections;

SELECT slug, sort_index, tier_thresholds FROM achievements ORDER BY sort_index;
