# Storybook Naming — convention (thầy chốt 2026-07-24)

SSOT cách đặt tên story/component trong Storybook design-system (`$FE_SOURCE/.storybook/stories/blocks/**`).
Rút từ scan toàn bộ (~130 story). **Full English.** Family = **số NHIỀU**.

## 1. Story `title` path — `Tier/Family/Component[/Variant]`

| Cấp | Luật | Ví dụ |
|---|---|---|
| **Tier-1** | 5 cố định (giữ): `Primitives` · `Design` · `Block` · `Layouts` · `Overlays` | `Design/...` |
| **Family** (tier-2) | **Số NHIỀU** cho họ component-type; domain-noun giữ English tự nhiên | `Cards` · `Buttons` · `Chips` · `Lists` · `Forms` · `Stats` · `Texts` |
| **Component** | PascalCase English (giữ — đã ổn) | `ContinueCard` · `HighlightChip` |
| **Variant** (tuỳ) | PascalCase | `Plain` · `Hero` |

- Tier = bản chất component (§6c), KHÔNG phải category → cùng family xuất hiện ở nhiều tier là ĐÚNG (`Design/Cards` + `Block/Cards` + `Primitives/Cards`), miễn **family cùng dạng số nhiều** mọi tier.
- **Component-type family → số nhiều**: `Cards · Buttons · Chips · Lists · Forms · Stats · Texts · Skeletons · Layouts` (nhóm "loại phần tử UI").
- **Domain/feature family → giữ danh từ domain English** (nhiều cái vốn ổn): `Learn · Marketing · Commerce · Grading · Identity · Feed · Code · Media · Rendering · Async · Feedback · Navigation · Notifications · Profile · Rewards`.
- ⚠️ **`Primitives/Layouts` vs tier-1 `Layouts`**: khác cấp path (`Primitives/Layouts/PageHeader` ≠ `Layouts/CourseContents`) nên không đụng nhau; nếu thấy rối, cân nhắc đổi họ primitive này thành `Structures`/`Shell` (để thầy quyết).

## 2. Story display `name:` — full English, **Hoa chữ đầu mọi từ** (thầy chốt 2026-07-24)
KHÔNG prose câu, KHÔNG ` · `, KHÔNG tiếng Việt. 2 loại:
- **STATE / variant chung** → ghi **plain, Title Case**: `Loading` · `Empty` · `Default` · `Error` · `WithProgress` · `NoProgress` · `TitleOnly`. (khớp prop/state trong code).
- **COMPONENT / sub-component cụ thể** → ghi **theo COMPONENT NAME** (identifier, dot cho compound): `Skeleton.ABC` · `Button.Primary` · `DropdownItem.Delete`.
- Vì `name:` ≈ `export const` (đã PascalCase) → nhiều chỗ chỉ cần **bỏ `name:` prose**, để Storybook tự lấy tên export.
- ❌ hiện: ~980 `name:` tiếng Việt → sweep (state plain / component theo tên).

## 2b. LAYOUT nhiều màn → Component thành FOLDER, sub-folder theo DEVICE (thầy chốt 2026-07-24)
- `title` = `Layouts/<Component>/<Device>` với device = `Mobile - 375px` · `Tablet - 768px` · `Desktop` (Title Case, kèm px). Mỗi device 1 story FILE (title per-meta).
- Dưới mỗi device là các **STATE** story: `Default` · `Loading` · `Empty` · (`Paid`…). App **container-query** → mỗi story bọc `@container` width cố định (viewport addon vô dụng).
- **Anatomy Ở KHẮP NƠI**: MỌI story bọc `BlockAnatomy` (không có story "Anatomy" riêng).
- **MỌI device có BỘ STATE Y CHANG nhau** (Desktop sao thì Tablet/Mobile vậy): `Default · Paid · Loading · Empty`.
- **Page padding**: layout apply `p-6` (padding trang thật). Render **canh TRÁI** (không `mx-auto` ở frame).
- **Frame device** = `border-2 border-dashed border-accent rounded-none` (dash accent vuông).
- **BlockAnatomy render box** = `relative` THUẦN — KHÔNG viền, KHÔNG padding (`p-4` bỏ), KHÔNG rounded (chỉ để neo badge absolute).
- ✅ neo: `Layouts/CourseContents/{Mobile - 375px, Tablet - 768px, Desktop}/{Default, Paid, Loading, Empty}` — helper chung `_shared.tsx` (`deviceLeaf`), port `state: content|loading|empty`.

## 2c. Anatomy `parts` name + `leaf` label — cũng theo identifier (thầy chốt 2026-07-24)
`AnatomyNode.name` và `BlockAnatomy leaf=` cũng là tên hiển thị → theo §2:
- Part name: **Component name / dot** — `Typography.Title` · `Typography.Body` · `Dot` · `IconTile` (KHÔNG `Typography · title` VN).
- `leaf=` = English, khớp story name: `Default` · `Unread` · `Read` · `WithAction` · `TitleOnly`.
- 🚨 **COUPLED**: đổi part name phải đổi ĐỒNG BỘ **2 chỗ** — `AnatomyNode.name` trong story **VÀ** giá trị hardcode `anatPart`/`data-anat-part` trong component `.tsx` (badge map theo tên; lệch = mất badge).
- ⚠️ sweep NAMING v1 (2026-07-24) đã LOẠI anatomy name (tưởng DOM data) → còn **62 story** VN cần sweep vòng 2 (coupled component+story).

## 3. Export const + file/component — PascalCase English (giữ, đã ổn)
`export const ContentHomeTrial` · `ContinueCard.tsx`. Không đổi.

## 4. Vi phạm phát hiện (fix sau — sweep riêng)

### 4a. Family lệch dạng số (fix path `title`)
| Hiện | → Đích | Chỗ |
|---|---|---|
| `Primitives/Card` (9) | `Primitives/Cards` | SurfaceListCard, NestedCard… |
| `Primitives/Button` (4) | `Primitives/Buttons` | Button, InputButtonLike… |
| `Primitives/Chip` · `Design/Chip` | `.../Chips` | HighlightChip, StatusChip… |
| `Primitives/List` | `Primitives/Lists` | ListRow… |
| `.../Form` | `.../Forms` | SearchBar… |
| `Primitives/Text` | `Primitives/Texts` | TitledText, InlineIconLabel |
| `Primitives/Layout` | `Primitives/Layouts` (hoặc đổi họ — xem §1) | PageHeader, BlockAnatomy |
| `Primitives/Skeleton` | `Primitives/Skeletons` | Skeleton |
| ✓ đã plural | (giữ) | `Cards`(Design/Block) · `Buttons`(1) · `Stats` · `Notifications` |

### 4b. Display name VI → EN
- **~980 `name:`** tiếng Việt → English. Sweep lớn → **workflow Sonnet riêng** (thầy phát lệnh).

## Ràng
- Đây là canon CHỐT; fix là bước sau (thầy chốt "ghi canon trước, fix sau").
- Khi dựng story MỚI: theo convention này NGAY (family plural + name English) — đừng đẻ thêm vi phạm.
