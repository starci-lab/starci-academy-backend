# Proposal — MockInterview flow layout

- **Status:** ✅ DONE (build B1-B4, 2026-07-07) · **Chốt:** thầy duyệt blueprint 2026-07-07
- **Prototype:** [`../prototypes/mock-interview.html`](../prototypes/mock-interview.html) (element-aware)
- **Feature doc:** [`../features/mock-interview.md`](../features/mock-interview.md)

## Flow + shell (job → shell, feature nhiều-pha đổi shell theo pha)
| Pha | Job | Shell |
|---|---|---|
| setup | quyết / green-room | centered `max-w-2xl` ([[centered-form-setup]]) |
| **interview** | làm-việc + tool | **full-bleed 2-pane** ([[full-bleed-work-surface]]) — bỏ rail |
| grading | chờ | centered interstitial |
| scorecard | kết quả + phễu | centered `max-w-2xl` |

`qna` = full-bleed 1-cột + workspace **bung-theo-yêu-cầu** (câu code auto-mở pane) · `design` = 2-pane cứng.

## Blocks (element-aware — tên block THẬT)
- setup: `LabeledCard` · `FlexWrapButtonRadio` (tier) · `GradeModelDropdown` + `GradeCreditCaption` · `MockInterviewHistory` · `MockInterviewTrackSnapshot`
- interview: `InterviewerPresence` · `VoiceHero` · `MockInterviewWorkspace` (TabsCard: Whiteboard/Code/Notes)
- scorecard: `MockInterviewScorecard`

## Conversion lens (grounded — ngữ nghĩa thật)
- **CTA:** setup "Vào phòng" (1 primary, Fogg) · scorecard "Học điểm yếu" → **module** (không phải lesson/challenge — deep-link theo `InterviewQuestion.moduleId`).
- **Link:** scorecard → module yếu (deep-link mang ý định). MockInterview **KHÔNG phát XP** (đừng gợi XP).
- **Psych:** goal-gradient = dots (trung tính, KHÔNG điểm real-time) · room-feel = persona · hook = retry (đề mới) · **grade-at-end HONEST** (`assessment-integrity`).

## Files touched (build B1-B4)
- `src/app/[locale]/courses/[courseId]/learn/layout.tsx` — `isMockInterview` + đọc `?phase=interview` → `fullBleed` (drop rail).
- `src/components/features/learn/MockInterview/MockInterviewSession/index.tsx` — mirror `phase`→URL `?phase=` (guarded) + render qna: workspace → RIGHT pane bung-theo-yêu-cầu (grid 2-cột lg / stack mobile / mounted giữ buffer).
- `src/components/features/learn/MockInterview/index.tsx` — full-width + ẩn PageHeader khi `?phase=interview`.

## Verify
- ✅ `tsc --noEmit` exit 0, 0 lỗi · ✅ eslint clean.
- ⏳ Visual browser: chưa (Preview MCP không track được server FE cross-repo từ session cwd backend — xem `preview-tool-cross-repo-workspace-limitation` memory). Đã xác nhận gián tiếp qua screenshot thầy gửi (interview phase render đúng full-bleed 2-pane) + đọc trực tiếp source.

## Batch 2 (2026-07-08) — re-audit CTA/link full flow, fix 2 gap thật
Full-brainstorm lại (yêu cầu thầy) → đọc lại toàn bộ source thật (không chỉ doc) → xác nhận shell/CTA/link B1-B4 ở trên **ĐÃ ÁP ĐÚNG**, không cần redesign. 2 gap CODE thật tìm được + đã fix:
1. **Workspace không tự đóng theo câu** (`MockInterviewSession/index.tsx`) — `workspaceOpen` là state cấp-phiên, tự mở khi câu có `givenCode` nhưng không tự đóng cho câu sau không cần → dính mở hết phiên (vi phạm "bung-theo-yêu-cầu"). Fix: `workspaceAutoOpenedRef` phân biệt auto-open (đóng lại được) vs manual-open (giữ nguyên, không clobber user tự mở để ghi chú).
2. **History overflow không có "+N xem thêm"** (`MockInterviewHistory/index.tsx`) — cap cứng `HISTORY_PAGE_SIZE=10`, vi phạm `layout-must-funnel-to-courses-and-cover-full-data-state-matrix` Luật 2. Fix: dùng `totalCount` (đã có sẵn ở BE response `QueryMyMockInterviewAttemptsResponseData`) + `LabeledCard.onSeeMore`/`seeMoreLabel` load-more (tăng `limit`, không cần route/drawer mới). Thêm i18n key `mockInterview.historySeeMore` (vi/en).
- ✅ `tsc --noEmit` + eslint sạch trên cả 2 file sửa.
- **Gap out-of-scope note lại** (không fix): `VoiceUnavailableModal` (component viết sẵn, mô tả nhắc TTS tiếng Việt) không import/wire ở đâu trong app — dead code hoặc tính năng dang dở.
