# Async data — idiom `runGraphQL` + SWR

Phạm vi: cách app FE gọi API bất đồng bộ — GraphQL query/mutation qua SWR, wrap trong custom hook, và bọc mọi WRITE bằng `runGraphQL` (từ `useGraphQLWithToast`). Ground 100% từ source thật, đường dẫn tương đối `src/...`.

---

## 1. Mọi WRITE đi qua `runGraphQL = useGraphQLWithToast()` — KHÔNG gọi bản pure

`useGraphQLWithToast()` trả về 1 hàm ổn định `(action, options?) => Promise<boolean>`; nó tự toast kết quả bằng copy đã i18n. TUYỆT ĐỐI không import `runGraphQLWithToast` (bản pure ở `src/modules/toast/api.ts`) vào component/hook — bản pure chỉ để dùng ngoài React.

✅ ĐÚNG — `src/components/features/community/CommunityFeed/CommunityComposer/index.tsx`
```tsx
const runGraphQL = useGraphQLWithToast()
const ok = await runGraphQL(
    async () => {
        const result = await createPost({ channel, body: trimmed })
        return result.data!.createCommunityPost
    },
    { showSuccessToast: true },
)
if (ok) { setBody(""); onPosted() }
```

❌ SAI — gọi thẳng bản pure trong React (mất i18n, phải tự truyền `messages`):
```tsx
import { runGraphQLWithToast } from "@/modules/toast/api"
await runGraphQLWithToast(() => createPost(...))   // copy toast rơi về English fallback
```

Docstring chuẩn ngay tại `src/modules/toast/hooks.ts`: "Components/hooks should use these instead of importing `run*WithToast` directly, so every toast message is localized."

---

## 2. `action` PHẢI trả về `GraphQLResponse<T>` (bọc `success`/`message`), không trả data thô

`runGraphQL` chờ 1 `action: () => Promise<GraphQLResponse<T>>` và toast dựa trên `response.success`. Vì vậy action trả về đúng cái resolver-wrapper lồng trong `result.data` (`result.data!.createCommunityPost`, `response.data.addToCart`). Khi payload rỗng thì `throw` để wrapper bắt và toast lỗi.

✅ ĐÚNG — `src/components/features/cart/hooks/useCart.ts`
```ts
const success = await runGraphQL(
    async () => {
        const response = await addSwr.trigger({ courseId })
        if (!response.data?.addToCart) {
            throw new Error(response.error?.message)
        }
        return response.data.addToCart
    },
)
```

❌ SAI — trả về Apollo result thô (không có `.success`) → toast luôn coi là thất bại/`defaultError`:
```ts
await runGraphQL(async () => addSwr.trigger({ courseId }))  // thiếu bóc .data + không throw
```

`runGraphQL` trả `boolean` (`true` nếu resolve, `false` nếu throw). LUÔN guard bằng `if (ok)` / `if (success)` trước khi refresh/clear/navigate — đừng bỏ trống giá trị trả về.

---

## 3. 3 tầng cố định: module fetcher → SWR hook → facade hook. Component KHÔNG gọi tầng module

- **Tầng module** (`src/modules/api/graphql/{mutations,queries}/*.ts`): dựng `gql`, tạo Apollo client, trả `apollo.mutate/query`. Vd `mutateAddToCart` trong `src/modules/api/graphql/mutations/mutation-add-to-cart.ts`.
- **Tầng SWR hook** (`src/hooks/swr/api/graphql/{mutations,queries}/*.ts`): bọc fetcher trong `useSWR`/`useSWRMutation`, gắn KEY + generic. 1 hook = 1 operation.
- **Tầng facade hook** (`src/components/features/**/hooks/*.ts` hoặc `src/hooks/**`): gộp nhiều SWR hook + `runGraphQL` thành API sạch cho UI. Vd `useCart`.

Component chỉ consume facade/SWR hook, KHÔNG import `mutateAddToCart` / `queryMyCart` trực tiếp.

✅ ĐÚNG — SWR mutation hook, `src/hooks/swr/api/graphql/mutations/useMutateAddToCartSwr.ts`
```ts
export const useMutateAddToCartSwr = () => {
    const swr = useSWRMutation<MutateAddToCartResult, Error, string, AddToCartRequest>(
        "MUTATE_ADD_TO_CART_SWR",
        async (_key, { arg }) => mutateAddToCart({ request: arg }),
    )
    return swr
}
```

❌ SAI — gọi tầng module thẳng trong component:
```tsx
import { mutateAddToCart } from "@/modules/api/graphql/mutations/mutation-add-to-cart"
const res = await mutateAddToCart({ request: { courseId } })  // bỏ qua SWR cache + toast
```

---

## 4. Query = `useSWR`/`useSWRInfinite`; Mutation = `useSWRMutation`. KEY theo quy ước

- **Query key**: exported `const UPPER_SNAKE_SWR = "..."`, dùng dạng **tuple** `[KEY]` để `mutate([KEY])` revalidate ở nơi khác. Query user-scoped gate auth bằng `authenticated ? [KEY] : null`.
- **Mutation key**: string literal inline UPPER_SNAKE (không cần export, không cần revalidate).

✅ ĐÚNG — query hook, `src/hooks/swr/api/graphql/queries/useQueryMyCartSwr.ts`
```ts
export const QUERY_MY_CART_SWR = "QUERY_MY_CART_SWR"
export const useQueryMyCartSwr = () => {
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWR<Array<CartItemEntity>>(
        authenticated ? [QUERY_MY_CART_SWR] : null,
        async () => {
            const result = await queryMyCart({})
            return result.data?.myCart?.data ?? []
        },
    )
}
```

✅ ĐÚNG — infinite/cursor, `src/hooks/swr/api/graphql/queries/useQueryCommunityFeedSwr.ts`: `getKey` trả tuple `["QUERY_COMMUNITY_FEED_SWR", channel ?? "", cursor]`, dừng khi `previous.nextCursor === null` (trả `null`).

❌ SAI — key rời rạc string không revalidate được từ nơi khác, hoặc fetch khi chưa auth:
```ts
useSWR("myCart", async () => queryMyCart({}))  // không tuple-key, không gate auth
```

Type generic BẮT BUỘC: `useSWR<Array<CartItemEntity>>`, `useSWRMutation<Result, Error, string, Request>` (dùng `Awaited<ReturnType<typeof fetcher>>` cho Result). Không để suy luận `unknown`/`any`.

---

## 5. Trạng thái loading/error/mutating LẤY TỪ hook, không tự dựng `useState`

Facade/SWR hook expose sẵn: đọc `data ?? []`, `isLoading`, `error` (từ `useSWR`); ghi `isMutating`, `trigger` (từ `useSWRMutation`). Component chỉ tiêu thụ, không tự quản cờ loading.

✅ ĐÚNG — `src/components/features/community/CommunityCommentThread/index.tsx`
```tsx
const { data, isLoading, error, mutate } = useQueryCommunityPostCommentsSwr(postId)
const { trigger: createComment, isMutating } = useMutateCreateCommunityPostCommentSwr()
const comments = data?.comments ?? []
```
`isMutating` chạy thẳng vào `<Button isPending={isMutating}>`; `isLoading`/`error` vào `<AsyncContent>`.

✅ ĐÚNG — facade gộp nhiều cờ, `src/components/features/cart/hooks/useCart.ts`:
```ts
const isMutating = addSwr.isMutating || removeSwr.isMutating || clearSwr.isMutating
const isLoading = cartSwr.isLoading && items.length === 0   // chỉ loading khi CHƯA có cache
```

❌ SAI — tự dựng cờ song song, dễ lệch với SWR:
```tsx
const [loading, setLoading] = useState(false)
setLoading(true); await createComment(...); setLoading(false)
```

---

## 6. Facade hook trả `Promise<boolean>` + revalidate KEY chia sẻ sau khi ghi

Mỗi hành động ghi trong facade: chạy `runGraphQL`, và CHỈ khi `success` mới `mutate([KEY])` để đồng bộ mọi consumer (navbar badge, card, page) trên cùng 1 cache. Success-toast tùy UX: bỏ qua khi đã có xác nhận trực quan khác.

✅ ĐÚNG — `src/components/features/cart/hooks/useCart.ts`
```ts
const refresh = useCallback(() => { void mutate([QUERY_MY_CART_SWR]) }, [mutate])
const addToCart = useCallback(async (courseId: string) => {
    // no success toast: mini-cart drawer IS the confirmation; errors still toasted by wrapper
    const success = await runGraphQL(async () => { /* ... */ })
    if (success) { refresh(); openMiniCart() }
    return success
}, [addSwr, runGraphQL, refresh, openMiniCart])
```
Copy toast tùy chỉnh truyền qua option: `{ successMessage: t("cart.removed") }` (đã i18n), không hard-code chuỗi.

❌ SAI — ghi xong không revalidate → UI khác vẫn hiển thị data cũ:
```ts
await runGraphQL(async () => addSwr.trigger({ courseId }))
// thiếu mutate([QUERY_MY_CART_SWR]) → badge navbar không cập nhật
```
