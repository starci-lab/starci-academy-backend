---
name: starci-fe-story-audit
description: >
  VẼ CÂY LÝ TƯỞNG top-down cho một feature ĐÃ CÓ trong app FE chính `$FE_SOURCE` — **4 tầng
  `layout/overlay → block → design → primitive`** (canon `.claude/fe/principles.md` §6c + §11). Đọc source
  để hiểu feature LÀM GÌ, cộng **tư duy xây app** để HOÀN THIỆN nó thành cây đầy đủ (bổ sung leaf/state/design
  còn nửa vời). Trục cốt lõi: **LEAF = cấu trúc · STATE = nội dung trong block** (§11f) — không đẻ leaf cho
  empty/loading/error. STEP 1 = **VẼ CÂY** (đọc `src/components/**` để hiểu biz + phán đoán UX) → ghi report
  `$FE_SOURCE/.artifacts/decompose/` + **RENDER trang HTML serve 8080 = PROTOTYPE hình mỗi leaf (icon Phosphor
  import) + cây tầng** (thầy soi mắt) → **STOP cho thầy duyệt**. ⛔ Step 1 KHÔNG audit có/thiếu port, KHÔNG bắt
  drift, KHÔNG so story hiện có — đó là STEP SAU. Read-only ở step 1. **3 BƯỚC TUẦN TỰ qua arg step** (mỗi
  bước STOP cho thầy duyệt, cổng tuần tự đọc report bước trước): `step1` vẽ cây · `step2` diff reuse-first vs
  storybook (prototype đối chiếu từng node) · `step3` workflow Sonnet dựng thật + ghi kinh nghiệm. Không token
  step = step 1. Cặp sinh-mới là `starci-fe-story-create` (feature CHƯA có → soạn biz rồi vẽ cây y hệt). Dùng
  khi thầy gõ `/starci-fe-story-audit <UI>` (vd `ContentAiChatDrawer`), `/starci-fe-story-audit step2 <UI>` ·
  `step3 <UI>`, "vẽ cây feature này", "diff vs storybook", "dựng story cho <màn>". KHÔNG chấm surface/màu (đã
  bỏ khỏi lane này; §1/§2 vẫn ở principles.md).
---

# /starci-fe-story-audit — vẽ cây lý tưởng 4 tầng cho feature CÓ SẴN

> **Nền luôn-bật:** [`discipline/verify-empirically.md`](../../discipline/verify-empirically.md) (cấu trúc thật NHÌN qua browser + ĐỌC code, đừng đoán từ ảnh) · `ground-in-source` (đọc **feature THẬT** `src/components/**`, không chỉ story fixture — story có thể lệch biz) · [`discipline/multi-session-git.md`](../../discipline/multi-session-git.md) (**pull FE trước khi phân tích** — memory `feedback-pull-fe-before-analyzing`).

## ⭐ Chọn STEP theo args (1 skill, 3 bước tuần tự)
Args = `[step] <tên UI>`. Token step: `step1|s1|1` · `step2|s2|2` · `step3|s3|3`. Không có token → **step 1**. Phần còn lại = tên UI.

| Gọi | Chạy | Đọc file bước trước | Chi tiết |
|---|---|---|---|
| `/starci-fe-story-audit <name>` | **Step 1** — vẽ cây | (không) | [`s1-decompose.md`](./s1-decompose.md) |
| `/starci-fe-story-audit step2 <name>` | **Step 2** — diff reuse-first | `.artifacts/decompose/<name>.md` (cây đã duyệt) | [`s2-diff.md`](./s2-diff.md) |
| `/starci-fe-story-audit step3 <name>` | **Step 3** — workflow Sonnet dựng + kinh nghiệm | `.artifacts/decompose/<name>.step2.md` (diff đã duyệt) | [`s3-build.md`](./s3-build.md) |

- **Cổng tuần tự:** gọi stepN mà report bước N-1 CHƯA có ở `$FE_SOURCE/.artifacts/decompose/` → DỪNG, báo thầy chạy bước trước (đừng nhảy cóc — mỗi bước cần bước trước ĐÃ THẦY DUYỆT).
- Mỗi bước xong đều **STOP cho thầy duyệt** trước khi bước tiếp; thầy gõ step kế để đi tiếp.
- Mỗi bước đều render ra **8080** (step1/2) hoặc Storybook :6006 (step3) để thầy soi mắt.

## Skill làm gì (và KHÔNG làm gì)
- **ĐỌC (để HIỂU biz, không để chấm):** `$FE_SOURCE/src/components/**` (feature THẬT — `index.tsx`, hook, redux slice) + canon `.claude/fe/principles.md` §6c/§11.
- **VẼ:** cây feature NÊN-CÓ (source + tư duy xây app hoàn thiện) → ghi `$FE_SOURCE/.artifacts/decompose/<ui-name>.md`.
- ⛔ **Step 1 KHÔNG:** audit có/thiếu port · bắt drift · so với story hiện có · sửa code. Tất cả để **STEP SAU**.
- **STOP sau STEP 1** cho thầy duyệt cây (+ chỗ hoàn thiện) trước khi làm bất cứ bước nào.

`$FE_SOURCE` khai ở `.artifacts/config.json` (`feSource`). Hiện `C:\Repositories\starci-academy`, branch `mtp`.

## Thước = canon 4 tầng (KHÔNG lặp luật ở đây — đọc SSOT)
Cây tier + luật leaf-vs-state là **SSOT ở `.claude/fe/principles.md`**:
- **§6c BỐN TẦNG** — `primitive` (shape trơ, slot-agnostic) · `design` (1 component mang vai nội dung) · `block` (1 vùng chức năng, có bộ state) · `layout/overlay` (nơi ghép block). Thang 3 câu để xếp tầng.
- **§11 Layouts & Overlays** — decompose block-first (§11a); chức năng khác → block khác, đừng over-group (§11b); đừng ép primitive rời thành block giả (§11c); **§11f LEAF = cấu trúc, STATE = nội dung trong block**.

Skill này chỉ **áp** thước đó lên 1 UI; luật đổi ở principles.md thì skill theo.

## STEP 1 — VẼ CÂY LÝ TƯỞNG (read-only, rồi STOP)
Xem quy trình chi tiết + format report ở [`s1-decompose.md`](./s1-decompose.md). Tóm tắt:

1. **Scope + pull** — `args = <tên UI>`. `git fetch` + kiểm `HEAD..origin/mtp` FE trước khi đọc.
2. **Đọc source để HIỂU feature** — mở feature (`src/components/features/**`, `drawers/**`, `src/app/**`), đọc HẾT view-switch/scope/mode + render để biết feature LÀM GÌ. Đọc để hiểu, không để chấm.
3. **Rút LEAF (cấu trúc)** — các CẤU TRÚC riêng (§11f): leaf đổi ⇔ **tập BLOCK đổi**. Cùng cấu trúc khác nội dung = 1 leaf + state. Smell test: 2 leaf trùng `parts` → gộp.
4. **Đào từng LEAF xuống tầng** — mỗi leaf = tập BLOCK; mỗi block ghi **đầy đủ states**; đào tiếp DESIGN → PRIMITIVE (§6c thang 3 câu).
5. **HOÀN THIỆN bằng tư duy xây app** — bổ sung leaf/state/design mà feature còn nửa vời (union khai mà chưa dựng, state thiếu về UX, design nên tách). Đánh dấu `★HOÀN THIỆN` + lý do để thầy duyệt.
6. **RENDER RA 8080 — PROTOTYPE HÌNH + CÂY** (bắt buộc) — trang HTML: (a) **prototype mockup UI thật mỗi leaf** (icon Phosphor import CDN), (b) cây tầng. Serve `python -m http.server 8080` → thầy soi mắt, không đọc text. (chi tiết bước F ở s1)
7. **Report + STOP** — markdown cây + link 8080 + câu hỏi → báo thầy. **Dừng chờ duyệt.**

⛔ Step 1 KHÔNG: đánh dấu có/thiếu port · bắt drift · so story hiện có. Đó là STEP SAU.

## STEP 2 — DIFF vs Storybook (chỉ khi thầy duyệt cây step 1)
Chi tiết ở [`s2-diff.md`](./s2-diff.md). Đối chiếu từng node của cây đã duyệt với `.storybook/stories/blocks/**` → phân loại **REUSE · MODIFY · ADD-STORY** (có src, thiếu port) **· EXTRACT** (inline → tách) **· NEW** → đề xuất **thứ tự dựng từ gốc lên** → **render trang diff ra 8080** (thêm/tách/chỉnh gì, đếm + nhóm theo nhãn) → **STOP chờ duyệt**.

## STEP 3 — WORKFLOW Sonnet DỰNG + GHI KINH NGHIỆM (chỉ khi thầy duyệt diff)
Chi tiết ở [`s3-build.md`](./s3-build.md). Cắm **Workflow**: 1 agent **Sonnet** / node (MODIFY·ADD-STORY·EXTRACT·NEW), parallel cho file rời + assembly sau; mỗi agent đọc canon + quyết-định-reuse + source + convention story anh-em → dựng → **verify tsc/eslint** (không DONE khi đỏ; store-coupled không render được → report BLOCKED). Phase cuối 1 agent **ghi kinh nghiệm** → `.step3-lessons.md` (+ đề xuất canon, không tự ghi). STOP → thầy soi mắt Storybook. Lane NẶNG, ≤2 workflow song song.

## Model
Đọc code + dựng cây = main-loop (Opus, đọc kỹ biz — đây là phán đoán tầng, không rẻ). Không fan-out workflow: cây phải mạch lạc 1 đầu, human-in-loop.

## Ràng
- **ĐỌC feature thật để HIỂU biz, không đoán từ story/ảnh** — bài học 2026-07-24: phân tích `ContentAiChatDrawer` qua story/ảnh dễ sai (tưởng `settings` là leaf thiếu, thực ra `PanelView "settings"` khai mà chưa render → chỗ để HOÀN THIỆN thành Leaf "Cài đặt AI", không phải drift). Đọc `src/` mới rõ.
- **Cây là feature NÊN-CÓ, không phải bản chép code** — dùng tư duy xây app bổ sung chỗ nửa vời (§bước D). Nhưng bổ sung phải NEO vào ý đồ biz (union/query đã ám chỉ), không chế bừa; đánh dấu `★HOÀN THIỆN` cho thầy duyệt.
- **LEAF theo CẤU TRÚC, xét ĐÚNG TẦNG** — ở tầng overlay, leaf đổi ⇔ tập block đổi; mode/empty/loading trong 1 block = state của block, không leo lên leaf.
- **KHÔNG over-group / KHÔNG block giả** (§11b/§11c).
- Report ghi FE `.artifacts/decompose/`; canon KHÔNG sửa ở đây (luật mới → đề xuất thầy).
- **STOP sau step 1** — KHÔNG so port / bắt drift / dựng gì khi cây chưa duyệt (tất cả là step sau).
