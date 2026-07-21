# Layout — Mô hình VÙNG (region model): shell + từ vựng vùng của StarCi

> Đặt 1 component/feature mới = **gọi tên VÙNG nó thuộc về TRƯỚC**, rồi mới style. Vùng = building-block của layout,
> mỗi vùng tự sở hữu padding/sticky/width ([Calcite Shell](https://developers.arcgis.com/calcite-design-system/foundations/layouts/) · [Fluent 2 layout](https://fluent2.microsoft.design/layout)).

## Shell thật (grounded)
| Shell | Vùng | Nguồn |
|---|---|---|
| **InnerLayout** (global, bọc MỌI trang) | navbar `h-16` (sticky) · ambient bg · content · footer (CHỈ landing) · overlay containers (modal/drawer) · TopLoader | `src/app/InnerLayout.tsx` |
| **LearnShell** (docs 4-cột) | icon-rail (`LearnSidebar`) · content-rail trái (`leftRail`, ResizableRail) · reading-col (`p-6`, owns measure) · on-this-page phải (`rightRail`, TOC) · `fullBleed` opt-out | `features/learn/LearnShell` + `learn/layout.tsx` |
| **SettingsLayout** (2-pane manage) | collapsible-rail (`CollapsibleSidebar`, sticky) · content-col centered | `features/profile/Settings/SettingsLayout` |
| **PageContainer** | 1 cột centered `max-w-*` gutter | `blocks/layout/PageContainer` |

## Từ vựng vùng (đặt component vào đúng vùng)
- **navbar** (trên, `h-16`) + **navbar-bottom-layer** (tab-strip dính dưới navbar — dashboard/profile, `useRegisterNavbarBottomLayer`).
- **icon-rail** (điều hướng surface, mảnh, `lg+`) · **content-rail** (cây/list nội dung, trái) · **reading-col** (nội dung chính, sở hữu measure `max-w-3xl`) · **on-this-page** (TOC phải).
- **CTA-anchor** (primary action — hero/sticky) · **bottom-bar** (`StickyBottomBar`, mobile enroll) · **workspace-pane** (full-bleed 2-pane, [[full-bleed-work-surface]]).

## Quy tắc
- **1 component mới → hỏi "vùng nào?"**: nav toàn cục → navbar/bottom-layer · duyệt list → content-rail · nội dung chính → reading-col · phụ theo ngữ cảnh → on-this-page · hành động chính → CTA-anchor · tool khi solve → workspace-pane.
- **Vùng sở hữu chrome của nó**: reading-col owns `p-6` + measure ([[three-tier-page-layout]] — cột đọc narrow `max-w-3xl mx-auto`); rail owns sticky + width; feature KHÔNG tự khai padding cột (LearnShell lo — xem `components/sidebar`).
- **Đo bằng cột, không nhét max-width vào renderer** (measure là việc của reading-col, không của MarkdownContent).
- **KHÔNG "mồ côi" width/max-width (STRICT):** 1 vùng/con ĐÃ sống trong 1 container đã có measure (từ tổ tiên — reading-col/shell/card) → **KHÔNG tự áp thêm `max-w-*`/`w-<fixed>` hẹp hơn** trừ lý do thiết kế THẬT (vd cột chat full-bleed cố ý giới hạn measure đọc). Double-constraint (con hẹp hơn cha đã hẹp) tạo cạnh LỆCH giữa các pha/section cùng 1 trang — nhìn "xộc xệch", khó chịu thị giác. Test nhanh: 2 khối XẾP DỌC cùng 1 cột (vd header trên + card dưới) phải **cùng 1 mép trái/phải**; 1 field NẰM TRONG 1 hàng full-width (dropdown cạnh caption) → field đó `w-full`, KHÔNG cap fixed (`w-72`) trong khi hàng chứa nó đã full-width — control méo/lọt thỏm giữa khoảng trống thừa.
  - **Áp đầu (2026-07-08) — MockInterview:** (1) pha `setup`/`grading`/`scorecard` tự áp `max-w-2xl` (672px) trong khi parent (`MockInterview/index.tsx`) đã `max-w-3xl` (768px) → hẹp hơn PageHeader phía trên nó → bỏ cap con, dùng `w-full` kế thừa measure cha. (2) `GradeModelDropdown` cap `sm:w-72` trong khi hàng chứa nó `flex flex-wrap` full-width, các field khác (tier picker) đã full-width → bỏ cap, `w-full`. **Ngoại lệ giữ nguyên:** cột hội thoại lúc `interview` LIVE (full-bleed, không có "cha" nào để đo theo) vẫn giữ `max-w-2xl` cố ý — bỏ cap ở đây sẽ làm dòng chat giãn hết viewport, hại đọc (đúng tinh thần "đo bằng cột" ở trên, không phải ngoại lệ của luật này).

## Liên quan
[[page-shell-selection]] · [[surface-job-drives-layout]] · [[responsive-regions]] · `components/sidebar` (rail/shell blocks) · `components/header` (PageHeader vùng) · `foundations/gap` · `foundations/sticky` · `foundations/breakpoints`.
