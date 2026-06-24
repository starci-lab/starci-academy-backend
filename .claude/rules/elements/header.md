# Element — Header (block `PageHeader`)

> Element doc cho Page/Section Header. Mọi trang content/settings/learn dùng block `blocks/layout/PageHeader`, KHÔNG tự dựng header bằng `Typography` tay.

## 1. Cấu trúc PageHeader (4 slot)
- Block `blocks/layout/PageHeader` — tier-3 presentational, mọi thứ qua props:
  - **`breadcrumb`** (slot trên cùng) — `<Breadcrumbs>` / `LearnBreadcrumb` / `SettingsBreadcrumb`, HOẶC **back-link** cho trang leaf (xem §3).
  - **`title`** — `Typography.Heading level={3}` (H3, KHÔNG H1/H2/H4). Đồng bộ MỌI header.
  - **`description`** — `body-sm muted`, dưới title (cặp title↔desc = `gap-2`).
  - **`meta`** — hàng chip/stat dưới title-block (vd `HighlightChip` "24 Module · 87 Nội dung", hoặc chips điểm/độ khó/trạng thái).
  - **`actions`** — slot phải (`shrink-0`).
- Outer của PageHeader = `gap-3` (breadcrumb ↔ title-block ↔ meta); title↔desc bên trong = `gap-2`.

## 2. PageHeader là TIER HEADER RIÊNG — gap-10 xuống content (STRICT)
- **PageHeader LUÔN đứng riêng. Khoảng dưới nó = `gap-10`** (header → content). TUYỆT ĐỐI KHÔNG gộp PageHeader chung 1 wrapper với block nội dung đầu tiên (continue/progress/list/section…).
- Khuôn chuẩn mọi trang dùng PageHeader:
  ```
  <div className="mx-auto flex max-w-3xl flex-col gap-10">   ← header → content
    <PageHeader breadcrumb title description meta? />        ← tier header (đứng riêng)
    <div className="flex flex-col gap-6">                    ← content cluster
      <section/> <section/> ...                              ← section ↔ section = gap-6
    </div>
  </div>
  ```
- **Đính chính `course-home-vertical-rhythm-gap3` (bản cũ):** bỏ "vùng A = breadcrumb+title+continue gap-3". PageHeader tách hẳn; continue/progress là CONTENT (trong cluster gap-6). `gap-3` chỉ dùng TRONG 1 block. Ref [[gap]] (gap-10 = ngoại lệ có tên: header→content).
- **Bug điển hình (đã sửa CourseContents):** gộp `<div gap-10>[<div gap-3>{PageHeader+continue}</div>, path]` → gap-10 rớt xuống continue↔path thay vì header↔continue. Sửa: PageHeader = direct child gap-10; bọc continue+path trong `<div gap-6>`.

## 3. Slot `breadcrumb` = BACK-LINK cho trang LEAF (solve / result)
- Trang **leaf "giải/làm/xem-kết-quả 1 item"** (challenge solve, submission result…) KHÔNG dùng breadcrumb-chain (chain generic dừng giữa chừng = vô nghĩa) → đặt **1 back-link vào slot `breadcrumb`** (vd "← Quay lại bài học" / "← Quay lại thử thách"). 1 affordance điều hướng-lùi duy nhất (ref [[leaf-page-one-nav-and-combined-tab-toolbar]]). Gate khi có `onBack`.
- Trang ĐỌC/duyệt (`/learn/*`, settings) → breadcrumb-chain thật (`LearnBreadcrumb` / `SettingsBreadcrumb`, DRY — chỉ truyền `current`). Ref [[header-gap2-and-breadcrumb-everywhere]] + [[settings-pages-breadcrumb-and-pageheader]].
- **SUB-VIEW của 1 tab (không phải leaf-solve) → thêm crumb TRUNG GIAN clickable, KHÔNG back-link riêng.** Khi 1 tab có sub-view (vd bộ thẻ dưới "Ôn tập"): breadcrumb = `… › <tab>(clickable→overview) › <tên sub-view>`. Crumb `<tab>` click được CHÍNH LÀ đường lùi → **bỏ "← Tổng quan"** (1 affordance lùi, ref [[leaf-page-one-nav-and-combined-tab-toolbar]]). `LearnBreadcrumb` có prop **`section={{label,onPress}}`** chèn crumb giữa course↔current (chỉ khi có `current`). Khác back-link của leaf-SOLVE (§3): leaf solve dùng back-link vì chain generic dừng giữa chừng; sub-view của tab thì chain ĐỦ nghĩa (tab→sub) nên dùng chain.
- Canvas full-bleed (mind-map) = NGOẠI LỆ: KHÔNG header/breadcrumb (ref [[fullbleed-canvas-no-chrome-and-orient-zoom]]).

## 4. Đã áp (mọi trang dùng PageHeader)
- Landing course (CourseHero) · learn CourseContents · Foundations (topic-list + resource-list, breadcrumb vào slot) · settings (5 trang) · ChallengeView (back-link breadcrumb + title + description + chips meta) · SubmissionResult (back-link breadcrumb + requirement title).
- **Lesson reader** (`LessonReader/ContentHeader`): breadcrumb `ResponsiveBreadcrumb` (Home › Courses › `<course>` › Học phần) vào **slot `breadcrumb` của PageHeader** + title + description + meta chips (Đã đọc · phút · thử thách) + outcomes (CheckListCard). **Breadcrumb KHÔNG còn render riêng ở route layout** (`content/modules/layout.tsx` chỉ pass children) — gom vào PageHeader để header là 1 đơn vị (thầy chốt 2026-06-25: *"chuyển ResponsiveBreadcrumb vào PageHeader"*). Nguyên tắc: breadcrumb của trang ĐỌC sống TRONG PageHeader slot, KHÔNG là 1 hàng nav rời ở layout.
- Meta chips = block `HighlightChip` (value+label tách), KHÔNG raw `<Chip>` i18n gộp.

## Liên quan
- [[gap]] (gap-10 header→content) · [[three-tier-page-layout]] · [[elements/card]] (content cluster cards) · [[leaf-page-one-nav-and-combined-tab-toolbar]] (back-link vs breadcrumb).
