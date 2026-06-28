# Draft — Trang KẾT QUẢ chấm (quality-gate report): tách `LabeledCard` (Kết quả + Góp ý) · verdict = score-hero · findings = LABELED ACCORDION CARD (2026-06-28)

- File/§ đích khi `/merge`: `concepts/` (result/verdict page) + [[elements/card]] (LabeledCard + Accordion Card) + [[verdict-banner-and-separated-finding-cards]] (đính chính: findings giờ là ACCORDION trong LabeledCard, không phải FeedbackCard rời) + liên quan [[concepts/card]] (2 vùng có nhãn riêng) · [[elements/accordion]].
- Bối cảnh: `SubmissionResult` (kết quả chấm 1 challenge). Qua nhiều vòng brainstorm thầy chốt: gộp 1 surface → "1 section" → rồi **tách thành các LabeledCard nhỏ hơn** + "góp ý render theo kiểu labeled accordion card thì ngon".

## Quy tắc (STRICT)
- **Trang "kết quả của 1 lần chấm/check tự động" = quality-gate report, IA cố định:** (1) **attempt selector** (xem draft [[attempt-history-selector-adaptive-and-grading-model-chip]]) → (2) **`LabeledCard` "Kết quả"** (verdict) → (3) **`LabeledCard` "Góp ý"** (findings). 1 cột dọc, full-width, KHÔNG 2-cột flex (rail trống khi ít item).
- **Tách thành NHIỀU `LabeledCard` nhỏ có NHÃN, KHÔNG 1 surface to gộp dividers.** Mỗi vùng chức năng = 1 `LabeledCard` (label NGOÀI + card). 2 LabeledCard cách `gap-6`, mỗi cái nhãn riêng → đọc ra "2 vùng" (đúng [[concepts/card]]: 2 vùng NGANG HÀNG có nhãn riêng = OK; KHÁC "2 box floating dính" không nhãn — cái đó mới xấu). **Đính chính** quyết định "1 surface card gói trọn" trước đó: thầy muốn TÁCH (có nhãn) chứ không gộp.
- **Verdict = SCORE HERO** trong card "Kết quả": điểm cỡ lớn (`text-4xl font-bold`, tone `text-success`/`text-danger` theo pass/fail) + `/max` nhỏ muted (dính, gap-0) + chip verdict (đạt/chưa) + "cần N để qua" + shortFeedback + "Xem bài nộp"↗. Dưới (border-t) = **model byline** (xem draft model-chip). Verdict pass/fail là tín hiệu số-1 → score to dẫn.
- **Findings = LABELED ACCORDION CARD**: `LabeledCard label="Góp ý"` → `<Accordion variant="surface" className="overflow-hidden rounded-2xl border border-default" allowsMultipleExpanded>`, mỗi finding = `Accordion.Item` (trigger = severity icon + message clamp-1 + file chip + `Accordion.Indicator`; panel = detail + location link + suggestion). **Surface-in-surface → BORDER** (accordion trong card surface — [[surface-in-surface-inner-has-border]]). KHÔNG dùng FeedbackCard rời / wall-of-cards / div-rows tự chế. **Đính chính** [[verdict-banner-and-separated-finding-cards]] (findings = FeedbackCard bordered tách): cuối cùng thầy chốt **accordion** (gọn, quét nhanh, expand khi cần) trong LabeledCard.
- **Severity:** sort findings high→low; mỗi accordion item có severity icon + tone (`WarningCircleIcon` danger/warning, `InfoIcon` muted). (Bỏ severity-count strip riêng — accordion items đã color-coded + sorted; nếu cần count → `labelEnd` của LabeledCard.)
- **Empty/state:** findings rỗng (đạt sạch) → `AsyncContent` empty TRONG `LabeledCard "Góp ý"` ([[frameless-section-empty-state-needs-card]]) "không có góp ý — đạt sạch", KHÔNG tự ẩn card. Loading = skeleton mirror; error = retry.
- **Verdict bug guard:** `isPassing = passThreshold > 0 && maxScore > 0 && score >= passThreshold*maxScore`. Khi config/threshold chưa load (=0) → `0>=0` báo ĐẠT nhầm cho mọi điểm ("Đạt 0/100"). Guard: threshold/maxScore chưa biết → coi NHƯ chưa đạt (không báo pass giả).

## Block/primitive map
| Phần | Dùng |
|---|---|
| Vùng có nhãn | `LabeledCard` (label ngoài) — [[elements/card]] §2 |
| Findings | `LabeledCard` + HeroUI `Accordion variant="surface"` + border — [[elements/card]] §3 · [[elements/accordion]] |
| Verdict chip / severity chip | HeroUI `Chip` — [[elements/chip]] |
| Icon | phosphor — [[elements/icon]] |
| State | `AsyncContent` |

## ĐÃ ÁP DỤNG 2026-06-28 (FE `D:\Repositories\starci-academy`)
- `SubmissionResult/index.tsx`: result = 2 `LabeledCard` ("Kết quả" score-hero + model byline · "Góp ý" Accordion surface findings); `FindingAccordionItem` (trigger severity+message+file, panel detail+location+suggestion); bỏ `FindingRow`/severity-strip/outer-surface-div. i18n `submissionResult.{resultLabel,feedbackLabel}`. tsc/eslint sạch.

## TÁI DÙNG cho PERSONAL-PROJECT task (2026-06-28) — cùng IA, khác nguồn data
- **`PersonalProjectTaskResult` = MIRROR `SubmissionResult`** cho task dự án cá nhân (route `…/personal-project/tasks/[taskId]/result`). Dùng CHUNG block: `GradingByline` (ModelByline+VerdictIcon) · `FlexWrapButtonRadio` · `LabeledCard` · `PageHeader` · drawer pattern (`PersonalProjectTaskResultHistoryDrawer` clone `SubmissionResultHistoryDrawer`). Bỏ modal cũ (`UserMilestoneTaskFeedbacksModal` + overlay state) → nút "Xem chi tiết phản hồi" `router.push` page.
- **Khác data (grounded):** verdict = `attempt.passed` boolean THẬT (KHÔNG cần `isPassing` threshold guard — PP attempt có sẵn `passed`); maxScore = `selectedTaskDetail.maxScore`; findings KHÔNG có `detail` (panel = location + suggestion); "Xem repo" = enrollment github url (PP attempt KHÔNG lưu submissionUrl per-attempt); severity = `MilestoneSeverity` (low/medium/high, KHÔNG Info).
- **Routing INTERNAL (gotcha):** PP layout render `<PersonalProjectWorkspace/>` (KHÔNG `{children}`) → route `…/result/page.tsx` = `<></>` marker; workspace tự detect `/\/result$/` pathname → render result. Giữ left-rail milestone (shell), KHÔNG p-6 (shell đã pad — khác challenge full-bleed có p-6).
- **BE servedModel PHẢI persist ON ATTEMPT (không chỉ credit-history):** processor `aiUsage` trước chỉ ghi vào `recordCreditUsage` → attempt.servedModel NULL ở flow live (challenge byline trước chỉ chạy nhờ SEED). Fix: set `servedModel/servedProvider: grade.aiUsage?.model/provider` Ở chính `entityManager.save(<Attempt>)` (challenge git+gdocs + milestone) + cột trên `UserMilestoneTaskAttemptEntity` + migration. Nguyên tắc: muốn field hiện trên trang → persist ON entity hiển thị, không chỉ ở bảng phụ.
