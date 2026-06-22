# Draft — Mọi trang profile/settings: breadcrumb (SettingsBreadcrumb dùng chung) + PageHeader, KHÔNG header h4 tay (2026-06-22)

- File/§ đích khi `/merge`: `starci-ui.rules` (PageHeader/breadcrumb) + mở rộng [[header-gap2-and-breadcrumb-everywhere]] + [[three-tier-page-layout]].
- Bối cảnh: thầy chỉ `/profile/settings` (hub) *"tất cả phải có breadcrumb hết nhé và layout chuẩn"*. 5 trang thiếu
  breadcrumb (settings hub, learning, submissions, attempts, feedback) + dựng header bằng `Typography type="h4"` tay,
  trong khi `/profile/edit`/security/... đã đúng (Breadcrumbs + `PageHeader`).

## Luật (STRICT)
- **MỌI trang dưới `/profile/*` (settings) = TẦNG 1 breadcrumb + TẦNG 2 `PageHeader`(title H3 + desc) + content.**
  Giống luật `/learn` ([[header-gap2-and-breadcrumb-everywhere]]) nhưng cho khu settings. KHÔNG dựng header bằng
  `<div flex-col gap-2><Typography type="h4">title</Typography><Typography body-sm muted>desc</Typography></div>` tay
  → dùng block **`PageHeader`** (H3, đồng bộ mọi trang). h4 tay = lệch cấp + lệch nhịp với các trang dùng PageHeader.
- **Breadcrumb settings DRY qua 1 component dùng chung `SettingsBreadcrumb`** (`features/profile/Settings/SettingsBreadcrumb`):
  trail `Home › Hồ sơ › <current>` (crumb cuối read-only), chỉ truyền prop `current`. Trước đây mỗi trang hand-roll
  lại 3-item `<Breadcrumbs>` y hệt → tách thành 1 component generic (giống `LearnBreadcrumb` của khu learn). Nav:
  `pathConfig().locale().build()` (home) + `pathConfig().locale(locale).profile().build()` (hồ sơ).
- **Shell sở hữu khung, trang chỉ đặt 3 tầng:** `SettingsLayout` đã cho `max-w-3xl p-6` + sidebar; trang chỉ render
  `<SettingsBreadcrumb/> + <PageHeader/> + content` trong `<div flex flex-col gap-6>`. KHÔNG tự thêm padding/max-w.
- **Ngoại lệ layout đặc thù:** trang CV (`/profile/cv`) là tool 2 cột (preview + form) → GIỮ breadcrumb nhưng không
  ép `PageHeader` (header sống trong cột). Mọi trang "đọc/list" thường đều theo 3 tầng.

## ĐÃ LÀM 2026-06-22
- Tạo `SettingsBreadcrumb` (DRY). Áp breadcrumb + `PageHeader` cho 5 trang thiếu (SettingsHome hub, LearningHistory,
  MySubmissions, MyAttempts, MyFeedback) — thay header h4 tay. tsc + eslint sạch.
- **Chưa làm (optional):** 8 trang đã đúng (edit/security/sessions/ai-*/membership/bookmarks) vẫn hand-roll
  `<Breadcrumbs>` riêng → nên refactor về `SettingsBreadcrumb` cho DRY hoàn toàn (chưa đụng để giảm blast radius).
