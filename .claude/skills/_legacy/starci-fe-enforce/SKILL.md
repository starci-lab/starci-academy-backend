---
name: starci-fe-enforce
description: >
  BUILD + duy trì TẦNG MÁY của enforcement ([[methodology/enforcement]]) cho FE app (`D:\Repositories\starci-academy`):
  biến 1 dòng `fe/enforcement/lint-candidates.md` thành ESLint rule thật trong `eslint-plugin-starci-fe`, roll-out
  warn→burn-debt→error (make-illegal), thêm/chỉnh husky+lint-staged gate, story-ize block cho Storybook+axe (visual/a11y
  tier), và giữ vòng "AUDIT TÌM 1 LẦN · LINT GIỮ MÃI". Đây là skill đóng từ việc đã dựng thật (eslint-plugin-starci-fe
  4 rule + jsx-a11y + husky + Storybook 2026-07-14). KHÁC `ui-patch` (sửa code lệch rule ĐÃ CÓ) — skill này TẠO cơ chế
  MÁY để rule tự-enforce, không cần audit-LLM lặp lại. Trigger khi thầy nói "thêm lint rule cho X", "chặn Y tại commit",
  "burn nợ rule Z lên error", "make-illegal cái này", "story-ize block", "set up storybook/chromatic/axe".
---

# /starci-fe-enforce — Dựng luật MÁY (không để audit-LLM gánh trục-1)

Tầng máy = thứ chặn drift TẠI lúc gõ/commit, deterministic, chạy CI. Skill này TẠO nó. Nguyên tắc gốc:
**đẩy luật về tầng rẻ nhất bắt được nó** — `LÀM-BẤT-HỢP-LỆ > LINT > CI/VISUAL > AUDIT-LLM > MẮT NGƯỜI` ([[methodology/enforcement]]).

## Phân loại TRƯỚC KHI code rule (bắt buộc)
- **Cơ học + máy-nhận-diện-được** (icon import, spacing lẻ, chip-cạnh-chip, `titleClassName`, uppercase, arbitrary value) → **LINT rule**. Xúc.
- **Value-existence** (giá trị không nên tồn tại) → **make-illegal** qua token/type (nhưng **Tailwind v4 spacing = dynamic calc, KHÔNG prune được** → lint là công cụ đúng; đừng cố prune theme).
- **Render/pixel** (contrast, fill-chồng-fill, vỡ dark-mode) → **Storybook + axe + Chromatic** (visual tier).
- **Judgment** (block đúng data? shell đúng job?) → **KHÔNG phải lint** → để `audit-sweep`/`layout-brainstorm` + mắt người. Đừng nhét judgment vào lint.

## A. Thêm 1 ESLint rule (từ lint-candidate)
1. Đọc dòng ở `fe/enforcement/lint-candidates.md` (pattern + ví dụ thật + cơ chế đề xuất).
2. Viết rule AST trong `eslint-plugin-starci-fe/index.mjs` — **scope CHÍNH XÁC, 0 false-positive** (vd `no-fractional-spacing` chỉ bắt fractional `-\d+\.5` trên spacing-prefix, KHÔNG đụng `size-`/`w-`). Rule mơ hồ/false-pos cao (vd `no-modal-body-padding` — Drawer.Body p-0 hợp lệ) → **KHÔNG ship** (làm plugin mất uy tín); để cho constrained-primitive hoặc judgment.
3. Wire vào `eslint.config.mjs` (flat) ở block `plugins:{"starci-fe":…}`, severity **'warn'** trước.
4. Đo nợ: `npx eslint src -f json` → đếm vi phạm rule đó (script node, path git-bash ≠ node Windows → dùng `path.sep`).
5. **Roll-out:**
   - Nợ ÍT / rõ (0 false-pos) → **burn** (fan-out `audit-sweep` fix hoặc sed cơ học) → verify tsc+lint=0 → nâng **'error' (make-illegal)**.
   - Nợ NHIỀU / heuristic (vd landing hero hợp lệ) → giữ **'warn'** (advisory) — gate pre-commit đủ chặn code mới.
6. Verify gate: file BẨN `eslint <file> --max-warnings=0`→EXIT 1; file SẠCH→0.
7. Update Status trong `lint-candidates.md` (⏳→🛠→✅) — khi ✅ error, **gỡ pattern khỏi prompt audit-LLM** (máy đã gánh). PUSH canon.

## B. Gate pre-commit (husky + lint-staged)
- Đã dựng: `.husky/pre-commit` = `npx lint-staged`; `package.json` lint-staged = `"src/**/*.{ts,tsx}": "eslint"` (**block-on-ERROR-only** — rule sạch chặn cứng, warn = advisory không block → ít friction cho team; nợ cũ 'warn' burn dần).
- Muốn chặn cả warning trên code MỚI → `eslint --max-warnings=0` (nhưng đụng file có nợ 'warn' sẽ block → cân nhắc).

## C. Visual tier (Storybook + axe + Chromatic)
- Đã dựng: Storybook 10 (`@storybook/nextjs`, support next^16/react^19) + `.storybook/{main.ts,preview.tsx}` (HeroUIProvider+NextIntl+Tailwind v4+theme toolbar) + `@storybook/addon-a11y` (axe fail-on-error). `build-storybook` phải EXIT 0.
- **Story-ize 1 block:** đọc `blocks/<cat>/<Block>/index.tsx` (props/variants/states THẬT) → viết `<Block>.stories.tsx` co-located: Default + mỗi variant/state (loading/empty/error/selected/disabled). Props tĩnh (KHÔNG redux/SWR); i18n dùng key THẬT (preview đã wrap NextIntl vi). Verify `build-storybook`.
- **Chromatic** (snapshot regression) = cần **token/tài khoản thầy** — setup ở `.storybook/CHROMATIC.md` + `.github/workflows/chromatic.yml` (gate `if secret!=''`). Không tự nhập token (prohibited); hướng dẫn thầy.

## Ràng (STRICT)
- **KHÔNG ship rule false-positive-cao** — thà 4 rule 'error' sạch còn hơn 8 rule 'warn' nhiễu.
- **KHÔNG make-illegal thứ có ngoại lệ hợp lệ** (arbitrary value đôi khi cần % / px canh chỉnh → 'warn' + eslint-disable-có-lý-do, không 'error').
- **KHÔNG nhét judgment (trục 2/3) vào lint.**
- Install nặng (Storybook…) vào SHARED tree có dev-server sống → check `netstat :300x`; ưu tiên devDep nhẹ / isolated nếu rủi ro. Verify compat (`npm view <pkg> peerDependencies`) TRƯỚC khi blast.

## ★ Tự phản biện TRƯỚC khi trình
Rule vừa viết có false-positive trên pattern hợp lệ nào không (grep thử)? Nợ đã về 0 thật trước khi nâng 'error' chưa? Có đang cố make-illegal cái v4/stack không cho (prune spacing) không? Cái này có thực sự cơ học, hay là judgment tôi đang ép vào máy?

## Bàn giao / liên quan
- Rule tìm nợ để burn → **`starci-fe-audit-sweep`** (fan-out fix). · Feedback trục-1 mới từ thầy → `ui-feedback` (log lint-candidate) → skill này build.
- Canon: `fe/enforcement/{lint-candidates}.md` · `fe/methodology/enforcement.md` · repo FE `eslint-plugin-starci-fe/` · `.storybook/`.
