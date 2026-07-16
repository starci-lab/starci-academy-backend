# Code-style: Zustand state management

Phạm vi: cách VIẾT store zustand trong app FE (đặt store ở đâu, đọc bằng selector, không prop-drill, mẫu overlay/cart). Ground 100% từ `src/hooks/zustand/**` và consumer thật. Đây là rule viết code, không phải design.

---

## 1. Store sống ở `hooks/zustand/<feature>/store.ts`, export `use<Feature>Store`

Mỗi cross-cutting state = 1 folder trong `src/hooks/zustand/`, file `store.ts`, hook đặt tên `use<Feature>Store`. Dòng đầu file LUÔN `"use client"`. Không tạo store rải rác trong component.

✅ ĐÚNG — `src/hooks/zustand/dashboardTab/store.ts`
```ts
"use client"
import { create } from "zustand"

export const useDashboardTabStore = create<DashboardTabStoreState>((set) => ({
    tab: "overview",
    setTab: (tab) => set({ tab }),
}))
```

❌ SAI — quên `"use client"`, đặt store lẻ cạnh component, hoặc tên không theo `use…Store`.

Ngoại lệ hợp lệ: store bám 1 feature con để colocate được đặt cạnh feature đó (`src/components/features/learn/ContentAiSelectionAsk/hintStore.ts`, `src/hooks/socketio/connectionStore.ts`) — vẫn giữ `"use client"` + `create<T>` + tên `use…Store`.

---

## 2. State + actions trong CÙNG 1 interface `XxxStoreState`; JSDoc mọi field

Một interface `XxxStoreState` gộp cả field dữ liệu lẫn action; `create<XxxStoreState>(...)` truyền generic tường minh. Mỗi field/action có JSDoc `/** … */` một dòng.

✅ ĐÚNG — `src/hooks/zustand/dashboardTab/store.ts`
```ts
interface DashboardTabStoreState {
    /** Currently open tab (drives the panel switch). */
    tab: DashboardTab
    /** Select a tab. */
    setTab: (tab: DashboardTab) => void
}
```

❌ SAI — tách state và actions thành 2 type rời, hoặc `create()` không generic (mất type an toàn).

---

## 3. Consumer đọc bằng SELECTOR HẸP, mỗi giá trị 1 selector

Trong component/hook, subscribe từng mẩu qua `useStore((state) => state.x)` — mỗi field/action một dòng — để chỉ re-render khi đúng mẩu đó đổi. Tên tham số chuẩn là `state` (biến thể `s` có tồn tại nhưng `state` là idiom trội).

✅ ĐÚNG — `src/components/features/dashboard/hooks/useDashboardTabUrlSync.ts`
```ts
const tab = useDashboardTabStore((state) => state.tab)
const setTab = useDashboardTabStore((state) => state.setTab)
```

❌ TRÁNH — destructure cả store làm component re-render mọi khi BẤT KỲ field nào đổi:
```ts
const { tab, setTab } = useDashboardTabStore() // đọc cả state
```
Dạng destructure chỉ chấp nhận với store bé, ít field (vd `DashboardTabsBar/index.tsx`, `ProfileTabsBar/index.tsx`). Store nhiều field (overlay) BẮT BUỘC selector.

---

## 4. Store OWN state dùng chung → siblings đọc thẳng, KHÔNG prop-drill

State mà nhiều surface anh-em cùng cần (tab đang mở, badge giỏ hàng, overlay) đặt vào store; mỗi surface đọc trực tiếp thay vì kéo prop/callback qua nhiều tầng. Comment nêu rõ chủ đích "no prop-drilling".

✅ ĐÚNG — `src/hooks/zustand/dashboardTab/store.ts`
```ts
/** Owned here … so the tab strip and any jump-to-tab action drive the same
 * selection without prop-drilling. */
```
✅ ĐÚNG — `src/components/features/cart/hooks/useCart.ts`: "Any component reads this directly (no prop-drilling) so the navbar badge, course cards, and the cart page all stay in sync off one SWR cache."

❌ SAI — nhấc `tab`/`setTab` lên tổ tiên chung rồi truyền prop xuống từng cấp.

---

## 5. `set` — patch trực tiếp khi độc lập, `set((state) => …)` khi phụ thuộc state cũ

Ghi 1 field không phụ thuộc giá trị hiện tại: `set({ field })`. Cần state cũ (map, mảng, toggle, counter): `set((state) => …)` và spread bất biến. Muốn skip re-render khi không đổi: trả về CHÍNH `state`.

✅ ĐÚNG — `src/hooks/zustand/overlay/store.ts`
```ts
setPaymentContext: (context) => set({ paymentContext: context }),
toggleOverlay: (key) =>
    set((state) => ({ openMap: { ...state.openMap, [key]: !state.openMap[key] } })),
```
✅ ĐÚNG — no-op giữ nguyên state để không re-render, `src/hooks/socketio/connectionStore.ts`
```ts
setStatus: (ns, status) =>
    set((state) => {
        if (state.statuses[ns] === status) return state // same object → no re-render
        return { statuses: { ...state.statuses, [ns]: status } }
    }),
```

❌ SAI — mutate state cũ (`state.openMap[key] = true`) hoặc dùng `set((state)=>…)` cho ghi độc lập không cần thiết.

---

## 6. Form store: `initialState` object + `reset()`; `create<T>((set, get) => …)` khi action đọc state

Form dùng chung (giữ giá trị qua chuyển bước) tách `initialState` để `reset` reuse. Action cần đọc giá trị hiện tại (hydrate idempotent, commit) mới nhận `get` trong `(set, get) => …`.

✅ ĐÚNG — `src/hooks/zustand/signIn/store.ts`
```ts
const initialState = { email: "", password: "", otp: "", /* … */ }
export const useSignInStore = create<SignInStoreState>((set) => ({
    ...initialState,
    setValue: (field, value) => set({ [field]: value } as Partial<SignInStoreState>),
    reset: () => set({ ...initialState }),
}))
```
✅ ĐÚNG — cần `get`, `src/hooks/zustand/cookieConsent/store.ts`
```ts
export const useCookieConsentStore = create<CookieConsentStoreState>((set, get) => ({
    hydrate: () => { if (get().decided !== null) return; /* … */ },
}))
```

❌ SAI — inline lại toàn bộ giá trị mặc định ở cả state lẫn `reset` (lệch nhau), hoặc luôn khai `get` dù action không đọc state.

---

## 7. Nhiều overlay → 1 store `openMap` + accessor per-key trong `hooks.ts`

Toàn bộ modal/drawer/popover gộp vào `useOverlayStore` (một `openMap: Record<OverlayKey, boolean>`). Consumer KHÔNG chạm store trực tiếp; dùng accessor `useXxxOverlayState()` khai trong `hooks.ts` cạnh `store.ts`, mỗi accessor subscribe đúng key qua factory `useOverlayHandle(key)` và bọc action bằng `useCallback` để giữ identity.

✅ ĐÚNG — `src/hooks/zustand/overlay/hooks.ts`
```ts
const useOverlayHandle = (key: OverlayKey): OverlayStateHandle => {
    const isOpen = useOverlayStore((state) => state.openMap[key]) // chỉ key này
    const openOverlay = useOverlayStore((state) => state.openOverlay)
    const open = useCallback(() => openOverlay(key), [openOverlay, key])
    return { isOpen, /* … */ open }
}
export const useMiniCartOverlayState = () => useOverlayHandle("miniCart")
```
Overlay có payload override `open(context)`: stash context rồi mới `openOverlay` (vd `usePaymentOverlayState`, `useFollowListOverlayState`).

❌ SAI — mỗi modal một `useState`/store riêng, hoặc consumer đọc `useOverlayStore((s)=>s.openMap)` (subscribe cả map → re-render khi overlay khác đổi).

---

## 8. Ghi state từ NGOÀI React → `useStore.getState().action()`

Code không phải component (Apollo link, socket.io lifecycle) ghi store qua `useStore.getState().action(...)` — không subscribe, không hook.

✅ ĐÚNG — `src/hooks/socketio/useAiLabSocketIoLifecycle.ts`
```ts
useSocketConnectionStore.getState().setStatus("ai_lab", "connected")
```
✅ ĐÚNG — `src/hooks/zustand/overlay/hooks.ts` (JSDoc): mở overlay maintenance từ Apollo `ErrorLink` bằng `useOverlayStore.getState().openOverlay("maintenance")`.

❌ SAI — cố gọi hook `useStore(...)` ngoài thân component, hoặc truyền setter qua biến global tay.
