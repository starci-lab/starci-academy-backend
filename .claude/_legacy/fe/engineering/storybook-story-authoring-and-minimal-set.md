# Storybook — cách viết story + BỘ story TỐI THIỂU (mỗi story = 1 trạng thái KHÁC BIỆT) — CHỐT 2026-07-15

Story sống TÁCH KHỎI code app trong cây `.storybook/stories/` (mirror cấu trúc `src/components/`), mỗi component 1 folder chứa 2 file: `<Name>.stories.tsx` (CSF thuần) + `components.tsx` (demo/mock/logic, export để story khác import chéo). Ba nhóm quy tắc: **cấu trúc file**, **bộ story tối thiểu**, **gom cây sidebar**.

## 1. Cấu trúc file (convention bắt buộc — CHỐT 2026-07-16)
- **Story tách hẳn khỏi component**, sống ở `.storybook/stories/<REL>/` — trong đó `<REL>` = đường dẫn component sau `src/components/` (vd component `src/components/blocks/cards/PressableCard/` → story ở `.storybook/stories/blocks/cards/PressableCard/`). Cây `.storybook/stories/` mirror y hệt cây `src/components/`. Glob nạp: `main.ts` → `stories: ["./stories/**/*.stories.@(ts|tsx)"]`.
- **Mỗi component 1 FOLDER trong cây story**, chứa **2 file**:
  - **`<Name>.stories.tsx`** — CHỈ khai báo Storybook (CSF): `import type { Meta, StoryObj }` + `const meta` + `export default meta` + `type Story = StoryObj<…>` + các `export const X: Story`. KHÔNG demo component / mock data / helper.
  - **`components.tsx` (CÙNG folder story)** — MỌI thứ còn lại: demo component, wrapper `Controlled` (useState), mock data const, interface/type của mock, helper. Tất cả `export`. Story import qua `import { … } from "./components"`.
  - Story KHÔNG có gì để tách (chỉ meta + stories inline) → **KHÔNG tạo `components.tsx` rỗng**.
  - **Vì sao:** demo/mock trong `components.tsx` được EXPORT nên story khác **import chéo** dùng lại (hết copy-paste khuôn Table/khuôn so-sánh giữa story cùng họ). File story gọn còn đúng phần tài liệu.
- **Import component THẬT bằng alias `@/`** (KHÔNG relative — story ngoài `src/`): `import { PressableCard } from "@/components/blocks/cards/PressableCard"`. Chỉ `./components` (sibling cùng folder story) mới là relative.
- **Component gốc `index.tsx` ghi ref ngược tới story** = JSDoc `@see Story: .storybook/stories/<REL>/<Name>.stories` trên khai báo component (comment, KHÔNG import — production không phụ thuộc story). Ngoại lệ: primitive không có `index.tsx` riêng (Button/Chip/Popover/Toast/Foundations…) thì bỏ qua ref.
- **Gate vẫn giữ:** `tsconfig.json` include `.storybook/**/*.{ts,tsx}`; `eslint.config.mjs` cho `.storybook/**` vào `files` của block starci-fe canon + jsx-a11y → story vẫn bị tsc + canon + a11y soi như khi còn trong `src/`.
- `import type { Meta, StoryObj } from "@storybook/nextjs"`; import component thật từ `"@/components/<REL>"`; import demo/mock từ `"./components"`.
- `meta`: `title: "Blocks/<Category>/<Name>"` (xem §3), `component`, thường `parameters: { layout: "centered" }`.
- Mỗi story: **JSDoc `/** … */` ngay trên** + **`parameters.usage`** = ĐÚNG câu tiếng Việt đó. `usage` render thành ghi chú "Cách dùng" trên canvas (decorator repo dựa vào nó) — không có = mất note.
- Caption tiếng Việt tự nhiên đủ dấu, nói **KHI NÀO/vì sao** dùng biến thể đó (không tả nó trông thế nào). KHÔNG emoji, KHÔNG ALL-CAPS.
- Component STATEFUL (value+onChange / selection) → wrapper `Controlled` giữ `useState`, đặt trong `components.tsx`, story render qua nó. Presentational → render thẳng props.
- Type-correct (tsc) + eslint sạch: 4-space, double-quote, không dấu `;`, không import thừa, không `any`. Mock data thực tế + tiếng Việt; callback no-op `() => {}`; ngày = ISO cố định (KHÔNG `new Date()`).

## 2. Bộ story TỐI THIỂU — 1 story chỉ đáng tồn tại nếu cho thấy điều KHÔNG suy ra được từ story khác
Rubric (đã dùng để cắt 466→~340 story, 2026-07-15). Một story = 1 **trạng thái/bố cục/hành vi KHÁC BIỆT trực quan**, không phải 1 giá trị prop khác.
- **Enum/tone/size explosion → GỘP thành 1 story "so sánh cạnh nhau".** N story chỉ khác nhau ở 1 giá trị enum/màu/cỡ mà layout+hành vi y hệt → 1 story gallery (`AllTones`/`AllCategories`/`Sizes`) render mọi biến thể 1 lượt. (Vd AiCategoryChip/DifficultyChip: bỏ per-value, giữ 1 gallery.)
- **Wrapper re-demo → GỘP về 1 story "phân nhánh".** Component bọc/uỷ quyền (AsyncContent, PaginatedList) render lại state của con (EmptyContent/ErrorContent/Skeleton) vốn ĐÃ có story riêng → 1 story thể hiện LOGIC riêng của wrapper (thứ tự error>loading>empty>content), không re-demo từng state con.
- **XOÁ filler:** biến thể chỉ khác `className` (CustomClassName/CustomPosition/CustomSpacing), chỉ khác SỐ LƯỢNG (ManyItems/count), chỉ khác 1 TỪ / 1 ICON (icon là content của caller, không phải variant), hoặc 2 story trông ~giống hệt.
- **GIỮ:** 1 Default = case thật thường gặp + các state THẬT KHÁC HÌNH (loading/empty/error/disabled/overflow/truncation/có-vs-không slot đổi layout).
- **KHÔNG cross-dup:** đừng xoá story ở component A chỉ vì component B cũng cho thấy state đó — mỗi component giữ story ở "nhà chính" của nó.
- Thiên về ÍT story, DÀY, kiểu gallery. Chip/badge/tone thường chỉ cần 1–2 story.

## 3. Gom cây sidebar theo HỌ (CHỐT 2026-07-15)
- `title` = **`"Blocks/<Category>/<Name>"`**, `<Category>` map theo folder code (số ít gọn): chips→**Chip**, cards→**Card**, buttons→**Button**, lists→**List**, stats→**Stat**; còn lại giữ tên folder viết hoa (Async, Feed, Grading, Identity, Layout, Learn, Marketing, Navigation, Feedback, Commerce, Media).
- → sidebar tự gom thành thư mục theo họ (Chip/Card/Stat/…), mỗi component vẫn là 1 mục con GIỮ Controls/Docs riêng — KHÔNG merge nhiều component vào 1 trang (mất Controls).
- Ngoại lệ có chủ ý: `InfoTooltip` để `Overlays/InfoTooltip` (chung Popover/Toast — đều overlay). `Foundations/*`, `Overlays/*`, `Reuseable/*` giữ prefix riêng.
- Component 1-mình-1-họ (Skeleton): dùng `Blocks/Skeleton` thẳng (tránh `Skeleton/Skeleton` thừa).

## Liên quan
- [[storybook-story-canvas-full-bleed.md]] (canvas full-bleed cho story layout) · [[elements/color]] §7 (soft-foreground — gallery tone chip) · [[elements/button.md]] §8 (ButtonGroup segmented).
