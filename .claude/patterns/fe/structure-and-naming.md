# Cấu trúc thư mục & đặt tên (FE)

> Phạm vi: cách TỔ CHỨC file/folder và ĐẶT TÊN component/hook/type trong `src/components` — không phải rule design/UI. Ground 100% từ code thật của repo.

---

## 1. 1 component = 1 folder + `index.tsx`

Mỗi component sống trong CHÍNH folder của nó, code trong `index.tsx` (không đặt file `.tsx` tên component rời trong folder cha). Folder PascalCase, tên folder = tên component export. Repo có 764 `index.tsx` theo đúng luật này.

✅ ĐÚNG — `src/components/blocks/cards/LabeledCard/index.tsx`
```
blocks/cards/LabeledCard/index.tsx   →  export const LabeledCard = (...)
```

❌ SAI
```
blocks/cards/LabeledCard.tsx                 // component không được nằm rời
blocks/cards/LabeledCard/LabeledCard.tsx     // đừng lặp tên; dùng index.tsx
```

Ngoại lệ hiếm (file rời cùng cấp) chỉ cho helper container thuần, vd `src/components/drawers/DrawerContainer.tsx` — component thật vẫn phải 1-folder-index.

---

## 2. Sub-component = folder con lồng trong folder cha

Khi 1 component tách nhỏ, MỖI phần con là 1 folder PascalCase riêng có `index.tsx`, đặt LỒNG trong folder cha; `index.tsx` cha compose chúng qua import tương đối `./ChildName`.

✅ ĐÚNG — `src/components/features/course/CourseDetail/`
```
CourseDetail/index.tsx          // compose
CourseDetail/CourseHero/index.tsx
CourseDetail/CoursePricingRail/index.tsx
CourseDetail/CourseFaq/index.tsx
```
`CourseDetail/index.tsx`:
```tsx
import { CourseHero } from "./CourseHero"
import { CoursePricingRail } from "./CoursePricingRail"
```

Sub-component gọi sibling / lên barrel cha bằng đường dẫn tương đối (`src/components/features/careers/Headhunting/Headhuntings/ConsultantCard/index.tsx`):
```tsx
import { ConsultantAvatar } from "../ConsultantAvatar"     // sibling
import { useOpenHeadhunterDetail } from "../../hooks"       // barrel cha
```

❌ SAI — nhét nhiều component vào 1 file `index.tsx`, hoặc đặt sub-component thành file phẳng `CourseHero.tsx` cạnh `index.tsx`.

---

## 3. Category ở cấp trên cùng

`src/components/` chia theo VAI TRÒ, không phẳng:

- `blocks/` — block tái dùng, chia tiếp theo họ: `cards/ chips/ form/ lists/ navigation/ layout/ stats/ skeleton/ feedback/ …`
- `features/` — UI theo DOMAIN, gom theo miền: `features/careers/… features/course/… features/learn/…`
- `modals/` · `drawers/` — overlay (xem §6)
- `layouts/ providers/ svg/ utils/ reuseable/`

✅ ĐÚNG: block dùng chung → `src/components/blocks/cards/PressableCard/`; UI riêng 1 miền → `src/components/features/careers/Headhunting/`.

❌ SAI: đặt component đặc-thù-feature vào `blocks/`, hoặc quăng component mới thẳng vào `src/components/` không qua category.

---

## 4. Folder đồng-hành khi component lớn: `hooks/ types/ utils/` + barrel

Khi 1 component sinh nhiều hook/type/util, tách thành folder con `hooks/ types/ utils/` NGAY TRONG folder component, mỗi folder có `index.ts` barrel `export * from "./x"`. Hằng số → `constants.ts`, type ít → `types.ts` phẳng.

✅ ĐÚNG — `src/components/features/careers/Headhunting/`
```
hooks/index.ts          →  export * from "./useOpenHeadhunterDetail"
hooks/useHeadhuntingCompanyDetail.ts
types/index.ts          →  export * from "./breadcrumbs"
utils/index.ts          →  export * from "./resolveConsultantAvatar"
```
Type ít / cục bộ → 1 file phẳng: `src/components/features/course/CourseDetail/types.ts`, `constants.ts`.

❌ SAI — barrel `index.ts` chứa logic; hoặc rải `useX.ts` lẫn `index.tsx` ngoài folder `hooks/` khi đã có nhiều hook.

---

## 5. Đặt tên: hook `use*`, props `<Component>Props`, export CÓ TÊN

- Hook: file camelCase mở đầu `use`, vd `useCourseTotals.ts`, `useHeadhuntingsBreadcrumbs.ts` (`src/components/features/course/CourseDetail/hooks/`).
- Props: `interface <Component>Props` (hoặc `type`), EXPORT, extends `WithClassNames`.
- Component: **named export**, tên trùng folder. Đây là idiom trội (743/764). `export default` là thiểu số (~21 file, luôn KÈM named export) — mặc định dùng named, đừng viết default-only.

✅ ĐÚNG — `src/components/blocks/cards/LabeledCard/index.tsx`
```tsx
export interface LabeledCardProps extends WithClassNames<undefined> { label: ReactNode /* … */ }
export const LabeledCard = ({ label, className }: LabeledCardProps) => { /* … */ }
```
Props không có field riêng → alias `WithClassNames<undefined>` (`src/components/.../Headhuntings/index.tsx`):
```tsx
export type HeadhuntingsProps = WithClassNames<undefined>
```

❌ SAI
```tsx
export default function labeledCard(props) {}   // default-only + tên thường
const Props = {}                                 // props không đặt <Component>Props, không export
function useData() {}                             // hook không đặt trong hooks/ + không phải file useX.ts
```

---

## 6. Overlay: `modals/` `drawers/` với hậu tố

Modal ở `src/components/modals/`, mỗi cái 1 folder hậu tố `Modal` (`AuthenticationModal/`, `GlobalSearchModal/`). Drawer ở `src/components/drawers/`, hậu tố `Drawer` (`MiniCartDrawer/`, `E2eResultDrawer/`). Vẫn theo luật 1-folder-`index.tsx` (§1).

✅ ĐÚNG: `src/components/modals/AiQuotaModal/index.tsx`, `src/components/drawers/SubmissionResultHistoryDrawer/index.tsx`.

❌ SAI: `AiQuotaOverlay/` (thiếu hậu tố Modal), hay để modal trong `features/` thay vì `modals/`.

---

## 7. Alias deprecated = re-export cạnh export mới

Đổi tên component thì GIỮ tên cũ làm alias re-export + `@deprecated`, không xóa gãy import.

✅ ĐÚNG — `src/components/features/careers/Headhunting/Headhuntings/index.tsx`
```tsx
export const Headhuntings = (...) => { /* … */ }
/** @deprecated Use {@link Headhuntings}. */
export const HeadhuntingsLearnLayout = Headhuntings
```
