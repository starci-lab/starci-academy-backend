---
name: starci-fe-story-create
description: >
  SOẠN một UI MỚI (chưa có trong app FE chính `$FE_SOURCE`) từ mô tả biz của thầy, rồi DECOMPOSE top-down
  thành cây **4 tầng `layout/overlay → block → design → primitive`** (canon `.claude/fe/principles.md`
  §6c + §11) — y hệt lane `starci-fe-story-audit`, chỉ khác NGUỒN: audit đọc code có sẵn, còn create **soạn
  biz mới** (spec hành vi: chức năng, view-switch, state) TRƯỚC rồi mới vẽ cây. Trục cốt lõi: **LEAF = cấu
  trúc · STATE = nội dung trong block** (§11f). STEP 1 = **VIẾT BIZ SPEC** (từ mô tả thầy) → **VẼ CÂY LÝ
  TƯỞNG** feature nên-có → ghi report `$FE_SOURCE/.artifacts/decompose/` + **RENDER trang HTML serve 8080 =
  PROTOTYPE hình mỗi leaf (icon Phosphor import) + cây tầng** → **STOP cho thầy duyệt**. ⛔ Step 1
  KHÔNG grep port / đánh REUSE-NEW / lo cái sẵn có — đối chiếu port là STEP SAU. Read-only ở step 1 (chỉ ghi
  report, chưa dựng .tsx). Dùng khi thầy gõ `/starci-fe-story-create <tên UI>` kèm mô tả (vd "drawer thông
  báo", "trang leaderboard"), "soạn biz mới rồi phân tách layout→primitive", "UI này chưa có, vẽ cây tầng".
  Cặp audit là `starci-fe-story-audit` (feature CÓ SẴN). KHÔNG chấm surface/màu — đây là lane BẢN ĐỒ TẦNG.
---

# /starci-fe-story-create — soạn biz MỚI → vẽ cây lý tưởng 4 tầng

> **Nền luôn-bật:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) · `ground-in-source` (biz mới vẫn phải neo vào pattern + port THẬT đang có — đừng chế component trùng cái sẵn có) · [`discipline/multi-session-git.md`](../../discipline/multi-session-git.md) (**pull FE trước** để biết port nào đã tồn tại — memory `feedback-pull-fe-before-analyzing`).

## Skill làm gì (và KHÔNG làm gì)
- **NHẬN:** mô tả biz của thầy (chức năng UI mới muốn có). Thiếu thông tin → HỎI thầy (view nào, state nào, dữ liệu gì), đừng bịa.
- **ĐỌC (để tái dùng):** `$FE_SOURCE/.storybook/stories/blocks/**` (port đã có) + `$FE_SOURCE/src/components/**` pattern gần giống + canon `.claude/fe/principles.md` §6c/§11.
- **GHI:** 1 biz spec + cây decompose → `$FE_SOURCE/.artifacts/decompose/<ui-name>.md`.
- **KHÔNG:** dựng .tsx/story ở step 1. Chỉ ra BẢN ĐỒ (spec + cây + GAP) rồi STOP chờ duyệt.

`$FE_SOURCE` khai ở `.artifacts/config.json` (`feSource`). Hiện `C:\Repositories\starci-academy`, branch `mtp`.

## Thước = canon 4 tầng (SSOT ở principles.md, KHÔNG lặp)
- **§6c BỐN TẦNG** — `primitive` · `design` · `block` · `layout/overlay`; thang 3 câu xếp tầng.
- **§11 Layouts & Overlays** — block-first (§11a); chức năng khác → block khác (§11b); đừng ép primitive thành block giả (§11c); **§11f LEAF = cấu trúc, STATE = nội dung trong block**.

Create ≠ audit ở chỗ: audit RÚT cây từ code có sẵn; create **THIẾT KẾ** cây từ biz — nhưng thước tầng y hệt.

## STEP 1 — VIẾT BIZ SPEC → VẼ CÂY LÝ TƯỞNG → report → STOP
Xem quy trình chi tiết + format ở [`s1-decompose.md`](./s1-decompose.md). Tóm tắt:

1. **Clarify** — mô tả thầy thiếu chỗ nào (view-switch? state mỗi vùng? dữ liệu?) → HỎI, đừng đoán.
2. **Viết BIZ SPEC** — mô tả hành vi UI mới, top-down: page hay overlay; SWITCH giữa những cấu trúc nào; mỗi cấu trúc chức năng gì; mỗi vùng có STATE nào (empty/loading/error/content…). Đây là "biz thật" của UI chưa tồn tại.
3. **Rút LEAF từ spec** — mỗi CẤU TRÚC riêng = 1 leaf (§11f): leaf đổi ⇔ tập BLOCK đổi. state (empty/loading) KHÔNG thành leaf. Smell test: 2 leaf trùng parts → gộp.
4. **Đào từng leaf xuống tầng** — mỗi leaf = tập BLOCK; mỗi block ghi **đầy đủ states**; đào tiếp DESIGN → PRIMITIVE (§6c thang 3 câu).
5. **RENDER RA 8080 — PROTOTYPE HÌNH + CÂY** (bắt buộc) — trang HTML: (a) **prototype mockup UI thật mỗi leaf** theo spec (icon Phosphor import CDN), (b) cây tầng. Serve `python -m http.server 8080` (chi tiết bước F ở s1).
6. **Report + STOP** — markdown (spec + cây) + link 8080 → báo thầy. **Dừng chờ duyệt.**

⛔ Step 1 KHÔNG: grep port để đánh REUSE/NEW · lo cái gì sẵn có. Cây là feature NÊN-CÓ; đối chiếu port hiện có = STEP SAU.

## STEP 2+ (chỉ khi thầy duyệt cây)
Cây duyệt → **bấy giờ** grep port hiện có (node nào REUSE được, node nào NEW), rồi dựng từ GỐC lên (primitive/design trước, block, layout/overlay ghép) — route qua `starci-fe-story-fix-block-apply`. Step 1 chỉ ra cây.

## Model
Viết spec + dựng cây = main-loop (Opus — thiết kế tầng là phán đoán khó). Human-in-loop, không fan-out.

## Ràng
- **HỎI khi biz thiếu** — không bịa view/state. Spec sai gốc → cây sai hết.
- **Step 1 = cây feature NÊN-CÓ, KHÔNG lo port sẵn có** — không grep `blocks/**`, không đánh REUSE/NEW. Đối chiếu port (để tái dùng, tránh đẻ trùng §6b) là STEP SAU sau khi thầy duyệt cây.
- **LEAF theo CẤU TRÚC, xét đúng tầng** — empty/loading/error là state của block, không leaf.
- **KHÔNG over-group / block giả** (§11b/§11c).
- Report ghi FE `.artifacts/decompose/`; KHÔNG dựng .tsx ở step 1; STOP chờ duyệt.
