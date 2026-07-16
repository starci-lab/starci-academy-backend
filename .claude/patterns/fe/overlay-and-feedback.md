# Overlay & Feedback — cách VIẾT code (không phải design)

Phạm vi: cách gọi/mở-đóng overlay (modal · drawer · alert-dialog) và cách bắn feedback (toast) trong app FE — idiom code THẬT của repo, không bàn hình hài/spacing (đó là việc của `.claude/fe`).

---

## 1. Mở/đóng overlay = overlay store, KHÔNG useState cục bộ

Mỗi overlay toàn cục có 1 key trong `OverlayKey` + 1 accessor `useXxxOverlayState()`. Component KHÔNG tự giữ `useState(false)` cho modal/drawer của mình — lấy `{ isOpen, setOpen, open, close }` từ hook.

✅ ĐÚNG — `src/components/modals/LanguageModal/index.tsx`
```tsx
const { isOpen, setOpen } = useLanguageOverlayState()
return <ModalShell isOpen={isOpen} onOpenChange={setOpen} title={t("settings.language.title")}>
```

❌ SAI — tự quản lý state cho một overlay toàn cục
```tsx
const [isOpen, setIsOpen] = useState(false) // không nối được với nút mở ở nơi khác
```

Thêm overlay mới = thêm key vào CẢ HAI: union `OverlayKey` và mảng `OVERLAY_KEYS` (`src/hooks/zustand/overlay/store.ts`), rồi export accessor trong `hooks.ts`. Bỏ 1 chỗ → store lệch.

---

## 2. Overlay cần payload → override `open(payload)` trong accessor, KHÔNG prop drilling

Overlay được mount 1 lần trong `ModalContainer`/`DrawerContainer` (không nhận props), nên dữ liệu vào modal đi qua store: stash context rồi mở. Accessor override `open` để nhận payload.

✅ ĐÚNG — `src/hooks/zustand/overlay/hooks.ts` (`usePaymentOverlayState`)
```tsx
const open = useCallback((next: PaymentContext) => {
    setPaymentContext(next)
    openOverlay("payment")
}, [setPaymentContext, openOverlay])
return { ...base, open, context }
```
Caller: `openPayment({ flow: PaymentFlow.CoursesCheckout, courseIds, lines })` (`MiniCartDrawer`). Modal đọc `context` từ chính hook.

Cùng khuôn: `useAdModalOverlayState`, `useCvPreviewOverlayState`, `useFollowListOverlayState`. Đừng truyền payload xuống modal qua props — modal không có chỗ nhận.

---

## 3. Mở overlay ngoài React → `useOverlayStore.getState()`, chỉ khi thật sự ngoài component

Trong component/hook LUÔN dùng accessor. Chỉ code chạy ngoài cây React (Apollo link, util thuần) mới gọi `getState()`.

✅ ĐÚNG — `src/modules/api/graphql/clients/links/error.ts` (Apollo ErrorLink)
```tsx
useOverlayStore.getState().openOverlay("maintenance")
```

❌ SAI — dùng `getState()` trong component (bỏ mất subscription, không re-render)
```tsx
const onClick = () => useOverlayStore.getState().openOverlay("payment") // dùng usePaymentOverlayState().open thay vào
```

---

## 4. Modal chuẩn = `ModalShell`, KHÔNG hand-roll cây `<Modal>`

Modal thường (close-trigger + header + body) dựng bằng `ModalShell` (`src/components/blocks/layout/ModalShell`), truyền `isOpen`/`onOpenChange` + `title`/`description` (hoặc `header` tuỳ biến). Không tự viết `Modal > Backdrop > Container > Dialog`.

✅ ĐÚNG — `src/components/modals/LanguageModal/index.tsx`
```tsx
<ModalShell isOpen={isOpen} onOpenChange={setOpen} title={t("settings.language.title")}>
    <div className="flex flex-col gap-6">…</div>
</ModalShell>
```

Ngoại lệ (có docstring cho phép): shape phi chuẩn — không close-trigger, backdrop tuỳ biến — mới giữ cây `<Modal>` tự dựng. Body dài → `scroll="inside"` (ShellShell tự thêm `max-h-[85vh]`), đừng tự set max-height.

---

## 5. Drawer = cây `Drawer.*` tay (chưa có DrawerShell), giữ đúng thứ tự phần tử

Repo CHƯA có block DrawerShell tương đương ModalShell → drawer dựng cây `Drawer` trực tiếp, nhưng vẫn lấy open-state từ overlay hook và theo đúng khung `Backdrop > Content > Dialog > (Header/Body/Footer)`.

✅ ĐÚNG — `src/components/drawers/MiniCartDrawer/index.tsx`
```tsx
const { isOpen, setOpen } = useMiniCartOverlayState()
<Drawer>
  <Drawer.Backdrop isOpen={isOpen} onOpenChange={setOpen} className="backdrop-blur-sm">
    <Drawer.Content placement={isMobile ? "bottom" : "right"}>
      <Drawer.Dialog>… <Drawer.CloseTrigger /> <Drawer.Header/> <Drawer.Body/> <Drawer.Footer/> …</Drawer.Dialog>
```

`isOpen`/`onOpenChange` đặt trên `Drawer.Backdrop` (khác Modal đặt trên `<Modal>` gốc) — đúng API HeroUI, đừng đổi chỗ.

---

## 6. Xác nhận hành động phá huỷ = `ConfirmDialog`, confirm KHÔNG tự đóng

Việc irreversible (huỷ ghi danh, xoá bài nộp) dùng block `ConfirmDialog` (`src/components/blocks/feedback/ConfirmDialog`) trên nền `AlertDialog` — KHÔNG `window.confirm`, KHÔNG tự dựng `AlertDialog`. Nút confirm KHÔNG tự đóng dialog: `onConfirm` chạy action, caller đóng qua `onOpenChange` (giữ mở khi `isConfirming`).

✅ ĐÚNG — hợp đồng của block (`ConfirmDialog/index.tsx`)
```tsx
<ConfirmDialog isOpen={isOpen} onOpenChange={setOpen} tone="danger"
  title="Xoá bài nộp này?" confirmLabel="Xoá bài nộp"
  isConfirming={isPending} onConfirm={handleDelete} />
```
`tone="danger"` cho action xoá/undo (nút danger + icon danger); benign → để mặc định `"default"`.

❌ SAI
```tsx
if (window.confirm("Chắc chưa?")) handleDelete() // dùng ConfirmDialog
```

---

## 7. Toast: import từ `@/modules/toast/toast`, KHÔNG từ `@heroui/react`

Bắn toast trạng thái qua wrapper app (`toast.success|danger|warning|info`) — nó tự chèn Phosphor indicator chuẩn. Import trực tiếp `toast` của HeroUI là sai (mất indicator canonical).

✅ ĐÚNG — `src/components/features/profile/CvSubmission/index.tsx`
```tsx
import { toast } from "@/modules/toast/toast"
toast.danger(t("uploadError"))
```

❌ SAI
```tsx
import { toast } from "@heroui/react" // bỏ qua wrapper, indicator không đồng nhất
```

---

## 8. Toast quanh mutation/write = `useGraphQLWithToast` / `useRestWithToast`, KHÔNG toast tay

Mọi GraphQL write / REST write bọc trong runner có sẵn để toast success/error + i18n tự động; runner trả `boolean`/`T|null` để rẽ nhánh. Chỉ toast tay (mục 7) cho feedback lẻ ngoài response (validate client, lỗi đọc file…).

✅ ĐÚNG — `src/components/features/cart/hooks/useCart.ts`, `.../community/CommunityComposer/index.tsx`
```tsx
const runGraphQL = useGraphQLWithToast()
const ok = await runGraphQL(() => mutateSomething(request))
if (ok) { … }
```
REST/upload: `const runRest = useRestWithToast()` → `runRest(() => axios.put(presignedUrl, file))`.

❌ SAI — tự try/catch rồi `toast.success/danger` quanh 1 mutation (lặp lại logic runner + dễ quên i18n/unauthorized)

Muốn tắt toast 1 nhánh: `runGraphQL(action, { showSuccessToast: false })`; đổi copy success: `{ successMessage }`. Đừng viết lại vòng try/catch.
