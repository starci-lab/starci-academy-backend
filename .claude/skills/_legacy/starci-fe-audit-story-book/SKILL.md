---
name: starci-fe-audit-story-book
description: >
  AUDIT + SỬA Storybook của app FE chính (`C:\Repositories\starci-academy`, harness `.storybook/{main.ts,
  preview.tsx}`, mọi `src/**/*.stories.tsx`) cho khớp component THẬT + canon `.claude/fe/components/INDEX.md`
  (ở repo backend). Soi 4 trục: (1) **coverage** — block có component thật nhưng thiếu story (hiện >80%
  block chưa có story — gap lớn nhất); (2) **drift** — story dùng prop/value đã đổi so component thật; (3)
  **"Cách dùng"** — mỗi Story thiếu/sai `parameters.usage` (decorator canvas caption render trong
  `preview.tsx`); (4) **state coverage** — component có state (loading/empty/error/disabled/tone…) mà
  story không demo. Fix nhỏ (thêm story thiếu 1-2 cái, sửa caption, đồng bộ prop hiển thị) → SỬA TRỰC TIẾP
  story + verify Storybook chạy thật (preview_start). Fix lớn hơn (bug/gap THẬT trong COMPONENT, không chỉ
  story) → SỬA CẢ COMPONENT + tsc/eslint. **PHẢN BIỆN (quy tắc riêng của skill này):** mọi finding gate-verify
  grounded là 1 "hole" mặc định PHẢI SỬA — thầy phải bác bỏ CỤ THỂ (lý do kỹ thuật) mới bỏ qua; không bác
  được (im lặng/"để sau" không lý do) thì tự sửa luôn, không hỏi lại vòng 2 (đảo vai so
  `critique-unrebutted-then-build-layout-and-sonnet-workflow.md`). Coverage-gap lớn → queue nhỏ giọt
  `fe/proposals/BACKLOG.md`, KHÔNG tự generate hết 80% block cùng lúc. **Đây là lane NẶNG (quét toàn bộ +
  Workflow + sửa component + browser) — CHỈ dùng khi thầy chủ động gọi AUDIT/SOÁT:** user gõ
  `/starci-fe-audit-story-book [scope]`, hoặc "audit storybook", "soát coverage storybook", "quét drift
  story↔component", "block nào chưa có story", "update fe components theo storybook". **Sửa/thêm story lẻ
  thường ngày ("sửa story", "thêm story", "sửa Cách dùng", "gộp story trùng") KHÔNG dùng skill này — dùng
  sibling NHẸ `starci-fe-story-fix`** (inline, story-only, không đụng component, không mở browser).
---

# /starci-fe-audit-story-book — Audit + sửa Storybook khớp component thật

Chạy khi thầy muốn kiểm/soi/sửa Storybook. **Khác trục mọi skill audit FE khác**: `quality-audit-scan` soi
i18n/a11y/responsive; `consolidate-components` soi trùng lặp; `ui-patch` soi drift so RULING cũ đã đổi. Skill
này soi **story ↔ component THẬT** — Storybook là tài liệu sống, lệch tài liệu là bug tài liệu, thiếu tài
liệu (không có story) cũng là 1 loại thiếu-sót cần track như thiếu code.

**Cross-repo (giống mọi skill fe-*):** Storybook + component thật nằm ở FE repo
`C:\Repositories\starci-academy`; canon spec (`fe/components/INDEX.md`) + `fe/proposals/BACKLOG.md` nằm ở
repo này (`.claude/fe/`). Đọc/ghi cả hai. **Preview cross-repo gotcha:** Preview tool đọc
`.claude/launch.json` ở **workspace root (repo backend)**, không phải FE — entry `"storybook"` (`npm
--prefix C:/Repositories/starci-academy run storybook`, port 6006) đã có sẵn ở đó, dùng thẳng
`preview_start({name: "storybook"})`, đừng tự thêm ở launch.json phía FE (preview tool không đọc file đó).

## Thực thi (BẮT BUỘC dùng Workflow tool — thầy 2026-07-14: "để đừng block session này")
Skill này KHÔNG chạy inline turn-by-turn trong session chính (enumerate/fan-out/judge tốn rất nhiều agent
call, block session hàng chục phút nếu làm tay từng bước). Chia **3 pha**, 2 pha đầu+cuối chạy nền qua
`Workflow`, pha giữa (phản biện) chạy ở main session vì cần tương tác thật với thầy:

- **Pha A (Workflow, nền)** = Quy trình bước 1-3: enumerate+gate (Haiku) → fan-out xác nhận (Haiku per-nhóm)
  → judge+phân loại (Sonnet 5). Trả về danh sách finding đã gate-verify (file:line, story-fix hay
  component-fix, bằng chứng). KHÔNG sửa file gì ở pha này — chỉ audit.
- **Pha B (main session, tương tác)** = Quy trình bước 4 (⚔️ PHẢN BIỆN) — trình bày finding từ Pha A cho
  thầy, áp gate phản biện (giữ/bỏ từng finding). Đây là bước DUY NHẤT không tự động hoá được (cần phản hồi
  thật của thầy).
- **Pha C (Workflow, nền)** = Quy trình bước 5-7: fix (Sonnet story-only / Opus component-level) → verify
  (`preview_start` + tsc/eslint thật, không tự báo PASS) → đóng (báo cáo + memory + push canon). Chỉ áp cho
  finding đã sống sót qua Pha B.

Scope rộng (`all`) → Pha A luôn fan-out per-nhóm trong workflow (không launch 1 workflow/nhóm riêng — 1
workflow, nhiều agent con). Scope hẹp (1 component) → vẫn nên qua Workflow cho pha A/C (nhất quán, dễ resume
nếu lỗi giữa chừng), trừ khi thầy đang thao tác trực tiếp trên Storybook và chỉ 1 điểm/1 dòng CSS cụ thể (như
gap-1 vs gap-2) — case đó sửa thẳng inline, không cần dựng workflow cho 1 dòng.

## Model tier (xem `.claude/docs/pipeline.md §Phân vai MODEL`)
- **Haiku** — enumerate: liệt kê block thật (`src/components/blocks/**`) vs story thật (`src/**/*.stories.tsx`)
  → diff coverage; với story đã có, đọc prop/type component thật + prop dùng trong story → diff drift.
- **Sonnet 5 (default)** — judge finding + fix cơ học (story-only): thêm story thiếu, sửa `parameters.usage`,
  đồng bộ prop/value stale, thêm state demo.
- **Opus (opt-in, BẮT BUỘC khi fix đụng COMPONENT thật)** — bất kỳ finding nào kết luận là bug/gap trong
  chính component (không chỉ story sai) → Opus đọc source + spec trước khi sửa, KHÔNG để Sonnet tự sửa
  logic production component. Cùng nguyên tắc `ui-patch`: "đọc spec+source thật trước khi chạm, đừng đoán".

## Scope (arg)
`all` (toàn bộ Storybook) · 1 nhóm (`blocks/stats`, `blocks/cards`, …, theo 17 nhóm dưới
`src/components/blocks/`) · 1 component cụ thể. Rộng → fan-out Haiku per-nhóm.

## Nền tra cứu (đọc TRƯỚC, đừng tự chế)
- ⭐ `.storybook/preview.tsx` (FE repo) — harness thật: decorator `NextIntlClientProvider` (**locale hard-code
  `vi`**, story KHÔNG BAO GIỜ render bản `en` — biết trước, không phải bug tự nhiên nhặt ra, nhưng LÀ 1 hole
  đáng phản biện nếu thầy muốn story cũng preview `en`) + `HeroUIProvider` + toolbar `theme` light/dark;
  `a11y: { test: "error" }`. Cơ chế **"Cách dùng"**: đọc `parameters.usage` (ưu tiên) hoặc
  `parameters.docs.description.story` (fallback), chỉ hiện khi `viewMode === "story"`.
- `.storybook/main.ts` — `stories: ["../src/**/*.stories.@(ts|tsx)"]`, addon `a11y`, framework `@storybook/
  nextjs`. **Biết trước:** comment trong file trỏ `.claude/fe/methodology/enforcement.md` — file này KHÔNG
  TỒN TẠI (dead link). Quyết định thầy: tạo file đó, hay sửa comment trỏ đúng chỗ.
- `.claude/fe/components/INDEX.md` (backend repo) — spec canon, 1 file/element, ground-truth để so prop.
  **Biết trước:** `fe/README.md` §BUG/DRIFT còn 1 dòng cũ "ProgressMeter README thiếu prop `color`" — đã
  fix rồi (story+component khớp prop `color` thật) — gạch dòng đó khi audit chạm tới.
- Component thật tương ứng mỗi story (`index.tsx` + type file) — nguồn spec CAO HƠN canon doc nếu 2 bên lệch
  nhau (component thật luôn thắng, doc theo sau).
- `fe/proposals/BACKLOG.md` — hàng đợi chung mọi skill fe-*.
- `.claude/fe/product/critique-unrebutted-then-build-layout-and-sonnet-workflow.md` — tinh thần PHẢN BIỆN
  (§ dưới) đảo vai từ ruling này.

## Quy trình
1. **Enumerate + gate (Haiku, free/deterministic)** — coverage: `find src/components/blocks -maxdepth 2
   -type d` vs `title:`/`component:` khai trong mọi `.stories.tsx` → list block KHÔNG có story. Drift: với
   mỗi story đã có, đọc component thật, diff prop dùng trong story vs prop export thật + state component hỗ
   trợ (loading/empty/error/disabled/tone…) vs state story demo. Caption: story thiếu cả `parameters.usage`
   lẫn `docs.description.story`.
2. **Fan-out xác nhận (Haiku per-nhóm cho scope rộng)** — mỗi finding phải neo file:line thật (story file +
   component file), không suy đoán từ tên biến.
3. **Judge + phân loại (Sonnet 5)** — mỗi finding: fix ở STORY (thêm/sửa story, không đụng component) hay
   fix ở COMPONENT (bug/gap thật, ví dụ prop component có nhưng logic không hoạt động đúng, hoặc component
   thiếu 1 state UI đáng lẽ phải có)? Viết finding kèm bằng chứng (prop thật vs prop story, ảnh nếu cần).
4. **⚔️ PHẢN BIỆN (quy tắc riêng skill này, thầy chốt 2026-07-14)** — trình bày TOÀN BỘ finding gate-verify
   grounded (bỏ finding mơ hồ/subjective ở bước 2-3) cho thầy, coi mỗi cái là **hole mặc định PHẢI SỬA**.
   - Thầy đưa được lý do kỹ thuật cụ thể ("không phải bug, vì X") → bỏ finding, ghi lý do vào audit note (để
     lần chạy sau không re-flag).
   - Thầy im lặng / ừ đúng / "để sau" không kèm lý do → **hole tự động thành yêu cầu cứng, sửa luôn**, không
     hỏi lại vòng 2 (đừng dừng chờ — mirror lý do gốc của `critique-unrebutted-then-build`: để treo = ship
     với lỗ hổng đã biết, tệ hơn không audit).
   - **Ngoại lệ luôn phải hỏi thật (không áp phản biện)**: coverage-gap lớn (generate story mới cho >5 block
     cùng lúc), đổi API thật của component (breaking prop rename/remove), đổi cơ chế harness
     (`preview.tsx`/`main.ts`) — đây là quyết định kiến trúc, không phải "hole nhỏ", luôn HỎI THẦY bình
     thường (không đảo vai).
5. **Fix** — story-only: sửa trực tiếp file `.stories.tsx`. Component-level (Opus): sửa `index.tsx`/types,
   tsc/eslint sạch trước khi coi là xong. Coverage-gap: KHÔNG generate hết cùng lúc — queue theo batch nhỏ
   (3-5 story/lần, giống `consolidate-components-scan`) vào `fe/proposals/BACKLOG.md`, apply dần.
6. **Verify (bắt buộc, thật — không tự báo PASS)** — `preview_start({name: "storybook"})` (đã có sẵn trong
   `.claude/launch.json` gốc backend), `navigate` tới đúng story vừa sửa, `read_page`/`get_page_text` xác
   nhận: story render không lỗi console, prop mới/sửa hiện đúng trên canvas, box "Cách dùng:" xuất hiện đúng
   câu. Component-level fix thêm `npx tsc --noEmit` + eslint cho file đã sửa.
7. **Đóng** — báo cáo finding × (giữ/bỏ theo phản biện) × fix đã áp (story/component) × coverage còn lại.
   GHI MEMORY (rule always-update-mindset). Push canon: sửa `fe/components/INDEX.md`/BACKLOG → private ngay;
   sạch business → public.

## Ràng buộc (STRICT)
- Không đoán prop/state — mọi finding neo file:line thật (story thật + component thật), không suy từ tên.
- Component thật luôn là spec cao nhất; nếu canon `INDEX.md` lệch component thật → sửa doc, không sửa
  ngược component theo doc cũ (trừ khi component thật rõ ràng sai).
- Đừng tự generate story mới hàng loạt cho >80% block còn thiếu trong 1 lượt — đó là backlog dài hạn, nhỏ
  giọt theo batch, có gate phản biện riêng (ngoại lệ ở bước 4).
- PHẢN BIỆN chỉ áp dụng finding đã gate-verify grounded (bước 1-2) — đừng bịa hole để ép sửa.

## Liên quan
- ⭐ `starci-fe-story-fix` — **sibling NHẸ, lane mặc định cho story thường ngày** (sửa/thêm/gộp 1-vài story,
  inline, story-only, không đụng component, không mở browser; component-finding → chốt + ghi plan
  `fe/proposals/story-driven-component-migrations.proposal.md`). Skill NÀY chỉ chạy khi thầy gọi audit/soát
  TOÀN BỘ. Đang định sửa 1-2 story lẻ → dùng skill kia, đừng dựng Workflow cho 1 file.
- `starci-fe-block-apply`/`starci-fe-block-brainstorm` — khi fix component-level lớn hơn 1-2 file, escalate
  sang đây thay vì tự làm trong lượt audit.
- `starci-fe-quality-audit-scan/apply` — trục khác (i18n/a11y/responsive), không trộn.
- `fe/proposals/BACKLOG.md` — hàng đợi chung, coverage-gap queue vào đây.
