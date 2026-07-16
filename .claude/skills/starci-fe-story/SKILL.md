---
name: starci-fe-story
description: >
  Sửa/thêm/gộp/cắt **STORY** (`.storybook/stories/**/*.stories.tsx`) của app FE chính (`$FE_SOURCE`,
  branch mtp) — lane NHẸ, chạy inline, phạm vi 1-vài story. **VÙNG CẤM: component thật (`index.tsx`/types),
  `.storybook/preview.tsx`, `.storybook/main.ts`** — story lộ ra component có vấn đề thì CHỐT với thầy + ghi
  1 mục vào `.artifacts/proposals/`, KHÔNG sửa production code trong lượt này. **KHÔNG ghi `.artifacts/states`**
  (story-only ≠ đổi component — states là của `starci-fe-sync`). **KHÔNG chạy browser/preview MCP** — thầy tự
  soi bằng mắt trên Storybook đang mở sẵn (:6006, HMR tự áp); skill chỉ chạy `tsc --noEmit` + eslint rồi báo
  thầy. Đọc rule ở `.claude/fe` + `.claude/patterns/fe` (READ-ONLY, không ghi .claude). Dùng skill này cho MỌI
  việc story thường ngày: "sửa story", "thêm story", "story thiếu state", "sửa Cách dùng / caption", "gộp story
  trùng", "cắt story filler", "story dùng prop cũ", "đổi title story gom đúng họ", "story only đừng đụng
  component".
---

# /starci-fe-story — sửa story, KHÔNG đụng component, KHÔNG mở browser

> ★ **Đồng bộ 3 lớp** (chân lý `.claude/fe` · story = UI-ref · component = UI-trên-nền): mọi thay đổi skill này tạo ra PHẢI reconcile CẢ 3 → luật `.claude/fe/principles/three-layer-sync-truth-story-ui.md` · recipe `.claude/fe/patterns/reconcile-three-layers-on-change.md`.

Storybook = nguồn sự thật UI, là tài liệu sống của design system. Sửa story phải RẺ và NHANH, nếu không sẽ
không ai sửa. Lane này: thầy đang mở Storybook, thấy 1 story sai/thiếu/thừa → sửa ngay, tsc/eslint, thầy nhìn
mắt là xong. Không quét, không workflow, không browser.

**Cross-repo:**
- Story sống ở FE source: `$FE_SOURCE\src\**\*.stories.tsx` (branch **mtp**; `$FE_SOURCE` khai ở
  `$BE_SOURCE/.artifacts/config.json`).
- Rule đọc ở `.claude/fe` (design) + `.claude/patterns/fe` (code-style FORCE) — **READ-ONLY, không ghi .claude**.
- Artifacts động ghi ở FE source: `.artifacts/proposals/` (khi cần queue migration component).

## Nền tra cứu (đọc TRƯỚC khi sửa — đừng tự chế luật)
- ⭐ [[fe/methodology/storybook-story-conventions]] — SSOT cách viết story: cấu trúc file, `meta.title` gom cây
  theo họ, JSDoc + `parameters.usage` (thiếu `usage` = mất note "Cách dùng" trên canvas), **rubric bộ story TỐI
  THIỂU** (1 story chỉ đáng tồn tại nếu cho thấy điều KHÔNG suy ra được từ story khác — enum explosion → gộp 1
  story so-sánh; xoá filler chỉ-khác-className), **khung story so-sánh** (§2b: `<Label>` chữ hoa đầu + description
  `Typography body-sm muted` nói "xài lúc nào" + `flex flex-col gap-6` neo trái, không grid/hàng ngang), canvas
  **full-bleed** (story không tự set `parameters.layout`; wrapper bó width `w-80`/`max-w-md` thì GIỮ). Skill này
  KHÔNG lặp lại luật — canon đổi thì skill tự theo. Đọc file, đừng đoán.
- **Component thật** (`index.tsx` + types) của story đang sửa — spec cao nhất, đọc để neo prop/state THẬT vào
  story, **đọc chứ KHÔNG sửa**.
- [[fe/axis-1-rules/RULES]] + [[fe/axis-2-biz-ui/RULES]] — khi caption cần nói "dùng cái này thay vì cái kia khi
  nào": luật cơ học (token, Label, Typography) ở axis-1, luật chọn block theo data-shape ở axis-2. Đừng tự bịa
  tiêu chí chọn trong story.
- `.claude/patterns/fe` — code-style FORCE khi viết/sửa file story (import, naming, cấu trúc).
- `.storybook/preview.tsx` (FE) — biết trước để không ngạc nhiên: locale hard-code `vi`, `HeroUIProvider`,
  toolbar theme, `a11y: { test: "error" }`, `layout:"fullscreen"` global + decorator full-bleed, helper
  `renderUsage` (markdown-inline CHỈ sống trong `parameters.usage`, không sống trong `render`). **Đọc để hiểu,
  KHÔNG sửa.**

## Ranh giới cứng: story-only
Sửa: **chỉ `*.stories.tsx`.** Không đụng `index.tsx`/types của component, không đụng `.storybook/preview.tsx`
hay `main.ts`, không đụng i18n/token.

Lý do (không phải hình thức): đổi component là đổi **production code** — cần đọc spec, soi hết call-site,
verify runtime thật. Nhét chung 1 lượt "sửa story" là âm thầm ship thay đổi production dưới vỏ "sửa tài liệu",
và thầy soi story bằng mắt sẽ KHÔNG thấy blast radius ở 12 chỗ khác. Nên: story sửa ngay, component xếp hàng.

**Khi story lộ ra component có vấn đề thật** (prop chết không call-site nào dùng · 6 cờ trực giao đáng gộp
thành 1 `variant` · thiếu hẳn 1 state đáng lẽ phải có · prop có mà logic không chạy):
1. **CHỐT với thầy** — nói ra phát hiện + đề xuất, đừng im lặng bỏ qua, cũng đừng tự sửa.
2. **Append 1 mục** vào `.artifacts/proposals/story-driven-component-migrations.proposal.md` (FE source, tạo
   nếu chưa có): ngày · story nào lộ ra · component + `file:line` thật · vấn đề · đề xuất · blast radius (grep
   số call-site) · thuộc trục nào (axis-1 / axis-2).
3. Story vẫn sửa cho ĐÚNG với component **hiện tại** — story phản ánh sự thật hôm nay, không phản ánh dự định.

## Verify: tsc + eslint, KHÔNG browser
```bash
# tại $FE_SOURCE
npx tsc --noEmit
npx eslint <đường dẫn story vừa sửa>
```
Rồi **báo thầy nhìn Storybook** (:6006 — HMR thường tự áp, hiếm khi cần refresh tay).

Vì sao không tự mở browser: thầy đã mở sẵn Storybook và soi bằng MẮT — đó mới là gate thật cho "trông thế
nào". Preview MCP chậm/hay treo pane (đã dính 2 lần 1 phiên), và story là code khai báo: tsc/eslint bắt gần
hết lỗi THẬT (prop sai, import thiếu, type lệch). Ngoại lệ hiếm: cần 1 số ĐO thật mà mắt không đọc ra và tsc
không biết — hỏi thầy trước, đừng tự dựng server.

## Ràng buộc (STRICT)
- **KHÔNG ghi `.artifacts/states`** — story-only ≠ đổi component. `states` do `starci-fe-sync` giữ (git-diff
  incremental); nếu lần sửa story lặt vặt nào cũng ghi states thì brainstorm tưởng app đổi liên tục. Lane này:
  sửa story → tsc/eslint → thầy nhìn, HẾT.
- **KHÔNG ghi `.claude/`** — rule là read-only trong vòng lặp skill. Phát hiện rule sai/thiếu → nói với thầy.
- **KHÔNG sửa component/harness trong lượt này** — dù thấy rõ nó sai. Chốt + ghi proposal (§trên).
- **KHÔNG thêm story cho sướng tay** — rubric "bộ story tối thiểu" trong canon: 1 story phải cho thấy điều
  KHÔNG suy ra được từ story khác. Story filler làm loãng gallery.
- **KHÔNG tự generate story hàng loạt** cho block chưa có story — đó là backlog của lane audit/build (story
  "news" gắn `tags: ['news']` là của `starci-fe-build` khi build block/layout MỚI), không phải việc lane này.
- **Mỗi story mới/sửa phải ĐỦ JSDoc + `parameters.usage`** khớp nhau — thiếu `usage` là mất note "Cách dùng",
  đó là lý do story tồn tại.
- Mock data tiếng Việt thực tế, ngày ISO cố định (`new Date()` làm story nhảy), callback no-op.
- Đụng story nào thì nắn story đó theo canon (Label/description/flex-col/no-layout) — **không tự sweep** cả
  đống file drift còn lại trong lượt này.

## Liên quan
- `starci-fe-sync` — chủ sở hữu `.artifacts/states` (ghi sau khi component/story đổi qua git). Skill này không đụng.
- `starci-fe-build` — khi proposal migration được duyệt và tới lúc đổi component thật; build mới thì tự đẩy
  story "news" (tag `news` + caption "Chờ duyệt").
- [[fe/methodology/storybook-story-conventions]] — SSOT luật story. `.artifacts/proposals/` — hàng đợi chốt→apply.
