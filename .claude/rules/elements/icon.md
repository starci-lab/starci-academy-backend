# Element — Icon

> Convention icon cho UI. Bổ trợ [[no-emoji]] (KHÔNG emoji, dùng icon phosphor) + [[status-icon-overrides-base]] (icon trạng thái ghi đè icon gốc).

## 1. Phosphor-only
- **MỌI icon = `@phosphor-icons/react` (`*Icon`).** KHÔNG `@gravity-ui/icons`, KHÔNG emoji. Gặp gravity-ui (`Check`/`MapPin`/`Bulb`/`DiamondExclamation`…) khi đụng tới → đổi sang phosphor (`CheckCircleIcon`/`MapPinIcon`/`LightbulbIcon`/`WarningCircleIcon`).

## 2. Dấu "tích/hoàn thành/đạt" = `CheckCircleIcon` (circle check), KHÔNG `CheckIcon` trơn — CHỐT 2026-06-25
- **Mọi dấu tích mang nghĩa "đã hoàn thành / được bao gồm / đạt / đúng"** (outcome, value-prop, prerequisite, membership perk, capstone done, feedback strength…) = **`CheckCircleIcon`** (tích trong vòng tròn), KHÔNG `CheckIcon` (tích trơn). Circle-check đọc rõ "1 mục ✓", đồng nhất mọi list check-led.
- `text-success` khi khẳng định tích cực (đạt/đúng); `text-muted` nếu marker trung tính.
- **Ngoại lệ:** `FollowButton` (`CircleCheck` alias) — đã là circle-check, giữ. KHÔNG để dấu tích "trơn" tồn tại.
- **Gotcha refactor:** đổi hàng loạt `CheckIcon` → `CheckCircleIcon` bằng replace-all dính substring `SealCheckIcon` → `SealCheckCircleIcon` (sai) → dùng word-boundary hoặc sửa tay; verify tsc.
- Đã áp 2026-06-25: CourseValueProps · Membership · ProfileCapstone/ProjectCard · FeedbackCard · SnippetIcon · 2 legacy ProfileCapstone (gravity Check → phosphor CheckCircleIcon).

## 3. Cỡ icon — theo BỐ CỤC (inline cạnh text vs stacked trên text) — CHỐT 2026-06-30
**Nguyên tắc:** icon optical-size theo cỡ TEXT + phụ thuộc icon nằm **CẠNH** text (inline) hay **TRÊN** text (stacked). KHÔNG nửa bậc (`size-3.5`…). Leading = trailing (caret/arrow) cùng cỡ trong 1 hàng.

| Bố cục / vị trí | Icon |
|---|---|
| **INLINE cạnh text-sm / body-sm (14px)** (leading & trailing: nav row · button · status/meta · label · caret/arrow) | **`size-4` (16px)** |
| **INLINE cạnh text-xs / body-xs (12px)** | `size-3` (12px) |
| **INLINE cạnh text-base (16px, cột đọc/hero)** | `size-6` (24px) |
| **STACKED — icon TRÊN text-sm** (flex-col, vd bottom-tab bar icon-trên-label) | **`size-5` (20px)** |
| icon trong `Chip` (inline cạnh text-xs chip) | `size-3` (12px) |
| icon-only button (không text kèm) | `size-5` (20px) |

- **Icon cạnh không được lấn dòng chữ → nhỏ (≈ chữ: 4/3); icon trên là điểm neo → to (5).**
- **NGOẠI LỆ `size-5` — LEADING ROW-MARKER / NAV ICON:** icon trạng thái/định-danh ở ĐẦU 1 dòng list/nav (Play/Check/Circle/Lock đầu content-map row · `SidebarNavItem` icon), dù cạnh title `text-sm`, **giữ `size-5`** (điểm neo thị giác + sidebar collapsed thành icon-only). KHÔNG đổi `ContentMapRow`/`ListRow`/`SidebarNavItem`/path-row leading.
- **`size-6`** cũng cho social-brand logo nổi (footer) / status lớn (`WarningOctagon` empty-error). **Entity / empty / hero / avatar → block `IconTile`** (§4), KHÔNG `size-*` trần lớn rải feature.
- KHÔNG `min-h-*/min-w-*` thừa kèm `size-*`.
- Ref [[icon-size-inline-vs-stacked]]. (Đây LẬT NGƯỢC bản 2026-06-26 "inline cạnh text-sm = size-5" → nay `size-4`; `size-5` chỉ còn cho stacked / icon-only / leading-row-marker.)

## 4. Leading "avatar của 1 thứ" = `IconTile`, KHÔNG icon trơ nhỏ — CHỐT 2026-06-25
- **Icon đại diện cho 1 ĐỐI TƯỢNG ở leading của row/card (bài học/khóa/dự án) → block `IconTile` (tile khung `size="sm"` = 48px, icon tự `size-6` + nhận `src` cover/fallback), KHÔNG `<*Icon size-4/5>` trơ.** Icon trơ trong row cao (title+subtitle) nhìn nhỏ/yếu/lạc lõng. Phân vai: **avatar của 1 thứ → IconTile**; **marker phụ** (check/bullet/inline) → icon trơ `size-4/5`. Chi tiết + skeleton mirror: [[elements/list]] §5 + [[row-leading-icontile-not-bare-small-icon]].

## Liên quan
- [[no-emoji]] (icon thay emoji) · [[status-icon-overrides-base]] (lock ghi đè icon gốc khi khoá) · [[disable-vs-lock-and-perrow-autosave]] (WarningCircle=disable vs Lock=khoá).
