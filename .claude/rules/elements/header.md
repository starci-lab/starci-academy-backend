# Element — Header (block `PageHeader`)

> Element doc cho Page/Section Header. Mọi trang content/settings/learn dùng block `blocks/layout/PageHeader`, KHÔNG tự dựng header bằng `Typography` tay.

## 1. Cấu trúc PageHeader (4 slot)
- Block `blocks/layout/PageHeader` — tier-3 presentational, mọi thứ qua props:
  - **`breadcrumb`** (slot trên cùng) — `<Breadcrumbs>` / `LearnBreadcrumb` / `SettingsBreadcrumb`, HOẶC **back-link** cho trang leaf (xem §3).
  - **`title`** — `Typography.Heading level={3}` (H3, KHÔNG H1/H2/H4). Đồng bộ MỌI header.
  - **`description`** — `body-sm muted`, dưới title (cặp title↔desc = `gap-2`).
  - **`meta`** — hàng chip/stat dưới title-block (vd `HighlightChip` "24 Module · 87 Nội dung", hoặc chips điểm/độ khó/trạng thái).
  - **`actions`** — slot phải (`shrink-0`). Để dành cho **CTA CHÍNH của trang**, KHÔNG cho thao tác PHỤ (vd nút refresh/làm-mới của 1 board) — thao tác phụ đặt trong toolbar của chính khối đó, không tranh chỗ ngang tiêu đề trang.
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
- **Back-link = block `blocks/navigation/BackLink`, KHÔNG hand-roll `<Link>` + class tay** (1 element = 1 component — [[single-source-render]]). API `{ label?, target?, onPress, className? }`: omit hết → **"Trở lại"** (`common.goBack`); `target` → **"Trở lại {target}"** (`common.goBackTo`); `label` = override trọn nhãn (nhãn legacy "Quay lại thử thách"…). Da (block sở hữu): `Link group ... gap-2 text-sm text-muted no-underline hover:text-foreground` + `ArrowLeftIcon size-5` + label. Hover = **arrow TRƯỢT TRÁI** (`group-hover:-translate-x-1`) + **label UNDERLINE** (`group-hover:underline`, mode go-there — [[hover-style-matches-clickable-nature]]). KHÔNG text-accent (back không thuộc 4 vai accent — [[concepts/accent-system]]), KHÔNG pill/Button, KHÔNG action-button bên phải.
- **View edit/compose (leaf "làm-1-việc") → back-link THAY luôn title + breadcrumb:** xóa Label/title thừa (form tự nói nó là gì), 1 affordance lùi duy nhất, nhãn generic "Trở lại".
- Trang ĐỌC/duyệt (`/learn/*`, settings) → breadcrumb-chain thật (`LearnBreadcrumb` / `SettingsBreadcrumb`, DRY — chỉ truyền `current`). Ref [[header-gap2-and-breadcrumb-everywhere]] + [[settings-pages-breadcrumb-and-pageheader]].
- **SUB-VIEW của 1 tab (không phải leaf-solve) → thêm crumb TRUNG GIAN clickable, KHÔNG back-link riêng.** Khi 1 tab có sub-view (vd bộ thẻ dưới "Ôn tập"): breadcrumb = `… › <tab>(clickable→overview) › <tên sub-view>`. Crumb `<tab>` click được CHÍNH LÀ đường lùi → **bỏ "← Tổng quan"** (1 affordance lùi, ref [[leaf-page-one-nav-and-combined-tab-toolbar]]). `LearnBreadcrumb` có prop **`section={{label,onPress}}`** chèn crumb giữa course↔current (chỉ khi có `current`). Khác back-link của leaf-SOLVE (§3): leaf solve dùng back-link vì chain generic dừng giữa chừng; sub-view của tab thì chain ĐỦ nghĩa (tab→sub) nên dùng chain.
- Canvas full-bleed (mind-map) = NGOẠI LỆ: KHÔNG header/breadcrumb (ref [[fullbleed-canvas-no-chrome-and-orient-zoom]]).

## 4. Đã áp (mọi trang dùng PageHeader)
- Landing course (CourseHero) · learn CourseContents · Foundations (topic-list + resource-list, breadcrumb vào slot) · settings (5 trang) · ChallengeView (back-link breadcrumb + title + description + chips meta) · SubmissionResult (back-link breadcrumb + requirement title).
- **Lesson reader** (`LessonReader/ContentHeader`): breadcrumb `ResponsiveBreadcrumb` (Home › Courses › `<course>` › Học phần) vào **slot `breadcrumb` của PageHeader** + title + description + meta chips (Đã đọc · phút · thử thách) + outcomes (CheckListCard). **Breadcrumb KHÔNG còn render riêng ở route layout** (`content/modules/layout.tsx` chỉ pass children) — gom vào PageHeader để header là 1 đơn vị (thầy chốt 2026-06-25: *"chuyển ResponsiveBreadcrumb vào PageHeader"*). Nguyên tắc: breadcrumb của trang ĐỌC sống TRONG PageHeader slot, KHÔNG là 1 hàng nav rời ở layout.
- Meta chips = block `HighlightChip` (value+label tách), KHÔNG raw `<Chip>` i18n gộp.
- **MỌI trang `/profile/settings/*` (CHỐT 2026-06-25): `SettingsBreadcrumb` nằm TRONG `breadcrumb` slot của PageHeader, KHÔNG để là 1 hàng rời sibling.** Trước đó settings để `<SettingsBreadcrumb/>` SIBLING của PageHeader trong `<div gap-6>` → breadcrumb↔header = **gap-6** (sai); learn để breadcrumb VÀO slot → breadcrumb↔header = **gap-3** (outer của PageHeader = gap-3). Thầy chỉ ra lệch → sửa 13 trang settings về đúng khuôn §2: `<div gap-10><PageHeader breadcrumb={<SettingsBreadcrumb/>} title desc/><div gap-6>{content}</div></div>`. Trang multi-section (form EditProfile, Security, AiUsage, Bookmarks, LearningHistory) BẮT BUỘC bọc content trong `<div gap-6>` (nếu không, outer gap-10 giãn MỌI field/section 40px — vỡ form); trang single-block (1 AsyncContent/grid) không cần bọc (header→content = gap-10 tự đúng). Nguyên tắc: breadcrumb của trang ĐỌC/settings sống TRONG PageHeader slot (1 đơn vị header), KHÔNG là hàng nav rời → breadcrumb↔header tự = gap-3.

## 5. MODAL header ≠ Page header — `Typography body semibold` + `pr-8` (CHỐT 2026-06-25)
- **Tiêu đề MODAL KHÔNG dùng `Typography.Heading level={3}` (H3 của PAGE header).** Modal là surface nhỏ → title nhỏ hơn page. Chuẩn (theo PaymentModal/PremiumGateModal đã polish): `<Modal.Header><Typography type="body" weight="semibold" className="pr-8">{title}</Typography></Modal.Header>`.
  - `type="body"` (16px) `weight="semibold"` — KHÔNG H3 (to/đậm quá cho modal).
  - **`pr-8` BẮT BUỘC** — chừa chỗ cho `Modal.CloseTrigger` (nút X góc phải, absolute) để title dài không đè lên X.
  - **KHÔNG icon ở `Modal.Header` — chỉ TEXT title (CHỐT 2026-06-25).** Header modal là 1 dòng tiêu đề thuần, không leading icon. PaymentModal/PremiumGateModal header chỉ có `<Typography>` text. Cần icon nhận diện (logo GitHub, cover khóa…) → đặt trong **BODY** (vd `IconTile` cover ở đầu body như PaymentModal summary), KHÔNG ở header. (Vd `GithubTeamGate` cũ để `<GithubIcon/>` cạnh title ở header → bỏ; chuyển identity xuống body.)
- Phân biệt: **PageHeader** (trang) = H3 (§1); **Modal header** = body semibold + pr-8. Đừng bê H3 vào modal. KHÔNG tự chế `text-2xl`/`text-lg` lẻ (ShareModal/AiQuota cũ lệch) — về 1 chuẩn body-semibold.
- Áp 2026-06-25: `ManagePinnedProjectsModal` đổi `Typography.Heading level={3}` → `Typography body semibold pr-8`. (Quét các modal `text-2xl`/`text-lg`/H3 lẻ khi đụng → chuẩn hoá.)

## Liên quan
- [[gap]] (gap-10 header→content) · [[three-tier-page-layout]] · [[elements/card]] (content cluster cards) · [[leaf-page-one-nav-and-combined-tab-toolbar]] (back-link vs breadcrumb) · [[modal-body-no-padding-override-heroui-idiom]] (modal gutter/padding) · [[modal-header-tabs-indicator]] (tabs cần Indicator).
