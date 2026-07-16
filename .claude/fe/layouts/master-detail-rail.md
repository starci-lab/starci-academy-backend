# Pattern — Master-detail rail (rail trái + work pane, URL-synced, route STANDALONE)

> Shell/route: `Practice` (`src/components/features/practice/index.tsx`, route `/practice`) — rail RESIZABLE (`ResizableRail`). `SettingsLayout` (`src/components/features/profile/Settings/SettingsLayout`, route `/profile/settings/*`) — rail COLLAPSIBLE fixed-width (`CollapsibleSidebar`). 2 biến thể cùng archetype.

## Khi nào dùng
- Route STANDALONE (KHÔNG có `LearnShell`) nhưng vẫn có 1 TRỤC NAV + list đủ dài (mode/topic list, danh sách trang settings) cần đứng cạnh 1 work pane. Khác [[docs-three-pane-reader]]: chỉ 2 pane (không có TOC pane thứ 3), và content TỰ khai `p-6` (không có shell nào lo hộ).

## Region map
1. **Rail** (trái, `hidden lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)]`) — 2 kiểu, chọn theo bản chất nav:
   - **Resizable** (`ResizableRail` + `storageKey`/`minWidth`/`maxWidth`) khi rail chứa nav ĐA DẠNG bề rộng (mode switch + topic list dài — `Practice`).
   - **Collapsible fixed** (`CollapsibleSidebar` + `SidebarNavGroup`/`SidebarNavItem`) khi rail là 1 MENU cố định (`SettingsLayout`) — thu về icon-only, persist `localStorage`.
2. **Work pane** (phải, `min-w-0 flex-1 p-6`) — `PageHeader` (breadcrumb+title) → nội dung. State pane (mode/topic đang xem) đọc từ URL (`usePracticeView`), KHÔNG local state rời khỏi rail.
3. **Mobile (`<lg`):** rail `hidden`; `Practice` fold thành chip-row (`PracticeMobileNav`); `Settings` fold thành hàng nav ngang cuộn (`overflow-x-auto`) sticky dưới navbar.

## Liên quan
[[when-rail]] · [[docs-three-pane-reader]] (biến thể 3-pane, sống trong `LearnShell`) · sidebar (component canon: `CollapsibleSidebar`/`ResizableRail`) · [[page-shell-selection]].
