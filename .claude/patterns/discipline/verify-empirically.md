# Verify empirically — đo, không đọc

> Câu gốc v2: **đừng tin lời kể — của người khác, của chính mình, hay của công cụ — khi có thể ĐO được.** *"Build xanh ≠ chạy đúng."*

**Trigger (tự áp, không đợi gõ):** trước khi báo "xong", "chạy được", "đã sửa", "không lỗi", "render đúng".

## Luật

- KHÔNG kết luận từ ĐỌC code / lời kể / `package.json` / "chắc là". Phải ĐO cái thật.
- Mỗi loại claim có một cách đo RẺ — chọn cách rẻ nhất đủ chứng minh:

| Claim | Đo bằng |
|---|---|
| "render đúng / có N state" | `curl :6006/index.json` + ĐẾM; hoặc drive browser đọc DOM |
| "input / UI hoạt động" | repro `elementFromPoint` / `getBoundingClientRect` — không đoán |
| "thư viện X dùng thật" | `grep -rl` source ĐẾM — KHÔNG tin deps trong `package.json` |
| "type khớp / không lỗi" | `tsc --noEmit` chạy thật |
| "sweep không regression" | gate + đếm/tsc trước & sau |

- Build / lint / tsc xanh CHỈ chứng minh "compile được" — KHÔNG chứng minh "chạy đúng / render đẹp". Cái sau cần mắt hoặc đo runtime.

## Bằng chứng (đừng lặp lại các lỗi này)

- Terminal "gõ không được" → dựng `elementFromPoint` repro → input đúng cấu trúc → gốc là **thiếu agent** (hạ tầng), không phải code (memory `playground-agent-local-server-flag`). Tin lời kể "code sai" = thrash nhầm tầng.
- Overlap mục lục → đo `getBoundingClientRect` → `container-type` không tạo containing-block cho `fixed`.
- i18n → gate snapshot placeholder/ICU/mirror chạy TRƯỚC + SAU `--write`.

## Điểm mù: Storybook đo được BLOCK, không đo được SURFACE (v2 §4b)

Story sync 100% VẪN không đảm bảo "mượt" — mượt nằm ở **composition** (nhịp · phân cấp · data thật · bố cục cả màn). Storybook chỉ cân atom cô lập.

→ **Surface phải verify ở app CHẠY THẬT qua browser**, không chỉ Storybook. Ba-lớp-sync (canon · story · component) đang bỏ trống lớp bố-cục-cả-màn → lớp đó chỉ đo được ở reality.

Nối: [`diagnose-before-fix.md`](diagnose-before-fix.md) (đo để chẩn đúng tầng).
