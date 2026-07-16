# Proposal — consolidate FE · batch 1 (top 3)

- **Status:** ⏳ PENDING · **scope:** all FE · **plan ngầm:** [consolidate-fe-all.plan.md](consolidate-fe-all.plan.md) · scan Haiku ×4 + Opus chốt 2026-07-07.
- Mỗi lần **3 cụm** (dễ duyệt). Apply xong → ✅ trong plan → re-scan lấy 3 tiếp.

## 1. `ModalShell` ⭐⭐⭐ (22/24 modal)
- **Trùng:** scaffold `Modal > Backdrop > Container > Dialog > CloseTrigger + Header + Body` copy-paste 22/24 modal; header typography (`Typography body semibold pr-8` / `text-2xl|lg bold centered`) lặp 12+.
- **Block đích:** NEW `blocks/.../ModalShell` — props `{ title?, headerVariant?: left|center, closeAction, size?, children }`, gói Backdrop/Container/Dialog/Close + header slot chuẩn. Modal chỉ còn truyền title + body.
- **Call-sites:** ~22 file `components/modals/*/index.tsx`.
- **Verify:** tsc/lint + preview 3-4 modal đại diện (open/close · header · body scroll).

## 2. `SimpleEmptyState` ⭐⭐ (learn, 3 identical)
- **Trùng:** `<p className="text-sm text-muted">{t(key)}</p>` y hệt, khác mỗi i18n key.
- **Block đích:** `SimpleEmptyState` wrap block `EmptyState` (props `{ children | i18nKey }`).
- **Call-sites:** `features/learn/.../LessonBodyEmpty` · `CodeExplainingEmpty` · `CodeImplementationEmpty`.
- **Verify:** preview 3 empty state.

## 3. `TierCardBase` ⭐⭐ (AiSubscription, 2 + footer)
- **Trùng:** `TierCard` & `FreeTierCard` chung Card.Content flex-col-gap-3 · icon+title row · desc `h-[2lh]` · price layout · **footer feature-list (`flex items-center gap-2` + `SealCheckIcon`) lặp 2x y hệt**.
- **Block đích:** NEW `TierCardBase` (props `{ isCurrent, icon, title, price, features[], cta }`) — 2 card compose từ đây.
- **Call-sites:** `profile/AiSubscription/TierGrid/TierCard` · `profile/AiSubscription/FreeTierCard`.
- **Verify:** preview trang AI subscription (current vs available tier).

## Files to touch
`components/modals/*` (~22) · new blocks `ModalShell`/`TierCardBase`/`SimpleEmptyState` · `features/learn/*Empty` (3) · `features/profile/AiSubscription/*` (2).

## Verify plan chung
`npx tsc --noEmit` + `npm run lint` sạch · preview mỗi cụm (modal mở/đóng, empty, tier cards) không vỡ.
