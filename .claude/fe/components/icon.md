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
- **★ Cặp đối xứng đạt↔lỗi = `CheckCircleIcon` ↔ `XCircleIcon` (circle-x), CHỐT 2026-07-14 (StatusChip):** dấu "thất bại/lỗi/từ chối" = **`XCircleIcon`** (x-trong-vòng-tròn), song song với circle-check của "đạt" — KHÔNG bare `XIcon` cho status. `StatusChip` CÓ icon = **CHỈ 2 status dứt khoát**: thành công (`CheckCircleIcon` + tone success) · lỗi (`XCircleIcon` + tone danger); icon STATUS = LEADING (đầu, đọc "✓/✗ nhãn"), TĨNH — tone khác (neutral/warning "sắp hết hạn"/accent "nổi bật") KHÔNG icon status. (Bỏ SVG bare-check hand-roll trong story cũ — vi phạm §2 + "dùng icon thật".)
  - **Đính chính (cùng ngày 2026-07-14) — StatusChip CÓ hỗ trợ X-GỠ ở cuối (đảo câu "pill thuần không nhét X"):** thầy chốt tiếp: chip filter/tag GỠ ĐƯỢC → prop `onCancel` render nút **X TRAILING** (cuối) bấm để huỷ/gỡ chip. Nút gỡ = **HeroUI `CloseButton`** (icon **× MẶC ĐỊNH của nó**, KHÔNG override glyph — theo `alert.md` close-affordance = CloseButton, KHÔNG hand-roll `<button><XIcon/>`; dùng plain như `Callout`). **Bare-X, KHÔNG `XCircleIcon`** — circle-x để dành cho STATUS lỗi (leading).
    - **Đính chính lượt 2 (2026-07-15) — 2 chỉnh nữa của thầy:** (a) *"dấu x nhớ dùng heroui close button"* → bỏ hẳn việc truyền `<XIcon/>` Phosphor làm con; dùng thẳng `<CloseButton/>` với glyph mặc định (đồng bộ `Callout`). (b) *"có dấu X rồi thì prefix không có icon"* → chip mang **HOẶC** status-icon-leading **HOẶC** X-gỡ-trailing, **KHÔNG cả hai** (đảo câu "2 vai độc lập" ở bullet trên). Component ép: `onCancel` set → leading `icon` bị DROP (`{icon && !onCancel ? … : null}`). Story `Removable` = 3 filter chip (React/TypeScript/Junior) chỉ có X, không icon leading.
    - Quy tắc chung rút ra: **status = circle (leading, tĩnh) · remove/close = bare X (trailing, `CloseButton` mặc định)** — và 1 chip chỉ mang 1 trong 2, không gộp.

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
- **Ngoại lệ `size-4` cho chip meta-row ngay dưới title lớn (CHỐT 2026-07-08):** `ContentHeader` (`LessonReader`) — 3 chip "Đã đọc"/"phút đọc"/"thử thách" ngay dưới `PageHeader` title — icon `size-4` thay vì `size-3` mặc định (thầy quyết, đọc rõ hơn ở vị trí banner ngay dưới heading lớn). **KHÔNG áp cho Chip khác** trong app (tag/level/deck chip… vẫn `size-3` theo rule chính).
- **NGOẠI LỆ `size-5` — LEADING ROW-MARKER / NAV ICON:** icon trạng thái/định-danh ở ĐẦU 1 dòng list/nav (Play/Check/Circle/Lock đầu content-map row · `SidebarNavItem` icon), dù cạnh title `text-sm`, **giữ `size-5`** (điểm neo thị giác + sidebar collapsed thành icon-only). KHÔNG đổi `ContentMapRow`/`ListRow`/`SidebarNavItem`/path-row leading.
- **`size-6`** cũng cho social-brand logo nổi (footer) / status lớn (`WarningOctagon` empty-error). **Entity / empty / hero / avatar → block `IconTile`** (§4), KHÔNG `size-*` trần lớn rải feature.
- KHÔNG `min-h-*/min-w-*` thừa kèm `size-*`.
- Ref [[icon-size-inline-vs-stacked]]. (Đây LẬT NGƯỢC bản 2026-06-26 "inline cạnh text-sm = size-5" → nay `size-4`; `size-5` chỉ còn cho stacked / icon-only / leading-row-marker.)

## 4. Leading "avatar của 1 thứ" = `IconTile`, KHÔNG icon trơ nhỏ — CHỐT 2026-06-25
- **Icon đại diện cho 1 ĐỐI TƯỢNG ở leading của row/card (bài học/khóa/dự án) → block `IconTile` (tile khung `size="sm"` = 48px, icon tự `size-6` + nhận `src` cover/fallback), KHÔNG `<*Icon size-4/5>` trơ.** Icon trơ trong row cao (title+subtitle) nhìn nhỏ/yếu/lạc lõng. Phân vai: **avatar của 1 thứ → IconTile**; **marker phụ** (check/bullet/inline) → icon trơ `size-4/5`. Chi tiết + skeleton mirror: [[elements/list]] §5 + [[row-leading-icontile-not-bare-small-icon]].

## 5. Weight mặc định = THUẦN (outline/regular), KHÔNG `weight="fill"` tràn lan — CHỐT 2026-07-13
- **Icon KHÔNG set `weight` (mặc định "regular"/outline) trừ khi có lý do SEMANTIC rõ để dùng đặc (`weight="fill"`)** — đặc/solid nặng hơn tinh thần đơn giản của web, dễ đọc như 1 badge/nhấn mạnh không cố ý. Ca thật: `FlashcardReviewModeModal`'s tích xác nhận chọn (`CheckCircleIcon`) ban đầu `weight="fill"` → thầy: "render icon thuần thôi... not weight, color accent... giữ tính simple của web" (thấy đặc trong ảnh thật, đọc như badge tròn nặng) → bỏ `weight`, giữ `size-4 text-accent`.
- **Ngoại lệ ĐÃ CHỐT riêng (giữ `weight="fill"`):** `FireIcon weight="fill"` cho `badgeIcon` streak/momentum (khớp ngôn ngữ `UserStreak` navbar — xem `card.md` §3e "Đính chính 2026-07-11") — đây là 1 icon-language CỐ Ý đặc để đọc như "biểu tượng/mascot nhỏ", không phải marker thường. Marker/tích/trạng thái THƯỜNG (confirm, check, status inline) → giữ THUẦN.
- Khi phân vân: mặc định KHÔNG set `weight` — chỉ thêm `weight="fill"` khi có ca cụ thể thầy duyệt riêng (như FireIcon trên), đừng tự suy ra "đặc = nhấn mạnh hơn = tốt hơn".

## 6. Icon leading CÙNG MÀU với chữ cạnh nó — CHỐT 2026-07-13
- **Icon leading (đứng trước title trong 1 row/item) PHẢI cùng màu với title cạnh nó** — mặc định cả 2 `text-foreground` (KHÔNG để icon `text-muted` trong khi title vẫn foreground — 2 tông khác nhau đọc lệch/rời). Nếu row đang ở trạng thái nhấn mạnh (selected/active) → ĐỔI CẢ HAI cùng lúc sang cùng 1 tông mới (vd `text-accent`), không đổi riêng icon hay riêng chữ.
- **Trạng thái "đang chọn" trong 1 list radio-1-trong-N ưu tiên đổi màu icon+title sang accent, hơn là thêm 1 dấu tích riêng.** Ca thật: `FlashcardReviewModeModal` — bản đầu dùng `CheckCircleIcon` trailing xác nhận chọn (xem §5 trên) → thầy đổi ý (lượt 4, cùng ngày): bỏ hẳn dấu tích, thay bằng leading icon + title cùng chuyển `text-accent` khi row đó là lựa chọn hiện tại; row chưa chọn = icon+title cùng `text-foreground`. Gọn hơn (không thêm 1 icon phụ), tín hiệu vẫn rõ vì áp đồng thời lên 2 chỗ (icon + label).
- **Đính chính (2026-07-13, cùng ngày):** Impl ban đầu ("span con lồng bên trong `title`") SAI khi row cũng có `hover="underline"` — `text-decoration-color` ăn theo `currentColor` của element GỐC đặt `text-decoration-line` (ở đây là `Typography` bên trong block, không phải span con feature tự bọc), nên hover ra chữ hồng nhưng gạch chân đen (lệch tông). Thầy: *"click vào rồi thì hover accent underline đi"*. Fix ĐÚNG: block expose **`titleClassName?: string`** áp thẳng lên chính `Typography` mang `group-hover:underline` (không phải wrapper span của feature) — màu chữ VÀ màu underline cùng đọc từ 1 element, luôn khớp nhau. Đã thêm cho `SurfaceListCardRow` (`titleClassName`), dùng ở `FlashcardReviewModeModal`. **Quy tắc chung:** khi 1 block có sẵn `hover="underline"`/tương tự (màu do `currentColor` của chính element quyết định) và feature cần đổi màu title theo state → PHẢI có prop `titleClassName` (hoặc tương đương) từ block, KHÔNG bọc span con — span con chỉ an toàn khi row KHÔNG có underline-on-hover phụ thuộc currentColor.

## Liên quan
- [[no-emoji]] (icon thay emoji) · [[status-icon-overrides-base]] (lock ghi đè icon gốc khi khoá) · [[disable-vs-lock-and-perrow-autosave]] (WarningCircle=disable vs Lock=khoá).
