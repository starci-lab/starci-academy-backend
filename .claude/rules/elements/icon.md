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

## 3. Cỡ icon
- **Inline trong row/chip/finding = `size-4` (16px).** Icon nhỏ, không lấn text. (FeedbackCard severity chip + src pin + suggestion bulb = `size-4`.)
- **Nhãn section / label icon = `size-5` (20px)** (LabeledCard icon, meta chip section).
- KHÔNG `min-h-*/min-w-*` thừa kèm `size-*` (size đã set cả w/h). Đừng để icon `size-5`+ trong row gọn (lấn).

## Liên quan
- [[no-emoji]] (icon thay emoji) · [[status-icon-overrides-base]] (lock ghi đè icon gốc khi khoá) · [[disable-vs-lock-and-perrow-autosave]] (WarningCircle=disable vs Lock=khoá).
