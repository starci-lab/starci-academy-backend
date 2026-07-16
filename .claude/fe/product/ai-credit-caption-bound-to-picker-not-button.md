# Concept — AI credit = caption GẮN PICKER (không gắn nút), 1 block chung `GradeCreditCaption`; free-lane KHÔNG credit

> Heuristic (họ `concepts/*`, FE). Rút từ scan toàn app (2026-07-06): credit AI render **2 kiểu khác nhau** (challenge = button cùng-hàng-picker · mock-interview = text dưới-nút), + 5 surface tốn-credit mà không hiện credit, + **2 picker khác nhau** (`GradeModelDropdown` vs `LaneModelPicker`). Thầy: *"thống nhất chung cho toàn bộ… nút không full-width thì sao"*. Bổ sung/nâng [[credit-unified-pool-ui]].

## Nguyên tắc (STRICT)
- **Credit AI = caption GẮN VÀO PICKER (cụm model-picker), KHÔNG gắn vào NÚT CTA.** Vì credit chỉ đúng cho **lane Tự động** (`myAiQuota`), nó phải sống cạnh picker + **ẩn khi pin model trả phí** (`hasPinnedModel` → null). → **bề rộng nút hoàn toàn vô can** (full-width / hug-content / inline-toolbar đều được) — đây là cái làm pattern thống nhất mọi màn. Đừng đặt credit làm "helper của nút" (sẽ sai khi đổi model + phụ thuộc width nút).
- **1 BLOCK CHUNG `blocks/grading/GradeCreditCaption`** render credit — KHÔNG mỗi feature tự chế (challenge/interview đang lệch). Props: `{ creditUsage: myAiQuota|null|undefined, hasPinnedModel: boolean, autoCreditCost?: number, onOpenDetails?: () => void }`. Nó tự: gate Auto (`hasPinnedModel || !creditUsage` → null), tính quota-reached (`remaining5h/Week < autoCreditCost` → tông `text-danger` + `WarningCircleIcon`), else usage line `text-muted`; `onOpenDetails` → bấm mở modal quota. Feature CHỈ query `myAiQuota` + truyền vào — **block KHÔNG tự query** (nhiều caller free-lane không cần credit → tránh bloat; giữ [[credit-unified-pool-ui]]).
- **Vị trí = ngay DƯỚI (hoặc cạnh) picker**, cùng cụm: setup card → dưới CTA (picker phụ, [[split-config-card-by-meaning-not-per-control]]); toolbar chật per-row → hàng picker (trên nút). Feature đặt `<GradeCreditCaption>` sát picker; không quyết định gì thêm về "đặt đâu".
- **Free-lane KHÔNG có credit** (chatbot, selection-ask — model free, không tốn pool) → KHÔNG render `GradeCreditCaption`. Chỉ **Auto-lane-tốn-credit** mới hiện (challenge · interview · CV rewrite/tailor/split · AiLab). Surface **buộc pin model** (`showAutoLane={false}`, vd personal-project) → luôn `hasPinnedModel` → caption tự ẩn (đúng: pinned = không áp weekly-credit).
- **1 PICKER duy nhất** = `GradeModelDropdown`. `LaneModelPicker` (AiLab) là bản trùng cần khai tử (gom credit vô nghĩa nếu picker chưa gom). (Refactor riêng — AiLab có param system/user/temperature.)

## i18n
- Text credit dùng key CHUNG `aiCredit.usage` ("Còn {remaining}/{quota} credit tuần này") + `aiCredit.quotaReached` — KHÔNG per-feature key (`challenge.quota.*` / `mockInterview.autoCredit` cũ = orphan, dọn dần).

## Áp đầu (2026-07-06)
- Tạo block `blocks/grading/GradeCreditCaption` + i18n `aiCredit.*` (vi+en). Migrate 3 surface → dùng chung:
  - **MockInterview**: thay text hand-rolled → `GradeCreditCaption`.
  - **Challenge `SubmissionRow`**: thay button+`resolveGradeCreditDisplay` → `GradeCreditCaption` (`onOpenDetails`=mở AiQuota modal, giữ vị trí cùng-hàng-picker). Gỡ `useMemo`/`useCallback`/`WarningCircleIcon`/`resolveGradeCreditDisplay`/`GradeCreditDisplayKind` khỏi row. **Thay đổi behavior có chủ đích:** pinned-premium giờ ẨN credit (trước hiện `laneUsage.premium`) — đúng policy "credit = Auto-lane only".
  - **AiLab `PromptPlayground`**: thêm `GradeCreditCaption` cạnh `LaneModelPicker` (caption picker-agnostic → thêm được mà chưa cần gom picker).
  - tsc/eslint/JSON sạch cả 3. ⚠️ **Chưa verify mắt** (dev-server bị session khác khoá).
- **Nợ (staged, có lý do):**
  - ~~**CV editor**: session SONG SONG đã tự thêm credit hand-rolled (window 5h) → để họ adopt `GradeCreditCaption` sau.~~ **TRẢ 2026-07-08** (`starci-fe-ui-patch`): CV editor → `GradeCreditCaption` (weekly), i18n `cv.builder.aiCredits` xoá.
  - **Gom picker**: `LaneModelPicker`→`GradeModelDropdown` (AiLab) — refactor riêng (param system/user/temp). Vẫn CÒN NỢ, xem `fe/proposals/ui-patch-ai-model-picker-batch1.proposal.md` (queued, cần chốt thêm search/tier-filter/floor/task cho AI Lab).
  - ~~**Dead code**: `grade-credit-label.ts` + `grade-credit-display.ts` (challenge)~~ **TRẢ 2026-07-08**: xoá 2 file + barrel export + 7 key i18n `challenge.quota.*` mồ côi.
  - Doc: `blocks/grading/AI-PICKER-CREDIT-UNIFY-BRAINSTORM.md`.
- **Áp thêm (2026-07-08, `starci-fe-ui-patch`):**
  - **Fix bug thật:** `GradeCreditCaption.quotaReached` trước hardcode "hết credit tuần này" bất kể lý do chặn là burst-5h hay pool-tuần → tách `blockedByWeek`/`blockedByBurst`, thêm key `aiCredit.quotaReachedBurst`.
  - **`MockInterviewSession`**: đổi trigger model picker từ `isDropdown` (field-style, không khớp hàng xóm — card này toàn pill/`FlexWrapButtonRadio`, không có Select nào để mirror) sang **`isButton`** (kiểu trigger thứ 3, mới thêm — xem [[credit-unified-pool-ui]] §GradeModelDropdown trigger styles). Đồng thời đổi mọi nhãn nhóm con trong card từ `Typography muted` sang `<Label>` — xem đính chính [[label]] §1c (2026-07-08, đè bản 2026-07-06).
  - ⚠️ **Chưa verify mắt** (dev-server tiếp tục bị session khác khoá, lặp lại suốt ngày 2026-07-08).

## Liên quan
- [[credit-unified-pool-ui]] (credit = pool thống nhất, cạnh picker, block không tự query) · [[split-config-card-by-meaning-not-per-control]] (picker phụ dưới CTA) · [[single-source-render]] (1 render chung) · [[fair-monetization-axiom]] (credit theo tier/pool, không theo count).
