# Element — Sidebar / Navigation rail

> Canon cho **rail điều hướng** (side rail thu/giãn + nav rail nội dung + navbar trên). Gom các luật đang rải ở drafts (`rail-*`, `sticky-rail-*`, `learn-content-padding-shell-p6`, `settings-pages-breadcrumb`, `leaf-page-one-nav`, `navbar-bottomlayer`) thành 1 chỗ. Block: `blocks/navigation/CollapsibleSidebar` + `SidebarNavGroup` + `SidebarNavItem`; `blocks/layout/ResizableRail`; feature `Navbar`.

## 1. CollapsibleSidebar — rail thu/giãn (settings + learn icon-rail dùng CHUNG)
- **1 wrapper padding DUY NHẤT trên BOX**: `p-6` (expanded) · **`px-3 py-6` (collapsed)**. Header + rows + divider đều nằm TRONG padding này → đồng nhất, không tách padding ra từng phần.
- **`border-r border-separator` ĐẶT TRÊN BOX** (cùng element mang padding). Vì border ở mép box còn padding nằm trong → border-r **flush + full-height** (chạy từ đáy navbar xuống mép dưới), nội dung vẫn thụt vào theo padding. KHÔNG đặt border ở wrapper khác.
- **Box `overflow-hidden`** + width animate (framer spring, `reduce-motion` → duration 0): expanded `16rem`, collapsed `4rem`. Cờ collapsed **persist `localStorage`** (`storageKey`), hydrate sau mount (SSR-safe: start expanded rồi sync).
- **Nav list cuộn = HeroUI `ScrollShadow`** (`overflow-y-auto`, `hideScrollBar`) — **KHÔNG padding ngang trên ScrollShadow**. ⚠️ Gotcha: `overflow-y:auto` khiến `overflow-x` thành `auto` → **cắt mọi thứ tràn ngang** → negative-margin break-out (`-mx-*`) VÔ DỤNG ở đây. Đừng phá khung bằng `-mx`; để padding ở box, nội dung tự inset.
- **Collapsed = icon-only**: `SidebarCollapsedContext` cho row biết để bỏ label (giữ `aria-label`); title + caption ẩn.

## 2. SidebarNavGroup — cụm row + divider
- **Divider = HeroUI `Separator`** (`mb-3`), **full-width của vùng ĐÃ-PADDED** → tự **inset, THẲNG HÀNG với row** (không edge-to-edge, không chạm border-r). Không cần `w-full`/`-mx`/div thuần — Separator non-toolbar đã `width:100%` của container.
  - ⚠️ Nguyên tắc rút ra (bài học 2026-06-19): **"divider không full" của thầy = lệch/bất đối xứng** (do padding 1 phía), KHÔNG phải đòi kéo sát mép. Divider rail luôn **nằm trong padding, đối xứng, ngang row** — đừng tự suy "full = edge-to-edge".
- **Divider chỉ giữa các nhóm** (`divider={index > 0}`), không trước nhóm đầu.
- **Label nhóm = HeroUI `Header` BỌC NGOÀI `Typography body-xs muted`** (`<Header><Typography>…</Typography></Header>`, ẩn khi collapsed). KHÔNG uppercase (ref [[no-uppercase-text]]).
  - ⚠️ **`Header` (semantic `<header>`) NGOÀI, `Typography` (`<p>`) TRONG — KHÔNG lồng ngược.** `<p><header>` = HTML invalid → Next hydration error ("`<header>` cannot be a descendant of `<p>`"). Quy tắc chung: element block/landmark (`header`/`section`/`div`/`ul`) KHÔNG bao giờ là con của `<p>` → landmark bọc ngoài, Typography trong. (`Typography` KHÔNG nhận `elementType`/`as` để đổi tag → phải lồng đúng thứ tự.)

## 3. SidebarNavItem — 1 dòng nav
- **= HeroUI `Link`** (text-bấm-được → Link, KHÔNG 1-item `ListBox` — ListBox kéo theo hover/selected chrome xám của HeroUI đánh nhau với highlight). `px-3 py-2 rounded-large`.
- **Nav label chính = `text-base` (16px)** (`Typography type="body"`), KHÔNG 14px — dễ đọc (sidebar chuẩn 14–16px). Sub-item (lesson row) nhỏ hơn để phân cấp.
- **Title dài trong rail hẹp = title FULL-WIDTH 1 dòng + `truncate` + tooltip (`title` attr); meta (count "n/m", bar) xuống DÒNG 2 dưới title, caret canh giữa phải.** ĐỪNG để count/caret cùng hàng cướp width title. Ref [[rail-long-title-and-spacing]] + [[one-progress-bar-at-a-time]] (gập → "n/m" muted; mở → 1 thanh).
- **Chỉ 1 trạng thái FILL = active** (`bg-accent/10 text-accent`); hover = tint nhạt (`bg-default/40`); focus = ring; KHÔNG fill khác. Collapsed → icon-only canh giữa.
- Highlight `w-full` trong vùng padded → mép highlight ngang divider (cùng inset).

## 4. Caller (aside/shell) — vị trí + chiều cao
- **Aside bọc rail: `sticky top-16` + `h-[calc(100dvh-4rem)]` (LUÔN full-height, KHÔNG `max-h`)** → rail cao hết khung dưới navbar mọi lúc; border-r liền mạch. Rail TỰ sở hữu padding → **aside/shell KHÔNG pad quanh rail**.
- **LEARN SHELL sở hữu padding cột nội dung `p-6` — feature KHÔNG tự khai (STRICT).** Mọi tab `/learn/*` (foundations/flashcards/practice/leaderboard/personal-project/modules…) lấy `p-6` từ `LearnShell` content column (`cn("min-h-0 min-w-0 flex-1", !fullBleed && "p-6", …)`); feature chỉ còn `max-w-* + mx-auto + gap`, CẤM `p-*` ở wrapper feature (gỡ `p-*` cũ khi refactor → tránh double-pad). **Flush phải/dưới (`lg:pr-0 lg:pb-0`) gate theo `rightRail`** (chỉ bỏ pad phải khi content áp sát right-rail), **`leftRail && "max-lg:pb-16"`** (chỗ trống mobile tab-bar) tách riêng.
- **Full-bleed opt-out = ngoại lệ DUY NHẤT** (canvas tràn viền, vd mind-map) → truyền `fullBleed` để BỎ `p-6`. Mọi trang "đọc" khác đều padded. Ref [[learn-content-padding-shell-p6]].
- **Settings/profile shell = KHÔNG padding khung** (rail + content mỗi bên tự lo). **Content column** owns `mx-auto max-w-3xl p-6` (1 frame); **trang con render BARE** (`flex flex-col gap-6`) — đừng để shell-frame + child-frame chồng (double p-6/max-w). Ref [[settings-pages-breadcrumb-and-pageheader]].

## 5. Navbar (rail trên) — 1 border, 2 kiểu
- **`<nav>` root tự mang ĐÚNG 1 `border-b border-separator`** (single source). 2 kiểu: **single** (chỉ row) · **bottomLayer** (row + lớp dưới dính liền, KHÔNG border giữa → border-b rơi dưới lớp cuối). Row = `h-16` trong box; nav cao theo nội dung.
- Page feed lớp-2 qua store `useRegisterNavbarBottomLayer(useMemo node)` (Navbar global). Strip lớp-2 (ProfileTabsBar/DashboardTabsBar) bỏ `sticky/border/bg` riêng. Ref [[navbar-bottomlayer-system]].

## 6. Rail nội dung (learn ContentMap / OnThisPage) + ResizableRail
- Sticky `top-16`, full-height, vùng cuộn bọc **`ScrollShadow`** (fade mép, max-h) — KHÔNG overflow trần. Ref [[sticky-rail-overflow-wrap-scrollshadow]].
- Title rail dài → full-width 1 dòng + `truncate` + tooltip; meta/count xuống dòng 2 (ref [[rail-long-title-and-spacing]]).
- **`ResizableRail`** (kéo đổi rộng, persist `localStorage`): handle mép phải; **KHÔNG set `relative` ở root** (đè `lg:sticky` của caller → rail mất sticky). Rail sticky đã là positioned ancestor cho handle.
- Rail nhiều block: ẩn theo MỤC ĐÍCH container, không ẩn cả rail vì 1 block rỗng (ref [[rail-multiblock-hide-on-container-purpose-not-one-block]]).

## 6b. Rail docs-style ở đâu = TÙY route có LearnShell hay không (STRICT)
- **Route TRONG `/learn/*` (có LearnShell)** → rail = `LearnShell.leftRail` (rail ở LAYOUT), state qua URL. Chuẩn [[master-detail-rail-as-filter-and-mobile-chips]].
- **Route STANDALONE top-level (KHÔNG có LearnShell, vd `/practice`)** → rail = **PAGE-INTERNAL 2-pane**: dựng ngay trong feature (`<div className="flex flex-col lg:flex-row">` chứa `ResizableRail` + content), **content TỰ khai `p-6`** (không LearnShell lo → đính chính [[learn-content-padding-shell-p6]]: shell-sở-hữu-p6 chỉ đúng khi CÓ shell). Rail className mirror LearnShell (`hidden shrink-0 lg:sticky lg:top-16 lg:flex lg:h-[calc(100dvh-4rem)] lg:flex-col lg:self-start`).
- **Cả 2 kiểu:** state qua URL (`?view=`/`?domain=`, KHÔNG local `useState`) → rail + pane + mobile-chip-row cùng 1 nguồn; mode/topic = `ListBox` dùng `onSelectionChange` (KHÔNG `ListBox.Item onAction`); mobile fold rail thành CHIP-ROW cuộn ngang (`lg:hidden`). 1 surface = 1 đường route (đừng để `/practice` + `/learn/practice` trùng). Ref [[standalone-page-internal-rail-when-no-learnshell]].

## 7. Spacing
- Padding rail = `p-6` / `px-3 py-6` (collapsed) — KHÔNG rải `pr-6`/`pl-6` lẻ. Divider `mb-3`. Row `px-3 py-2`. Theo thang [[gap]] (0/2/3/6/8). Sticky offset theo [[sticky]] (`top-16` = navbar 4rem).

## 8. EDITOR-SHELL — trang "làm-1-tài-liệu" (CV builder / doc editor): toolbar navbar bottom-layer + sidebar full-height flush + full-bleed
Trang editor 1-tài-liệu (soạn CV/doc/sheet: có style-rail + canvas + preview) = **APP-SHELL full-bleed**, KHÔNG bọc content-column (`mx-auto max-w px-6`). 3 phần:
- **(a) Toolbar (back · tên tài liệu · export) = LỚP DƯỚI NAVBAR** qua `useRegisterNavbarBottomLayer` (mirror `DashboardTabsBar`/`ProfileTabsBar`). `<nav>` sở hữu 1 `border-b` dưới lớp cuối → toolbar dính liền dưới row nav, **KHÔNG divider giữa** (đọc như "dòng 2 của navbar" — [[navbar-bottomlayer-system]]). Toolbar `w-full justify-between` (back trái · tên giữa `TextField` cap `max-w-sm` · export phải), padding `px-6 pb-3`, KHÔNG border/sticky/bg riêng.
- **(b) Sidebar style/cấu hình = full-height flush-trái** `lg:w-64 lg:shrink-0 lg:overflow-y-auto border-r border-separator p-6`, chạm mép trái (route full-bleed), kiểu "Mục lục khoá học" (§4). Section chia bằng `<Label>` + `border-t` (Kiểu dáng · Trợ lý AI · Truy cập nhanh — [[elements/label]] §1b). Empty-state funnel-CTA (kéo-về-khóa) ghim `mt-auto` = `Alert status="warning"` nút stack dọc ([[elements/alert]] §4).
  - **Sidebar này RESIZABLE = dùng block `ResizableRail`** (KHÔNG tự chế resize), mirror content-rail (`storageKey` riêng theo route + `defaultWidth/minWidth/maxWidth` + `ariaLabel` i18n). **Root cần `relative`** (caller KHÔNG sticky → handle `absolute` cần positioned ancestor; khác content-rail vốn `lg:sticky`). **Mobile ép full-width bằng important-suffix `max-lg:w-full!`** (override inline `style={{width}}` JS-driven của ResizableRail — utility thường thua inline) + ẩn handle `[&>[role=separator]]:max-lg:hidden`. Khác content-rail (learn) `hidden` hẳn mobile; editor-sidebar hiện full-width mobile (là 1 pane trong toggle Sửa/Xem) — cùng block, khác cách override mobile.
- **(c) Content** = canvas/blocks + preview, mỗi cột `ScrollShadow` cuộn riêng, `p-6`.
- **Node bottom-layer render TRONG subtree Navbar → chỉ đọc provider GLOBAL** (Redux/i18n/HeroUI/zustand). Toolbar có state ĐỘNG (tên sửa được, export disabled/loading) → **dùng store zustand riêng** (vd `cvEditorToolbar`) giữ `{label, canExport, exportingFormat, onBack, onLabelChange, onExport}`; node = component ĐỨNG YÊN (`useMemo(()=><Bar/>,[])`) đọc store → cập nhật live **KHÔNG remount** (giữ focus ô tên). Editor sync state → store + register node (clear on unmount). **ĐỪNG re-memoize node theo state động** (mỗi keystroke remount input = mất focus). Ref [[navbar-bottomlayer-system]].
- **Chiều cao shell** = `lg:h-[calc(100dvh-Xrem)]` với X = chiều cao navbar-2-dòng (nav 4rem + toolbar ~3.5rem ≈ **`7.5rem`**). Sidebar + 2 cột content cùng height, `overflow` nội vùng → trang không cuộn cả khối. Nút export **default-size** (KHÔNG `lg` — compact-strip, [[elements/button]] §3).
- **Full-bleed route:** route render editor BARE (không wrapper padded); editor tự sở hữu shell (đính chính [[learn-content-padding-shell-p6]]: shell-sở-hữu-p6 chỉ đúng khi có LearnShell; editor standalone tự lo). Ref [[editor-shell-navbar-toolbar-fullheight-sidebar-and-control-button-semantics]] (draft nguồn).

## Liên quan
- [[navbar-bottomlayer-system]] (toolbar = lớp dưới navbar) · [[learn-content-padding-shell-p6]] (shell sở hữu padding) · [[standalone-page-internal-rail-when-no-learnshell]] (rail page-internal khi không có shell) · [[when-rail]] · [[sticky-rail-overflow-wrap-scrollshadow]] · [[rail-long-title-and-spacing]] (title dài + tooltip) · [[rail-multiblock-hide-on-container-purpose-not-one-block]] · [[elements/alert]] (funnel-CTA) · [[elements/label]] (section label) · [[settings-pages-breadcrumb-and-pageheader]] (settings shell).
