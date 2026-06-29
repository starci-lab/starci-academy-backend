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

## 3. Cỡ icon — scale theo TEXT, leading = trailing (chốt theo shadcn 2026-06-26)
**Nguyên tắc (thật, SF Symbols/Carbon):** icon optical-size theo cỡ TEXT nó đi kèm. **Leading (trước text) và trailing (sau text: caret/arrow) DÙNG CÙNG CỠ** — KHÔNG leading-to-trailing-nhỏ (chốt theo shadcn cho đơn giản, 1 cỡ/ngữ cảnh). KHÔNG nửa bậc (`size-3.5`…).

| Text đi kèm | Icon (leading & trailing) |
|---|---|
| **text-sm / body-sm (14px) — MẶC ĐỊNH** (đa số UI: nav row · button · status/meta · label section) | **`size-5` (20px)** |
| text-xs / body-xs (12px) | `size-4` (16px) |
| text-base (16px, cột đọc/hero) | `size-6` (24px) |
| icon trong `Chip` | `size-3` (12px) |

- Một row dùng 1 cỡ cho mọi icon (leading + caret/arrow trailing đều cùng cỡ theo text của row). Vd row `body-sm`: cả `[icon] … [›]` đều `size-5`.
- **`size-6`** cũng cho social-brand logo nổi (footer) / status lớn (`WarningOctagon` empty-error). **Entity / empty / hero / avatar → block `IconTile`** (§4), KHÔNG `size-*` trần lớn rải feature.
- KHÔNG `min-h-*/min-w-*` thừa kèm `size-*`.
- ⚠️ Scan 2026-06-26: 85 chỗ caret/arrow đang `size-4` trong row `body-sm` → theo canon mới phải `size-5` (đồng cỡ leading). Quét-sửa khi đụng (hoặc 1 pass riêng).

## 4. Leading "avatar của 1 thứ" = `IconTile`, KHÔNG icon trơ nhỏ — CHỐT 2026-06-25
- **Icon đại diện cho 1 ĐỐI TƯỢNG ở leading của row/card (bài học/khóa/dự án) → block `IconTile` (tile khung `size="sm"` = 48px, icon tự `size-6` + nhận `src` cover/fallback), KHÔNG `<*Icon size-4/5>` trơ.** Icon trơ trong row cao (title+subtitle) nhìn nhỏ/yếu/lạc lõng. Phân vai: **avatar của 1 thứ → IconTile**; **marker phụ** (check/bullet/inline) → icon trơ `size-4/5`. Chi tiết + skeleton mirror: [[elements/list]] §5 + [[row-leading-icontile-not-bare-small-icon]].

## Liên quan
- [[no-emoji]] (icon thay emoji) · [[status-icon-overrides-base]] (lock ghi đè icon gốc khi khoá) · [[disable-vs-lock-and-perrow-autosave]] (WarningCircle=disable vs Lock=khoá).
