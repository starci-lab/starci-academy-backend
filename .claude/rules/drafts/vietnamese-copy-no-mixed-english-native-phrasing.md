# Draft — Copy tiếng Việt (UI/landing): KHÔNG lẫn tiếng Anh trong câu Việt + dịch theo NGHĨA, không dịch từng chữ + label song nhịp (2026-06-26)

- File/§ đích khi `/merge`: `concepts/` (copywriting/i18n) + liên quan [[no-uppercase-text]] · [[no-emoji]] · [[landing-grounded-real-courses-and-systems]].
- Bối cảnh: landing `/vi` — thầy *"viết tiếng việt tốt hơn tí"*. Copy lẫn English giữa câu Việt (`build`, `diagram-first`, `app to-do`) + dịch word-for-word ("thiết kế cho thất bại" = design for failure) + stat label lệch nhịp ("Huy hiệu đã trao" cạnh "Học viên / Bài học / Khóa học").

## Luật (STRICT)
- **Câu tiếng Việt KHÔNG chèn từ tiếng Anh có sẵn từ Việt tốt.** `build → dựng/tự dựng` · `diagram-first → bắt đầu từ sơ đồ` · `app to-do → app to-do` (giữ — thuật ngữ nhận diện). **Giữ tiếng Anh CHỈ cho thuật ngữ kỹ thuật chuẩn** (API, CI/CD, production, capstone, traffic, sharding, idempotency, leaderboard…). Phân biệt: từ phổ thông có từ Việt → dịch; thuật ngữ ngành đã quen tiếng Anh → giữ. "Production" giữ; "build" dịch "dựng".
- **Dịch theo NGHĨA, không word-for-word.** "design for failure" → KHÔNG "thiết kế cho thất bại" (vô nghĩa tiếng Việt) → **"thiết kế để chịu được sự cố"**. "frontend sống được với traffic" → "frontend **trụ được dưới** traffic". Idiom tiếng Anh dịch thẳng = sượng → tìm cách nói tự nhiên tiếng Việt cùng nghĩa.
- **Label/stat trong 1 hàng phải SONG NHỊP** (cùng độ dài/cấu trúc). Stat strip "Học viên · Bài học · Khóa học · ~~Huy hiệu đã trao~~" → **"Huy hiệu"** (đồng 2 chữ). 1 label lệch dài phá nhịp editorial.
- **GIỮ wordplay/giọng cố ý** khi đã hay — chỉ làm mượt, đừng làm phẳng. Vd diagram caption giữ điệp "sập…sập": "Nhìn ra **nơi sẽ** sập. Dựng hệ thống **không bao giờ** sập." (mượt hơn "chỗ sập / không thể sập" mà vẫn giữ đòn chơi chữ). Founder quote hài giữ nguyên.
- **Nắn copy = chỉ đụng `vi.json`** (en.json giữ English). JSON hợp lệ sau sửa.

## Áp đầu (2026-06-26)
- `landing` vi.json: hero (xây→dựng, build→dựng, "dự án capstone thật"→"capstone thực tế", caption sập…sập) · stats (Huy hiệu đã trao→Huy hiệu) · learnLoop (intro "vòng khép kín: đọc → tự dựng → AI chấm → leo hạng" + 4 desc) · courses (diagram-first→sơ đồ kiến trúc, "thiết kế cho thất bại"→"chịu được sự cố", "sống được với"→"trụ được dưới") · systems (production thật→chạy thật ở production). Tag micro-label GIỮ uppercase (đã duyệt riêng landing — [[no-uppercase-text]] ngoại lệ). Doc: `Landing/COPY-POLISH-BRAINSTORM.md`.
