---
name: starci-fe-story-fix
description: >
  Sửa/thêm/gộp/cắt **STORY** (`src/**/*.stories.tsx`) của app FE chính (`C:\Repositories\starci-academy`) —
  lane NHẸ, chạy inline, phạm vi 1-vài story. **Chỉ đụng file story: component thật, `.storybook/preview.tsx`,
  `main.ts` là VÙNG CẤM** — phát hiện component cần đổi thì CHỐT lại với thầy + ghi plan migrate vào
  `fe/proposals/story-driven-component-migrations.proposal.md`, KHÔNG sửa production code trong lượt này.
  **KHÔNG chạy browser/preview MCP** — thầy tự soi bằng mắt trên Storybook đang mở sẵn (:6006, HMR tự áp);
  skill chỉ chạy `tsc --noEmit` + eslint rồi báo thầy refresh. Dùng skill này cho MỌI việc story thường ngày:
  "sửa story", "thêm story", "story thiếu state", "sửa Cách dùng / caption story", "gộp story trùng", "cắt
  story filler", "story dùng prop cũ", "đổi title story cho gom đúng họ", "story only đừng đụng component".
  Sibling NẶNG `starci-fe-audit-story-book` (quét coverage toàn Storybook + sửa cả component + preview_start)
  chỉ dùng khi thầy gọi audit/soát toàn bộ — mặc định story thường ngày là skill NÀY.
---

# /starci-fe-story-fix — sửa story, KHÔNG đụng component, KHÔNG mở browser

Storybook là tài liệu sống của design system. Sửa nó phải RẺ và NHANH, nếu không sẽ không ai sửa. Skill này
là lane thường ngày: thầy đang mở Storybook, thấy 1 story sai/thiếu/thừa → sửa ngay, thầy nhìn mắt là xong.

**Khác `starci-fe-audit-story-book` (sibling nặng):** skill kia QUÉT (coverage toàn bộ, fan-out qua Workflow,
phản biện gate, sửa cả component bằng Opus, verify bằng `preview_start`) — dùng khi thầy chủ động gọi audit.
Skill NÀY không quét, không workflow, không browser: 1-vài story, sửa thẳng, tsc/eslint, xong.

**Cross-repo:** story + component thật ở FE repo `C:\Repositories\starci-academy`; canon + BACKLOG ở repo này
(`.claude/fe/`). Đọc cả hai, ghi story ở FE, ghi plan ở backend.

## Nền tra cứu (đọc TRƯỚC khi sửa — đừng tự chế luật)
- ⭐ **`.claude/fe/methodology/storybook-story-conventions.md`** — SSOT cách viết story: cấu trúc file, `meta.title`
  gom cây theo họ, JSDoc + `parameters.usage` (thiếu `usage` = mất note "Cách dùng" trên canvas), **rubric bộ
  story TỐI THIỂU** (1 story chỉ đáng tồn tại nếu cho thấy điều KHÔNG suy ra được từ story khác — enum explosion
  → gộp 1 story so-sánh; xoá filler chỉ-khác-className/số-lượng), và luật caption **"KHI NÀO" phải loại trừ ANH
  EM** (block có lựa chọn thay thế thì caption phải nói *dùng cái này thay vì cái kia khi nào*, tả cơ chế là
  CHƯA ĐẠT). Skill này KHÔNG lặp lại các luật đó — canon đổi thì skill tự theo. Đọc file, đừng đoán.
- **Component thật** (`index.tsx` + types) của story đang sửa — spec cao nhất. Prop/state trong story phải neo
  vào prop/state THẬT, không suy từ tên biến.
- ⭐ **Canvas full-bleed — đụng story nào thì kiểm story đó KHÔNG set `parameters.layout`** (thầy 2026-07-15:
  *"để content full width height"*). Harness lo canvas: `preview.tsx` có `layout:"fullscreen"` global + decorator
  `min-h-screen w-full p-8`, content chảy trên-trái. Story tự set `layout:"centered"` → shrink-wrap canvas,
  strand `h-full`, block trôi giữa khoảng trắng. Thấy dòng đó → xoá, đừng hỏi. **Wrapper bó width (`w-80`,
  `max-w-md`…) thì GIỮ** — hẹp thường là nội dung story (Narrow Container, truncation); rule cấm `layout`, không
  cấm width. Chi tiết: `storybook-story-conventions.md` §1 ★ CANVAS FULL-BLEED.
- ⭐ **Khung story SO-SÁNH nhiều biến thể (`AllTones`/`Branches`/`Sizes`) — đụng story nào thì kiểm story đó 2 thứ**
  (thầy 2026-07-15, ca `AsyncContent/Branches`: *"Label này dùng Label và chữ hoa đầu nhé"* + *"dùng flex col gap-6
  nhé, float sang trái"*):
  1. **Nhãn mỗi biến thể = `<Label>` (HeroUI) + CHỮ HOA ĐẦU** (`error` → `Error`) — KHÔNG `<span className="text-xs
     text-muted">` tay. axis-1 §Label cấm hand-roll nhãn muted đứng trên 1 control/group, và **story không phải ngoại
     lệ**: Storybook là tài liệu SỐNG, story hand-roll thì nó dạy sai chính cái nó demo + người đọc copy ra feature là
     drift lan tiếp. **GAP Label→demo:** card/cụm `gap-3` · input text đơn `gap-2` (axis-1 §Label).
  1b. **NGAY DƯỚI mỗi Label = 1 DESCRIPTION nói BIẾN THỂ NÀY XÀI LÚC NÀO** (thầy 2026-07-15: *"dưới label ghi
     description text-sm text-muted là xài lúc nào nhé"*). Dùng **`<Typography type="body-sm" color="muted">`** —
     `body-sm` CHÍNH LÀ `text-sm`, và axis-1 §Token nền cấm `text-*` rời; viết `<span className="text-sm
     text-muted">` là lặp đúng cái tội span-muted mà gate 1 vừa dẹp. Cụm `Label + description` bọc chung 1 `<div
     className="flex flex-col gap-2">`, rồi cụm đó → demo cách `gap-3`. **Nội dung = ĐIỀU KIỆN CHỌN, không phải tả
     hình:** "CTA chính, tối đa 1 mỗi bề mặt" (đúng) chứ không phải "nút hồng bo tròn" (sai — mắt đã thấy rồi). Cùng
     lý do với luật caption §2 "KHI NÀO phải loại trừ ANH EM": bày 7 variant cạnh nhau mà không nói khi nào dùng cái
     nào thì người đọc vẫn phải đoán. **Ground vào canon/source THẬT** (axis-1 §Button/§Chip/§Label, JSDoc prop,
     call-site) — biến thể nào canon chưa có luật (vd `variant="outline"`) thì mô tả theo call-site thật đang dùng,
     **ĐỪNG bịa ra luật mới** trong story.
     **⚠ Description = CHỮ THƯỜNG, KHÔNG markdown** (thầy 2026-07-15: *"trò render dạng thường k markdown nhé"*).
     `parameters.usage` ĐƯỢC parse markdown-inline (`preview.tsx` có helper `renderUsage`: `` `x` `` → `<code>`) —
     nhưng description là children `<Typography>` TRẦN, không đi qua helper đó, nên backtick hiện ra thành ký tự
     trần, trông y như markdown hỏng. Tên prop/component viết thẳng: "Cần CẢ onRetry LẪN retryLabel". **Ranh giới
     dễ nhầm: markdown chỉ sống trong `usage`, không sống trong `render`.**
  2. **LUÔN `flex flex-col gap-6` — KHÔNG hàng ngang, KHÔNG grid ≥2 cột, KHÔNG ngoại lệ theo cỡ biến thể.** Mọi
     story so-sánh xếp DỌC, neo trái, bất kể biến thể là card to hay chip/nút bé tí. Thầy 2026-07-15 chốt lại
     lần 2 (*"ý là để flex-col"*, *"nhớ skill này là flex-col nhé"*) sau khi bản trước tự khoét nhánh "biến thể
     nhỏ → hàng ngang". Xếp ngang/grid đẩy nội dung sang PHẢI (nghịch canvas trên-trái) + bóp ô hẹp → block không
     render ở chiều rộng thật; và mỗi story một kiểu khung thì mắt phải học lại bố cục ở từng trang. 1 trục dọc =
     1 hình dạng duy nhất cho cả Storybook. `max-w-*` bó tổng thì GIỮ.
  - **Drift đã biết (grep 2026-07-15):** 26 chỗ span-muted làm nhãn ở **20 file** story, chỉ 1 file dùng `<Label>`
    đúng; 6 file dùng grid ≥2 cột (chưa soi từng cái). Sửa story nào thì nắn story đó — **KHÔNG tự sweep cả 20 file**
    trong lượt này (xem §Ràng buộc "không tự generate/sửa hàng loạt"). Chi tiết:
    `storybook-story-conventions.md` §2b.
- `.storybook/preview.tsx` (FE) — biết trước để không ngạc nhiên: locale hard-code `vi` (story không bao giờ
  render `en`), `HeroUIProvider`, toolbar theme light/dark, `a11y: { test: "error" }`. **Đọc để hiểu, KHÔNG sửa.**
- `.claude/fe/axis-1-rules/RULES.md` + `axis-2-biz-ui/RULES.md` — khi caption cần nói "dùng cái này thay vì cái
  kia khi nào", luật chọn nằm ở axis-2 (§Bảng tra data-shape → block); đừng tự bịa tiêu chí chọn.

## Ranh giới cứng: story-only
Sửa: **chỉ `*.stories.tsx`.** Không đụng `index.tsx`/types của component, không đụng `.storybook/preview.tsx`
hay `main.ts`, không đụng i18n/token.

Lý do ranh giới này tồn tại (không phải hình thức): đổi component là đổi **production code** — nó cần đọc spec,
soi hết call-site, verify runtime thật. Nhét việc đó chung 1 lượt "sửa story" là cách âm thầm ship 1 thay đổi
production dưới vỏ "sửa tài liệu", và thầy soi story bằng mắt sẽ KHÔNG thấy được blast radius của nó ở 12 chỗ
khác. Nên: story sửa ngay, component xếp hàng.

**Khi story lộ ra component có vấn đề thật** (prop chết không call-site nào dùng · 6 cờ trực giao đáng gộp thành
1 `variant` · component thiếu hẳn 1 state đáng lẽ phải có · prop có nhưng logic không chạy):
1. **CHỐT lại với thầy** — nói ra phát hiện + đề xuất, đừng im lặng bỏ qua và cũng đừng tự sửa.
2. **Append 1 mục** vào `fe/proposals/story-driven-component-migrations.proposal.md` (tạo file nếu chưa có):
   ngày · story nào lộ ra · component + `file:line` thật · vấn đề · đề xuất đổi · blast radius (grep số
   call-site) · thuộc trục nào (axis-1 rules / axis-2 biz-ui).
3. **Đảm bảo BACKLOG có ĐÚNG 1 dòng** trỏ file đó (`⬜ PENDING`) — 1 dòng gom chung cho mọi migration
   story-driven, KHÔNG mỗi finding 1 dòng (bảng BACKLOG vốn đã dài, mỗi finding 1 dòng là ngập).
4. Story vẫn sửa cho ĐÚNG với component **hiện tại** — story phản ánh sự thật hôm nay, không phản ánh dự định.

## Verify: tsc + eslint, KHÔNG browser
```
npx tsc --noEmit                       # ở C:\Repositories\starci-academy
npx eslint <đường dẫn story vừa sửa>
```
Rồi **báo thầy refresh tab :6006** (Storybook HMR thường tự áp — thường không cần refresh tay).

Vì sao không tự mở browser: thầy đã mở sẵn Storybook và soi bằng MẮT — đó mới là gate thật cho "trông thế nào",
và agent chụp ảnh hộ không thay được. Preview MCP còn hay treo/timeout, và khi dev server do session khác dựng
thì tool này không với tới được. Story là code khai báo: tsc/eslint đã bắt gần hết lỗi THẬT (prop sai, import
thiếu, type lệch). Phần browser thêm được đúng là phần thầy tự làm nhanh hơn.

Ngoại lệ hiếm: cần 1 số ĐO (chiều rộng/vị trí thật) mà mắt không đọc ra và tsc không biết — lúc đó hỏi thầy
trước, đừng tự dựng server.

## Ràng buộc (STRICT)
- **Không ghi `.claude/fe/_state/diff.md`, không kích hoạt `starci-fe-sync`** — chỉnh story ≠ đổi component thật.
  `_state/diff.md` chỉ phản ánh thay đổi COMPONENT (để brainstorm biết cái gì thật sự đổi mà khỏi rescan); nếu mỗi
  lần sửa story lặt vặt cũng ghi vào diff thì brainstorm tưởng app đổi liên tục. Chỉ `starci-fe-sync` ghi diff (khi
  COMPONENT/story đổi qua git). Lane này: sửa story → tsc/eslint → thầy nhìn, HẾT.
- **Không sửa component/harness trong lượt này** — dù thấy rõ nó sai. Chốt + ghi plan (§trên).
- **Không thêm story cho sướng tay** — rubric "bộ story tối thiểu" trong canon nói rõ 1 story phải cho thấy
  điều KHÔNG suy ra được từ story khác. Thêm story filler làm loãng gallery, đúng thứ vừa cắt 466→~340.
- **Mỗi story mới/sửa phải có ĐỦ JSDoc + `parameters.usage`** khớp nhau — thiếu `usage` là mất note "Cách dùng",
  đó là lý do story tồn tại.
- **Không tự generate story hàng loạt** cho các block chưa có story (>80% block đang thiếu) — đó là backlog dài
  hạn của skill audit sibling, không phải việc của lane này.
- Mock data tiếng Việt thực tế, ngày ISO cố định (`new Date()` làm story nhảy), callback no-op.

## Liên quan
- `starci-fe-audit-story-book` — sibling NẶNG: quét coverage toàn bộ + sửa component + preview. Gọi khi thầy
  muốn audit, không phải sửa 1 story.
- `starci-fe-block-apply` — khi plan migration ở trên được duyệt và tới lúc đổi component thật.
- `fe/methodology/storybook-story-conventions.md` — SSOT luật story. `fe/proposals/BACKLOG.md` — hàng đợi chung.
