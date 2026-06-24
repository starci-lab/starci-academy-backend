# Draft — Verdict/result header = BANNER tint theo kết quả (ấn tượng) + findings = card BORDERED tách thẻ (gap-3, không dính) (2026-06-25)

- File/§ đích khi `/merge`: `elements/header.md` (verdict/status header) hoặc `concepts/` + [[elements/card]] §4 + liên quan [[submission-result-flat-listbox-rail-and-detail-surface-card]] (đính chính phần findings inset).
- Bối cảnh: `SubmissionResult` cột phải. Thầy (2026-06-25, sau khi bỏ outer card): *"1 header ấn tượng hơn; các card tách nhau ra chứ không phải dính thế"*.

## Luật (STRICT)
- **Tín hiệu SỐ-1 của 1 trang kết quả/trạng thái (verdict đạt/chưa, build pass/fail…) → render bằng block HeroUI `Alert`, KHÔNG phải 1 chip nhỏ + muted trơ, KHÔNG tự dựng div tint tay.** Thầy chốt (2026-06-25): *"chưa đạt dùng alert"*.
  - **`<Alert status={success|danger|warning}>`** (status lo màu chữ/nền semantic) + `className="shadow-none bg-{status}/10"` (tint soft `/10`, bỏ shadow). Anatomy: `Alert.Indicator` · `Alert.Content` (`Alert.Title` + `Alert.Description`).
  - **Icon = PHOSPHOR, truyền vào `Alert.Indicator` làm children** (override icon mặc định): `<Alert.Indicator><CheckCircleIcon className="size-6"/></Alert.Indicator>` (đạt) / `XCircleIcon` (chưa đạt). Thầy chốt: *"dùng alert với icon của phosphor icon"* — KHÔNG để Indicator mặc định.
  - `Alert.Title` = status + số liệu chính (điểm); `Alert.Description` = dòng phụ (thời gian · "cần N để qua"). Action phụ (link "Xem bài nộp"↗) = child cuối của `Alert` với `ml-auto shrink-0`.
  - → đọc verdict <0.5s. Ref: GitHub Actions check summary · Sentry issue header. Pattern Alert có sẵn ở repo: `PersonalProject/TaskLockedAlert`.
  - Hợp khi **pass/fail là trục chính**. Nếu **điểm số là trục chính** → cân nhắc "score hero" (điểm cỡ lớn dẫn) — nhưng verdict pass/fail thường quan trọng hơn → mặc định Alert.
- **Findings/sub-items của kết quả = các card BORDERED TÁCH THẺ (`gap-3`), mỗi cái 1 bounded object — KHÔNG dồn vào 1 inset list dính separator.** Thầy chốt: thẻ tách bạch dễ quét + thoáng hơn list dính. Gom theo nhóm (severity) bằng **eyebrow câm** (`text-xs` tone semantic), KHÔNG uppercase. → **đính chính** hướng "frameless inset rows" (bản 2026-06-25 vòng 1): cuối cùng dùng FeedbackCard **bordered tách**, không frameless.
- **Nguyên tắc rút ra:** "1 surface gói trọn + rows dính" hợp khi nội dung là list đồng nhất ngắn; nhưng khi mỗi item là 1 **đối tượng giàu** (finding có severity + src + suggestion) → để mỗi item là 1 **card riêng tách gap**, dễ phân biệt ranh giới. Chọn dính-vs-tách theo độ "nặng" của item.

## ĐÃ ÁP DỤNG 2026-06-25 (FE)
- `SubmissionResult` cột phải: verdict header (chip nhỏ) → **HeroUI `Alert`** (`status` success/danger + `bg-{status}/10` + `Alert.Indicator` chứa `CheckCircleIcon`/`XCircleIcon` phosphor size-6 + Title status+điểm + Description "time · cần N để qua" + view link `ml-auto`). Findings: inset frameless list → **FeedbackCard bordered tách `gap-3`** theo severity eyebrow. i18n `submissionResult.passNeeded` (vi+en).
- `FeedbackCard` giữ prop `frameless` (variant hợp lệ, hiện result KHÔNG dùng — bordered mặc định). tsc + eslint + JSON sạch.
