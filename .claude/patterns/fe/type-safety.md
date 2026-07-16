# Type-safety FE — STRICT

> `tsconfig.json` bật `"strict": true` (bao gồm `strictNullChecks`) — mọi rule dưới đây INFER từ code thật trên `mtp`, không rule nào bịa.

## 1. CẤM `any` → `unknown` + narrow

- **CẤM `any` tuyệt đối** (kể cả `as any`, `: any`, `Array<any>`) — xem [[props-and-types]] §3. Giá trị chưa biết kiểu (input ngoài, JSON, error) khai `unknown` rồi **narrow tường minh** trước khi dùng:

```ts
// ✅ features/profile/CV/completeness.ts — type guard bằng typeof
const hasNonEmptyString = (value: unknown): boolean =>
    typeof value === "string" && value.trim().length > 0

// ✅ hooks/useSpeechSynthesis.ts — narrow bằng `in`
if (typeof window === "undefined" || !("speechSynthesis" in window)) { return }

// ❌ const hasNonEmptyString = (value: any) => value.trim?.().length > 0
```

- Error từ SWR/catch giữ nguyên `unknown` xuyên suốt boundary — KHÔNG ép kiểu cho tiện:

```ts
// ✅ blocks/async/AsyncContent/index.tsx
error?: unknown   // truthy → ErrorContent; pass thẳng SWR `error`
// ❌ error?: any   ·   ❌ error?: Error (SWR không hứa Error instance)
```

## 2. Discriminated union — KHÔNG cờ optional rời

- State/payload nhiều nhánh = union có field phân biệt, mỗi nhánh `readonly`, KHÔNG phải đống boolean/optional có thể mâu thuẫn nhau:

```ts
// ✅ hooks/zustand/overlay/store.ts
export type PendingCartIntent =
    | { readonly type: "add"; readonly courseId: string }
    | { readonly type: "open" }
// ❌ { isAdd?: boolean; courseId?: string }  → tồn tại state vô nghĩa (isAdd=true mà courseId=undefined)
```

- Async region KHÔNG tự chế cờ — dùng bộ SWR `{ data, error, isLoading }` + render qua `AsyncContent` (ưu tiên error → loading → empty → content). Hook public gói lại thì phải GHI RÕ ngữ nghĩa từng nhánh trong JSDoc:

```ts
// ✅ features/architecture/hooks/useSystemHealthPoll.ts
/** Live health keyed by component name, or `null` before the first resolve. */
healthByName: HealthByName | null
// caller phải coi null = "checking…", KHÔNG BAO GIỜ coi là up
```

## 3. `strictNullChecks` — null/undefined tường minh, `!` phải CHỨNG MINH

- Nullable từ API giữ đúng `| null` (không ép về `undefined`) — [[props-and-types]] §3. Xử lý bằng `?.` + `??` + guard, KHÔNG bằng `!` bừa.
- **Non-null assertion `!` chỉ khi đã chứng minh ngay cạnh đó**, và guard phải nhìn thấy được trong cùng tầm mắt:

```ts
// ✅ features/dashboard/TopLearners/index.tsx — Boolean(data) đứng NGAY TRƯỚC data!
const hasOverflow = Boolean(data) && data!.entries.length > TOP_N

// ❌ const hasOverflow = data!.entries.length > TOP_N   // không có gì chứng minh
```

- Không chứng minh được tại chỗ → viết guard thật (`if (!data) return null`) hoặc `?? fallback`. `!` rải rác qua nhiều dòng/hàm = sai chuẩn.

## 4. CẤM `as X` bừa — ưu tiên `satisfies`

- `as X` chỉ hợp lệ khi TS **không thể** biết mà runtime **chắc chắn** biết, và PHẢI kèm comment/lý do đọc được:

```ts
// ✅ blocks/marketing/ArchitectureScene/index.tsx — lý do ghi ngay trên dòng assert
/** Default scene (StarCi backend). JSON widens tuples/unions, so assert the schema. */
const DEFAULT_DATA = sceneJson as unknown as ArchitectureSceneData

// ✅ blocks/cards/GroupPressableCard/index.tsx — API DOM trả EventTarget, phải hẹp lại
const target = event.target as HTMLElement | null

// ✅ blocks/learn/EntityResultRow/index.tsx — string từ API map về key hẹp, CÓ fallback đỡ
KIND_META[kind as KnownKind] ?? KIND_META.content

// ❌ const data = response as CourseData        // ép mù payload không validate, không lý do
// ❌ const items = [] as Array<Item>             // → dùng: const items: Array<Item> = []
```

- **Kiểm tra shape mà vẫn giữ literal → `satisfies`, KHÔNG `as`** (as ĐÁNH MẤT check, satisfies GIỮ narrowing):

```ts
// ✅ blocks/marketing/ShowcaseMockup/index.tsx — key giữ literal, value bị check
export const SHOWCASE_THEMES = { accent: {…}, starci: {…}, aqua: {…} } satisfies Record<string, ShowcaseTheme>

// ✅ features/profile/CV/…/AchievementBlockEditor/index.tsx — check object literal đúng shape khi build
onChange({ ...block, items } satisfies CvBlock)

// ❌ } as Record<string, ShowcaseTheme>   // hết check thừa/thiếu key, mất luôn literal key
```

## 5. Generics + infer vs annotate

- Shape tái dùng → generic, KHÔNG copy-paste interface: `WithClassNames<T>` là mẫu chuẩn ([[props-and-types]] §1).
- **Boundary công khai annotate, local để TS suy**:
  - Hook/hàm export: annotate return type tường minh — `export const useSystemHealthPoll = (): UseSystemHealthPollResult =>`.
  - Data-fetch generic tại điểm gọi khi TS không suy được: `useSWR<HealthByName>(…)`.
  - `const` local trong body: để infer (`const trimmed = body.trim()`), KHÔNG annotate thừa.
- Cần "kiểu của kết quả hàm" → derive, không chép tay: `type MutateAddToCartResult = Awaited<ReturnType<typeof mutateAddToCart>>`.

## 6. `as const` + Record/mapped — KHÔNG index-signature lỏng

- Bảng hằng/tuple → `as const`, rồi **derive kiểu từ data** (1 nguồn sự thật):

```ts
// ✅ blocks/learn/EntityResultRow/index.tsx
const KIND_META = { content: {…}, code: {…}, challenge: {…}, … } as const
type KnownKind = keyof typeof KIND_META

// ✅ blocks/cards/GroupPressableCard/index.tsx
const STEP_ORDER = ["sm", "md", "lg", "xl", "xl3", "xl4"] as const
```

- Combo mạnh nhất cho map cấu hình: `as const satisfies Record<…>` — literal ĐƯỢC giữ VÀ shape ĐƯỢC check:

```ts
// ✅ blocks/stats/ProgressRing/index.tsx
const SIZE_MAP = {
    sm: { ring: "size-16", label: "body-sm" }, …
} as const satisfies Record<"sm" | "md" | "lg", { ring: string; label: "body-sm" | "body" | "h5" }>
```

- Key đã biết miền → `Record<UnionKey, V>` chứ KHÔNG `{ [key: string]: V }`: `type HealthByName = Record<string, SystemHealthComponent>` (value có kiểu thật). ❌ `[key: string]: any` = cấm tuyệt đối.

## 7. Boundary công khai = kiểu tường minh

- Props interface export + JSDoc từng prop ([[props-and-types]] §2), hook export annotate return-shape interface riêng (mẫu: `UseSystemHealthPollResult`), helper export annotate return (`const metaForKind = (kind: string): (typeof KIND_META)[KnownKind] =>`).
- Chỉ hàm/const **nội bộ file** mới được thả cho infer toàn phần.
