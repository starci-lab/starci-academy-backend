# Components — Index

> Bản đồ ĐẦY ĐỦ của shelf `components/` (Tầng 2 · ELEMENTS trong `README.md`). Mỗi dòng = 1 element có thật trong
> source FE (`C:\Repositories\starci-academy\src\components`). Cột **Doc** = trạng thái file trong shelf này;
> cột **Block** = anchor path thật trong source (đọc trước khi sửa/viết thêm). Quy tắc viết: brief-depth,
> ground vào block thật, cross-reference thay vì lặp nội dung ([[single-source-render]]).

## Có đủ doc (✓ full)

| Doc | Block(s) chính | Chủ đề |
|---|---|---|
| [accordion](./accordion.md) | `Accordion` (HeroUI) + directive `::::accordion` | Panel gập/mở — da theo nền |
| [alert](./alert.md) | `Alert` (HeroUI) + `blocks/feedback/Callout` | Banner inline bền — status/tint |
| [button](./button.md) | `Button` (HeroUI) | CTA/variant/control-button semantics |
| [card](./card.md) | `Card` (HeroUI) + `blocks/cards/*` (10+ biến thể) | Mọi biến thể card (list/accordion/flip/selectable…) |
| [chip](./chip.md) | `Chip` (HeroUI) + `blocks/chips/*` | Pill/tag/badge |
| [header](./header.md) | `blocks/layout/PageHeader` | Page/section header, back-link (§3), modal header (§5) |
| [icon](./icon.md) | Phosphor `*Icon` + `blocks/identity/IconTile` | Icon sizing/semantics |
| [input](./input.md) | `TextField`/`Input`/`Select`/`DatePicker` (HeroUI) | Field variants, composer, popover picker |
| [label](./label.md) | `Label` (HeroUI) + `blocks/cards/LabeledCard` | Nhãn section/nhóm-control/drawer-trigger |
| [list](./list.md) | `blocks/lists/*` + `ListBox` (HeroUI) | Họ list (ListRow/LabeledList/ListBox/status-list) |
| [price](./price.md) | `blocks/commerce/PriceTag` | Hiển thị giá + breakdown tooltip |
| [richtext](./richtext.md) | `reuseable/MarkdownContent` | Render markdown field |
| [sidebar](./sidebar.md) | `blocks/navigation/CollapsibleSidebar` + `SidebarNavGroup/Item` | Rail điều hướng + editor-shell |
| [tabs](./tabs.md) | `blocks/navigation/TabsCard`/`ExtendedTabs` | Toolbar tab 1-2 nhóm |

## Brief-stub mới (gap lấp trong lượt này)

| Doc | Block(s) chính | Chủ đề |
|---|---|---|
| [tooltip](./tooltip.md) | `blocks/feedback/InfoTooltip` | Giải thích thuật ngữ khi hover |
| [avatar](./avatar.md) | `reuseable/UserAvatar` + `blocks/identity/{AvatarGroup,AvatarUploadButton}` + `blocks/identity/UserCell` | Mặt người dùng + hàng identity |
| [brand-logo](./brand-logo.md) | `blocks/identity/{Logo,BrandLogo,BrandLockup}` | Logo/wordmark StarCi |
| [image](./image.md) | `blocks/media/CoverImage` + `blocks/identity/ImageDropzone` + `reuseable/Dropzone` | Cover 16:9 + upload ảnh/file |
| [breadcrumb](./breadcrumb.md) | `blocks/navigation/ResponsiveBreadcrumb` | Breadcrumb responsive (desktop chain / mobile back) |
| [segmented-control](./segmented-control.md) | `blocks/navigation/SegmentedControl` | Pill switch 1 setting gọn |
| [selectable-card](./selectable-card.md) | `blocks/navigation/{SelectableCardGroup,FlexWrapCardRadio,FlexWrapButtonRadio}` | Chọn 1-trong-N dạng card/pill |
| [back-link](./back-link.md) | `blocks/navigation/BackLink` | Affordance lùi duy nhất của trang leaf |
| [metric](./metric.md) | `blocks/stats/{MetricCard,StatPair,Legend}` | Số liệu tĩnh (không progress) |
| [meter](./meter.md) | `blocks/stats/{ProgressMeter,SegmentBar}` | Progress bar / tỉ lệ phân đoạn |
| [rating](./rating.md) | `blocks/buttons/RatingBar` | Thang chấm SM-2 (Again→Easy) |
| [modal](./modal.md) | `Modal` (HeroUI) + `components/modals/*` + `ModalContainer` | Overlay chặn 1 bước |
| [drawer](./drawer.md) | `Drawer` (HeroUI) + `components/drawers/*` + `DrawerContainer` | Panel trượt xem/chọn phụ |
| [skeleton](./skeleton.md) | `blocks/skeleton/Skeleton` (compound) | Placeholder loading mirror-layout |
| [chart](./chart.md) | `recharts` `BarChart`/`ResponsiveContainer` | Xu hướng theo thời gian — KHÔNG hand-roll div-height bars |

## TODO (chưa viết — element có thật nhưng chưa doc)

Nhìn thấy trong source nhưng KHÔNG đủ độ lặp lại/nghi vấn thiết kế để ưu tiên lượt này. Đừng bịa nội dung khi chạm —
đọc block thật trước.

| Block thật | Ghi chú |
|---|---|
| `blocks/async/{AsyncContent,EmptyContent,ErrorContent,InfiniteScrollSentinel}` | Data-state switch (error→loading→empty→content) — thuộc Tầng 4 (`patterns/`), không phải element thị giác thuần; cân nhắc `async.md` riêng khi có thời gian. |
| `blocks/feed/*` (ActivityAvatar, ActivityFeed, ChatBubble, CommunityCommentRow, CommunityPostCard, EntityLink, FeedItem, ReactionBar, Timeline) | Cụm feed/cộng đồng — feature-shaped hơn là element tái dùng rộng; cần audit riêng. |
| `blocks/feedback/{EmptyState,ErrorState}` | Anh em của `AsyncContent`; cross-ref `patterns/labeled-section-render-empty-not-self-hide`. |
| `blocks/grading/{GradeCreditCaption,GradeModelDropdown,GradingByline,SelfHostGpuMark}` | Đã có rải trong `product/ai-credit-caption-bound-to-picker-not-button` + `product/credit-unified-pool-ui`; cần gom 1 `grading.md`. |
| `blocks/marketing/*` (ArchitectureFlow/Scene, HeroBanner, MicroservicesDiagram/Scene, PitchCard, SectionHeading, ShowcaseMockup, SitePreview, TopicLane, TrackCard, TruthList) | Landing-only; rải trong `principles/landing-marketing`. |
| `blocks/layout/{AmbientBackground,AppSplash,PageContainer,ResizableRail,SocketConnectionStatus,StickyBottomBar,TopLoader}` | `AppSplash`/`TopLoader` đã tả kỹ trong `patterns/loading-feedback-three-tiers-splash-toploader-skeleton`; `ResizableRail` tả trong `sidebar.md` §6; `PageContainer`/`StickyBottomBar`/`SocketConnectionStatus` chưa doc riêng. |
| `blocks/navigation/{ContentMapRow,OutlineRail,SidebarNavGroup,SidebarNavItem}` | Đã tả trong `sidebar.md`. |
| `blocks/stats/{LanguageDonut,MilestoneRoadmap,TopicMasteryGrid}` | Viz chuyên biệt — cần doc riêng nếu tái dùng lần 2; hiện chỉ 1 nơi dùng mỗi cái. |
| `blocks/cards/{MediaCard,PricingCard,PressableCard,CourseCard,CourseCardSkeleton}` | Rải trong `card.md` (PressableCard nhắc ở §3c/gotcha, CourseCard ở gotcha-render); `MediaCard`/`PricingCard` chưa có mục riêng. `ContinueCard` giờ có mục riêng — `card.md` §3e (2nd usage: dashboard + MockInterview resume). |
| `reuseable/*` còn lại (SearchBar, SearchInput, Score, RankBadge, RankDeltaCaret, LeagueRow, LeagueTierBadge, StatRibbon, SummaryCard, SectionCard, TagChips, QRCode, Turnstile, VideoRenderer, PDFView, SandpackPanel, ProgrammingLanguageTabs, ReferenceLinks, SnippetIcon, MascotBadge, BadgeImage, HostPlatformChip, LessonVideoKindChip, CourseTrialChip, AIProcessingText, AiBalancer, CVSubmissionForm, ContributionCalendarView — heatmap tả trong `principles/heatmap-trong-la-bug-token-khong-redesign`) | Legacy tier ("reuseable" predates `blocks/`) — audit case-by-case; một số nên fold vào `blocks/*` trước khi doc. |
| `blocks/learn/UpNextCard` | 1 nơi dùng — chờ 2nd usage trước khi tách doc riêng. |

## Future / standard DS components (CHƯA có trong source — TODO khi được build)

Các primitive design-system tiêu chuẩn mà app hiện CHƯA cần/CHƯA dựng riêng (dùng trực tiếp HeroUI hoặc chưa có nhu
cầu). Đừng viết doc trước khi có block thật — ghi placeholder để nhớ audit lại khi chúng xuất hiện.

| Component | Trạng thái hiện tại |
|---|---|
| Table | Chưa có block riêng; `landing-marketing` §9 gọi ra nhu cầu "ma trận N-item chung trục" dùng HeroUI `Table` compound trực tiếp — chưa tách `blocks/`. |
| Badge | HeroUI `Badge` dùng trực tiếp rải rác (status dot, count) — chưa có wrapper block; `Skeleton.Badge` đã tồn tại (xem `skeleton.md`) dù component thật chưa tách. |
| Pagination | Đã có `blocks/lists/PaginatedList` (tả trong `list.md` §2) + `reuseable/Pagination` cũ — TODO: xác nhận cái nào là nguồn hiện hành, gộp/khai tử cái lệch. |
| Toast | `useGraphQLWithToast` (hook) bắn toast qua HeroUI `Toast`/`ToastRegion` — chưa có block doc riêng cho variant/thời lượng/stacking. |
| Checkbox | Dùng trực tiếp HeroUI `Checkbox`; `Skeleton.Checkbox` tồn tại — chưa có convention riêng (màu/size) ngoài field chung (`input.md`). |
| Radio | Dùng qua `RadioGroup`/`Radio` bên trong `SelectableCardGroup`/`FlexWrapCardRadio` (xem `selectable-card.md`) — chưa có convention cho radio "trần" (không card-styled). |
| Switch | Dùng trực tiếp HeroUI `Switch` (`.switch__control` override trong `globals.css` theo `card.md` gotcha) — chưa có block/doc riêng. |
| Popover | Dùng trực tiếp HeroUI `Popover`/`Dropdown` bên trong `GradeModelDropdown` (xem `input.md` §13) — chưa tách convention popover thuần (không picker). |
| Spinner | Dùng trực tiếp HeroUI `Spinner` (composer gửi, nút loading, Alert Indicator — xem `alert.md` §4) — chưa có size/placement convention riêng. |

## Liên quan
- `../README.md` (bản đồ 9 tầng — `components/` = Tầng 2) · [[single-source-render]] (vì-sao 1 element = 1 doc/1 nguồn render) · `../patterns/when-drawer.md` · `modal-body-no-padding-override-heroui-idiom.md` (cùng shelf) · `related-content-list-row-accent-read-cta-not-snippet-panel.md` (ruling cùng shelf — `blocks/learn/RelatedContentList` gợi ý = link-row + CTA accent, không panel snippet) · `entity-result-row-and-chat-tool-result.md` (row RAG dùng chung `EntityResultRow` + widget generative-UI `ChatToolResult` trong chat).
