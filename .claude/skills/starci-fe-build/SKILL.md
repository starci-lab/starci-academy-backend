---
name: starci-fe-build
description: >
  Pha APPLY của vòng lặp Storybook-driven — BUILD 1 proposal đã chốt trong `.artifacts/proposals/` (FE source
  `$FE_SOURCE`, branch mtp) thành code FE THẬT. ĐỌC: proposal + `.artifacts/proposals/BACKLOG.md`
  (hàng đợi) + `.claude/patterns/fe` (code-style FORCE) + `.claude/fe/components` (block canonical, không hand-roll) +
  `.claude/fe/{foundations,layouts,patterns,principles}` khi cần; GHI: code trong `src/` + story "news"
  (`tags: ['news']` + caption "Chờ duyệt") lên Storybook + đánh ✅ DONE trong BACKLOG. `.claude/` là RULE read-only —
  skill này KHÔNG ghi `.claude`; cũng KHÔNG tự ghi `.artifacts/states` (fe-sync giữ, git-diff incremental sẽ bắt story
  mới ở lần sync kế). Verify BẮT BUỘC: tsc + eslint sạch + chạy runtime thật theo verify-plan trong proposal.
  Build lớn/đụng BE → Opus viết impl-spec kĩ rồi Sonnet code; build nhỏ → dựng thẳng. Có thể chạy KHÁC session với
  brainstorm — BACKLOG là bàn giao. Trigger khi user gõ `/starci-fe-build <proposal|feature>`, hoặc bảo
  "build/apply proposal đã chốt", "dựng cái đã duyệt", "code cái trong backlog".
---

# /starci-fe-build — Build 1 proposal đã chốt thành code FE thật

Pha **BUILD** (tách khỏi brainstorm). Đọc 1 proposal ⏳ PENDING trong `.artifacts/proposals/` → code thật tuân
[[patterns/fe]] + block canonical [[fe/components/INDEX]] → verify → đẩy **story "news"** cho thầy duyệt trên
Storybook → ✅ DONE trong BACKLOG. Chạy được ở **session khác** với brainstorm — hàng đợi là bàn giao.

## Bản đồ đọc/ghi (STRICT)

| Vùng | Quyền | Ghi chú |
|---|---|---|
| `.artifacts/proposals/` (FE source) | ĐỌC + ghi status BACKLOG | spec đầu vào + hàng đợi |
| `.artifacts/{states,concepts}` | ĐỌC-only | states do `starci-fe-sync` giữ — **CẤM tự ghi** |
| `.claude/patterns/fe` | ĐỌC-only | code-style **FORCE** — mọi dòng code tuân đây |
| `.claude/fe/*` | ĐỌC-only | components/foundations/layouts/patterns/principles — **CẤM ghi trong vòng lặp** |
| `src/` + `.storybook/stories/**/*.stories.tsx` | GHI | code thật + story news |

Path FE = `$FE_SOURCE` (branch mtp)

## Trước khi build
- Mở **`.artifacts/proposals/BACKLOG.md`** → chọn 1 proposal **⏳ PENDING** (theo arg; nhiều thì hỏi thầy). Đổi → **🔨 IN-PROGRESS**.
- Đọc **`.artifacts/proposals/<feature>.proposal.md`** = SPEC: flow · shell per surface · zones · state matrix ·
  block briefs · files-to-touch · verify plan. **Bám spec** — brainstorm là nơi quyết, build là nơi dựng.
- Đọc nền: [[patterns/fe]] (code-style) + [[fe/components/INDEX]] (brief block 1 dòng) + `.artifacts/states`
  (Storybook hiện có gì — khỏi rescan `src/`). Thiếu dữ kiện trong proposal → **DỪNG hỏi thầy**, không tự chế.

## Build
- **Block canonical, không hand-roll:** lắp từ block THẬT trong `src/components/blocks/*` theo [[fe/components/INDEX]].
  CẤM `<div border>`/`<button hover:bg>`/tự ghép icon+input. Element mới không có canon → HỎI thầy.
- **Code-style FORCE theo [[patterns/fe]]:** 1 component = 1 folder `index.tsx`; props `*Props extends WithClassNames`;
  container tự đọc store/SWR, không prop-drill thừa; mọi fetch → `AsyncContent` (skeleton mirror · empty · error).
- Token + spacing scale, variant theo NỀN, hover theo bản chất, icon Phosphor, a11y — theo
  [[fe/foundations]] + [[fe/principles]]; shell/zone theo [[fe/layouts]] nếu proposal là cả flow.
- **Cơ chế theo cỡ:** build LỚN (nhiều surface / đụng BE) → **Opus viết IMPL-SPEC siêu kĩ** (file · thay đổi chính xác ·
  edge case · thứ tự áp) rồi **Sonnet code đúng spec**, Opus verify diff. Build nhỏ (1 block) → dựng thẳng, khỏi rườm.
- **ĐƯỢC sửa BE + data nếu proposal cần:** field/resolver/gate mới → `starci-academy-backend/src`; content →
  `.mount/data`. Thứ tự **BE trước, FE sau**; đụng BE thì verify runtime BE thật (chạy action + đọc log), không dừng ở "tsc FE sạch".

## Verify (bắt buộc trước khi ✅)
- `npx tsc --noEmit` + `npm run lint` sạch.
- **Chạy runtime thật** theo verify-plan trong proposal: đi ma trận state (empty/1/N/error/loading) + cả flow.
  Build xanh ≠ chạy đúng.
- **★ Tự phản biện trước khi nói xong** ([[fe/principles/self-critique-before-presenting]]): (1) đọc HẾT section canon
  liên quan — phần tử vừa sửa có phá rule KỀ BÊN không? (2) đổi ≥2 render-site giống nhau → **grep lại tất cả** sau khi
  sửa, đừng tin lời tự thuật; (3) claim "đã build đúng cả flow" phải là KIỂM đi thật, không narrate. Sót → sửa trước khi DONE.

## Xong → story "news" + chốt sổ
1. **★ Đẩy STORY "news" lên Storybook (BẮT BUỘC cho mọi surface/block mới hoặc đổi hình):** sinh/cập nhật
   `*.stories.tsx`, gắn **`tags: ['news']`** + caption **"Chờ duyệt"** (`parameters.usage`). Storybook = review-surface —
   thầy lọc tag `news` duyệt bằng mắt. **KHÔNG tự gỡ tag `news`** (thầy duyệt xong mới gỡ).
2. **`.artifacts/proposals/BACKLOG.md`**: proposal → **✅ DONE** + ngày.
3. **KHÔNG ghi `.artifacts/states`** — lần `starci-fe-sync` kế git-diff sẽ tự bắt story mới. **KHÔNG ghi `.claude`** —
   ruling tái dùng phát hiện trong lúc build → BÁO thầy (thầy quyết đưa vào canon ngoài vòng lặp), không tự ghi.

## Ràng (STRICT)
- **Bám SPEC.** Muốn lệch layout/scope so proposal → HỎI thầy / quay lại brainstorm, không tự đổi giữa chừng.
- KHÔNG đụng trang/tab ngoài scope proposal. KHÔNG search web. KHÔNG hand-roll primitive. KHÔNG ghi `.claude` /
  `.artifacts/states`. Xoá dead code lộ ra chỉ khi confirm không ai import.

## Liên quan
- Nguồn spec: skill brainstorm (đọc `.artifacts/{states,concepts}` → chốt proposal) · sau build: `starci-fe-sync`
  (ghi states incremental) · hàng đợi: `.artifacts/proposals/BACKLOG.md` · bản đồ canon: [[fe/README]].
