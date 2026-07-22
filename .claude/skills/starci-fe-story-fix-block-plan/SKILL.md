---
name: starci-fe-story-fix-block-plan
description: >
  GIAI ĐOẠN 1 (plan, read-only) của lane sửa render 1 BLOCK story (`Block/*` — Cards, Feed, Commerce,
  Grading, Learn, Notifications…). Đọc principle → audit story qua MẮT (browser) → **vẽ visual_widget chú
  thích đúng/sai + đề xuất cách fix** (như prototype CourseCard) → xuất plan ngắn → **STOP cho thầy duyệt**.
  KHÔNG sửa code. Đối tác: `starci-fe-story-fix-block-apply` (giai đoạn 2 apply plan đã duyệt). Dùng khi thầy
  gõ `/starci-fe-story-fix-block-plan <story|họ>` (vd `CourseCard`, `cards`), "plan sửa block <X>", "phân tích
  cách fix render block <X>". KHÔNG phải audit-toàn-bộ (đó là `starci-fe-story-audit`); đây là 1 block, ra plan
  fix cụ thể. KHÔNG phải layout/overlay (dùng skill `-layout-plan`/`-overlay-plan`).
---

# /starci-fe-story-fix-block-plan — audit 1 block → visual_widget cách fix → thầy duyệt

> **Nền luôn-bật:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) (màu + phân lớp là VISUAL → **NHÌN** browser/screenshot, không chấm bằng đọc class) · `ground-in-source` (đọc principle + story THẬT, đừng chế) · [`diagnose-before-fix`](../../discipline/diagnose-before-fix.md) (khoanh đúng chỗ sai trước khi đề xuất).

## Vai: PLAN (read-only). Không đụng code.
Ra **cách fix** để `-apply` thực thi. Plan sai thì apply sai theo — nên plan phải NHÌN thật + neo principle, không cảm tính.

## B1 — Đọc principle (đừng chế)
- **`.claude/fe/principles.md`** — block dùng chủ yếu **§1 Surface-in-surface** + **§2 Color-prominence** (nổi/chìm · thang chip/accent/muted · cặp trái-phải lệch cấp). Đọc checklist "Đo được" của mỗi §.
- Component + story THẬT của block đang plan (`$FE_SOURCE/.storybook/stories/blocks/**`) — prop/state neo vào code thật.
- `$FE_SOURCE` = repo FE (`.artifacts/config.json`; hiện `D:\Repositories\starci-academy`, branch mtp).

## B2 — Audit theo concept (NHÌN, không đọc class)
Mở story qua browser (Storybook :6006), **nhìn render** từng state. Chấm theo §1 + §2:
- **Màu:** đúng 1 thứ nổi/vùng? meta chìm (không lạm dụng chip/accent)? cặp trái-phải lệch cấp? nhiễu sắc (đếm điểm nổi — >2 là cờ)?
- **Surface:** ngoài shadow / nested border? không double-fill? radius đúng (surface-card 3xl, media 2xl)?
- **Text:** phân cấp (title nổi → meta/desc muted)? alignment (neo trái, không căn giữa lạc)?
- **Anatomy đầy đủ?** blockShell liệt kê **MỌI** part (block + primitive) chưa, hay thiếu (vd quên Button/cover)? Skeleton/part-chỉ-1-state có tag `state` chưa? part gắn `tier` (block/primitive) chưa? (U1 — block cấu tạo từ block + primitive.)
Mỗi phát hiện = 1 dòng: `[✅/⚠️/❌] vùng — lý do neo §principle`.

## B3 (của plan) — DEEP brainstorm → 3–4 PHƯƠNG ÁN widget để thầy CHỌN
KHÔNG chốt 1 fix. Với mỗi vấn đề đáng kể:
- **Brainstorm sâu** nhiều hướng fix KHÁC nhau (đừng lấy cái đầu tiên nghĩ ra) — mỗi hướng neo §principle, nêu tradeoff.
- **Render 3–4 phương án** bằng `mcp__visualize__show_widget` (đọc `read_me` module `mockup` TRƯỚC): mỗi hướng 1 mockup (hoặc 1 widget nhiều cột), tái dựng block theo hướng đó + chú thích cái đổi; kèm **before (hiện tại)** để so.
- Prose NGOÀI widget: bảng ưu/nhược từng phương án + em nghiêng về cái nào + LÝ DO — nhưng để **THẦY CHỌN**.
- **STOP: thầy chọn 1 (hoặc trộn)** → hướng đó thành plan duyệt cho `-apply`. KHÔNG tự chốt.

## Xuất plan + STOP
- Ghi plan ngắn → `$FE_SOURCE/.artifacts/plans/story-fix-<block>.md`: bảng phát hiện (✅/⚠️/❌ · vùng · §principle) + **3–4 phương án** (mô tả + tradeoff) + link widget từng phương án.
- **STOP — thầy CHỌN phương án** (hoặc trộn). Chốt xong ghi **phương án đã chọn** (class/token/prop cụ thể) vào plan → `-apply` mới chạy. KHÔNG tự chốt/sửa code.

## Ràng (STRICT)
- **Read-only:** không sửa story/component/preview. Chỉ đọc + widget + ghi plan `.artifacts`.
- **Mọi phát hiện phải neo §principle** (không "thấy xấu" chung chung). Không có luật trong principles.md → ghi là *đề xuất luật mới*, để thầy quyết bổ sung §, KHÔNG tự chế trong plan.
- 1 block/lượt (hoặc 1 họ nhỏ). Họ lớn → chạy `starci-fe-story-audit` trước để khoanh block đáng fix.

## Liên quan
- `starci-fe-story-fix-block-apply` — giai đoạn 2, apply plan này.
- `starci-fe-story-audit` — chấm toàn bộ (không ra plan fix từng block).
- `.claude/fe/principles.md` — SSOT thước.
