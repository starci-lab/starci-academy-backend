# Draft — Landing PHẢI grounded từ curriculum THẬT: track = course có thật, "systems" = capstone thật (2026-06-25)

- File/§ đích khi `/merge`: `concepts/` (landing/marketing — grounded-in-data) + brainstorm `features/landing/Landing/UX-BRAINSTORM.md`.
- Bối cảnh: thầy bảo scan source để biết StarCi dạy gì → brainstorm landing. Scan ra: 5 course (Fullstack 23 module · System Design 24 module/356+ challenge/20 capstone · DevOps 35 module · AI/LLM 2 · Claude trống). Landing CŨ khoe **track "Security" + "Solution Architect" KHÔNG tồn tại** (không phải course) — vi phạm grounded-in-data.

## Luật (STRICT)
- **Landing CHỈ được marketing track/course CÓ THẬT trong curriculum.** TrackLadder cũ liệt kê fullstack/devops/**security**/**architect** nhưng chỉ có 3 course thật (FS/SD/DevOps) → "security"/"architect" là track ma → khách bấm vào không có gì. Đã sửa → 3 track thật. Nguyên tắc: trước khi đưa 1 "track/lộ trình" lên landing, kiểm `.mount/data/courses/` có course đó không; KHÔNG bịa track cho "nghe sang".
- **Proof "không CRUD" = liệt kê HỆ THỐNG THẬT từ capstone** (`courses/<sd>/milestones/` + module titles), KHÔNG nói chung chung. SD có 20 capstone = News feed/Video/Flash sale/Gọi xe/Ví điện tử/Chat/Search/K8s — đây là bằng chứng cụ thể. Section "Hệ thống bạn sẽ xây" dùng list curated này (i18n), số liệu (356+ challenge, 20 capstone, 82 module) là THẬT từ data.
- **"Curated marketing copy" (systems list, tier) = i18n constant rút từ curriculum thật, KHÔNG query live** (highlight chọn lọc, không phải list động). Course/module thật hiện ở course detail (`courses`/`course`). Số tổng nếu muốn live → cần aggregate field BE (defer).
- **Tham vọng sản phẩm (thầy chốt): StarCi = LỘ TRÌNH TỰ HỌC CÓ HỆ THỐNG** (foundation→application + capstone) across FS/SD/DevOps — landing phải phản ánh điều này, không phải "1 khóa lẻ".

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `Landing`: thêm section **"Hệ thống bạn sẽ xây"** (8 capstone thật, PitchCard grid, i18n vi+en) sau Track ladder. Hero → split + ảnh (vòng trước). CourseCatalog chuyển lên sớm.
- **Roadmap: TrackLadder 4-track-ma → 3 track THẬT** (fullstack/systemDesign/devops; SD highlighted; caption concrete "dựng sản phẩm / hệ thống quy mô lớn / vận hành đa cloud"). i18n roadmap title/intro bỏ "đích đến Solution Architect" (course không tồn tại) → "3 lộ trình mastery, foundation→application + capstone". `LANDING_TRACK_KEYS` = 3 real.
- tsc + eslint + JSON sạch.

## ⚠️ TENSION định vị CHƯA giải (cần thầy quyết copy)
- **Hero/Wedge copy vẫn nói "StarCi KHÔNG phải bootcamp fullstack, đây là nơi rèn Solution Architect"** — nay MÂU THUẪN với roadmap honest (có Fullstack Mastery cho fresher/junior + 3 track). Cần thầy chốt: (1) giữ giọng "Solution Architect" (thu hẹp định vị, mâu thuẫn data) hay (2) mở rộng giọng = "lộ trình tự học để xây hệ thống thực, từ fullstack đến system design đến devops" (khớp data + tham vọng). Em KHÔNG tự rewrite hero copy opinionated của thầy — chờ quyết.
- **Chưa làm:** "Cách học" loop (thay Wedge — cần copy); Blog + hiring-strip (cần hook BE); ảnh hero file `public/landing/hero-dev.png`.
