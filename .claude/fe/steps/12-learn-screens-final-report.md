# Bước 12 — Báo cáo cuối: toàn bộ `learn/` screens (Storybook)

Workflow `build-all-learn-screens` (task `webkzoyd8`, batch=5+retry) đã dựng xong **17/17
màn** trong `courses/[courseId]/learn/**`. Đã `TaskStop` để dừng ở đây cho thầy review —
**98 file/thư mục còn UNCOMMITTED**, chưa ai đụng vào ngoài agent.

## 1. 17 pages đã dựng

| Page | Trạng thái | Ghi chú |
|---|---|---|
| ContentScreen | đã commit (session trước) | fix render Toolbar |
| QuizScreen | đã commit | |
| ChallengeScreen | đã commit | |
| ChallengeResultScreen | đã commit | |
| CourseContents | đã commit | |
| FlashcardReviewScreen | **mới, chưa commit** | |
| FoundationsGridScreen | **mới, chưa commit** | |
| FoundationsCategoryScreen | **mới, chưa commit** | |
| FoundationResourceScreen | **mới, chưa commit** | |
| LeaderboardScreen | **mới, chưa commit** | |
| MindMapScreen | **mới, chưa commit** | không nằm trong `SCREENS` gốc — agent tự phát hiện route thiếu, thêm vào |
| MockInterviewScreen | **mới, chưa commit** | phase `setup/live/result`, xem gap §3 |
| ModulePageScreen | đã commit | |
| PlaygroundHubScreen | **mới, chưa commit** | |
| PlaygroundPrepareScreen | **mới, chưa commit** | |
| PlaygroundSessionScreen | **mới, chưa commit** | |
| HeadhuntingsScreen | **mới, chưa commit** | |

**76 block** đã dựng dưới `starci/blocks/{learn,commerce,consultant,navigation}` (38 cái mới
lượt này, còn lại từ trước). Danh sách đầy đủ nằm trong `.storybook/components/README.md`
và có thể liệt bằng `git status --porcelain`.

## 2. 9/9 cổng + tsc

Mỗi agent tự chạy đủ 9 cổng (`check-no-namespace`, `check-story-ids`, `check-seams`,
`check-inline-types`, `check-padding`, `check-one-instance-per-state`,
`check-member-as-state`, `check-orphan-parts`, `check-passthrough-block`) + `tsc --noEmit`
+ `eslint --fix` TRƯỚC khi báo xong, log verbatim trong journal. 0 lỗi mới, 0 namespace mới.

Một nghi vấn namespace từ journal đã **verify lại và loại bỏ**: `Feedback.Callout` /
`SurfaceCard.CrossList` chỉ là văn xuôi tốc ký trong comment
(`MockInterviewScorecard.stories.tsx:13-16`) — code thật import phẳng
`FeedbackCallout`, `SurfaceCardCrossList` từ `composites/feedback/Feedback` và
`composites/cards/SurfaceCard`. Không vi phạm gì.

## 3. Gap có chủ đích (§B3) — CẦN feedback

Mỗi block/page ghi rõ gap trong file header thay vì giả engine. Đáng chú ý nhất:

- **MockInterviewScreen**: chưa có confirm-dialog khi rời/kết-thúc-sớm, chưa có
  `Disclosure` "Tùy chỉnh phiên", chưa có pane whiteboard/code workspace, chưa có
  5-phase Design-mode script, chưa có tab History/Stats.
- **PlaygroundSessionScreen / PlaygroundPrepareScreen / PlaygroundHubScreen**: engine
  kết nối máy ảo thật (VNC/terminal) chưa build — để nguyên chỗ trống có ghi chú, không
  giả bằng div.
- **MindMapScreen**: engine canvas mind-map thật (kéo-thả, zoom) chưa build.

## 4. CẦN thầy quyết trước khi build tiếp

1. **`PremiumGateModal` (overlay) vs `ContentPaywall` (block đã dựng)** — nghi trùng khái
   niệm, chưa đọc kỹ để xác nhận. Cần đọc `src` trước khi dựng overlay "premium gate".
2. **`layouts/` còn trống hoàn toàn** — chưa dựng `InnerLayout` (root, Navbar+overlay
   mount) và `LearnShell` (`learn/layout.tsx`).
3. **`personal-project/layout.tsx` và `profile/[username]/layout.tsx`** — cả hai có
   `page.tsx` rỗng đi kèm, nghi nội dung màn bị đặt nhầm vào layout. Chưa đọc để confirm.
4. **`overlays/{modals,drawers}` còn trống** — 26 overlay toàn cục đã đo (21 modal + 5
   drawer, xem `11-overlays-layouts-brainstorm.md` §2), chưa cái nào dựng.
5. **Login `miamia`/`nivo`** — batch cũ đã XÓA do lỗi `args.app` undefined (session
   trước). Chưa dựng lại; cần workflow có guard trước khi chạy lại.
6. **71 route ngoài `learn/`** — đã liệt kê + map sang feature component (từ turn trước),
   CHƯA có workflow build.

## 5. Đề nghị

Dừng ở đây để thầy review/gộp (`git add`/`git diff` trên 98 file), sửa/xoá component nào
thầy thấy sai trước khi trò build tiếp phần `layouts`/`overlays`/71-route còn lại.
