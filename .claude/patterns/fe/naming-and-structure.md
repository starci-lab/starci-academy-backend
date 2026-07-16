# Naming & cấu trúc file — STRICT

Nguồn sự thật: cây `src/` thật của `$FE_SOURCE` (branch `mtp`).

## 1. Cây thư mục `src/` (đặt file MỚI vào đúng ngăn, không chế ngăn mới)

```
src/
  app/            # Next.js App Router — page/layout (default export BẮT BUỘC ở đây, Next yêu cầu)
  components/
    blocks/       # block tái dùng THUẦN props (async|buttons|cards|chips|feed|form|identity|
                  #   layout|learn|lists|navigation|rendering|skeleton|stats|…)
    features/     # component gắn nghiệp vụ per-feature (dashboard|learn|course|community|…)
    modals/       # XxxModal — mỗi modal 1 folder
    drawers/      # XxxDrawer
    layouts/      # shell/navbar/blog… khung trang
    overlays/     # overlay không phải modal/drawer
    providers/    # React providers
    reuseable/    # tiện ích UI nhỏ dùng chéo (UserAvatar, TagChips, SnippetIcon…)
    svg/  utils/  pallettes/
  hooks/
    swr/api/graphql/{queries,mutations}/   # useQueryXxxSwr.ts · useMutateXxxSwr.ts (+ index.ts barrel)
    swr/api/rest/
    zustand/<domain>/{store.ts, hooks.ts}   # store + hook accessor tách 2 file
    rhf/useXxxForm.ts                       # react-hook-form + zod
    effects/  socketio/  reuseables/
    useXxx.ts                               # hook đơn lẻ không thuộc họ nào (useIsMacPlatform…)
  modules/        # API client (graphql/rest) + types + toast… — KHÔNG chứa JSX
  i18n/ messages/ redux/ config/ data/ resources/ types/ utils/
.storybook/stories/<nhóm>/<Component>/<Component>.stories.tsx   # story mirror theo nhóm block
```

## 2. Component: 1 folder = 1 component

- **STRICT**: folder PascalCase trùng tên component, file duy nhất `index.tsx`. Sub-component riêng của nó = folder con lồng trong (ví dụ thật: `features/learn/ModulePage/ModulePageSkeleton/index.tsx`).
- ✅ `src/components/blocks/identity/UserCell/index.tsx` → `export const UserCell = …`
- ❌ `src/components/blocks/identity/UserCell.tsx` · ❌ `userCell/Index.tsx` · ❌ 2 component trong 1 file (trừ helper KHÔNG export).

## 3. Export: NAMED, arrow const

- **STRICT**: `export const UserCell = (props) => …`. KHÔNG `function UserCell()`, KHÔNG `React.FC` (cả repo chỉ còn 1 chỗ legacy — đừng thêm).
- **Default export CHỈ 2 ngoại lệ**: (a) `src/app/**` page/layout — Next bắt buộc; (b) component load qua `next/dynamic` thì thêm `export default Xxx` Ở CUỐI FILE, vẫn giữ named export (ví dụ thật: `blocks/navigation/OutlineRail/index.tsx` dòng cuối `export default OutlineRail`).
- Props interface export cùng file, tên `XxxProps`.

## 4. Naming hook — theo họ, suffix bắt buộc

| Họ | Tên file/hàm | Ví dụ thật |
|---|---|---|
| SWR query | `useQueryXxxSwr` | `useQueryActiveAdvertisementSwr.ts` |
| SWR mutation | `useMutateXxxSwr` | `useMutateAddToCartSwr.ts` |
| RHF form | `useXxxForm` | `useContactForm.ts` |
| Zustand accessor | `useXxxState` / `useXxxOverlayState` trong `hooks.ts` | `useAdModalOverlayState` (zustand/overlay/hooks.ts) |
| Hook lẻ | `useXxx.ts` ngay `src/hooks/` | `useIsMacPlatform.ts` |

- SWR cache key = SCREAMING_SNAKE string trùng tên hook: `"QUERY_ACTIVE_ADVERTISEMENT_SWR"`, `"MUTATE_ADD_TO_CART_SWR"`.
- Zustand: `store.ts` chứa `create()` + types, `hooks.ts` chứa accessor per-key (selector-subscribed) — KHÔNG cho component đụng store thô.

## 5. Const & type naming

- Hằng module-level: SCREAMING_SNAKE (`DEFAULT_CAROUSEL_INTERVAL`, `TAB_CLASS_ACCENT`, `OVERLAY_KEYS`, `NAME_MAX`).
- Union key/type: PascalCase (`OverlayKey`, `FollowListTab`, `PendingCartIntent`).

## 6. Story (khi skill đẩy story "news")

- Path: `.storybook/stories/<nhóm>/<Component>/<Component>.stories.tsx` (main.ts glob `./stories/**/*.stories.@(ts|tsx)`).
- `title: "Core/Async/AsyncContent"` dạng phân-cấp; mỗi story có `parameters: { usage: "…" }` (caption "Cách dùng" tiếng Việt); story chờ duyệt gắn `tags: ['news']`.
- JSDoc component trỏ ngược: `@see Story: @/stories/blocks/identity/UserCell/UserCell.stories`.
