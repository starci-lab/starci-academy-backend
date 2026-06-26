# Draft — Landing render TRACK (lộ trình curated), KHÔNG course-catalog; track = course → 1 section (identity + tier + link course thật), đừng tách 2 section cùng entity (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (landing/marketing — grounded + định vị) + [[landing-grounded-real-courses-and-systems]] + [[concepts/card]] (không 2 card/section trùng) + [[single-source-render]].
- Bối cảnh: landing có 2 section — "Courses" (3 card identity FS/SD/DevOps) + "Roadmap" (3 cột tier cùng FS/SD/DevOps). Thầy: *"cái này render khóa học hay render track"* → *"nên render khóa học hay track"* → *"rồi track ra cái gì"*.

## Phân biệt (StarCi)
- **Course** = entity THẬT trong DB (CourseEntity), enroll được. Có 5 (FS·SD·DevOps·AI mỏng·Claude trống).
- **Track (lộ trình)** = cách ĐÓNG GÓI 1 course thành "đường đi có cấu trúc" (tier foundation→application).
- **Ở StarCi: track ≈ course** (FS Mastery course = track Fullstack). KHÔNG có grouping "track gồm nhiều course".

## Luật (STRICT)
- **Landing = render TRACK (curated, có tier/path), KHÔNG dump course-catalog.** Landing là marketing/định vị → kể chuyện CURATED ("lộ trình tự học có hệ thống"), chọn **3 track tiêu biểu mạnh** (FS/SD/DevOps), KHÔNG liệt kê hết 5 course (tránh khoe AI mỏng + Claude trống). Course-catalog đầy đủ (search/enroll mọi khóa) sống ở **trang /courses** ("khác tự search"). Định vị bằng chiều SÂU + cấu trúc (track có tier), không bề rộng (chợ khóa học).
- **Track = course → 1 SECTION DUY NHẤT, KHÔNG tách 2 section cùng 3 entity.** Tách "Courses card" + "Roadmap tier" = render CÙNG 3 track 2 lần → lặp (thầy bắt). Gộp: **mỗi track-card = identity (icon/module/tag/title/desc) + tier path (foundation→application) + CTA "Vào khóa"**. 1 lần xuất hiện, vừa "khóa học" vừa "lộ trình". Cùng tinh thần [[concepts/card]] (đừng 2 card/section trùng) + [[single-source-render]] (1 entity = 1 chỗ render).
- **Track RA khóa THẬT.** CTA card → `pathConfig().locale(locale).course(slug)` = course detail (`/courses/<slug>`), slug khớp DB thật (`fullstack-mastery`/`system-design-mastery`/`devops-mastery`). KHÔNG link tới catalog generic, KHÔNG bịa. Track là PRESENTATION; entity dưới là course thật.
- **Module count = THẬT** (23/24/35 từ curriculum) — grounded, không bịa số.

## ĐÃ ÁP DỤNG 2026-06-26 (FE)
- `Landing/index.tsx`: gộp section "Courses" + "Roadmap" → 1 section `#courses` ("Lộ trình"): mỗi card identity + tier (`LANDING_ROADMAP_TIERS[key]`, divider `border-t`) + Link "Vào khóa" → `course(LANDING_TRACK_COURSE_SLUG[key])`. Xoá section Roadmap riêng + import `LANDING_TRACK_KEYS` (khỏi index, vẫn giữ ở constants cho type).
- `constants`: thêm `LANDING_TRACK_COURSE_SLUG` (track → slug khóa thật).
- i18n: `landing.courses.eyebrow` "Khóa học"→"Lộ trình" / "Courses"→"Tracks"; `view` "Xem khóa"→"Vào khóa" / "View track"→"Open course".
- **Nợ:** `landing.roadmap.*` i18n + block `TrackLadder` giờ mồ côi (không ai import) → xoá khi dọn. tsc/eslint/JSON sạch.
