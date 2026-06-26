# Draft — Card minh hoạ "sản phẩm" trên landing = mini-web (ShowcaseMockup browser-chrome) + URL thật + GROUNDED từ trang thật (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (landing/marketing) hoặc `elements/` (ShowcaseMockup) + liên quan [[landing-grounded-real-courses-and-systems]] · [[landing-hero-split-visual-and-catalog-early]].
- Bối cảnh: section "Hai hướng đáng giá" (`TalentMarketplace`) — card ứng viên mẫu bên phải render trần như 1 `SectionCard`. Thầy: *"bên phải render dạng web mini nhé, trò đọc trang profile"*.

## Luật (STRICT)
- **Card minh hoạ "đây là màn hình sản phẩm" trên landing (profile mẫu, leaderboard mẫu, submit mẫu…) → bọc trong block `ShowcaseMockup`** (browser-chrome: mac dots + address bar) với **URL đọc như thật** (`starci.academy/profile/<slug>`, `starci.academy/leaderboard`…), KHÔNG để card trần. Khung trình duyệt + URL = tín hiệu "đây là sản phẩm thật chạy được", mạnh hơn 1 card mồ côi. Canonical đã dùng: `LearnLoopScroll` (read/grade/capstone/rank đều ShowcaseMockup + `STEP_URL`).
- **GROUNDED từ TRANG THẬT:** trước khi dựng mini-web của màn X, **đọc component trang X thật** (vd `PublicProfile`) để card minh hoạ mirror đúng phần tử nhận diện (avatar rank-frame, open-to-work pill, role, các stat row, skill chips, XP) + URL khớp route thật (`/profile/<username>`). KHÔNG bịa layout không tồn tại.
- **ShowcaseMockup API:** `url?` (address bar) · `theme={SHOWCASE_THEMES.starci}` · `backdrop="glow"` (quầng sáng nền) · `tilt` (default "left", nghiêng như screenshot) · `aspect="video"` (CHỈ khi cần 16:9; bỏ → cao theo content) · `contentClassName` (vd `flex flex-col gap-3 p-4`). Nội dung bên trong vẫn dùng token app (`bg-surface`/`border-default`/Typography) — chrome lo khung, content theo light/dark token.
- **Phân biệt:** card là **đối tượng dữ liệu thật của trang** (record/receipt) → `SectionCard`/Card thường. Card là **ảnh chụp minh hoạ 1 màn sản phẩm** trên landing → ShowcaseMockup mini-web.

## ĐÃ ÁP DỤNG 2026-06-26 (FE)
- `TalentMarketplace`: `SampleCandidateCard` đổi `SectionCard` → `ShowcaseMockup` (url `starci.academy/profile/minh-anh`, theme starci, backdrop glow), mirror `PublicProfile` (avatar + name + role + open-to-work + CV score + Thử thách hệ thống + skills + XP). Import `ShowcaseMockup`/`SHOWCASE_THEMES` từ `@/components/blocks`, bỏ `SectionCard`.
- Copy (vi+en): eyebrow "Giá trị thực tế"/"Real outcomes"; title "Đầu ra cho cả hai phía"/"Output for both sides"; engineer/enterprise body viết lại (sòng phẳng, bỏ "vetted"/"keyword" lặp); enterprise CTA "Tìm kiếm ứng viên"/"Find candidates"; card label "Challenge AI chấm" → "Thử thách hệ thống" (giảm nói "AI"). tsc/eslint/JSON sạch.
- Liên quan copywriting: [[vietnamese-copy-no-mixed-english-native-phrasing]] (giọng sòng phẳng, không đao to búa lớn).
