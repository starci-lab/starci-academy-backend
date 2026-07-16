# React/TSX idioms — STRICT

## 1. Phân tầng: block THUẦN vs feature CÓ DATA

- **`components/blocks/**` = presentational, props-only.** KHÔNG `useSWR`, KHÔNG zustand, KHÔNG `useTranslations` — caller đưa hết text + data qua props (mẫu: `UserCell` — "Pure and props-only — no store or data access"). Text hiển thị của block = prop `ReactNode`/`string`.
- **`components/features/**` (+ `modals/`, `drawers/`) = container.** Được gọi `useQueryXxxSwr`/`useMutateXxxSwr`, `useXxxOverlayState`, `useTranslations()` với key đầy đủ `t("dashboard.adModalTitle")`.
- ❌ Block gọi SWR = sai tầng (repo chỉ còn 1 file lệch `blocks/learn/RelatedContentList` — đừng nhân bản).
- ❌ Hardcode chuỗi UI tiếng Việt/Anh trong feature — mọi chuỗi qua `t("…")` (messages `src/messages/{vi,en}.json`).

## 2. Không hand-roll primitive

- Button/Modal/Tabs/Select/Card/Chip/Typography/Spinner… = **`@heroui/react`** hoặc block canon đã có (`ModalShell`, `AsyncContent`, `UserAvatar`, `ExtendedTabs`…). Grep `src/components/blocks` trước khi viết mới.
- ❌ `<div onClick>` giả button (jsx-a11y bắt) · ❌ tự vẽ modal bằng fixed-div · ❌ copy component gần giống thay vì tái dùng (→ consolidate).
- Text luôn qua `<Typography type="body-sm" color="muted" truncate>` chứ không `<p className="text-sm text-gray-500">`.

## 3. Overlay (modal/drawer) — zustand registry, KHÔNG useState cục bộ

- Mỗi overlay có key trong `OverlayKey` (`hooks/zustand/overlay/store.ts`) + accessor `useXxxOverlayState()` trong `hooks.ts`.
- Modal component pattern (mẫu thật `AdModal`):

```tsx
export const AdModal = ({ className }: WithClassNames<undefined>) => {
    const t = useTranslations()
    const { isOpen, setOpen, context } = useAdModalOverlayState()
    if (!context) {
        return null            // guard sớm, không render vỏ rỗng
    }
    return (
        <ModalShell isOpen={isOpen} onOpenChange={setOpen} className={className} title={t("…")}>
            …
        </ModalShell>
    )
}
```

- Thêm overlay mới = thêm key vào `OverlayKey` + `OVERLAY_KEYS` + accessor — KHÔNG chế store riêng.

## 4. Render idiom

- Conditional: `x ? <… /> : null` — KHÔNG `x && <… />` cho giá trị có thể là `0`/`""`; repo dùng `? :` + `: null` nhất quán (`trailing ? <div>…</div> : null`).
- Guard sớm `return null` khi thiếu data (AdModal `if (!context) return null`).
- List: `.map()` với `key` = id ổn định (`item.key`), KHÔNG index trừ khi list tĩnh thật.
- Helper render trong component = arrow const có JSDoc (`renderGroup`, `renderSelect` trong TabsCard), KHÔNG tách component mới nếu chỉ dùng nội bộ 1 chỗ.
- Comment giải thích QUYẾT ĐỊNH (tại sao sr-only, tại sao suppress indicator…) đặt ngay JSX bằng `{/* … */}` — repo coi comment ngữ cảnh là bắt buộc cho hành vi không hiển nhiên.

## 5. className merge

- Root: `className={cn("flex min-w-0 items-center gap-2", className)}` — base trước, prop sau. `cn` từ `@heroui/react`.
- Điều kiện: `cn(variant === "secondary" && TAB_CLASS_ACCENT, size === "sm" && TAB_SIZE_SM, item.muted && "text-muted")`.
- Chuỗi class dài/tái dùng → hằng SCREAMING_SNAKE module-level có JSDoc (`TAB_CLASS_NEUTRAL`).

## 6. SWR hook pattern (file mới copy đúng khung)

```ts
// queries/useQueryXxxSwr.ts — KHÔNG "use client"
export const useQueryXxxSwr = (request?: XxxRequest) => {
    return useSWR(
        ["QUERY_XXX_SWR", request?.param ?? null],   // key mảng: TÊN + mọi param (null-normalized)
        async () => {
            const data = await queryXxx({ request })
            return data.data?.xxx?.data ?? null       // unwrap tại hook, caller nhận data sạch
        },
    )
}

// mutations/useMutateXxxSwr.ts
export const useMutateXxxSwr = () => {
    const swr = useSWRMutation<Result, Error, string, XxxRequest>(
        "MUTATE_XXX_SWR",
        async (_key, { arg }) => mutateXxx({ request: arg }),
    )
    return swr
}
```

- Gọi API thô nằm ở `@/modules/api/…` — hook CHỈ wrap SWR, không fetch tay, không axios trong component.

## 7. RHF form hook (mẫu `useContactForm`)

- `"use client"` + `useForm` + `zodResolver`; schema trong `useMemo(() => z.object({…}), [t])` để message i18n; max-length = hằng SCREAMING_SNAKE đầu file; submit qua `useMutateXxxSwr` + `useGraphQLWithToast`; export values interface JSDoc đủ.

## 8. Callback ổn định

- Handler truyền xuống store-bound: bọc `useCallback` với deps đúng (mẫu `useOverlayHandle`). `react-hooks/exhaustive-deps` đang off — TỰ chịu trách nhiệm deps, đừng ỷ lint.

## 9. Exception/error

- Async UI: mọi vùng data-backed đi qua `AsyncContent` (error → loading → empty → content). KHÔNG tự if-else 4 nhánh tay ngoài wrapper này.
