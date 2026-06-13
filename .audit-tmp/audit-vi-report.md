# Audit Tiếng Việt — Báo cáo (Fullstack + System Design)

Ngày: 2026-06-12 · Chuẩn: `.gitrefs/data/rules/audit-vietnamese.md` (§F execution model đã bake)
Vị trí fix: `.gitrefs/data/courses/{0-fullstack-mastery,1-system-design-mastery}`

## Scope
- 203 unit (2 course root + 41 module + 160 lesson). Lesson đệ quy vào bodies + challenges + submissions.
- ~1285 vi.md curriculum + submissions. Chia 10 chunk round-robin → 10 workflow song song.
- Model: Haiku (scan+fix term/dấu) → Sonnet (rewrite calque). Opus = 0.

## Tổng số sửa (10 chunk)
| Loại | Số chỗ |
|---|---|
| A — Force-translation → trả tiếng Anh | ~890 |
| B.dấu — thêm dấu / em-dash | ~426 |
| B.calque — rewrite câu (Sonnet) | ~30 |
| Sửa tay sau re-scan (vỏ app×2, dòng tải trọng×2, corruption giao-hợp-hiệu×1) | 5 |

## Verify (L0 re-scan độc lập, loại submissions)
- Force-translation vô-nghĩa (vỏ app/giàn giáo/phần mềm trung gian/mã thông báo…): **0**
- Thiếu dấu (heuristic khoi dong/cau hinh…): **0**
- Còn `config có kiểu dữ liệu` (6): GIỮ — descriptive tự nhiên, không phải calque.

## Quyết định ngữ cảnh (giữ, KHÔNG ép Anh-hoá — đúng §B balance)
- `nhà cung cấp` = vendor/dịch vụ business (SMTP/SMS/mail) → GIỮ.
- `điểm cuối` = "điểm cuối cùng/final" (PageRank) → GIỮ.
- `khoá phân tán (distributed lock)` có gloss → GIỮ.
- `bộ nhớ đệm`, `phân phối tải trọng`, `điểm hội tụ [của tín hiệu]`, `dưới lớp vỏ` (under the hood) → GIỮ.

## Sự cố & bài học
1. `args` của Workflow tới script dạng **STRING** (không phải object) → 3 workflow đầu cùng default chunk 0, edit chồng. Fix: `JSON.parse(args)`. Chunk 0 chạy lại (term-replace hội tụ, vô hại).
2. 1 unit (redis-data-structures) fail StructuredOutput → chạy lại bằng free-form Agent; agent này **đi quá scope** (gộp "giao/hợp/hiệu" → "giao hợp hiệu" vô nghĩa). Đã phát hiện qua re-scan + sửa tay. → Free-form Agent rủi ro hơn workflow agent có schema.

## Ép nghiêm §A.2 — DONE 2026-06-12 (thầy chốt "quất full")
Research cộng đồng dev VN (Viblo/TopDev) → ép cả 4:
- `bộ nhớ đệm`→cache/Cache (4) · `lớp bọc`→wrapper/Wrapper (5) · `config/cấu hình có kiểu`→Typed Config (6) · `khoá/khóa phân tán`→Distributed lock (22, bỏ gloss trùng) · thêm `trình bao bọc giao dịch`→transaction wrapper, `lớp vỏ envelope`→lớp envelope, `móc nối`→cơ chế.
- GIỮ 2 idiom hợp lệ: `dưới lớp vỏ` (under the hood), `lớp vỏ thị giác` (visual shell).
- Verify cuối: force-translation §A.2 = **0**, thiếu dấu = **0**. Distributed lock=101, Typed Config=23 đã vào.

## Pending
- Sync `.gitrefs` → `.mount/data/courses` (bản deploy) sau khi chốt — dính [V1→V2 collapse] đang dở.
- Dọn `.audit-tmp/` nếu không cần chạy lại.
