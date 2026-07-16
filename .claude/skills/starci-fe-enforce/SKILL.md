---
name: starci-fe-enforce
description: >
  BUILD + duy trì TẦNG MÁY của enforcement ([[methodology/enforcement]]) cho FE app (`$FE_SOURCE`):
  biến 1 dòng lint-candidate ([[enforcement/lint-candidates]]) hoặc 1 code-style rule trong `.claude/patterns/fe` thành
  ESLint rule thật trong `eslint-plugin-starci-fe`, roll-out warn→burn-debt→error (make-illegal), thêm/chỉnh
  husky+lint-staged gate, story-ize block cho Storybook+axe (visual/a11y tier), và giữ vòng "AUDIT TÌM 1 LẦN · LINT GIỮ
  MÃI". ĐỌC rule ở `.claude/{fe,patterns/fe}` (read-only — KHÔNG ghi .claude trong vòng lặp) + `.artifacts/states`
  (inventory block/story do `fe-sync` giữ); GHI kết quả roll-out +
  status vào `.artifacts/proposals/` trong SOURCE FE; story mới đẩy tag 'news' cho thầy duyệt trên Storybook. Skill
  đóng từ việc đã dựng thật (eslint-plugin-starci-fe 4 rule 'error' + jsx-a11y + husky + Storybook 2026-07-14). KHÁC
  `starci-fe-patch` (sửa code lệch rule ĐÃ CÓ) — skill này TẠO cơ chế MÁY để rule tự-enforce, không cần audit-LLM lặp lại.
  Trigger khi thầy nói "thêm lint rule cho X", "chặn Y tại commit", "burn nợ rule Z lên error", "make-illegal cái này",
  "story-ize block", "set up storybook/chromatic/axe".
---

# /starci-fe-enforce — Dựng luật MÁY (không để audit-LLM gánh trục-1)

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

Tầng máy = thứ chặn drift TẠI lúc gõ/commit, deterministic, chạy CI. Skill này TẠO nó. Nguyên tắc gốc:
**đẩy luật về tầng rẻ nhất bắt được nó** — `LÀM-BẤT-HỢP-LỆ > LINT > CI/VISUAL > AUDIT-LLM > MẮT NGƯỜI` ([[methodology/enforcement]]).

## Đọc / Ghi (mô hình mới — STRICT)
- **ĐỌC (read-only):** `.claude/fe` (design rules, trong đó [[enforcement/lint-candidates]] = backlog luật-máy) ·
  `.claude/patterns/fe` (code-style FORCE — nguồn rule ứng viên thứ 2) · `.artifacts/states` (inventory block/story do
  `fe-sync` giữ — KHỎI rescan src).
- **GHI:** code thật trong SOURCE FE `$FE_SOURCE` (`eslint-plugin-starci-fe/`, `eslint.config.mjs`,
  `.husky/`, `package.json`, `*.stories.tsx`) + báo cáo roll-out vào `.artifacts/proposals/` (dòng status ⏳→🛠→✅ per
  rule: nợ đo được · burn kết quả · severity cuối). **KHÔNG ghi `.claude/`** — status trong canon do vòng canon-sync
  ngoài skill cập nhật. **KHÔNG ghi `.artifacts/states`** (fe-sync ghi).
- Path LUÔN là `$FE_SOURCE`

## Phân loại TRƯỚC KHI code rule (bắt buộc)
- **Cơ học + máy-nhận-diện-được** (icon import, spacing lẻ, chip-cạnh-chip, `titleClassName`, uppercase, arbitrary value) → **LINT rule**. Xúc.
- **Value-existence** (giá trị không nên tồn tại) → **make-illegal** qua token/type (nhưng **Tailwind v4 spacing = dynamic calc, KHÔNG prune được** → lint là công cụ đúng; đừng cố prune theme).
- **Render/pixel** (contrast, fill-chồng-fill, vỡ dark-mode) → **Storybook + axe + Chromatic** (visual tier).
- **Judgment** (block đúng data? shell đúng job?) → **KHÔNG phải lint** → để `starci-fe-audit`/`starci-fe-layout` + mắt người. Đừng nhét judgment vào lint.

## A. Thêm 1 ESLint rule (từ lint-candidate / patterns-rule)
1. Đọc dòng nguồn: [[enforcement/lint-candidates]] hoặc rule trong `.claude/patterns/fe` (pattern + ví dụ thật + cơ chế đề xuất).
2. Viết rule AST trong `eslint-plugin-starci-fe/index.mjs` — **scope CHÍNH XÁC, 0 false-positive** (vd `no-fractional-spacing` chỉ bắt fractional `-\d+\.5` trên spacing-prefix, KHÔNG đụng `size-`/`w-`). Rule mơ hồ/false-pos cao (vd `no-modal-body-padding` — Drawer.Body p-0 hợp lệ) → **KHÔNG ship** (làm plugin mất uy tín); để cho constrained-primitive hoặc judgment.
3. Wire vào `eslint.config.mjs` (flat) ở block `plugins:{"starci-fe":…}`, severity **'warn'** trước.
4. Đo nợ: `npx eslint src -f json` → đếm vi phạm rule đó (script node; path git-bash ≠ node Windows → dùng `path.sep`).
5. **Roll-out:**
   - Nợ ÍT / rõ (0 false-pos) → **burn** (fan-out fix Sonnet hoặc sed cơ học) → verify tsc+lint=0 → nâng **'error' (make-illegal)**.
   - Nợ NHIỀU / heuristic (vd landing hero hợp lệ) → giữ **'warn'** (advisory) — gate pre-commit đủ chặn code mới.
6. Verify gate: file BẨN `eslint <file> --max-warnings=0`→EXIT 1; file SẠCH→0.
7. Ghi status vào `.artifacts/proposals/` (rule · nợ đo · burn · severity cuối, ⏳→🛠→✅). Khi ✅ error, note rõ "**gỡ pattern khỏi prompt audit-LLM** — máy đã gánh" để vòng canon-sync mirror sang [[enforcement/lint-candidates]].

## B. Gate pre-commit (husky + lint-staged)
- Đã dựng: `.husky/pre-commit` = `npx lint-staged`; `package.json` lint-staged = `"src/**/*.{ts,tsx}": "eslint"` (**block-on-ERROR-only** — rule sạch chặn cứng, warn = advisory không block → ít friction; nợ cũ 'warn' burn dần).
- Muốn chặn cả warning trên code MỚI → `eslint --max-warnings=0` (nhưng đụng file có nợ 'warn' sẽ block → cân nhắc).

## C. Visual tier (Storybook + axe + Chromatic)
- Storybook = **nguồn sự thật UI** — đã dựng ở SOURCE FE: `.storybook/{main.ts,preview.tsx}` (HeroUIProvider+NextIntl+Tailwind v4+theme toolbar) + `@storybook/addon-a11y` (axe fail-on-error). `build-storybook` phải EXIT 0.
- **Story-ize 1 block:** tra `.artifacts/states` xem block đã có story chưa → đọc `blocks/<cat>/<Block>/index.tsx` (props/variants/states THẬT) → viết `<Block>.stories.tsx` co-located theo [[methodology/storybook-story-conventions]]: Default + mỗi variant/state (loading/empty/error/selected/disabled). Props tĩnh (KHÔNG redux/SWR); i18n dùng key THẬT (preview đã wrap NextIntl vi). Story MỚI gắn **`tags: ['news']` + caption "Chờ duyệt"** — thầy duyệt trên Storybook; KHÔNG tự ghi states (fe-sync ghi sau). Verify `build-storybook`.
- **Chromatic** (snapshot regression) = cần **token/tài khoản thầy** — setup ở `.storybook/CHROMATIC.md` + `.github/workflows/chromatic.yml` (gate `if secret!=''`). Không tự nhập token (prohibited); hướng dẫn thầy.

## Ràng (STRICT)
- **KHÔNG ship rule false-positive-cao** — thà 4 rule 'error' sạch còn hơn 8 rule 'warn' nhiễu.
- **KHÔNG make-illegal thứ có ngoại lệ hợp lệ** (arbitrary value đôi khi cần % / px canh chỉnh → 'warn' + eslint-disable-có-lý-do, không 'error').
- **KHÔNG nhét judgment (trục 2/3 của [[methodology/three-axis]]) vào lint.**
- **KHÔNG search web** — thiếu dữ kiện (pattern chưa có candidate, cơ chế không chắc) → DỪNG hỏi thầy.
- Install nặng (Storybook…) vào SHARED tree có dev-server sống → check `netstat :300x`; ưu tiên devDep nhẹ / isolated nếu rủi ro. Verify compat (`npm view <pkg> peerDependencies`) TRƯỚC khi blast.

## ★ Tự phản biện TRƯỚC khi trình
Rule vừa viết có false-positive trên pattern hợp lệ nào không (grep thử)? Nợ đã về 0 thật trước khi nâng 'error' chưa? Có đang cố make-illegal cái v4/stack không cho (prune spacing) không? Cái này có thực sự cơ học, hay là judgment tôi đang ép vào máy? Có lỡ ghi gì vào `.claude/` không?

## Bàn giao / liên quan
- Rule tìm nợ để burn → **`starci-fe-audit`** (fan-out fix). · Feedback trục-1 mới từ thầy → `starci-fe-feedback` (log candidate) → skill này build. · Story 'news' duyệt xong → `starci-fe-sync` ghi `.artifacts/states`.
- Canon (đọc): [[methodology/enforcement]] · [[enforcement/lint-candidates]] · [[methodology/storybook-story-conventions]] · `.claude/patterns/fe`. Code (ghi): `eslint-plugin-starci-fe/` · `.husky/` · `.storybook/` · `.artifacts/proposals/`.

## Phân model (fan-out / nhiều pha)
Khi skill này fan-out hoặc chia pha, phân model theo VAI:
- **fable — deep thinking**: rescan/phân tích/ra nhận định nhanh, quyết hướng (decide).
- **sonnet — action**: quét · scan · build · sửa (làm việc thật). **LUÔN ghi brief** kết quả lại (file/`.artifacts`), đừng giữ trong đầu — pha finalize cần đọc.
- **opus — finalize**: đọc mọi brief → synthesize · chốt · quyết định cuối + ghi state.
