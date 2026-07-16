# Patch-list ngầm — ui-patch: AI model picker + credit caption drift

> Nguồn: `.claude/fe/product/{ai-credit-caption-bound-to-picker-not-button,credit-unified-pool-ui}.md` — canon đã tự
> ghi "Đính chính"/nợ (`§Áp đầu 2026-07-06` + `§Nợ (staged, có lý do)`). Plan ngầm, ghi HẾT, không đổ hết ra duyệt.

## Rule 1 — Credit caption = `GradeCreditCaption` chung (window tuần), không hand-roll
Ref: `ai-credit-caption-bound-to-picker-not-button.md` §Nợ — *"CV editor: session song song đã tự thêm credit hand-rolled (5h) → để họ adopt GradeCreditCaption sau"*.

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `CvEditor/index.tsx:518-541` | Hand-roll `Typography` + `t("cv.builder.aiCredits", {remaining5h, limit5h})` | `<GradeCreditCaption creditUsage={aiQuota} hasPinnedModel autoCreditCost>` (window tuần) | ✅ (2026-07-08) |
| i18n `cv.builder.aiCredits` (vi+en) | orphan sau patch | xoá | ✅ |

## Rule 2 — `GradeCreditCaption.quotaReached` phải nêu đúng lý do chặn (5h burst ≠ tuần)
Ref: phát hiện khi thầy hỏi "xài hết 5h thì sao" — message cũ hardcode "hết credit tuần này" bất kể lý do chặn thật là burst 5h hay pool tuần → sai lệch với user còn credit tuần.

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `GradeCreditCaption/index.tsx` | 1 message `aiCredit.quotaReached` cho mọi lý do chặn | tách `blockedByWeek` vs `blockedByBurst`, thêm key `aiCredit.quotaReachedBurst` | ✅ |

## Rule 3 — Dead code từ lần migrate Challenge (2026-07-06)
Ref: `ai-credit-caption-bound-to-picker-not-button.md` §Nợ — *"Dead code: grade-credit-label.ts + grade-credit-display.ts (challenge) giờ orphan"*.

| Call-site | Trạng thái | Status |
|---|---|---|
| `ChallengeSubmissionPanel/utils/grade-credit-label.ts` | orphan, không ai import | ✅ xoá + gỡ barrel `utils/index.ts` |
| `ChallengeSubmissionPanel/types/grade-credit-display.ts` | orphan, không ai import | ✅ xoá + gỡ barrel `types/index.ts` |
| i18n `challenge.quota.*` (7 key, vi+en) | orphan sau khi 2 file trên bị xoá (verify: không còn ref nào kể cả scoped-translator) | ✅ xoá cả subtree |

## Rule 5 — `MockInterviewSession` trigger + label lệch hàng xóm trong card
Ref: thầy soi trực tiếp trên browser sau khi patch batch đầu — trigger `isDropdown` (field-style) là control DUY NHẤT có khung viền trong card `Cấu hình phiên`, mọi control khác là pill/`FlexWrapButtonRadio`; nhãn nhóm con dùng `Typography muted` (đúng CHỐT 2026-07-06 §1c cũ) nhưng thầy quyết đổi sang `<Label>` cho đồng da với nhãn-nhóm-control toàn app → **đè rule cũ** ([[label]] §1c đính chính 2026-07-08).

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `MockInterviewSession/index.tsx` — model picker trigger | `isDropdown` (field-bordered, không hàng xóm Select nào để mirror) | `isButton` (trigger thứ 3 mới thêm vào `GradeModelDropdown`, dùng `Button variant="tertiary"`) | ✅ (2026-07-08) |
| `GradeModelDropdown/index.tsx` | 2 kiểu trigger (compact, isDropdown) | +1 kiểu `isButton` — prop mới, không phá 2 kiểu cũ | ✅ |
| `MockInterviewSession/index.tsx` — 6 nhãn nhóm con (Chế độ·Số câu·Kiểu câu·Cách trả lời·Mức·Model) | `Typography type="body-xs" color="muted"` | `<Label>` (HeroUI) | ✅ |
| `fe/components/label.md` §1c | STRICT 2026-07-06: trong-card = muted caption | Đính chính 2026-07-08: trong-card cũng `<Label>` (đè rule cũ) | ✅ |

## Rule 6 — CV editor "Mẫu" + AI model picker: field → button (đè rule §7 STRICT)
Ref: thầy soi trực tiếp CV editor sidebar (`localhost:3000/vi/profile/cv/...`) — yêu cầu đổi cả "Trợ lý AI" và "Mẫu" (template picker) sang button. Phát hiện đây là lần THỨ 2 "Mẫu" đổi qua lại: `input.md` §7 (CHỐT 2026-07-06) từng ghi "Mẫu" TỪNG là `Button variant="tertiary"` rồi bị sửa thành `InputButtonLike` (field) vì lý do FIELD-vs-COMMAND ("SAI khi gắn tertiary cho field-like"). Đã hỏi lại thầy (AskUserQuestion) — xác nhận đè lại, giữ Button.

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `CvEditor/index.tsx` — "Mẫu" (template picker) | `InputButtonLike` (field-style, `Button variant="outline"` + field chrome) | `Button variant="tertiary"` (icon+label+caret) | ✅ (2026-07-08) |
| `CvEditor/index.tsx` — "Trợ lý AI" (`GradeModelDropdown`) | `isDropdown` (field-style) | `isButton` | ✅ |
| import `InputButtonLike` trong `CvEditor` | mồ côi sau đổi | xoá | ✅ |
| `fe/components/input.md` §7 + §8b | ví dụ áp đầu = "Mẫu" field, `isDropdown` cạnh Select | Đính chính 2026-07-08: field-style chỉ bắt buộc cho `Select`-listbox tại-chỗ; picker mở modal/gallery riêng được `isButton` nếu đứng cạnh button-style khác | ✅ |
| `fe/product/credit-unified-pool-ui.md` | ví dụ `isDropdown` = CV editor | Sửa: `isDropdown` hiện KHÔNG còn caller nào | ✅ |

**Cảnh báo cho lần audit sau:** rule field/command (§7) đã bị hẹp phạm vi 2 lần trên CÙNG 1 control ("Mẫu") trong <1 ngày — nếu thấy đổi qua lại lần 3, dừng lại hỏi thầy có muốn viết lại hẳn §7 thay vì tiếp tục vá từng case.

## Rule 7 — `isButton`: full-width + bỏ caret
Ref: thầy soi CV editor thật, thấy "Mẫu"/"Trợ lý AI" hug-content lệch bề rộng với Select Phông chữ/Cỡ chữ full-width cạnh bên; và chốt caret không hợp với button ("button không nên có caret").

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `GradeModelDropdown/index.tsx` — nhánh `isButton` | không full-width, có `CaretDownIcon` | thêm prop `isButtonFullWidth` (opt-in); **xoá hẳn caret** khỏi nhánh isButton (không phải toggle) | ✅ (2026-07-08) |
| `CvEditor` — "Mẫu" (Button tertiary) | hug-content + caret | `fullWidth` + bỏ caret | ✅ |
| `CvEditor` — "Trợ lý AI" (`GradeModelDropdown isButton`) | hug-content | `isButtonFullWidth` | ✅ |
| `MockInterviewSession` — model picker | có caret (isButton mặc định cũ) | caret tự mất theo thay đổi chung ở `GradeModelDropdown` (không cần sửa call-site, không opt-in full-width vì đứng cạnh `GradeCreditCaption` trong 1 hàng) | ✅ (tự động) |

## Rule 8 — Nút full-width đứng riêng trong sidebar phải căn trái + truncate
Ref: thầy soi tiếp CV editor, chỉ "Dán CV có sẵn"/"Chỉnh theo tin tuyển dụng" bị center mặc định của `Button` (base `.button` = `justify-center`) trong khi mọi field/label khác trong sidebar đọc trái→phải.

| Call-site | Pattern cũ | Pattern mới | Status |
|---|---|---|---|
| `CvEditor` — "Dán CV có sẵn" | `Button tertiary w-full` (center, label không truncate) | `w-full justify-start` + label `min-w-0 flex-1 truncate text-left` | ✅ (2026-07-08) |
| `CvEditor` — "Chỉnh theo tin tuyển dụng" | (như trên) | (như trên) | ✅ |
| `fe/components/button.md` | không có rule cho nút full-width đứng riêng dọc | thêm §6b (CHỐT 2026-07-08) | ✅ |

## Rule 4 — `LaneModelPicker` (AiLab) trùng `GradeModelDropdown`, cần gộp
Ref: `ai-credit-caption-bound-to-picker-not-button.md` §Nguyên tắc — *"1 PICKER duy nhất = GradeModelDropdown. LaneModelPicker (AiLab) là bản trùng cần khai tử. (Refactor riêng — AiLab có param system/user/temperature.)"*

- Call-site: `AiLab/PromptPlayground/index.tsx:284`, `AiLab/EvalChallengePanel/index.tsx:268` — cả 2 dùng `LaneModelPicker` + type `AiLabModelSelection` (structurally giống `GradeModelSelection`: `{model, provider}`).
- **KHÔNG patch same-session** — đây là "Lớn" theo skill (nhiều call-site + cần quyết định thêm: có bật search/tier-filter/floor/task cho AI Lab không, `showAutoLane` mặc định gì) + canon tự ghi "refactor riêng".
- Status: ⬜ — xem proposal `ui-patch-ai-model-picker-batch1.proposal.md`, PENDING trong BACKLOG.
