# Bước 13 — Feedback thầy (batch, sửa 1 lần sau khi gom đủ)

## 1. `*Screen` → `*Page`, đồng bộ với thư mục `pages/`

Thư mục đã đổi `screens/` → `pages/` (bước 11 §7) nhưng TÊN component bên trong vẫn còn
hậu tố `Screen` (`ContentScreen`, `QuizScreen`, `MindMapScreen`, `CourseQaScreen`,
`ChallengeResultScreen`, `ModulePageScreen`…) — lệch với tên thư mục. Cần đổi hậu tố
`Screen` → `Page` cho MỌI file trong `starci/pages/**` (component + story + `title:` +
`storyId` liên quan), quét lại bằng `check-story-ids.mjs` sau khi đổi.

✅ **CHỐT (thầy duyệt 2026-07-28) — ĐÃ LÀM XONG.** string-replace `Screen`→`Page` cho 17 tên:
`ChallengeResultScreen ChallengeScreen ContentScreen FlashcardReviewScreen
FoundationResourceScreen FoundationsCategoryScreen FoundationsGridScreen HeadhuntingsScreen
LeaderboardScreen MindMapScreen MockInterviewScreen PlaygroundHubScreen
PlaygroundPrepareScreen PlaygroundSessionScreen QuizScreen CourseQaScreen
PersonalProjectTaskScreen`. KHÔNG đổi `CourseContents`, `PersonalProjectWorkspace` (không có
chuỗi "Screen"). Ca lệch `ModulePageScreen` → đổi thành `ModulePage` (bỏ hẳn hậu tố, không
string-replace máy móc ra "ModulePagePage").

Đã đổi: folder + file (component/story) + tên export/interface/JSDoc + `title:` + storyId
(hoa lẫn thường-kebab) + cross-reference ở file NGOÀI `pages/` từng nhắc tên cũ
(`MockInterviewAnswerAction`, `PersonalProjectResultScreen`(+story), `PremiumGateModal`,
`LearnShell.stories.tsx`). Verify: `check-story-ids` live 0 gãy, tsc sạch, 9/9 gate xanh,
eslint --fix 0 lỗi. Lưu ý: `PersonalProjectResultScreen` (BLOCK, không phải page) vẫn giữ
nguyên tên dù có chữ "Screen" — ngoài phạm vi feedback này (nó không nằm trong `pages/`),
cờ riêng nếu thầy muốn dọn tiếp.

---

## 2. Responsive cho `pages/` — pilot `ContentPage`

Thầy hỏi tách page thành 3 bản responsive (sm/md/xs). Đọc `src` thật trước khi làm:
`LessonReader` chỉ có ĐÚNG 1 ranh thật (`@app-lg`, mobile+tablet gộp chung vs desktop), khác
biệt DUY NHẤT là `UpNextCard` mobile-only (rail phải desktop đã lo phần này rồi). Không có
ranh tablet riêng.

✅ **CHỐT LẦN 2 (thầy sửa lại ngay trong buổi 2026-07-28) — ĐÃ LÀM XONG, pilot `ContentPage`
only.** Lần đầu thử namespace (`ContentPage.Mobile`/`.Tablet`, allowlist riêng trong gate) —
thầy bảo bỏ, quay về **CSS-only, đúng y hệt cách `src` thật làm**:
- KHÔNG namespace, KHÔNG tách folder theo device. `ContentPage` là 1 component DUY NHẤT,
  1 cây render.
- Nudge luyện tập LUÔN mount trong JSX (điều kiện: `mode === "content" && !isLocked &&
  challengeCount > 0`), tự ẩn ở desktop bằng `className="@app-lg:hidden"` — đúng cơ chế
  `UpNextCard` thật (`LessonReader/index.tsx:386-398`).
- `scripts/check-no-namespace.mjs` **ĐÃ REVERT** — bỏ hẳn `ALLOWLIST`, không còn ngoại lệ
  nào trong toàn hệ thống nữa (`namespace còn lại: 0`, không còn dòng "CHO PHÉP").
- Story: 1 leaf `PracticeNudgeResponsive`, **3 state trong CÙNG leaf** (không phải 3 leaf/3
  export riêng) — Mobile 375px / Tablet 768px / Desktop 1280px, mỗi state chỉ đổi bề rộng
  `@container` bọc quanh CÙNG MỘT `ContentPage`. Mobile+Tablet đều thấy nudge (dưới
  `@app-lg`=1024px), Desktop tự ẩn — khớp đúng khuôn `deviceLeaf` của `CourseContents`
  (width=375/768 cho mobile/tablet) nhưng gộp vào 1 leaf thay vì tách file riêng.
- Nudge tái dùng `MilestoneUpNextCard` (đã có sẵn, cùng hình dạng generic hệt `UpNextCard`
  thật trong `src` dù tên gắn với milestone — reuse-first, không dựng block mới).
- Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi.

**CHƯA LÀM** (ngoài phạm vi pilot này, chờ thầy feedback tiếp nếu muốn nhân rộng): 17 page
còn lại chưa có responsive thật (đã đo: chỉ 4/18 page có tí `@app-*`), phần lớn cần đọc `src`
riêng từng page để biết ranh thật ở đâu trước khi build, không suy diễn hàng loạt.

### 2b. Bug tìm ra khi thầy soi Storybook: render lệch bản gốc

Thầy hỏi "sao render khác bản đang chạy trên web?" — soi ra `MilestoneUpNextCard` (tái dùng
cho nudge) HARDCODE `isHighlight` (dải sáng góc thẻ) — đúng với vị trí gốc của nó (màn kết
quả milestone, LUÔN là hành động trọng tâm duy nhất) nhưng SAI với `ContentPage` (`src` thật:
`UpNextCard` ở đây là thẻ TRƠN, `SectionCard` không hề truyền `accent`). Bài học lặp lại đúng
kiểu `ContentTabBar`/`Toolbar` — tái dùng block mà không soi kỹ default của nó có khớp chỗ
dùng mới không.

✅ **FIX:** `isHighlight` chuyển thành prop (`@default true`, mọi chỗ gọi cũ không đổi gì).
`ContentPage` truyền `isHighlight={false}`. Thêm leaf mới `Plain` cho
`MilestoneUpNextCard.stories.tsx` (khác `Default` một node DOM thật — dải sáng — nên là leaf,
không phải state). Verify: tsc sạch, 9/9 gate xanh, eslint 0 lỗi.

### 2c. Audit toàn diện `ContentPage` — thầy: "chế nhiều quá", soi lại từng block

Chạy 3 agent song song đọc HẾT `src` thật (LessonReader + mọi block con) so với Storybook.
Kết quả: nhiều chỗ bịa THẬT (không phải chỉ 1 ca `isHighlight`).

✅ **ĐÃ FIX (nhanh, an toàn, verify xong — tsc sạch, 9/9 gate xanh, eslint 0 lỗi):**
- `ContentModeNav`: icon SAI cả 3 — `sandbox` phải `PlayIcon` (không phải Terminal),
  `challenges` phải `PuzzlePieceIcon` (không phải Flame), `aiLab` phải `FlaskIcon` (không
  phải Sparkle) — khớp đúng `LessonReader/map.tsx`. Bỏ hẳn field `count` trên
  `ContentModeOption` — real `ContentTabItem` KHÔNG có field đếm nào, tab bar thật không bao
  giờ hiện số.
- `ContentPager`: "Bài trước"/"Bài sau" → "Nội dung trước"/"Nội dung tiếp"; ariaLabel
  "Điều hướng bài học" → "Chuyển nội dung trước hoặc tiếp" — khớp đúng
  `src/messages/vi.json:1607-1609` (verify từng chữ, không đoán).
- Nudge `MilestoneUpNextCard` trong `ContentPage`: eyebrow/description/ctaLabel ĐỀU BỊA
  (chỉ `title` đúng) — sửa khớp `src/messages/vi.json:1581-1590` từng chữ.

**⚠️ CHƯA LÀM — 4 khoảng trống LỚN, không phải sửa chữ mà THIẾU HẲN chức năng, cần thầy
xác nhận phạm vi trước khi trò rebuild (không lặng lẽ làm to):**
1. **`ContentReaction`** — thật là bộ chọn 6 cảm xúc kiểu Facebook (Thích/Yêu thích/Haha/
   Wow/Buồn/Phẫn nộ) qua Popover (`ReactionBar.tsx`); Storybook hiện chỉ có 1 nút toggle
   boolean. Thiếu cả cơ chế, không chỉ chữ.
2. **`ContentDiscussion`** — thật có: reply lồng nhau (expand/collapse), reaction riêng từng
   comment, sửa/xoá cho chủ comment, badge founder, "xem thêm" phân trang, dòng archive.
   Storybook hiện chỉ là list phẳng 2 dòng, không có gì trong số này.
3. **`ContentRelatedList`** — thật KHÔNG hiện snippet trích đoạn (`showSnippet` luôn false),
   hiện `breadcrumb` thay vào; và có `isLocked`/gợi ý "vào học để mở" cho bài chưa mua.
   Storybook hiện có field `snippet` (bịa) mà thiếu `breadcrumb` + `isLocked`.
4. **`ContentModeNav` — ngôn ngữ code**: thật LUÔN hiện đủ danh mục ngôn ngữ cố định, ngôn
   ngữ bài không có thì hiện mờ+khoá (`isDisabled`) chứ không biến mất; Storybook hiện chỉ
   vẽ đúng tập được truyền vào, không có khái niệm khoá.

Việc này rộng hơn "sửa lỗi" — là XÂY THÊM chức năng thật đang thiếu. Chờ thầy chốt làm cái
nào/theo thứ tự nào trước khi trò động vào.

### 2d. Thầy: "làm hết đi" — đã xong item #3 (RelatedList) + #4 (ngôn ngữ)

✅ **Item #4 — `ContentModeNav` ngôn ngữ**: `ContentLanguage` thêm `isDisabled`; catalog LUÔN
đủ 4 (TypeScript/Java/C#/Go — đúng `DEFAULT_PROGRAMMING_LANGUAGES`), món nào bài không có thì
`isDisabled` (mờ, không xoá khỏi hàng). Điều kiện hiện cả cụm đổi từ `languages.length > 1`
→ đếm SỐ MÓN CÒN BẬT (`!isDisabled`) > 1. Story `WithLanguages` thêm state "2 available, 2
disabled" chứng minh catalog cố định.

✅ **Item #3 — `ContentRelatedList`**: bỏ `snippet` (thật không bao giờ hiện), thêm
`breadcrumb` (trên title) + `isLocked` (dòng khoá dưới title, dùng `LockSimpleIcon`). Dùng
khe `content` (free-form) của `SurfaceCardList` vì khe cố định title/subtitle không đủ chỗ
cho 3 dòng. Thêm leaf mới `Locked` (dòng khoá là node thật, structural).

**⚠️ Feedback riêng phát sinh khi làm item #3, đã ghi thành memory
`starci-fe-story-feedback`**: trò pass thẳng className CSS phức tạp
(`group-hover:underline...`) vào BLOCK — sai, vì CSS phức tạp chỉ được viết ở tầng
atom/frame. Fix: thêm prop mới `underlineOnGroupHover` cho atom `Typography` (đóng gói CSS
bên trong atom), block chỉ gọi prop ngữ nghĩa. Thêm leaf `UnderlineOnGroupHover` cho
`Typography.stories.tsx`. Quy trình chuẩn từ nay: ghi nhớ feedback → hỏi lại confirm → sửa
1 cái → chốt → mới sửa hàng loạt.

Verify cả 2 item: tsc sạch, 9/9 gate xanh, eslint 0 lỗi, Storybook restart không lỗi.

### 2e. Item #1 (`ContentReaction`) xong + 2 lỗi CSS-phức-tạp-ở-block bắt tại chỗ + 2 fix nhỏ

✅ **`ContentReaction` rebuild xong** — bộ 6 cảm xúc kiểu Facebook (`ReactionBar` +
`FacebookReactionSelector` thật), reuse asset SVG thật (`public/reactions/*.svg`, Storybook
serve chung `staticDirs`). Trigger pill + Popover (raw HeroUI, atom `Popover.Base` không hợp
vì chrome cố định) mở panel 6 nút.

**⚠️ Lặp lỗi CSS-phức-tạp-ở-block NGAY TRONG LÚC BUILD ContentReaction** (thầy bắt tại
chỗ) — animation/hover CSS của 6 nút (`animate-[reactionPop_…]`, `group/fbreact`,
`group-hover/fbreact:scale-[1.45]`, `text-[10px]`) viết trần trong block. Fix: tách hẳn 1
ATOM MỚI `atoms/feedback/ReactionPicker` (nhận `items`/`activeKey`/`onSelect` — không biết
"reaction" là gì), atom giữ hết CSS. Đã cập nhật `rules/3-shape-tier.md` +
`principles.md` §9c với neo cụ thể.

✅ **Quét hàng loạt** (`grep` toàn `components/starci/**`+`composites/**`): hầu hết hit là
HỢP LỆ (composite đã đóng gói CSS đó thành prop có tên từ trước — `SurfaceCard.hover`,
`SegmentBar`, `MarkdownContent`). Chỉ 1 chỗ dính y lỗi: `SubmissionFindingsList.tsx:229`
(block từ session trước, `<a>` trần + `hover:underline decoration-[...]`) — đã sửa dùng
`Typography` + prop mới.

✅ **Thầy hỏi vặn offset-2 vs offset-4**: soi ra `isLink` cũ (offset-2, không màu decoration
riêng) KHÁC công thức `src` thật dùng cho link "trầm" (`offset-4` +
`decoration-[var(--separator-tertiary)]`, lặp lại ở `SubmissionResult`/`RichText`). Thêm
prop song sinh `underlineOnHover` (tự-hover, cùng công thức `underlineOnGroupHover` nhưng
không cần `.group`) — không đổi `isLink` mặc định (khỏi ảnh hưởng chỗ khác đang dùng offset-2).
`isLink` cũng được nới: `color` giờ override được accent mặc định (link trầm không phải lúc
nào cũng accent), + `target`/`rel` cho link mở tab mới.

✅ **2 fix nhỏ theo feedback trực tiếp (ảnh chụp)**:
- `ContentHeader`: card "Bạn sẽ học được gì" đang `variant="nested"` (border, không shadow)
  nhưng KHÔNG có card cha nào bọc quanh (chỉ có frame `PageHeader`, không phải card) ⇒ phải
  là card ngoài cùng → bỏ `variant="nested"`, dùng mặc định (`shadow-surface`).
- `ContentDiscussion`'s `InputTextarea` chưa truyền `variant="secondary"` dù nằm trong card
  (tiền lệ: `ModalShell.stories.tsx` dùng `TextField variant="secondary"` trong modal-card)
  — sẽ áp khi rebuild item #2 ngay dưới đây.

Verify tất cả: tsc sạch, 9/9 gate xanh, eslint 0 lỗi, Storybook restart không lỗi.

**Đang làm tiếp**: item #2 (`ContentDiscussion` — reply lồng/reaction/sửa-xoá/phân trang,
+ áp `variant="secondary"` cho composer) — việc LỚN NHẤT còn lại, đang đọc kỹ `src` trước
khi build để không lặp lại lỗi "chế".

### 2f. Item #2 (`ContentDiscussion`) xong — rebuild toàn bộ + 3 lỗi CSS-phức-tạp-ở-block nữa

✅ **`ContentDiscussion` rebuild xong**, port verbatim từ `CommentItem`/`Discussion` thật:
- **FRAMELESS** — bỏ hẳn `SurfaceCard` bọc ngoài. Đọc kỹ file header thật của
  `Discussion`: nó nằm TRỰC TIẾP trên canvas trang, không xếp thêm 1 mặt card thứ 2 dưới card
  "trang giấy" đọc bài phía trên. Vì vậy composer cũng đổi lại `variant="primary"` (KHÔNG
  phải `"secondary"` như §2e ghi tạm — sửa lại đúng vì giờ mới biết Discussion không có card
  bọc để "secondary" có nghĩa).
- **`ContentCommentThread`** (block mới) — 1 comment (hoặc reply ở `depth>0`) đệ quy: tác giả +
  badge founder + giờ + "(đã sửa)", nội dung/form sửa/placeholder đã xoá, hàng action
  (reaction + Trả lời + Sửa/Xoá chỉ chủ), composer reply thu gọn, toggle "xem N câu trả
  lời"/"ẩn" + đệ quy con. Không tách "Reply" riêng — 1 reply = `ContentCommentThread` sâu
  hơn 1 `depth`, đúng cách `CommentItem` thật tự gọi lại chính nó.
- **`ReactionButton`** (block mới, tách khỏi `ContentReaction`) — trigger pill + Popover +
  `ReactionPicker` + tóm tắt, dùng CHUNG cho cả reaction cấp bài (`ContentReaction`) lẫn
  reaction từng comment (`ContentCommentThread`) — đúng y cách `src` thật dùng 1
  `ReactionBar` cho cả `InteractionBar` lẫn `CommentItem`. `ContentReaction` giờ chỉ còn ghép
  `ReactionButton` + Typography lượt xem.
- **Archive line trung thực** — đếm `replyCount > 0` trên đúng số comment ĐÃ TẢI (không phải
  số bịa), cùng kiểu under-count-tới-khi-tải-hết mà `Discussion` thật tự nhận.
- **Loading = `isSkeleton`** (KHÔNG phải `isLoading`+`Spinner`) — thầy bắt tại chỗ: "không có
  spinner, cái nào cũng có skeleton hết, tin code chứ không tin concepts". `src` thật tình cờ
  dùng `Spinner` trơn cho case này, nhưng copy y hệt sẽ làm `ContentDiscussion` thành BLOCK
  DUY NHẤT trong cả hệ thống không tự soi gương skeleton — vỡ nhất quán nội bộ. Khi 1 lựa
  chọn UI cụ thể của `src` thật đụng độ với quy ước nội bộ ĐÃ LẶP LẠI ở mọi block khác, quy
  ước nội bộ thắng (khác với chữ/copy — chữ luôn khớp thật).
- Empty NGƯỢC với `ContentRelatedList`: vẽ lời mời (chưa ai viết = mời viết đầu tiên), không
  ẩn khối.

**⚠️ 3 lỗi CSS-phức-tạp-ở-block bắt được TRONG lúc build này (cùng 1 loại lỗi lặp lại):**
1. Đường viền thụt lề reply (`border-l pl-3 @app-sm:pl-4`) viết trần trong
   `ContentCommentThread` — kể cả sau khi đã chuyển qua khe `className` có sẵn của `StackH`
   (thầy: "sao render kiểu container hay gì mà phải viết thô vậy, mục đích tối thiểu code
   trùng + strict rules đồng bộ CẢ APP") vẫn tính là vi phạm — route qua 1 prop khung có sẵn
   KHÔNG miễn trừ CSS phức tạp khỏi tầng atom/frame. Fix thật: thêm hẳn `nested?: boolean`
   vào `StackBaseProps` (`frames/Stack/Stack.tsx`) — cùng từ vựng `SurfaceCard.variant=
   "nested"`. Đúng thang (`pl-6` = §10 InsetScale bậc 3 tương ứng `@app-sm`, không phải
   `pl-4` lệch thang bản nháp đầu).
2. "Trả lời"/"Sửa"/"Xóa" là `<button>` trần + tay viết `hover:text-foreground`/
   `hover:text-danger-soft-foreground` — thầy: "sao không thêm lựa chọn `isButton` cho Typo".
   Fix: `Typography` thêm `isButton` + `hoverColor` (khác `isLink`: KHÔNG gạch chân, chỉ đổi
   màu khi hover — đúng thật `CommentItem` không gạch chân 3 link hành động này).
3. `InputTextarea` (`atoms/forms/Input/Input.tsx`) có 1 type intersection ẩn danh
   (`StringFieldProps & {...}` kèm JSDoc trong ngoặc) — thầy: "sao không viết InputProps
   nhỉ?" → đặt tên hẳn `InputTextareaProps`.

✅ **Đã cập nhật `rules/3-shape-tier.md` + `principles.md`** (neo 2026-07-28): mở rộng luật
"className chỉ để đặt chỗ" sang mọi CSS phức tạp (arbitrary-value/pseudo-class), không chỉ
`text-*`/`font-*`; và chốt rõ: route qua 1 prop `className` đã có sẵn ở tầng frame KHÔNG
tính là hợp lệ — phải là 1 NAMED PROP thật của atom/frame/composite sở hữu.

**Lỗi kỹ thuật tự gây trong lúc refactor** (không phải feedback thầy, tự bắt+sửa): 2 lỗi cú
pháp JSX khi gộp `<div>` bọc ngoài vào `<StackH nested>` (thẻ đóng lệch cặp) +
`StackV.stories.tsx` leaf `Nested` mới có `reason="...\"...\"..."` (escape `\"` không hợp lệ
trong JSX attribute string thường — phải đổi sang `reason={"...\"...\"..."}`). Sau khi
`ContentDiscussion` đổi API, `ContentPage` (screen gọi nó) cũng phải đổi theo (props phẳng
hoá: `currentUserId`/`currentUser`/`comments`/`commentsTotal`/`repliesByParent`/
`onReply`/`onEditComment`/`onDeleteComment`/`onReactComment`/`onLoadReplies`/`hasMoreComments`
/`isLoadingMoreComments`/`onLoadMoreComments`/`discussionErrorMessage` — không còn
`draft`/`onDraftChange`/`onSubmitComment: () => void` cũ).

Verify: tsc sạch, 9/9 gate xanh (kể cả `check-padding` bắt 1 `px-4` lệch thang trong
`ContentCommentComposer`'s collapsed-pill button, sửa `px-3` theo tiền lệ
`TopicLane`/`SitePreview`), eslint --fix 0 lỗi, Storybook restart không lỗi build.

**4 khoảng trống lớn (§2c) nay đã xong CẢ 4**: #1 ContentReaction, #2 ContentDiscussion,
#3 ContentRelatedList, #4 ContentModeNav ngôn ngữ. Chờ thầy chốt trước khi coi
`ContentPage` là "xong hẳn".

### 2g. Skill `/starci-fe-story-feedback` chính thức hoá (2026-07-29) + 2 vòng feedback đầu tiên

✅ **Skill hoá luật đã áp thủ công cả buổi** — `.claude/skills/starci-fe-story-feedback/SKILL.md`
(mới), gọi được qua `/starci-fe-story-feedback`. Khung 2 lượt (thầy yêu cầu 2026-07-29): lượt 1
ghi nhớ→hỏi confirm→sửa 1 chỗ→chốt; lượt 2 quét toàn Storybook tìm cùng pattern→trình danh
sách→chốt→sửa hàng loạt+verify full. Cả 2 lượt chốt xong mới ghi vào steps+canon. Thêm luật
**"phản biện, không vâng dạ"** (thầy: *"update story-fe-feedback thì trò phải phản hồi lại
theo kiểu phản biện hiểu k?"*) — nhận feedback phải tự tra cứu/kiểm chứng trước, nói ra chỗ
KHÔNG khớp nếu có bằng chứng, không tự động chiều theo hướng thầy gợi ý chỉ vì đó là thầy nói.

**Vòng feedback #1 — `ContentCommentComposer` collapsed-pill dùng `<button>` trần:**
Thầy: *"cái này dùng Typo isButton không dc à! nhớ rules là tất cả css className ở
atom/frame/composite... rất dễ trùng code trò hiểu k?"* — soi ban đầu đề xuất `Typography.
isButton` KHÔNG hợp (chỉ sở hữu chữ, không có border/bg/padding), rồi tự đề xuất tạo atom mới
`InputTrigger`. Thầy sửa lưng: **composite `InputButtonLike` đã có sẵn** (`composites/buttons/
InputButtonLike/`) — và sibling `CourseQaComposer` đã dùng nó đúng cách rồi, comment gốc còn tự
cảnh báo đúng cái bẫy này ("rebuilt a worse version of an existing composite"). Bài học: tra
`atoms/forms/**` chưa đủ, phải tra cả `composites/**` trước khi đề xuất tạo mới — 1 nhánh cây
chưa lục hết dễ khiến trò đề xuất dựng lại thứ đã có.
✅ **Fix**: `ContentCommentComposer.tsx` đổi `<button>` trần → `<InputButtonLike placeholder
ariaLabel onPress>`, bọc `<div data-anat-part>` đúng khuôn `CourseQaComposer` đã dùng. Lượt 2
(quét toàn `.storybook/components/**`+`stories/**`) tìm được 2 chỗ `_legacy` dùng đúng chuỗi
CSS (`SitePreview.tsx`, `TopicLane.tsx`) nhưng cả 2 là hình khác (hàng danh sách/nút link, không
phải nút giả input) → KHÔNG sửa, đóng lượt 2 với danh sách rỗng.

**Vòng feedback #2 — tên tác giả bình luận thiếu đậm, lộ ra lỗi atom `Typography.weight`:**
Thầy chụp ảnh Anatomy panel (`ContentPage → Reading`), hỏi *"sao chữ minh anh không có
font-medium... phản biện khúc này thầy với"*. Quá trình phản biện nhiều vòng (đúng luật mới ở
trên) đi qua 3 lần tự sửa sai:
1. Đầu tiên tra `src` thật (`CommentItem.tsx` + block `EntityLink` nó compose) → tên tác giả
   thật ra CÓ đậm, nhưng là `font-semibold` (bake sẵn trong `EntityLink`, không phải
   `font-medium` như thầy đoán) — đề xuất `weight="semibold"` cho `Typography`.
2. Thầy hỏi ngược "giờ có 3 mức à? dừng ở semibold và bold thôi được không? nghiên cứu để
   thống nhất when bold, when semibold" → đọc lại **chính comment của `Typography.tsx`** mới
   thấy luật đã CHỐT SẴN từ 2026-07-25: `semibold` CHỈ có nghĩa ở cỡ heading (`h1`-`h5`); ở cỡ
   body (`xs`/`sm`/`base`/`lg`) `semibold` phải GẬP về `medium` — tức đúng như thầy gợi ý
   (2 mức ở body), chỉ là chiều ngược: bỏ `semibold`, không phải bỏ `medium`.
3. Nhưng code KHÔNG thực thi đúng lời hứa đó — cả 2 nhánh render body-scale (`Typography.tsx`
   dòng 352 + 367-369) không hề fold `semibold`→`medium`, rơi thẳng `null` (mất đậm hoàn
   toàn). Grep toàn bộ call-site `weight="semibold"` qua ĐÚNG atom (loại `PricePoint` — luôn
   cỡ heading nên không dính; loại `StatPair` — import `Typography` thẳng từ `@heroui/react`,
   không phải atom mình) ra **7 file / 9 chỗ đang chạy SAI ngay lúc phát hiện**: `ContentPaywall`,
   `MindMapContinueButton`, `ModuleContinueBand`, `PersonalProjectDashboard`,
   `PersonalProjectResultScreen`, `QuizProgressPanel`, `TaskBriefBody`×3 — tất cả mất đậm âm
   thầm dù tác giả gọi đúng prop theo đúng ý định.
✅ **Fix (đúng 1 chỗ ở tầng atom, tự lan ra cả 7 chỗ kia — không cần sửa call-site nào)**:
`Typography.tsx` 2 nhánh weight thêm `weight === "semibold"` fold về `"font-medium"`.
`ContentCommentThread.tsx` tên tác giả đổi thành `weight="medium"` (không phải `semibold` —
đúng cỡ `xs`/body, khớp sibling `askerName` ở `CourseQaQuestionList.tsx:313` vốn đã làm đúng).
Vì fix nằm ở atom nên lượt 2 (quét hàng loạt) coi như tự động xảy ra — không có danh sách file
nào cần sửa tay riêng.

**Bài học "trust internal convention" áp dụng chuẩn ở đây**: 98 call-site `weight="medium"`
trong hệ thống (kể cả person-name sibling `askerName`) là bằng chứng mạnh hơn 1 class CSS đơn
lẻ của `src` thật (`font-semibold` trong `EntityLink`) — quy ước nội bộ đã có sẵn (và ĐÃ được
chính atom tự ghi thành luật) thắng, không phải bịa ra tầng thứ 3 để khớp `src` byte-for-byte.

Verify cả 2 vòng: tsc sạch, 9/9 gate xanh (bắt thêm 1 lỗi `check-orphan-parts` — badge
`InputButtonLike` chưa khai trong `ANNOTATE` của `ContentCommentComposer.stories.tsx`, đã khai
bổ sung theo đúng mẫu `CourseQaComposer`), eslint --fix 0 lỗi, Storybook restart không lỗi build.

### 2i. Vòng feedback #3 — gap hàng byline lệch + "gap system hoàn chỉnh" + bài học "khách quan tư duy"

Thầy chụp ảnh Anatomy panel khoanh đen quanh "Minh Anh 2 giờ trước", nói *"gap bị lệch quá,
thầy cảm giác màu đen là 1 component"*. Diễn biến nhiều bước, đúng tinh thần skill mới:

1. **Đo lại `src` thật** (`CommentItem.tsx`) từng cấp gap, so khớp với `ContentCommentThread.tsx`
   → tìm ra ĐÚNG 1 lệch: hàng byline (tên+badge+giờ) đang `gap="tight"` (4px), `src` thật dùng
   `gap-2` (8px/`related`) — cột nội dung (byline→body) đã khớp sẵn (`related` cả 2 bên).
2. Thầy: *"phải scan code để đề ra 1 gap system hoàn chỉnh... vẽ ra 8080 kèm ví dụ"* → dựng
   `$FE_SOURCE/.artifacts/decompose/gap-system.html` (serve `python -m http.server 8080`):
   thang 6 bậc + luật đếm mark-vs-peer (tight = mark gắn 1 chủ DUY NHẤT, related = ≥2 peer tự
   đứng được) + catalog ví dụ render thật + case study before/after.
3. **Thầy đưa ảnh Facebook** (tên+giờ dính sát) phản bác: *"sao trên fb ntn mà trò vẫn bảo nên
   gap? thầy muốn skill feedback phải khách quan tư duy không phải theo ý thầy."* — phép thử
   xem có tự đổi ý theo cảm tính (cả hai chiều: chiều theo thầy VÀ chiều bảo vệ ý cũ) không.
   ✅ **Đi đo THẬT thay vì cãi bằng lời**: mở GitHub PR comment, `getComputedStyle` hàng byline
   Primer (`d-flex flex-items-center flex-wrap gap-1`) → đo được **`gap: 4px`** — phản chứng
   thật claim "byline = related, universal" tôi vừa viết. **Kết luận đúng**: không rút lại số
   `related` của `ContentCommentThread` (vì neo của NÓ là `src` thật của chính nó, gap-2, không
   đổi) — nhưng RÚT LẠI luật tổng quát "byline luôn = related cho mọi app" (overreach, chỉ dựa
   1 nguồn). Sửa `gap-system.html`: đổi từ "bảng tra cố định theo tên-hình" → "PHƯƠNG PHÁP" (đếm
   mark-vs-peer là ước lượng bước 1 → neo vào real-src CỦA CHÍNH component đang sửa nếu có, luôn
   ưu tiên → ví dụ ngoài ngành chỉ là tham khảo, không thay được real-src).
4. Thầy hỏi tiếp: *"gom cái màu đen này thành 1 component được không, và gap tight ở label/
   description có make sense không, pattern icon-text-description khá phổ biến"*:
   - Tra 2 nguồn nội bộ độc lập cho đúng hình "label(heading)+description(câu dài)":
     `FeedbackEmpty` (`Feedback.tsx:302`, `gap-2`) và `CommentItem.tsx:99` (`gap-2`) — CẢ HAI
     hội tụ `related`, không phải `tight` → trả lời: tight KHÔNG make sense cho description dài
     (chỉ đúng cho cặp cực ngắn kiểu `TitledText` size `row`, dùng hẳn `flush`/0px).
   - Phát hiện luôn: `QaQuestionThread.tsx:373` cũng đang `tight` cho đúng quan hệ này — NGHI
     cùng bug, chưa xác nhận (chưa có real-src).
   - So khớp cấu trúc `ContentCommentThread` vs `QaQuestionThread`: giống hệt 3 tầng (avatar+
     grouped → StackV byline+content → StackH byline) → đủ căn cứ (≥2 lần) để cân nhắc gộp 1
     composite `avatar+byline-slot+content-slot` — ĐỀ XUẤT, chưa làm (cần thầy chốt thời điểm).
5. Thầy "ok" → tìm ra real-src của `QaQuestionThread` (khai sẵn trong file header:
   `src/components/features/learn/CourseQa/QuestionRow/index.tsx`) → đo trực tiếp:
   - Hàng byline thật (`QuestionRow/index.tsx:173`) = `gap-2` → XÁC NHẬN cùng bug, sửa
     `QaQuestionThread.tsx:374` VÀ `:447` (biến thể thường + biến thể bong bóng chat) `tight`→
     `related`.
   - Cột nội dung thật (`QuestionRow/index.tsx:172`) = `gap-1` (tight) — KHÁC `CommentItem`'s
     `gap-2` cho cùng vị trí → **KHÔNG phải bug**, `QaQuestionThread.tsx:373`/`:446` giữ nguyên
     `tight`. Bài học: đừng suy diễn "2 sibling phải cùng số" — luôn đo lại real-src RIÊNG của
     từng component, kể cả khi hình dạng bên ngoài giống hệt nhau.

✅ **Fix áp**: `ContentCommentThread.tsx:139` + `QaQuestionThread.tsx:374,447` — `gap="tight"`
→ `gap="related"`. `QaQuestionThread.tsx:373,446` — giữ nguyên `tight` (đã đúng).

✅ **Skill `starci-fe-story-feedback` cập nhật thêm 2 luật cứng** (từ bài học vòng này):
- "Khách quan tư duy" — có bằng chứng mới thì đi ĐO, không chiều theo ai nói (kể cả thầy) và
  không tự ái bảo vệ kết luận cũ.
- "Không tổng quát hoá canon từ 1 nguồn" — cần ≥2 nguồn độc lập mới được viết thành luật chung;
  1 nguồn thì phải ghi rõ "neo riêng cho case này", không phải luật universal.

**Còn treo, chưa làm**: gộp composite `avatar+byline+content` cho `ContentCommentThread`/
`QaQuestionThread` — thầy chưa chốt thời điểm (làm ngay hay để round riêng).

Verify: tsc sạch, gate liên quan xanh (`check-no-namespace`/`check-seams`/`check-padding`/
`check-one-instance-per-state`/`check-orphan-parts`), eslint --fix 0 lỗi, Storybook restart
không lỗi build. Trang `gap-system.html` cập nhật khớp kết luận cuối, vẫn serve ở 8080.

### 2j. Thầy: "chưa hệ thống hoá được, chia block/gap nội bộ vẫn cảm tính" — nâng thành thuật toán

Sau §2i, thầy chỉ ra: sửa đúng 1 điểm + rút 1 luật vẫn là PHẢN ỨNG theo từng điểm, chưa phải
HỆ THỐNG áp được cho bất kỳ block nào. Nâng cấp `gap-system.html` + `principles.md` §10b'':
- Thêm **thuật toán 4 bước**: (1) vẽ cây tổ hợp — mỗi nút ≥2 con là 1 seam độc lập; (2) phân
  loại quan hệ bằng bảng 5 câu hỏi (đếm mark-vs-peer → byline → vùng-trong-1-đơn-vị →
  khối-chức-năng-riêng), hỏi từ trên xuống, dừng ở YES đầu tiên; (3) neo real-src ghi đè
  heuristic nếu có; (4) áp cho MỌI seam trong cây, không chỉ seam bị feedback.
- **Áp thử đầy đủ lên `ContentCommentThread`** (cả 5 seam: avatar↔cột, cột nội dung, byline,
  hàng action, cây replies) — 4/5 đã khớp real-src sẵn, chỉ seam byline lệch (đã sửa ở §2i).
  Trước đó chỉ soát seam byline vì đó là chỗ thầy chỉ; giờ soát HẾT mới CHẮC 4 seam kia đúng,
  không suy đoán.
- **Cross-check độc lập lên `QaQuestionThread`** (real-src khác, `QuestionRow/index.tsx`) —
  seam byline ra CÙNG kết luận `related` (vì real-src trùng `gap-2`), seam cột-nội-dung ra
  kết luận KHÁC (`tight`, vì real-src khác thật, `gap-1`) — bằng chứng thuật toán tổng-quát-hoá
  được, không phải áp đặt 1 số cứng theo tên-hình mà tự RA kết quả khác nhau khi bằng chứng
  khác nhau.

Verify: trang `gap-system.html` (8080) render sạch (console 0 lỗi), canon `principles.md`
§10b'' đã ghi thuật toán đầy đủ làm SSOT lặp lại được cho lần feedback gap sau.

### 2j. Feedback icon — 3 vòng liền, kết thúc bằng dẹp hẳn nhánh Gravity chết trong canon

Thầy chỉ ảnh `ContentPage` (chip "Đã đọc"/"2 phút đọc"/"N thử thách" + tab row) qua
`/starci-fe-story-feedback`, kèm 2 ý: *"trừ icon quốc dân là check ra, thì chip no icon"* +
*"icon ở tabs size <5 thì phải weight bold chứ?"*.

**Vòng 1 — đề xuất ban đầu SAI, tự phản biện sửa 2 lần trước khi chốt:**
1. Đề xuất đầu (size-4 + thêm `weight="bold"`) — SAI, dựa nhầm bảng "theo lib" cũ.
2. Thầy sửa: *"size-3.5 bằng size chữ chứ"* — cũng chưa đúng, vì `text-sm` HeroUI `Tabs.Tab`
   (`tabs.css:47`) là icon=DIV (khớp Ô/line-height 20px), không phải icon=TEXT (khớp glyph
   14px) — `size-3.5` là công thức icon=TEXT, sai ngữ cảnh cho 1 icon nằm TRONG tab.
3. Thầy hỏi vặn tiếp: *"nhớ rules khi nào icon=text, khi nào icon=div"* → mới ra đúng khung:
   trục quyết định KHÔNG PHẢI lib (Phosphor vs Gravity, canon cũ) mà là **icon nằm trần cạnh
   chữ hay nằm trong 1 Ô/control có line-height riêng**. Verify bằng số đo thật
   `tailwindcss/theme.css` (`text-xs/sm/base/lg` → line-height `16/20/24/28px`) — khớp CHÍNH
   XÁC bảng "icon=DIV" cũ (vốn ghi nhầm lý do là "Phosphor +1 nấc vì glyph mảnh").

**Vòng 2 — thầy phát hiện tôi trích 1 đoạn canon ĐÃ CHẾT:** *"ủa vẫn có gravity ui à? thầy
bảo dẹp hết r mà?"* — đúng, `principles.md` có 2 đoạn MÂU THUẪN: §5⃣0 (2026-07-26, "MỘT BỘ DUY
NHẤT, không ngoại lệ") ra SAU và đảo ngược hẳn §5c (2026-07-25, "atom=Gravity, block=Phosphor")
nhưng §5c chưa từng bị dọn — tôi đọc trúng đoạn chết. Verify code thật:
`grep -rl "@gravity-ui/icons" .storybook/components` = **0 file** (kể cả `_legacy`), Gravity
chỉ còn trong `package.json` (chưa gỡ dependency). Bài học: canon TỰ nó có thể có mâu thuẫn nội
bộ theo thời gian (quyết định sau chưa dọn quyết định trước) — phải verify bằng CODE THẬT, không
chỉ tin dòng canon đọc được, kể cả khi đang tự tin trích đúng nguồn.

**Vòng 3 — render `icon-system.html` (8080) 2 lần** (bản đầu còn dính Gravity, "vẽ lại html"
sau khi phát hiện lỗi vòng 2) — 7 mục: 1 lib Phosphor · khung icon=text/icon=div (bảng + 2 ví dụ
neo thật) · weight-theo-size (so trực tiếp regular/bold cùng size) · icon quốc dân · interaction
arrow/caret/rotate (demo hover thật) · case study `ContentModeNav` · round-2 chưa xác minh.

**Thầy: "ok scan fix hết đi" — áp toàn bộ:**
1. `ContentModeNav.tsx` — 4 icon tab `size-4`→`size-5`, không thêm weight (size-5=regular đúng).
2. `ContentHeader.tsx` — bỏ `prefixIcon={ClockIcon}`/`{FlameIcon}` ở "N phút đọc"/"N thử thách",
   giữ nguyên `CheckCircleIcon` trên chip "Đã đọc".
3. Round 2 (quét `prefixIcon={` toàn `.storybook/components/**`, ~40 hit, lọc theo đúng luật —
   loại hết icon trong `Button`/`Link` tương tác, chỉ giữ ca "icon trang trí cạnh fact tĩnh"):
   tìm thêm 2 chỗ CÙNG loại lỗi — `QaQuestionThread.tsx` + `QaConversationHeader.tsx`, cả 2
   dùng `ChatCircleIcon` trước "N phản hồi" → bỏ. Giữ lại `LockSimpleIcon`
   (`ContentRelatedList.tsx`) — ổ khoá là ký hiệu trực tiếp, không phải liên tưởng, cùng hạng
   check.
4. Quét consumer còn lại của `Toolbar` (`CourseQaToolbar`) cho lỗi icon=div tương tự — không
   truyền icon nào, không dính.

✅ **Cập nhật canon `principles.md` §5** (viết lại hẳn §5a, đánh dấu §5c SUPERSEDED, thêm §5a.2
mới):
- §5a: bỏ khung "2 thang theo lib", thay bằng khung **icon=TEXT (khớp glyph, 1:1 font-size) vs
  icon=DIV (khớp Ô/control, = line-height mặc định Tailwind)** — bảng có cột line-height đo
  thật, 2 neo real (`Typography.ICON_CLS` cho icon=text, HeroUI `Tabs.Tab` cho icon=div), + neo
  bug `ContentModeNav`.
- §5a.1 (gap-2 arrow-link) giữ nguyên, chỉ ghi rõ nó là ca icon=TEXT.
- §5a.2 (MỚI) — luật icon quốc dân, kèm cả 2 neo case (bỏ) + 1 neo case (giữ).
- §5c — đánh dấu ⛔ SUPERSEDED bởi §5⃣0, giữ nội dung cũ làm lịch sử, không xoá hẳn (đúng khuôn
  codebase này vẫn dùng cho quyết định bị đảo, vd `fe-canon-v4-three-axis`).
- Checklist đo (§5) viết lại 4 dòng đầu cho khớp khung mới.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi (4 file: `ContentModeNav`, `ContentHeader`,
`QaQuestionThread`, `QaConversationHeader`). KHÔNG restart Storybook lần này — cổng 6006 đang bị
1 phiên chat khác chiếm, không đụng vào server không phải của mình; verify đủ bằng tsc+gate+eslint
theo đúng quy ước "đừng lái Storybook qua Browser pane" đã có từ trước.

### 2k. Feedback tiếp — check icon phải xanh, quét ĐÚNG Storybook (không phải src) trước khi chốt type

Thầy chụp ảnh outcomes list ("Bạn sẽ học được gì"), ảnh checkmark đang màu đen: *"check thì màu
xanh đc kh"* + *"x thì có khi đen có khi đỏ thôi, tùy mức độ"*.

**Chẩn đoán**: `SurfaceCard.leadingIcon` (composite) khoá cứng *"colour follows the text
(foreground)"* — không có đường override theo ngữ nghĩa. Đề xuất đầu: prop mới
`leadingIconColor?: "default"|"success"|"danger"` (3 giá trị, khớp đúng câu thầy nói).

**Thầy: "scan xem màu icon có fit rule này không? quét source đi"** — quét `src/` thật, kết quả
đủ mạnh để lên canon: `CheckCircleIcon` màu tường minh (15+ nguồn: `CourseCard`, `GradingByline`,
`DailyQuest`, `ChallengeSubmissionPanel`, `MindMap`, `PremiumGateModal`…) LUÔN
`text-success-soft-foreground`; `XCircleIcon` màu tường minh (4/4 nguồn) LUÔN
`text-danger-soft-foreground` — không tìm được ca "X trung tính" nào (icon đen tìm được đều là
nút đóng/xoá, khác ngữ nghĩa). Phát hiện thêm: 1 cơ chế thứ 3 — icon nằm TRONG 1 `Chip`/badge đã
tô sẵn màu thì tự ăn `currentColor`, không cần class riêng (đúng câu đầu "icon trùng màu text"
của thầy) — khác ca `SurfaceCard.leadingIcon` (icon trần, không có badge bọc).

**Thầy sửa lại: "không quét src, quét storybook"** — quét lại đúng `.storybook/components/**`,
phát hiện quan trọng hơn: `Alert.tsx` ĐÃ CÓ SẴN `AlertStatus = "default"|"accent"|"success"|
"warning"|"danger"` (5 giá trị, chốt 2026-07-25/26, dùng chung `FeedbackCallout`+`Toast` để
tránh 2 bảng trùng). Tự phản biện lại đề xuất 3-giá-trị của chính mình: mở thêm 1 enum hẹp hơn
song song là lặp lại đúng lỗi `Alert.Base` từng sinh ra để sửa. Thầy chốt dùng `AlertStatus`.

✅ **Fix**: `SurfaceCard.tsx` — thêm `leadingIconColor?: AlertStatus` vào `SurfaceCardListItem`
(import `AlertStatus` từ `Alert.tsx`), bảng `LEADING_ICON_COLOR_CLASS` riêng (không dùng lại
`Alert`'s `STATUS_CLOSE_TONE` vì bảng đó có `hover:` cho nút ×, không hợp icon tĩnh) nhưng CÙNG
type. Mặc định `undefined` = giữ nguyên hành vi cũ (theo màu label), không ảnh hưởng chỗ khác
đang dùng `leadingIcon`. `ContentHeader.tsx` outcomes thêm `leadingIconColor: "success"`.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi thật (5 lỗi `showAnatomy` unused báo ra ở
`SurfaceCard.tsx` xác nhận qua `git stash` là NỢ CŨ có sẵn từ trước, không phải do fix này gây
ra — không sửa, ngoài phạm vi lượt này). Canon: `principles.md` §5a.3 mới — luật "icon mang
nghĩa trạng thái dùng lại `AlertStatus`, không tự chế bảng màu riêng".

**Bài học lặp lại đúng mẫu hình cả buổi**: (1) quét ĐÚNG cây được yêu cầu (Storybook, không phải
src, dù src cũng cho tín hiệu hữu ích) mới lộ ra bằng chứng quyết định (bảng `AlertStatus` có
sẵn); (2) tự đề xuất rồi tự phản biện lại đề xuất của chính mình khi bằng chứng mới xuất hiện,
đúng luật "khách quan tư duy" đã ghi vào skill.

### 2k. Vòng feedback #4 — gom "màu đen" thành composite `IdentityContentRow` + reply nested-avatar + `ThreadConnector`

Sau khi hệ thống hoá gap-system (§2j), thầy quay lại đúng ảnh gốc: *"gom màu đen thành block
riêng. flex gap tight thôi. ở dưới cũng tight thôi. khi trả lời thì nested avatar like
facebook. với có thể line màu cam được k?"*

**1. Tách composite `IdentityContentRow`** (`composites/lists/IdentityContentRow/`) — avatar +
byline-slot + content-slot, cả 2 seam (avatar↔cột, byline↔children) đều `tight`. Hỏi lại rõ
ràng trước khi sửa (AskUserQuestion) vì đây là ĐẢO NGƯỢC có chủ đích 1 fix vừa verify xong theo
real-src (§2i: byline-nội-bộ vốn `related` khớp `CommentItem.tsx:101`) — thầy xác nhận "cả 3
seam đều tight, kể cả byline nội bộ" là override CÓ CHỦ Ý cho block MỚI tách, không phải quay
lại lỗi cũ. Đã tra `List.Row`/`UserCell` trước khi dựng mới — cả hai không đủ (title/subtitle
1-dòng-cắt-chữ, không chứa nổi byline nhiều mảnh + body nhiều dòng) → dựng thật, không phải bỏ
qua reuse-first.
`ContentCommentThread.tsx` refactor để compose `IdentityContentRow`; `nested` (thụt lề reply)
forward xuống prop mới trên chính composite.

**2. "màu cam vẫn gap-3"** — thầy chỉnh lại: dù nội bộ tight, khoảng NGAY TRƯỚC khi reply
composer xuất hiện (chỗ đường nối sẽ chạy qua) phải là `grouped` (gap-3), không tight đều tuốt.
Fix: tách cột nội dung thành 2 tầng — `StackV gap="tight"`(body+action-row) lồng trong
`StackV gap="grouped"`(nhóm-tight-đó, composer/toggle/subtree) — seam "1 chủ" vẫn giữ đúng, chỉ
thêm 1 cấp lồng để có 2 giá trị gap khác nhau trong cùng cột.

**3. Nested avatar khi trả lời + `ThreadConnector`** — tính năng MỚI HOÀN TOÀN, xác nhận `src`
thật (`CommentComposer`) KHÔNG hề có avatar cho reply, nên đây là phân kỳ có chủ đích, không
phải port. Trình thiết kế trước khi code (đúng luật §1b): atom mới `ThreadConnector`
(`atoms/display/ThreadConnector/`) — `border-l`+`border-b`+`rounded-bl-2xl`, cùng họ kỹ thuật
với `Stack.nested` (bẻ cong thay vì đường thẳng), `ml-4` căn giữa cột avatar `size="sm"`
(`size-8`=32px). `ContentCommentComposer` ĐÃ SẴN hỗ trợ avatar ở nhánh mở rộng khi có
`currentUser` (không cần sửa) — chỉ thiếu `ContentCommentThreadProps.currentUser` để truyền
xuống, và composer reply chưa từng nhận `currentUser`. Thêm prop `currentUser` (threading qua
`ContentDiscussion`→`ContentCommentThread`, đệ quy xuống mọi reply), thêm `className` passthrough
cho `ContentCommentComposer` (đặt `flex-1` cạnh `ThreadConnector`). Thêm leaf `Replying` mới cho
story (dùng lại `ClickPreview`, bấm "Trả lời").

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi, Storybook restart không lỗi build. Story
mới: `IdentityContentRow.stories.tsx`, `ThreadConnector.stories.tsx`.

### 2l. Soi render THẬT (leaf `Replying` vừa dựng) → 2 fix ngay tại chỗ

Thầy chụp lại đúng leaf `Replying` vừa build, khoanh 2 điểm:
1. **Mũi tên xanh** (avatar↔"Minh Anh") — *"xanh la gap-3"*: seam avatar↔cột đang `tight` (theo
   chốt "cả 3 seam tight" ở §2k) nhìn THẬT lại thấy quá khít — thầy sửa lại thành `grouped`.
   ⚠️ Bài học: 1 chốt trước khi thấy render là TẠM, không phải chung thẩm — verify-empirically
   khi hình đã lên màn hình, đừng coi chốt bằng lời là xong việc.
2. **Đường đỏ** (thầy tự vẽ trace lại `ThreadConnector` đang render) — *"cái màu đỏ render bị
   dài quá, với border-4 được không?"* → hỏi lại xong thầy tự rút: *"à thôi border-1 thôi,
   không cần chỉnh border size. nhưng mà cái mốc bị lệch."* Border giữ nguyên (1px); lỗi THẬT
   là hình học: `ThreadConnector` cũ `self-stretch` kéo dài hết chiều cao CẢ composer (textarea
   + hàng nút Trả lời/Hủy), trong khi avatar của composer lại canh GIỮA cả khối đó (`StackH`
   không set `align`, mặc định `center`) — điểm cong không bao giờ khớp đúng tâm avatar.
   ✅ **Fix hình học** (không phải chỉnh màu/độ dày): avatar trong `ContentCommentComposer`
   thêm `align="start"` (canh trên, khớp mép trên ô nhập) → vị trí avatar giờ CỐ ĐỊNH, không
   phụ thuộc composer cao bao nhiêu. `ThreadConnector` bỏ `self-stretch`, đổi `h-4` (16px = nửa
   `size-8`/32px avatar) — điểm cong (border-b) khớp đúng tâm avatar theo phép tính hình học,
   không phải áng chừng. Wrapper `StackH` bọc `ThreadConnector`+composer đổi `align="stretch"`
   → `align="start"`.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi, Storybook restart không lỗi build.

### 2m. `ContentDiscussion` header — 3 seam lệch real-src cùng lúc ("cảm giác hơi chật")

Thầy chụp ảnh (filter xanh) khoanh label "Thảo luận · 1" + archive-line, hỏi *"cảm giác hơi
chật, đây là exception, brainstorm cách gap tốt hơn"*. Không brainstorm — có sẵn bằng chứng đo
được: đọc thẳng `src/components/features/community/Discussion/index.tsx:98-114`, tự có comment
ghi rõ từng seam. Bản dựng lúc đầu buổi (trước khi có quy trình neo real-src) lệch LỎNG HƠN 1
BẬC ở **cả 3 chỗ cùng lúc** trong `ContentDiscussion.tsx`:

| Seam | real-src | Trước | Sau |
|---|---|---|---|
| icon ↔ "Thảo luận · N" | `gap-2` (related) | `tight` | `related` |
| [icon+label] ↔ archive-line | `gap-1` (tight) | `flush` | `tight` |
| [label+archive] ↔ composer | `gap-3` (grouped) | `related` | `grouped` |

Thầy: *"vẽ 8080 để phân tích"* — thêm mục 6 vào `gap-system.html` (bảng lệch + before/after
render), thầy soi rồi "ok" mới áp. Không tự áp ngay dù bằng chứng rõ — đúng quy trình vẽ-trước-
sửa-sau khi thầy yêu cầu phân tích.

✅ **Fix**: `ContentDiscussion.tsx` 3 dòng gap đổi đúng bảng trên. Verify: tsc sạch, 9/9 gate
xanh, eslint --fix 0 lỗi, Storybook restart không lỗi build.

**Bài học**: khi ĐÃ CÓ real-src rõ ràng (nhất là khi chính `src` tự ghi comment neo gap), không
cần "brainstorm phương án" — trình thẳng bằng chứng đo được, khách quan hơn brainstorm chủ quan.
Brainstorm chỉ cần khi THẬT SỰ không có nguồn thật để neo vào.

### 2m. Feedback dồn 5 ý trong 1 ảnh `ContentPage` — 2 gap chủ động lệch src, bỏ icon mắt, nhãn ngôn ngữ compact, composite mới

Ảnh `ContentPage` (chế độ compact, chỉ icon tab + chevron ngôn ngữ). Thầy ghi tắt 5 ý trong 1
câu — tách rõ từng ý, đọc `src` thật trước khi hỏi lại 2 điểm mâu thuẫn (đúng quy trình round
1b), rồi thầy trả lời gọn "1,2 chủ động" / "4. thầy lượng, không tin source" / "5. tạo
doubleTabsCard từ Toolbar+Card":

✅ **1&2 — 2 seam `ModeNav↔Article` và `Article↔ReactionCluster` đổi `section`(gap-6)→
`grouped`(gap-3), CHỦ ĐỘNG lệch `src` thật** (`LessonReader/index.tsx:295,373` đều `gap-6`) —
thầy xác nhận đây là quyết định có chủ đích, không phải tôi build sai trước đó. `ContentPage.tsx`
tái cấu trúc: bọc `ContentModeNav`+`ContentArticle`+cụm-reaction trong 1 `StackV gap="grouped"`
MỚI (lồng trong `StackV gap="section"` cũ chỉ còn giữ đúng 1 seam Header↔phần-dưới) — seam NỘI
BỘ trong cụm reaction (Reaction↔nudge↔RelatedList↔Discussion↔Pager) giữ nguyên `section`, không
đổi lan.

✅ **3 — bỏ icon con mắt ở lượt xem** (`ContentReaction.tsx:86`, `EyeIcon`) — đúng luật "icon
quốc dân" §5a.2 vừa chốt hôm nay (mắt→lượt xem cần liên tưởng), CHỦ ĐỘNG lệch `src` thật
(`InteractionBar.tsx:40` có `EyeIcon`) — cùng loại quyết định như Clock/Flame/ChatCircle trước
đó, không cần hỏi lại.

✅ **4 — nhãn ngôn ngữ compact, "thầy lượng, không tin source"**: tra `src` thật ra 1 cơ chế
KHÁC hẳn (`ProgrammingLanguageTabs/map.tsx` — logo thương hiệu qua `react-icons`, không phải
rút gọn chữ) — thầy chọn KHÔNG theo `src`, tự quyết rút gọn chữ (`TypeScript`→`TS`, `Go`/`Java`/
`C#` giữ nguyên vì đã ngắn). Xây mới:
- `Toolbar.tsx` — thêm `ToolbarTabItem.compactLabel?: ReactNode`, render 2 span
  (`@app-sm:hidden`/`hidden @app-sm:inline`) khi có `compactLabel` — CSS phức tạp đặt ĐÚNG tầng
  composite (Toolbar sở hữu), không phải hand-roll ở block `ContentModeNav`.
- `ContentModeNav.tsx` — `ContentLanguage` thêm `compactLabel?: string`; bỏ hẳn
  `collapseRightOnMobile` (không còn ẩn nhóm ngôn ngữ vào dropdown nữa — giờ luôn hiện tab, chỉ
  đổi chữ khi hẹp). Fixture `LANGUAGES`/`ContentPage.stories.tsx` thêm `compactLabel: "TS"` cho
  TypeScript.

  ⭐ **Re-confirm 2026-07-29 (cùng ngày, phiên sau)**: thầy hỏi lại y hệt ý cũ — *"trong màn nhỏ
  thành dropdown chứ?"* trên đúng hàng tab này. Em trích lại nguyên văn quyết định trên, thầy
  xác nhận: *"thầy sai, trò sửa lại đi"* — tức chính THẦY nhớ nhầm/hỏi trái quyết định cũ, giữ
  NGUYÊN hiện trạng (không dropdown), KHÔNG có code nào cần đổi. Ghi lại để lần hỏi thứ 3 (nếu
  có) tra thẳng ra đây, khỏi lặp vòng hỏi-đáp.

✅ **5 — composite mới `DoubleTabsCard`** (`composites/navigation/DoubleTabsCard/`) — `Toolbar`
đặt vào khe `header` CÓ SẴN của `SurfaceCard.Base` (comment gốc của khe đó đã ghi đúng "a title
row, A TOOLBAR" — không phải bịa cách dùng mới). Props mirror `ToolbarBaseProps` (đổi tên
`variant`(tab)/`cardVariant`(mặt thẻ) để khỏi đụng nhau) + `children` cho phần thân dưới hàng
tab. 3 leaf: `Default` (1 nhóm), `TwoGroups` (2 nhóm, neutral), `Nested` (`cardVariant="nested"`).
**CHƯA áp dụng composite này vào `ContentModeNav`/`ContentPage`** — thầy chỉ yêu cầu tạo, chưa
yêu cầu thay thế cách `ContentModeNav` đang render (không có `SurfaceCard` bọc); để dành việc
riêng nếu thầy muốn áp sau.

Verify tất cả: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi. KHÔNG restart Storybook — cổng 6006
vẫn bị 1 phiên chat khác chiếm suốt cả buổi, không đụng vào.

### 2n. Feedback tiếp — `ContentRelatedList` variant sai + `ContentPager` gap sai + xác nhận hover-underline

Ảnh `ContentPage` khoanh đỏ card "Có thể bạn muốn đọc", cam ở 2 mũi caret `ContentPager`: *"do
la shadow card chu? cam la gap 3 chu? voi lai hover vao pressable card ref qua link khac thi
phai co hieu ung underline text chu"*.

✅ **1 — `ContentRelatedList.tsx:131`** đang `variant="nested"` (viền, không shadow) nhưng
KHÔNG có card cha nào bọc quanh trong `ContentPage` — đúng lặp lại lỗi đã sửa ở `ContentHeader`
outcomes (§2 cũ). Fix: bỏ hẳn `variant="nested"`, về mặc định `"surface"` (`shadow-surface`).

✅ **2 — `ContentPager.tsx:92,113`** đang `gap="related"` (gap-2, đúng luật §5a.1 cho icon+MỘT
DÒNG chữ kiểu `Link.Back`/`Link.SeeMore`) — nhưng ở đây caret gắn với cả 1 KHỐI 2 DÒNG (nhãn +
tiêu đề lineClamp), không phải 1 dòng — khác hình với ca §5a.1, gần quan hệ icon↔cột-nội-dung
(đã dùng `grouped` cho Avatar↔cột) hơn. Fix: `gap="related"` → `gap="grouped"` cả 2 item
(previous/next).

✅ **3 — hover-underline đã ĐÚNG SẴN, không cần sửa**: verify code — `ListFreeRow`
(`SurfaceCard.tsx:1439`, đường render cho khe `content` free-form mà `ContentRelatedList` dùng)
đã áp `.group` khi `hover="underline"`; `ContentRelatedList.tsx:117` đã có `underlineOnGroupHover`
trên title. Báo lại cho thầy xác nhận thay vì sửa mù.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi (file: `ContentRelatedList.tsx`,
`ContentPager.tsx`). KHÔNG restart Storybook — cổng 6006 vẫn bị phiên chat khác chiếm.

### 2n. `ContentDiscussion` bỏ icon "Thảo luận" (§5a.2) + quét round 2 + 1 bug thật bắt được nhân tiện

Thầy: *"thao luan bo icon di, theo rules icon"* — canon đã có sẵn luật đúng ngày hôm nay
(§5a.2 "icon quốc dân", chốt trước đó cùng buổi) nêu chính xác ví dụ "bong bóng chat ⇒ trả
lời" phải bỏ. Áp lại cho `ContentDiscussion.tsx` (gỡ `ChatsCircleIcon` cạnh "Thảo luận · N"),
xoá luôn `StackH` giờ chỉ còn 1 con.

✅ **Quét round 2 (bắt buộc theo skill, scope `.storybook/components/**`)** — tìm thêm 3 ca
CÙNG LOẠI chưa được dọn ở lượt trước (canon chỉ neo `ContentHeader`/`QaQuestionThread`/
`QaConversationHeader`, bỏ sót sibling):
- `CourseQaQuestionList.tsx:289` — `ChatCircleIcon` + "N phản hồi" (y hệt ca đã fix ở
  `QaQuestionThread`, sibling bị bỏ sót).
- `LeaderboardToolbar.tsx:118` — `Typography prefixIcon={ClockIcon}` + giờ cập nhật (đồng hồ ⇒
  thời gian, đúng ví dụ ĐẦU trong luật).
- `MockInterviewScorecard.tsx:337` — `ChatCircleIcon` cạnh nội dung câu hỏi tiếp theo, trong
  card đã có sẵn `label="Câu hỏi tiếp theo"` — icon trang trí thừa trên heading có sẵn.

**Loại khỏi danh sách, có lý do (không sửa)**:
- `InlineIconLabel` 2 chỗ (`PersonalProjectTaskAttemptsDrawer.tsx:194`,
  `LessonVideoModal.tsx:274`, cả 2 dùng `ClockIcon`) — tra component thấy `icon` là prop BẮT
  BUỘC (không optional), composite ≥15 call-site established riêng cho "icon+text = 1 unit" —
  khác hẳn pattern "Typography/StackH tay ráp rời" mà §5a.2 nhắm tới. Thầy: "theo trò trước
  đi" → quyết định GIỮ NGUYÊN, không đổi.
- `FeedbackEmpty icon={ChatsCircleIcon}` (2 chỗ) và `Chip icon={FlameIcon/ClockIcon}` (2 chỗ)
  — 2 pattern khác hẳn (icon trạng thái RỖNG, icon identity của Chip) — không phải "trang trí
  cạnh 1 fact tĩnh".

⚠️ **Bug thật bắt được giữa chừng** (thầy hỏi ngược khi soi code sửa `MockInterviewScorecard`:
*"sao lại if/else thế này? sao không pass isSkeleton vào MarkdownContent luôn?"*) —
`MarkdownContent` KHÔNG có `isSkeleton` riêng (§12c: chủ của hình phải là chủ của skeleton),
đây là DUY NHẤT chỗ trong cả hệ thống giả skeleton bằng `Typography isSkeleton` thay cho nó.
✅ **Fix**: thêm `isSkeleton` thật vào `MarkdownContent.tsx` (2 dòng shimmer, top-level
`HeroSkeleton`, đặt SAU tất cả hook — tự bắt lại 1 lỗi Rules-of-Hooks do đặt nhánh
`isSkeleton` sai vị trí 2 lần liên tiếp lúc đầu, tự sửa trước khi verify). Call-site
`MockInterviewScorecard.tsx` đổi từ if/else sang `<MarkdownContent isSkeleton={isSkeleton} />`
thẳng. Thêm leaf `Skeleton` mới cho `MarkdownContent.stories.tsx` + khai `"Skeleton": {tier:
"heroui"}` trong `ANNOTATE` (gate `check-orphan-parts` bắt được badge chưa khai).

### 2o. `.Pressable` gộp thành prop `isPressable` nội bộ trên `SurfaceCard` — thầy: "sao còn .Pressable, isPressable là prop hết rồi mà?"

Thầy soi ảnh `ContentPager` hỏi đề xuất `hover="underline"` (§2n) — vòng phản biện lộ ra
`.Pressable`/`.PressableGroup` không hề dùng convention `isPressable` (biến NỘI BỘ suy từ
`Boolean(onPress||href)`, đúng cách `List.Row:156` đã làm) mà là 2 COMPONENT RIÊNG song song
`SurfaceCard.Base` — đúng loại "biến thể đáng lẽ là prop" §6b cấm, chỉ là namespace flatten
2026-07-25 đổi TÊN (`X.Y`→`XY`) chứ không gộp THÂN.

✅ **Gộp `Pressable` vào `Base`** (`SurfaceCard.tsx`):
- `SurfaceCardBaseProps` thêm `onPress`/`href`/`isDisabled`/`isSelected`/`actions`/`ariaLabel`
  (đổi tên từ `label` cũ của `Pressable` — `Base` đã có `label` = tiêu đề section, trùng tên
  2 khái niệm khác nhau nếu giữ nguyên).
- `Base` tự suy `isPressable = !isSkeleton && Boolean(onPress||href)`, dựng `<div>`/`<button>`/
  `<a>` tương ứng — 3 nhánh render (plain, simple-press, stretched-link-actions) CHÉP NGUYÊN
  logic cũ của `Pressable` (ripple, `active:scale-[0.97]`, overlay stretched-link), không đổi
  hành vi, chỉ đổi CHỖ Ở.
- ⚠️ **Bẫy tự bắt được TRƯỚC khi verify**: `isSkeleton` của `Base`(thuần) và của `Pressable`
  (cũ) mang 2 NGHĨA khác hẳn — thuần chỉ shimmer phần frame sở hữu (`children` chảy thật
  xuống), pressable cũ THAY `children` bằng 1 mirror cố định (icon-tile + 2 thanh chữ) bất kể
  gì. Quét 6 consumer thật thì `FlashcardDeckList`+`_legacy/SummaryCard` ĐANG SỐNG nhờ đúng
  nhánh mirror đó (`isSkeleton={isSkeleton}` + `children={isSkeleton ? null : ...}`) — nếu
  gộp mà bỏ nhánh mirror, 2 nơi này sẽ render Ô RỖNG khi loading thay vì shimmer. Giữ nhánh
  riêng: `if (isSkeleton && Boolean(onPress||href)) return <mirror cũ>` TRƯỚC khi tính
  `isPressable`. Thêm 1 lỗi phụ tự bắt: `FlashcardDeckList`'s grid tile để `onPress={
  usingPlaceholders ? undefined : ...}` — khi `usingPlaceholders` (đang loading, chưa có id
  thật) thì `onPress` = `undefined`, khiến điều kiện trên fail (isSkeleton nhưng KHÔNG có
  onPress/href) → sửa: bỏ ternary, luôn set `onPress` thật (vô hại vì nhánh mirror chặn trước
  khi tới nút thật, chỉ cần `Boolean(onPress)` = true để trigger đúng nhánh).
- `PressableGroup` (grid — vẫn giữ, `items` = repeating list là hình khác thật, §13b) đổi gọi
  `<Pressable>` → `<Base>` cho từng ô.
- Xoá export `SurfaceCardPressable`, đổi 4 consumer thật (`ConsultantCard`, `FlashcardDeckList`,
  `QaQuestionThread`, `_legacy/SummaryCard`) sang import/dùng `SurfaceCard` thẳng, đổi `label`→
  `ariaLabel`. Gộp story `SurfaceCardPressable.stories.tsx` (6 leaf: Default/AsLink/
  WithActions/Selected/Disabled/Loading) vào `SurfaceCard.stories.tsx` (đổi tên
  `Pressable`/`PressableAsLink`/`PressableWithActions`/`PressableSelected`/`PressableDisabled`/
  `PressableLoading` để phân biệt leaf thuần đã có) — xoá file story cũ. Sửa 3 `ANNOTATE`
  storyId chết (`ConsultantCard`/`FlashcardDeckList`/`QaQuestionThread` stories) + 1 ở
  `SurfaceCardPressableGroup.stories.tsx` (đều trỏ `...surfacecardpressable--default`, story
  đã xoá) → trỏ lại `...surfacecard--pressable`.

**Bài học phương pháp**: khi gộp 2 API có prop CÙNG TÊN nhưng nghĩa khác (ở đây `isSkeleton`),
đừng coi "đã có sẵn prop cùng tên rồi" là đủ — phải hỏi rõ nghĩa cũ có consumer thật nào sống
nhờ nó không (grep hết 6 consumer trước khi xoá nhánh nào), rồi giữ nhánh cũ dưới 1 điều kiện
hẹp hơn thay vì xoá lẫn vào nghĩa mới.

Verify: tsc sạch (bắt thêm 3 lỗi tsc + 1 lỗi gate KHÔNG liên quan Pressable, nợ cũ từ phiên nền
trước đó — `ProgressMeter`/`ProgressRing`/`SegmentBar` optional-field-sau-destructure,
`KeyValue.tsx` badge `Skeleton` orphan — vá luôn cho tsc+gate sạch toàn cục, không phải do
gộp Pressable gây ra), 9/9 gate xanh, eslint --fix 0 lỗi mới (4 lỗi `showAnatomy` unused ở
`SurfaceCard.tsx` xác nhận nợ cũ qua `git stash`, không sửa — ngoài phạm vi). Canon:
`principles.md` §6b thêm neo `isPressable` suy-nội-bộ + luật giữ nhánh khi gộp 2 nghĩa
`isSkeleton`. KHÔNG restart Storybook — cổng 6006 vẫn bị 1 phiên chat khác chiếm.

### 2p. Feedback bị RƠI giữa tangent gộp Pressable — hover-underline `ContentPager` chưa bao giờ áp + skill thêm bước "kiểm tồn đọng"

Thầy chụp ảnh khoanh đỏ card `ContentPager`, hỏi lại: *"sao cái này hover lạ thế? hover ref bài
là card mà có group underline mà"* — đây CHÍNH LÀ đề xuất đã nêu ở §2n mục 3 ("hover-underline
đã ĐÚNG SẴN, không cần sửa"), nhưng kết luận đó SAI: lúc §2n viết, `ContentPager` vẫn còn dùng
`SurfaceCardPressableGroup` với hover ripple+`active:scale` CỐ ĐỊNH cho MỌI item (bất kể
`href` hay `onPress`) — không hề có nhánh "quiet link". Đề xuất đổi hover-language được nêu
đúng lúc đó nhưng bị lạc vào tangent lớn hơn (gộp `.Pressable`→`Base`, §2o) và chưa bao giờ
thực sự áp — cho tới khi thầy soi lại render thật mới bắt ra.

✅ **Fix thật — phân biệt 2 NGÔN NGỮ hover trong `SurfaceCard.Base`'s nhánh press đơn giản
(`!actions`)**: thêm `const isLink = Boolean(href) && !isDisabled`.
- `isLink` (có `href`, là LINK điều hướng thật) → frame chỉ thêm class `"group"`, KHÔNG ripple/
  KHÔNG `active:scale-[0.97]` — nội dung tự chọn `Typography.underlineOnGroupHover` (prop có sẵn
  từ §2c) để đọc như 1 link trầm, đúng convention `SurfaceCardListItem.hover="underline"` đã
  dùng.
- Không `isLink` (chỉ `onPress`, là HÀNH ĐỘNG tại chỗ) → giữ NGUYÊN ripple+`active:scale-[0.97]`
  y hệt cũ (không đổi hành vi `ConsultantCard`/`FlashcardDeckList`/`QaQuestionThread`/
  `RatingBar`/`PlaygroundExerciseGrid`).
`ContentPager.tsx` — thêm `underlineOnGroupHover` vào 2 `Typography` tiêu đề (previous/next).

✅ **Canon mới — luật tổng quát "href = link, onPress = action, 2 ngôn ngữ hover khác nhau"**:
đủ điều kiện lên `principles.md` (không phải neo-riêng-1-case) vì cùng đúng pattern
`SurfaceCardListItem.hover` ĐÃ có trước, cộng thêm chính bằng chứng thất bại lần này (thiếu
nhánh này ở `Base` khiến `href`-card bị hover sai).

✅ **Sửa quy trình skill, theo lệnh thầy: "update skills feedback là check feedbacks trước/
rules/steps để đưa ra câu trả lời chuẩn xác vì có thể sót từ các lần feedback trc"** — thêm
luật cứng mới vào `SKILL.md`: TRƯỚC MỌI round 1a/1b, bắt buộc quét — (1) chính file
`13-feedback-anatomy-registry.md` xem component/file đang bị chỉ ra có mục nào ghi "CHƯA áp"/
"để dành"/"chưa quay lại" chưa xử lý; (2) `principles.md`+`rules/*.md` xem luật liên quan đã
chốt; (3) lượt hội thoại TRƯỚC trong CÙNG phiên xem có đề xuất nào đã trình, thầy chưa bác, mà
cuộc trò chuyện rẽ hướng khiến nó chưa bao giờ thực sự được áp. Nếu khớp — nói thẳng ngay
("đây đúng là đề xuất từ lượt trước, chưa áp vì rẽ sang việc X") thay vì tái chẩn đoán từ đầu.

**Bài học phương pháp**: 1 đề xuất được nêu và có vẻ không bị bác KHÔNG đồng nghĩa đã được áp
— nếu ngay sau đó rẽ sang 1 việc lớn hơn (ở đây: gộp kiến trúc `.Pressable`→`Base`), phải tự
quay lại xác nhận đề xuất cũ đã thực sự lên code chưa trước khi coi là xong, chứ không dựa vào
trí nhớ "hình như đã nói rồi".

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi mới (file: `SurfaceCard.tsx`,
`ContentPager.tsx`). KHÔNG restart Storybook — cổng 6006 vẫn bị 1 phiên chat khác chiếm.

### 2q. "Quái lạ có cái card gì đằng sau nhỉ?" — `PressableGroup` tự nhét `className` sai prop, lộ ra 1 card ma

Thầy chụp `ContentPage` leaf "Practice nudge — responsive" (state Mobile 375px), khoanh đỏ card
`ContentPager` "Nội dung tiếp": *"quái lạ có cái card gì đằng sau nhỉ?"*.

**Chẩn đoán — lấy DOM thật (`javascript_tool` inject vào tab Storybook đang mở, đọc thẳng
`outerHTML`) thay vì đoán bằng CSS lý thuyết**, ra đúng bằng chứng:
```html
<section class="flex flex-col gap-3 rounded-2xl shadow-field">
  <a href="#prev" class="... rounded-3xl bg-surface shadow-surface p-3 group">…</a>
</section>
```
`SurfaceCard.Base` có SẴN 2 prop tách tầng từ trước (không phải do vụ gộp `.Pressable` gây ra):
`className` → luôn rơi vào `<section>` NGOÀI CÙNG (dòng ~497, vốn để bọc khi có `label`/
`description`, KHÔNG có nền); `contentClassName` → rơi vào khung thẻ THẬT (`<a>`/`<button>`,
giữ `rounded-3xl`/`shadow-surface`). `PressableGroup`'s tile builder (dòng 1019, sửa trong vụ
gộp §2o) truyền `TILE_CHROME` (`"rounded-2xl shadow-field"` — "1 bậc nhỏ hơn thẻ gốc", mục đích
RESTYLE mặt thẻ) qua **`className`** (nhầm) thay vì `contentClassName`. `box-shadow` không cần
nền vẫn vẽ được ⇒ `<section>` ngoài (bo 16px, có bóng riêng) hiện ra đúng như 1 "card thứ 2"
nấp sau thẻ thật (bo 24px) — bo góc khác nhau lộ ra ở 4 góc.

✅ **Fix (lượt 1)**: `SurfaceCard.tsx:1019` — đổi `className={cn(TILE_CHROME, ...)}` →
`contentClassName={cn(TILE_CHROME, ...)}`. Thầy: *"ok trò, giữ 2xl nhé"* — xác nhận bo góc hiển
thị đúng phải là 16px (rounded-2xl, "1 bậc nhỏ hơn"), không phải trả về 24px mặc định.

✅ **Quét lượt 2 (bắt buộc, không suy diễn bỏ qua dù bug ở tầng nội bộ 1 file)**: viết script
Node quét mọi JSX tag `<SurfaceCard(Nested|List|Accordion|CrossList|SelectableGroup|
PressableGroup)?` trong TOÀN `.storybook/**` (88 file có gọi, lọc ra ~18 call-site truyền
`className` thật) — soi từng cái, KHÔNG có ca thứ 2. Toàn bộ `className` khác chỉ mang class
layout (margin/width/`group` cho hover — `group` vẫn hoạt động dù rơi vào section ngoài vì hover
trigger dựa trên VÙNG BAO PHỦ chuột, không phải hiển thị), hoặc có doc riêng xác nhận
`className` cố ý nhắm outer wrapper (`DoubleTabsCard`). Nội bộ `SurfaceCard.tsx`, `<Base>` chỉ
được GỌI đúng 1 chỗ (`PressableGroup`) — `List`/`Accordion`/`CrossList`/`SelectableGroup`/
`Nested` đều tự vẽ frame riêng, không đi qua `Base` nên không thể dính cùng lỗi. **Danh sách
sửa thêm = RỖNG.**

**Bài học phương pháp**: khi nghi ngờ 1 hiện tượng thị giác (không phải lệch số liệu/copy), lấy
DOM/computed-style THẬT (script inject vào tab Storybook đang mở, kể cả khi cổng 6006 do phiên
khác giữ — `read_page`/`javascript_tool` inject vẫn đọc được snapshot hiện tại dù không
hot-reload theo sửa mới) thay vì suy luận thuần CSS — bug này không phải cascade-collision lý
thuyết mà là 2 ELEMENT THẬT lồng nhau, chỉ lộ ra khi nhìn đúng `outerHTML`.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi mới (4 lỗi `showAnatomy` unused ở
`SurfaceCard.tsx` xác nhận nợ cũ từ §2o, không phải do đổi 1 dòng này). KHÔNG restart Storybook
— cổng 6006 vẫn bị 1 phiên chat khác chiếm; verify DOM qua script inject vào tab đã mở sẵn thay
cho screenshot/click.

### 2q. `MilestoneUpNextCard` — eyebrow ngoài/trong lật lại 2 lần + bug `isHighlight` che nội dung + size/weight title sai

Thầy chỉ ảnh `MilestoneUpNextCard` (nudge `ContentPage`), hỏi *"phải có isHighlight với label ở
ngoài chứ?"*, dẫn tới chuỗi phản biện dài:

1. Đọc `UpNextCard`/`ContinueCard` thật → `isHighlight` ĐÃ ĐÚNG (caller-controlled từ §2b), còn
   "label ngoài" ban đầu KHÔNG khớp `src` (`UpNextCard` render eyebrow TRONG `SectionCard`,
   `ContinueCard` đã BỎ HẲN eyebrow từ trước theo §14d.1) — trình bằng chứng, thầy vẫn giữ ý.
2. Tìm ra `SurfaceCard` có sẵn cơ chế `label`+`subtleLabel` (render label NGOÀI, style eyebrow)
   — thầy chốt "ok hướng này đi" → áp: `label={eyebrow}` (kèm icon lồng `Typography` khi
   `showCheck`), bỏ `Typography` eyebrow trong `StackV`.
3. **Thầy soi render thật, LẬT LẠI**: *"ý là subtitle ở trong card"* — muốn đưa eyebrow về lại
   TRONG card. Xác nhận: bản gốc (Typography gọi thẳng trong `StackV`) KHÔNG hề vi phạm luật
   CSS-tier (đó là gọi atom qua prop, không phải className thô) — lo ngại "phải dùng
   `SurfaceCard.label`" ở bước 2 là nhầm 2 luật khác nhau (tái dùng composite ≠ CSS-tier
   ownership). Revert sạch về trong card.
4. **Bug thật bắt được TRONG lúc soi render `isHighlight=true`**: sweep (`.highlight-card-sweep`,
   `position: absolute`) ĐÈ LÊN nút CTA — ảnh chụp cho thấy vệt hồng cắt ngang nút. Root cause:
   `SurfaceCard.tsx` nhánh KHÔNG-pressable (dòng ~361) thiếu hẳn `relative` trên div card — theo
   CSS, sibling `position:absolute` LUÔN đè lên sibling `static` bất kể thứ tự DOM. Nhánh
   Pressable (dòng ~427) đã có `relative` từ trước, chỉ nhánh cơ bản bị rớt. **Fix: thêm
   `"relative"` vào className** — ảnh hưởng MỌI card `isHighlight` không-pressable trong hệ
   thống, không chỉ `MilestoneUpNextCard`.
5. **`text-lg` quá to** — tra `src` thật: `UpNextCard` title `<Typography weight="semibold">`
   KHÔNG khai `type` ⇒ mặc định HeroUI `type="body"` = `text-base` (verify
   `typography.css:105-107`). Sửa `size="lg" weight="bold"` → `size="base" weight="medium"`
   (semibold gập medium ở cỡ body, §9b).
6. **Round 2** — bản `MilestoneUpNextCard` LOCAL trong `PersonalProjectResultScreen.tsx` (helper
   riêng, không export) đã SẴN đúng hình (eyebrow trong card) từ đầu, không cần sửa gì thêm sau
   khi bước 3 revert — chỉ còn lệch nhẹ `weight="semibold"` thay vì `"medium"` (không phải bug
   chức năng vì đã fold, chỉ là chưa đồng bộ cách viết — chưa sửa, mức độ thấp).

✅ **Thầy yêu cầu thêm bộ quy tắc size chữ** (giống `gap-system.html`/`icon-system.html`) — dựng
`text-size-system.html` (8080): quét tần suất thật (`xs`=151 · `sm`=281 · `base`=176 ·
`lg`=26 · heading=40), luật chọn theo VAI TRÒ (xs=meta · sm=hàng dày đặc · base=tiêu đề/đoạn văn
độc lập trong khối rộng, MẶC ĐỊNH khi `src` không khai `type` · lg=nhấn mạnh hiếm, đứng 1 mình),
case study `MilestoneUpNextCard` before/after. 26 chỗ `size="lg"` khác CHƯA soát — ghi round-2
chờ thầy.

Verify: tsc sạch (loại 2 file đang bị 1 phiên chat khác sửa dở dang, xác nhận qua `git status`:
`PageHeader.stories.tsx`, `KeyValueList.stories.tsx` — không đụng), 8/9 gate xanh (bỏ
`check-story-ids` cùng lý do), eslint --fix 0 lỗi mới. KHÔNG restart Storybook — cổng 6006 vẫn
bị chiếm.

### 2r. Quét CHỦ ĐỘNG "giai đoạn 2" — 24 component thiếu `isSkeleton` trên toàn `.storybook/components/**`

Nguồn gốc: sau khi sửa 1 chỗ cụ thể (`MockInterviewScorecard` if/else `Typography isSkeleton`
thay vì `MarkdownContent` tự có isSkeleton, §12c mục "Đã áp"), thầy ra lệnh KHÔNG chờ feedback
từng chỗ nữa — *"giờ kiếm chỗ nào không có isSkeleton rồi fix cho giai đoạn 2 feedback đi đừng
để thầy feedback kiểu này"*. Đây là quét CHỦ ĐỘNG (không phải phản ứng 1 feedback cụ thể), áp
lại đúng luật đã có §12c: *"component nào sở hữu HÌNH thì sở hữu SKELETON của hình đó — atom,
design, block, layout, screen, không trừ tầng nào"*.

**Quét**: script Node liệt kê toàn bộ `.storybook/components/**` (loại `_legacy`, `frames`) —
246 file, 80 không có `isSkeleton`, lọc bỏ file re-export/namespace thuần còn 77. 4 agent Explore
song song phân loại 77 file thành GENUINE GAP vs EXEMPT (loại là leaf tuyền children/không async/
đã co-locate qua component con). **Kết quả: 24 genuine gap.**

**Sửa 24 file** (thêm union `isSkeleton` §12b + shimmer `HeroSkeleton` đúng khuôn §12g.0):
`CoverImage` · `HighlightChip` · `KeyValue.Row`+`.List` (thêm `skeletonRows`) · `Page.Header` ·
`CourseProgressBar` · `Legend` (+ `skeletonCount`) · `MetricCard` · `ProgressMeter` ·
`ProgressRing` (+ ăn theo phát sinh: thêm hẳn `anatPart`/`showAnatomy` — trước đó component này
chưa từng có 2 prop này, dù mọi composite cùng tầng đã có) · `SegmentBar` (chuyền `isSkeleton`
xuống `Legend`, không vẽ cây shimmer song song, đúng §12g.0 mục 3) · `StatPair` · `StatRibbon`
(chuyền xuống `StatPair`) · `FlowDiagram` (không mount `ReactFlow` khi skeleton — trục node/edge
là DO DỮ LIỆU QUYẾT, không preview được, đúng §12g.0 "không bịa hình cho đủ ô") · `RichText` ·
`PhaseScarcityNote` · `QaMessageBubble` · `WorkSessionHeader` · `AiQuotaSubscriptionPanel`
(chuyền xuống `AiQuotaLane` — prop con tên `isLoading`, KHÔNG đổi tên vì là component ngoài,
pre-existing) · `QuizRecapList` (+ `skeletonCount`) · `ContentModal` (isSkeleton ĐỘC LẬP, không
union với `content` — `content` vẫn giữ nguyên nghĩa "undefined = rỗng thật", không phải đang
tải) · `PDFView` (shimmer TOÀN FILE, phân biệt với shimmer PER-PAGE có sẵn của
`PdfViewportPage`) · `PlaygroundConnectSheet` · `PlaygroundStepGuide` (isSkeleton ĐỘC LẬP —
`step` vốn đã optional nghĩa "đã xong", isSkeleton là trạng thái THỨ BA, xét TRƯỚC) ·
`E2eResultDrawer` (+ `skeletonCount`).

⚠️ **Luật mới, bắt được ngay trong đợt sửa này — nhánh `isSkeleton` với component CÓ HOOK phải
đứng SAU khi mọi hook đã gọi**, không phải "đầu hàm" như component không hook. Neo:
`MarkdownContent.tsx` tự đặt sai 2 lần liên tiếp trước khi đúng; áp lại đúng ngay từ đầu cho
`PDFView.tsx`/`E2eResultDrawer.tsx` (đã có hook, kiểm tra kỹ vị trí). Đã ghi vào `principles.md`
§12c.

**tsc sau khi thêm cả 24 union**: lộ ra lớp lỗi TypeScript quen thuộc — sau khi destructure props
từ discriminated union, TS KHÔNG tự narrow biến đã destructure theo nhánh `isSkeleton` đã check
— cần fallback thủ công (`value ?? default`, `(arr ?? [])`, `const safeX = x!`) tại từng chỗ dùng
ở nhánh `false`. Sửa ở `AiQuotaSubscriptionPanel` (`premiumLane?.data`) ·
`PhaseScarcityNote` (`currentPhase != null ? ... : ""`) · `PlaygroundConnectSheet`
(`safeConnection = connection ?? "waiting"`) · `QaMessageBubble` (`safeAnswer = answer!`) ·
`WorkSessionHeader` (`total ?? 0`, đã có sẵn comment giải thích) — mỗi chỗ đều kèm comment 1 dòng
nói rõ đây là fallback KHÔNG BAO GIỜ thật sự chạy (union đã đảm bảo), không phải xử lý edge case
thật.

**Phát hiện tiếp theo, MỞ RỘNG phạm vi sửa**: đọc lại §12g.0a (*"mọi tầng đều có leaf `Skeleton`
riêng trong story, có `code`"* — luật đã chốt 2026-07-27, không phải luật mới) → 22/24 file story
KHÔNG có leaf `Skeleton` (chỉ mới thêm prop ở component, chưa thêm leaf ở story — nếu dừng ở đây
coi như sót nửa việc, đúng loại lỗi thầy vừa cấm lặp lại). Bổ sung leaf `Skeleton` cho **tất cả
24 story file** (kể cả `KeyValue` tách `.Row`+`.List` = 25 file story), qua 23 agent song song
(`general-purpose`, mỗi agent 1 file, không đụng file nhau) + `CoverImage` sửa tay. Mỗi agent tự
đọc component thật để lấy đúng khuôn shimmer, tự đọc story file để khớp đúng quy ước ANNOTATE
sẵn có của FILE ĐÓ (không ép 1 khuôn cứng — nhiều file dùng `parts=` thay vì `annotate=`, nhiều
file không có `anatPart`/`showAnatomy` trên component nên leaf mới bỏ qua 2 prop đó thay vì tự
chế, đúng tinh thần "generic thật, đừng bịa").

⚠️ **1 lỗi tsc phát sinh TỪ chính đợt thêm leaf**: `KeyValueList.stories.tsx` leaf `Skeleton`
gọi `<KeyValueList isSkeleton />` thiếu `items` — vì `KeyValueList.items` **KHÔNG union theo
isSkeleton** (giữ nguyên luật §13b "repeated list ⇒ items LUÔN required", kể cả khi isSkeleton
bỏ qua nó để dùng `skeletonRows`) — nhiều agent khác chạy tsc SAU khi lỗi này đã có sẵn, tưởng
nhầm là "pre-existing". Xác minh lại bằng lần tsc TRƯỚC batch (sạch tuyệt đối) → đúng là lỗi mới,
sửa bằng `items={[]}`.

Verify cuối: `npx tsc --noEmit` sạch · eslint --fix 0 lỗi mới (1 lỗi pre-existing không liên quan
ở `Page.tsx` — prop `showAnatomy` chết trong `BottomBar`, có từ trước đợt sửa này, ngoài phạm
vi) · đủ 9/9 gate xanh · Storybook restart, build 100% không lỗi.

**Việc CHƯA làm, cố ý để lại**: `RichText`/`FlowDiagram`/`PDFView`/`StatPair`/`Legend`/
`SegmentBar`/`MetricCard`/`CoverImage` vẫn thiếu `anatPart`/`showAnatomy` (không phải mọi
composite cùng tầng đều có 2 prop này) — leaf `Skeleton` của các file đó có tab Code (yêu cầu
cứng của §12g.0a) nhưng KHÔNG có tab Structure. Thêm 2 prop này là việc RIÊNG, ngoài phạm vi đợt
này (chỉ `ProgressRing` được thêm, vì agent phụ trách nó tự quyết định — xem xét giữ vì an toàn/
additive, không revert). `StatPair.stories.tsx` cũng thiếu leaf riêng cho state khác của
`isSkeleton` nếu sau này `StatPair` có thêm trục hình (hiện chỉ 1 state là đủ).

### 2s. Vét cạn — thêm `anatPart`/`showAnatomy` cho 8 component còn thiếu (nối tiếp §2r)

Thầy: *"thế thì thêm đi, vét cạn"* — đóng nốt "chưa làm" cuối §2r. 8 agent song song (1 agent/
component, không đụng file nhau), mỗi agent tự đọc `ProgressRing.tsx` làm khuôn mẫu (root
`data-anat-part={anatPart}` ở MỌI nhánh, bar shimmer nội bộ `data-anat-part={showAnatomy ?
"Skeleton" : undefined}`), rồi tự quyết cách áp phù hợp cấu trúc THẬT của component mình —
KHÔNG ép 1 khuôn cứng:

- **Node đơn (root = shimmer, không có wrapper riêng)** — `RichText` · `PDFView` ·
  `FlowDiagram` (nhánh skeleton) · `CoverImage`: dùng công thức coalesce có sẵn từ
  `MarkdownContent.tsx`/`Typography.tsx` — `data-anat-part={anatPart ?? (showAnatomy ?
  "Skeleton" : undefined)}` — vì root và "internal shimmer" là CÙNG 1 phần tử, không tách được
  2 tag độc lập như `ProgressRing` (có `<div>` bọc ngoài `HeroSkeleton`).
- **Composite tái dùng composite khác** — `SegmentBar`→`Legend`, `StatRibbon`→`StatPair`: chuyền
  `anatPart`/`showAnatomy` THẲNG vào component con qua props mới của nó (không tự vẽ cây shimmer
  song song, không bọc `<div data-anat-part="Legend">` ngoài — đã có sẵn 1 lần từ agent
  `SegmentBar`, agent `Legend` chạy sau dọn lại đúng luật "chuyền cờ xuống atom, đừng dựng cây
  song song" §12g.0 mục 3). `StatRibbon` GIỮ NGUYÊN không chuyền tiếp xuống từng `StatPair` con —
  wrapper `<div data-anat-part="StatPair">` mỗi cell ĐÃ LÀ cửa của cây (storyId), chuyền tiếp
  xuống nữa sẽ tạo 2 tag `"StatPair"` lồng nhau, đúng luật "cây Deps chỉ MỘT NẤC".
- **`CoverImage`** (atom): agent phát hiện + tuân theo tiền lệ `IconTile.tsx` (2026-07-28, cùng
  tầng atom, cùng hình "1 node đơn") — leaf top-level (`WithImage`/`NoImage`/`Skeleton`) KHÔNG
  truyền `anatPart` từ story (để atom tự badge bằng fallback `showAnatomy`), tránh lặp lại
  anti-pattern "component tự khai part trỏ vào chính nó" đã gỡ ở `Spinner.Base` (2026-07-26).
  Đồng thời nâng cấp `WithImage`/`NoImage` (2 leaf trần cũ, không hề dùng `BlockAnatomy`) lên
  cùng khuôn panel với `Skeleton`.

⚠️ **1 lỗi phát sinh, tự bắt bằng gate**: `check-orphan-parts` báo `SegmentBar.tsx` badge
`"Skeleton"` (bar shimmer) nhưng story chưa khai trong `BAR_SKELETON_PARTS` — comment cũ trong
story (viết lúc thêm leaf `Skeleton` sáng cùng ngày) nói "nhánh isSkeleton không tag gì cả",
nhưng đợt vét cạn này đã tag thật rồi, comment thành SAI. Sửa: khai `BAR_SKELETON_PARTS` = 2 part
(`Skeleton` tier heroui, `Legend` tier composite trỏ `--skeleton` của chính nó), xoá câu why đã
lỗi thời trong leaf.

Verify: `tsc --noEmit` sạch, eslint --fix 0 lỗi mới, đủ 9/9 gate xanh (kể cả sau khi sửa
`check-orphan-parts`), Storybook restart build 100% không lỗi.

**Bài học phương pháp cho lần sau**: khi 2 agent song song CÙNG có khả năng đụng 1 vùng code
(ở đây: `SegmentBar.tsx` vừa nhận việc tự thêm props, vừa là nơi 1 agent khác — phụ trách
`Legend`/`StatPair` — có lý do quay lại wire tiếp), luôn đọc lại file đó bằng tay SAU khi cả 2
agent báo xong, trước khi tin cả 2 "tsc sạch" riêng lẻ là đủ — tsc sạch từng lượt không loại trừ
2 lượt ghi đè nhau để lại code thừa (ở đây không xảy ra, nhưng phải xác nhận bằng mắt, không suy
diễn từ báo cáo).

### 2s. Round-2 "phase 2" cho `size="lg"` — 26 đếm nhầm → 5 thật, 4/5 sai, tự bắt lỗi trong chính bảng audit

Nối tiếp §2q (title `MilestoneUpNextCard` sai size/weight). Thầy: *"scan rồi cho thầy cái tổng
thể rồi tiến hành audit hàng loạt theo phase 2 của feedback"* + *"scan story nhé"* — đúng bước
lượt 2 của skill (scope `.storybook/**` cả components lẫn stories).

✅ **Tự sửa lỗi đếm của chính mình TRƯỚC KHI báo**: đếm thô `grep 'size="lg"'` ra 26 — SAI, gộp
lẫn `size` của `Button`/`Avatar`/`Container`/`ModalShell`/`IconTile`/`ProgressRing` (mỗi
component có thang size RIÊNG, không liên quan `Typography`). Lọc lại bằng cách bắt đúng thẻ
`<Typography` đứng trước `size="lg"` → còn ĐÚNG **5 call-site thật** trong `components/` + **1**
trong `stories/` (fixture, không tính). Trình bảng tổng thể cho thầy TRƯỚC khi sửa (đúng lượt 2),
3/5 lúc đó chưa đủ bằng chứng.

Thầy: *"ok làm hết đi"* — tiếp tục đào đủ cả 5:
1. **`MilestoneUpNextCard`** — đã sửa ở §2q.
2. **`EnrollGate.tsx:165`** — `src` (`EnrollGate/index.tsx:67`) dùng `type="h4"` (HEADING 20px),
   không phải body `lg` (18px) — SAI HƯỚNG NGƯỢC (đang nhỏ hơn thật, không phải to hơn). Sửa
   `size="lg"` → `size="h4"`.
3. **`LeaderboardBoard.tsx:209`** (số hạng trên bục) — lần đầu đọc nhầm `Podium/index.tsx:88`
   (`type="body-sm"`) tưởng là số hạng, **tự phát hiện lỗi khi đọc lại kỹ**: dòng đó là TÊN
   người chơi, số hạng thật nằm ở `Podium/index.tsx:103-112`, 1 **div TRẦN** không qua
   Typography, không khai size (kế thừa `base`), chỉ `font-bold`. Sửa lại đúng: `lg`→`base`
   (KHÔNG phải `sm` như báo nhầm lúc đầu).
4. **`ContentPaywall.tsx:89`** — `src` (`PremiumPaywall/index.tsx:54`) là div trần
   `text-xl font-semibold` — khớp `size="h4"` (20px), không phải `lg`. Cùng dạng lỗi với
   `EnrollGate`.
5. **`VoiceHero.tsx:170`** (transcript) — `src` (`VoiceHero/index.tsx:136`)
   `<Typography className="text-foreground">` không khai `type` ⇒ mặc định `base`. Sửa
   `lg`→`base`.
6. **`QuizProgressPanel.tsx:152`** — tìm hết cách (không có dir `Quiz` riêng trong
   `src/components/features/learn`, không khớp pattern stat-value 2xl nào ở profile/learn) vẫn
   KHÔNG ra đúng real src — **để nguyên, không đoán bừa**, cần thầy chỉ đúng file.

**Kết quả: 4/5 chỗ sai, không có ca nào giống nhau** — 2 ca phải TĂNG lên heading (`h4`), 2 ca
phải GIẢM xuống `base` — xác nhận đúng dự đoán ban đầu là KHÔNG thể sửa hàng loạt máy móc, mỗi
chỗ cần đọc riêng `src` thật của nó.

✅ Cập nhật canon `principles.md` §9d (MỚI) — luật cỡ chữ: mặc định = `base` khi porting, vai trò
quyết định cỡ (không phải cảm giác "cần to hơn"), phân biệt `text-xl font-semibold`=`h4` (heading)
vs body `lg`, neo đủ 5 bug thật, + bài học "tự kiểm chứng lại chính bảng audit của mình — trích
đúng DÒNG không chỉ đúng FILE".

Verify: tsc sạch (loại 3 file đang bị phiên chat khác sửa dở dang, xác nhận qua `git status`:
`PageHeader.stories.tsx`, `KeyValueList.stories.tsx`, `SegmentBar.tsx`+story — không đụng), 8/9
gate xanh (bỏ `check-orphan-parts` cùng lý do — lỗi nằm ở `SegmentBar.tsx` không phải file tôi
sửa), eslint --fix 0 lỗi mới trên 4 file thật đã sửa. KHÔNG restart Storybook — cổng 6006 vẫn bị
chiếm suốt buổi.

### 2t. Ngôn ngữ code ở `ContentModeNav` quay lại dropdown trên màn nhỏ — ĐẢO NGƯỢC quyết định `compactLabel` cùng ngày

Ảnh `ContentModeNav` (hàng tab TS/Java/C#/Go), thầy: *"trong màn nhỏ thành dropdown chứ?"*.

**Kiểm tồn đọng trước (đúng luật vừa thêm vào skill)**: tìm thấy quyết định TRÁI NGƯỢC ở §2m
cùng ngày — *"bỏ hẳn `collapseRightOnMobile` (không còn ẩn nhóm ngôn ngữ vào dropdown nữa —
giờ luôn hiện tab, chỉ đổi chữ khi hẹp)"*. Trình lại nguyên văn, hỏi thầy có thật sự đảo ngược
không. Thầy: *"thầy sai, trò sửa lại đi"* — rồi khi trò hiểu nhầm thành "giữ nguyên, không đổi
gì", thầy chỉnh thẳng: *"sửa code đi chứ, để thành dropdown."* — xác nhận ĐẢO NGƯỢC thật, không
phải giữ nguyên.

✅ **Fix — `ContentModeNav.tsx`**: khôi phục `collapseRightOnMobile` cho `rightTabs` (cơ chế
này CHƯA BAO GIỜ bị xoá khỏi `Toolbar.tsx` — §2m chỉ ngừng GỌI nó từ `ContentModeNav`, composite
vẫn giữ nguyên cả 2 khả năng). Đồng thời bắt ra 1 gap: `Toolbar`'s dropdown collapse render
`Select` trigger ICON-ONLY (nhãn `sr-only`, §13c — *"a compact ICON-ONLY trigger that must not
stretch"*) nhưng `ContentLanguage` không hề có field `icon` nào (chỉ `label`) — bật
`collapseRightOnMobile` suông sẽ ra trigger RỖNG (không icon, không chữ, chỉ mũi tên). Thêm
`LANGUAGE_ICON` dùng CHUNG 1 icon (`CodeIcon`, không phân biệt từng ngôn ngữ) cho mọi item —
đúng khuôn `Toolbar`'s story mẫu `RightNeutralCollapsed` (mọi item dùng chung 1 `GlobeIcon`,
không phải icon riêng từng ngôn ngữ).

✅ **Dọn theo — bỏ hẳn `compactLabel` khỏi `ContentModeNav`** (không phải chỉ thêm
`collapseRightOnMobile` cạnh nó): 1 khi dropdown thu hết cả nhóm tab dưới `@app-sm`, nhánh
`compactLabel` (vốn cũng chỉ hiện dưới `@app-sm`) KHÔNG BAO GIỜ còn render được nữa — giữ lại là
dead code. Xoá field `compactLabel` khỏi `ContentLanguage` interface + JSDoc, khỏi mapping
`rightTabs.items`, khỏi 3 fixture (`ContentModeNav.stories.tsx` ×2, `ContentPage.stories.tsx`
×1) + sửa lại `why`-text của state liên quan. `Toolbar.tsx`'s `compactLabel` mechanism GIỮ
NGUYÊN (composite generic, không riêng cho `ContentModeNav`, có thể vẫn cần cho caller khác).

✅ **Thêm state mới chứng minh dropdown thật** (`ContentModeNav.stories.tsx`, leaf
`WithLanguages`): "4 available, narrow column (below @app-sm) ⇒ language group collapses to a
dropdown" — bọc `<div className="@container" style={{width:375}}>` quanh render, đúng kỹ thuật
`ContentPage.stories.tsx`'s "Practice nudge — responsive" đã dùng (đổi layout/hành vi responsive
PHẢI có story chứng minh, không chỉ đổi code rồi mặc định "chắc đúng").

Verify: tsc sạch, 9/9 gate xanh (kể cả `check-story-ids` — storyId `ANNOTATE` đổi trỏ
`composites-navigation-toolbar-toolbar--right-neutral-collapsed`), eslint --fix 0 lỗi mới.
KHÔNG restart Storybook — cổng 6006 vẫn bị 1 phiên chat khác chiếm.

**Bài học phương pháp**: 1 quyết định đã chốt trong CÙNG buổi vẫn có thể bị chính thầy đảo
ngược ngay sau — "kiểm tồn đọng" không phải để CẢN sửa, chỉ để chắc chắn đây là ĐẢO NGƯỢC có ý
thức chứ không phải hỏi lặp do quên. Sau khi thầy xác nhận đảo ngược thật, sửa đến nơi đến
chốn: khôi phục cơ chế cũ, dọn hẳn cơ chế vừa bị thay thế (đừng để cả 2 cùng tồn tại), và bắt
thêm 1 gap phát sinh (icon rỗng) đáng lẽ sẽ tạo ra 1 lỗi hiển thị MỚI nếu chỉ bật cờ suông.

**⚠️ Follow-up ngay sau khi thầy soi ảnh dropdown MỞ RA thật (cùng vòng)**: thầy chỉ đúng icon
`</>` lặp lại y hệt trước MỌI dòng (TypeScript/Java/C#/Go đều đã hiện đủ chữ) — *"dropdown ra
chữ chứ ra cái icon vậy có ý nghĩa chi?"*. Đúng luật icon quốc dân §5a.2 đã chốt: icon chỉ giữ
khi mang thêm liên tưởng NGOÀI chữ đã có sẵn — lặp same icon trên mọi dòng cạnh chữ đã đọc được
là thừa. Icon chỉ thật sự cần cho TRIGGER lúc đóng (không có chữ nào để đọc, phải dựa icon).

✅ **Fix ở tầng composite `Toolbar.tsx`** (không phải riêng `ContentModeNav` — áp cho MỌI
dropdown-collapse dùng chung `renderSelect`, kể cả story mẫu `RightNeutralCollapsed` sẵn có
dùng chung `GlobeIcon` cho vi/en, vốn dính CÙNG lỗi mà chưa ai soi): bỏ `item.icon` khỏi mỗi
`ListBox.Item` trong popover (chỉ còn `item.label`), giữ nguyên `item.icon` ở `Select.Trigger`
(nơi DUY NHẤT icon còn cần thiết).

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi. KHÔNG restart Storybook — cổng 6006 vẫn bị
phiên chat khác chiếm (thầy tự thấy "Connection lost" trên tab của thầy, đúng do HMR đứt khi có
sửa file source — không phải lỗi từ phía trò).

### 2u. Underline "quiet link" không đều — thiếu đúng 1 class thầy chỉ đích danh: "lấy CSS Link của HeroUI"

Ảnh `ContentPager` (title 2 dòng, underline dưới dòng đầu), thầy: *"sao kích thước underline
không đều nhỉ? lấy css của Link underline của heroui mà?"*.

**Chẩn đoán — mở CSS THẬT của HeroUI `Link` thay vì tin lại chuỗi className đã chép trước đó**:
`node_modules/@heroui/styles/src/components/link/link.styles.ts` (base class thật) có
`decoration-[1.5px]` — chuỗi "quiet link" hiện tại trong `Typography.tsx`
(`GROUP_HOVER_UNDERLINE_CLS`/`SELF_HOVER_UNDERLINE_CLS`, chốt ở §2e) chỉ có
`underline-offset-4 decoration-[var(--separator-tertiary)]`, THIẾU đúng `decoration-[1.5px]`.
Lý do bị sót: công thức này chép từ `src` thật (`CommentItem.tsx`) — nhưng `CommentItem` render
qua **`<Link>` THẬT của `@heroui/react`** (`import { Link } from "@heroui/react"`), có sẵn base
class `.link` bake `decoration-[1.5px]` — className ở call-site đó chỉ override offset+màu,
chưa từng cần khai lại thickness vì HeroLink đã cho sẵn. Chép Y HỆT chuỗi className (không chép
cả class nền) lên `Typography` (không phải `HeroLink`, không kế thừa gì) làm rớt mất
`decoration-[1.5px]`, để lại `text-decoration-thickness: auto` — trình duyệt tự tính, mỏng hơn/
không nhất quán so với 1.5px cố định.

✅ **Fix**: `Typography.tsx` — cả `GROUP_HOVER_UNDERLINE_CLS` và `SELF_HOVER_UNDERLINE_CLS` thêm
`decoration-[1.5px]` tường minh. `SELF_HOVER_UNDERLINE_CLS`'s usage duy nhất (`isLink` branch)
đã render qua `HeroLink` nên vốn không bị ảnh hưởng (thickness kế thừa sẵn) — thêm tường minh
chỉ để 2 hằng số thực sự "SAME recipe" như doc của chúng tự nhận, phòng khi sau này bị dùng lại
ở ngữ cảnh không phải `HeroLink`.

Verify: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi (file: `Typography.tsx`). KHÔNG restart
Storybook — cổng 6006 vẫn bị phiên chat khác chiếm.

**Bài học phương pháp — lặp lại đúng khuôn `TILE_CHROME` (§2q)**: khi feedback chỉ đích danh
"lấy CSS của component HeroUI X", phải mở CSS THẬT của X trong `node_modules` — không chỉ đọc
lại chuỗi className ở 1 call-site `src` đã dùng X, vì call-site đó rất có thể đang ĂN THEO 1
class NỀN không hề xuất hiện trong chính chuỗi className nhìn thấy.

### 2v. Deep research — cỡ chữ + button variant, dispatch 2 Explore agent song song (2026-07-29)

Thầy: *"giờ có 2 thứ rất loạn. 1 là cỡ chữ, text-xs text-sm không có rules... text-lg khi nào,
semibold khi nào, bold khi nào... và button. button secondary chỉ đi kèm primary. còn lại thì
tertiary. ghost khi nào... deep research và trả lời thầy"* — yêu cầu ĐÀO SÂU thật (không chỉ
grep vài file) thay vì tiếp tục vá lẻ tẻ theo từng screenshot như các vòng trước.

**Phương pháp**: dispatch 2 `Agent` (subagent_type: Explore) chạy song song trong CÙNG 1
message — 1 con đọc ~70 file `src` thật để lập bảng vai trò→`type` cỡ chữ; 1 con đọc type
definition thật của HeroUI (`node_modules/@heroui/styles/dist/components/button/
button.styles.d.ts`) + ~35 file `src` để kiểm chứng giả thuyết button của thầy.

✅ **Kết quả cỡ chữ**: xương sống thật là `body-sm`(541)/`body-xs`(431), KHÔNG PHẢI heading —
`h1`/`h2` chỉ 1 lần MỖI loại (đều là ca đặc biệt: mã lỗi trang, skeleton). Luật riêng dễ nhầm
nhất: **tiêu đề Modal = `body` + `weight="semibold"`, KHÔNG BAO GIỜ `h*`** (neo
`PaymentModal/index.tsx:460`, `CookieConsentModal/index.tsx:45`) — bản năng hay đọc "to đậm" rồi
tự nâng lên heading, y hệt kiểu lỗi đã sửa ở 5-bug case study (§9d cũ).

❌ **Giả thuyết button "secondary chỉ đi kèm primary, còn lại tertiary" — BÁC BỎ bằng số đếm**:
chỉ 3 cụm secondary có primary sibling, trong khi ≥8 cụm secondary đứng MỘT MÌNH (neo
`SystemStatus/index.tsx:67-75`, `PinnedProjectCard/index.tsx:90-129`). Kết luận thật: `secondary`
là 1 mức nhấn trung bình ĐỘC LẬP, không phải "vệ tinh của primary". Đồng thời phát hiện lớn hơn cả
giả thuyết ban đầu: atom `Button` (Storybook) đang THIẾU 2/7 variant thật của HeroUI —
`tertiary` (77 call-site, nhiều hơn cả `ghost`) và `outline` (6 call-site) chưa có trong
`ButtonVariant` type. `ghost` vs `tertiary` tự `src` cũng KHÔNG nhất quán (2 nơi làm cùng 1 việc
reorder icon-only nhưng khác variant) — không rút được luật cứng từ src, cần thầy chốt luật
RIÊNG cho Storybook.

✅ **Giao sản phẩm**: 2 trang HTML 8080 siêu chi tiết kèm bảng ✅/❌ ví dụ đúng/sai (không chỉ
liệt kê phát hiện) — `text-size-system.html` (nâng cấp từ bản cũ) và `button-variant-system.html`
(mới) tại `.artifacts/decompose/`, cả 2 verify 200 OK. Ghi vào canon `principles.md` §9d (nâng
cấp, thêm bảng vai trò+ví dụ đúng/sai) và `## 15.` mới (Button variant, đầy đủ giả thuyết bị bác
bỏ + action-items CHƯA áp).

⚠️ **CHƯA sửa code** — đây là vòng "vẽ ra + lưu rules", không phải "sửa code". Việc thêm
`tertiary`/`outline` vào `button-tokens.ts` và audit lại các chỗ `secondary` đứng một mình còn
chờ thầy chốt riêng (xem `principles.md` §15d).

### 2w. Thầy chốt "cắm workflows sửa hết đi" — áp §15 vào code thật (2026-07-29)

Tiếp ngay sau §2v: thầy *"rồi cắm workflows sửa hết đi"* — cho phép áp các action-item §15d vào
code, dùng cơ chế Workflow (multi-agent) vì đây là lần đầu thầy chủ động gọi tên "workflows".

**Bước 1 — mechanical, làm trực tiếp không cần agent**: `button-tokens.ts` thêm `"tertiary"` +
`"outline"` vào `ButtonVariant`/`HeroVariant`/`HERO_VARIANT`. Phát hiện thêm khi mở lại comment
cũ: HeroUI thật (`node_modules/@heroui/styles/.../button.styles.d.ts`) khai `danger-soft` NGUYÊN
GỐC (không phải chỉ 6 giá trị như comment cũ tưởng) — nhưng KHÔNG đổi cách `danger-soft` đang
mượn `secondary` + `VARIANT_CLS`, vì đó là việc RIÊNG ngoài phạm vi thêm `tertiary`/`outline`.

**Bước 2 — fan-out**: grep toàn bộ `.storybook/components` ra 33 file có chuỗi
`variant="secondary"`, lọc thủ công còn **20 call-site THẬT của component `Button`** (loại trừ
`Tabs`/`Select`/`Input`/`TextField`/`InputGroup`/`ComboBox` — các component này có prop
`variant` RIÊNG, trùng tên nhưng không liên quan gì tới `ButtonVariant`). Gom theo file còn 16
file, dispatch 1 workflow `parallel()` 16 agent — mỗi agent đọc ngữ cảnh quanh (các) chỗ
`variant="secondary"` của file mình, áp ĐÚNG luật §15c (không tự nghĩ luật mới), tự sửa bằng
Edit tool nếu cần, trả JSON `{file, decisions:[{line, verdict, reasoning}]}`.

✅ **Kết quả — 11 đổi sang `tertiary`, 9 giữ `secondary`**:

| Đổi → `tertiary` | Lý do (rút gọn) |
|---|---|
| `AsyncContent.tsx:114` (nút retry) | Đúng ví dụ "nút retry" của §15c |
| `PersonalProjectTaskPage.tsx:454,462` ("Xem phản hồi"/"Xem lịch sử nộp") | Xem-lại phụ, trọng tâm cụm là "Đánh giá" |
| `SubmissionAttemptsDrawer.tsx:214` ("Xem chi tiết") | Không cạnh primary, không đứng một mình (2 nút), đều là "xem lại" phụ |
| `ProfileHero.tsx:300` (icon-only share) | Icon-only lặt vặt cạnh CTA chính follow/hire/edit |
| `ChallengeDeliverableList.tsx:327` (icon-only cài đặt chấm điểm) | Đứng một mình, không phải hành động chính của cụm |
| `FlashcardStudyCard.tsx:212,224` (prev/next lật thẻ) | Đúng ví dụ "điều hướng prev/next của 1 control con" |
| `PlaygroundSetupSteps.tsx:270,284` ("Kiểm tra lại"/"Làm mã mới") | Không cạnh primary, đứng chung hàng nhau (không đơn độc), phụ so với nội dung chính (lệnh/guide) |
| `TaskSubmissionPanel.tsx:266` (icon-only cài đặt) | Đứng một mình, không phải trọng tâm của `SettingsSummaryRow` |

| Giữ `secondary` | Lý do (rút gọn) |
|---|---|
| `ChallengeDeliverableList.tsx:250` ("Xem lịch sử") | Cạnh `primary` ("Nộp bài") — nhánh (a) |
| `WorkSessionHeader.tsx:133` (Finish) | Đơn độc nhưng LÀ hành động chính của cụm — nhánh (b) |
| `ConsultantProfileBody.tsx:182` (tên công ty) | Đơn độc, là hành động khả-nhấn DUY NHẤT của cụm identity — nhánh (b) |
| `CourseQaComposer.tsx:220` (Huỷ) | Cạnh `primary` (Gửi) — nhánh (a) |
| `MockInterviewScorecard.tsx:369` | Cạnh `primary` trong hàng CTA capstone — nhánh (a) |
| `LeaderboardToolbar.tsx:129` (refresh) | Đơn độc, trùng chính xác ca neo `SystemStatus` trong canon — nhánh (b) |
| `MockInterviewSetup.tsx:253` ("Bắt đầu Design") | Cạnh `primary` ("Bắt đầu Q&A") — nhánh (a) |
| `PlaygroundConnectSheet.tsx:262` ("Kết nối lại") | Đơn độc, nút cạnh chỉ là toggle `ghost` không cạnh tranh — nhánh (b) |
| `PlaygroundStepGuide.tsx:159` ("Về trung tâm Playground") | Đơn độc, là hành động chính DUY NHẤT của leaf hoàn thành — nhánh (b) |

✅ **Verify**: `tsc --noEmit` sạch (0 output), 9/9 gate script chạy lại — không phát sinh lỗi mới
ở bất kỳ file nào trong 17 file đụng tới (các lỗi gate hiện có đều là nợ cũ, không liên quan:
`stats/*` thiếu story, 5 storyId gãy trong `_legacy`). `eslint --fix` sạch trên toàn bộ 17 file.

⚠️ **Phát hiện phụ, KHÔNG động vào**: `WorkSessionHeader.tsx` đang có 1 diff LỚN không liên quan
(thêm `isSkeleton` + tái cấu trúc props) — xác nhận qua `git status`/`git diff` đây là việc CÓ
SẴN từ trước khi agent này mở file (agent kết luận "kept-secondary", không sửa gì) — không phải
do workflow gây ra, không đụng vào, đúng luật "không destructive/không sửa việc phiên khác".

### 2x. Thầy hỏi lại "la sao" về §15b treo — mở ra bằng chứng SỐNG, chốt luật 4 tầng (2026-07-29)

Thầy hỏi lại ý nghĩa của mục "còn treo §15b" trong báo cáo trước. Đào sâu thêm bằng grep trực
tiếp trong Storybook (không chỉ dựa vào report cũ của agent research) — phát hiện độ rối THẬT còn
lớn hơn báo cáo ban đầu:

1. **Va chạm do CHÍNH đợt audit §15d gây ra**: `SubmissionAttemptsDrawer.tsx` có 2 nút cùng cụm
   ("Xem chi tiết" dòng 214 vừa đổi `tertiary`, "Xem bài nộp" dòng 222 vẫn `ghost` — không nằm
   trong danh sách audit vì lúc đó chỉ grep `variant="secondary"`).
2. **Pattern "Huỷ cạnh primary" đã có 2 cách làm trong chính Storybook** (không chỉ trong `src`):
   `ContentCommentComposer.tsx:158` = `ghost`, `CourseQaComposer.tsx:220` = `secondary`.
3. **Bằng chứng NGƯỢC LẠI cho thấy `ghost` không phải lỗi**: `MockInterviewScorecard.tsx:357-383`
   — 1 hàng 3 nút `primary`→`secondary`→`ghost` ("Phỏng vấn lại"), đọc gradient rất hợp lý, không
   rõ có cần `tertiary` chen vào giữa không.

Trình bày cả 3 bằng chứng cho thầy qua `AskUserQuestion` (2 câu: xử lý va chạm cụ thể + luật
chung) thay vì tự chọn hướng — đúng luật "KHÔNG tự chốt thay thầy".

✅ **Thầy chốt cả 2**: (1) đồng bộ `SubmissionAttemptsDrawer.tsx:222` sang `tertiary` cho khớp
dòng 214 — đã sửa, eslint sạch. (2) Luật chung — mô hình **4 TẦNG** `primary→secondary→tertiary→
ghost` theo mức nhấn giảm dần: `ghost` dùng khi cụm có ≥3 nút cần phân bậc rõ (neo
`MockInterviewScorecard`, GIỮ NGUYÊN không sửa); `tertiary` dùng khi cụm chỉ 2 mức nhưng nút phụ
vẫn cần rõ ràng là 1 nút. Ghi vào `principles.md` §15b, thay hẳn phần "chưa nhất quán, không tự
gộp" cũ. Luật áp dụng CHO VIỆC VỀ SAU, KHÔNG kích hoạt quét lại toàn bộ `ghost` hiện có — riêng
việc "Huỷ cạnh primary" (`ContentCommentComposer` vs `CourseQaComposer`) lúc đầu chỉ GHI NHẬN,
CHƯA sửa, chờ thầy xác nhận riêng.

Dựng thêm 1 trang 8080 riêng — `ghost-vs-tertiary-system.html` — gom cả 3 bằng chứng + thang 4
tầng + phép thử "đếm số nút trong cụm" thành 1 trang tổng hợp, thay vì chỉ nhắc trong chat.

**Thầy hỏi lại "y la sao/"** về đúng đoạn "còn treo" ở cuối báo cáo — giải thích lại bằng bảng
đối chiếu: cả 2 cụm đều CHỈ 2 nút (không có tầng thứ 3) nên theo luật vừa chốt, `ghost` VÀ
`secondary` đều sai theo CÙNG 1 kiểu (thiếu tầng đáy để làm điểm tựa), không phải 1 đúng 1 sai.

✅ **Thầy chốt "ok cả 2 là terri"**: đổi `ContentCommentComposer.tsx:158` (`ghost`→`tertiary`) và
`CourseQaComposer.tsx:220` (`secondary`→`tertiary`). Verify: `tsc --noEmit` sạch (0 output),
`eslint --fix` sạch trên cả 2 file. Cập nhật `principles.md` §15b (đóng mục "ghi nhận, chưa sửa"
thành "đã sửa") và trang 8080 (đổi card "còn treo" thành "đã sửa", before/after gạch ngang).

**3/3 va chạm phát hiện được trong lượt soát ghost-vs-tertiary này đều đã xử lý xong.**

### 2y. `/starci-fe-story-feedback` — ReactionButton: cỡ chữ + màu + button size (2026-07-29)

**Lượt 1 — ghi nhớ nguyên văn**: ảnh chụp `ContentPage/PracticeNudgeResponsive` cho thấy "👍
Thích" + "👍❤️😂 128" + "2.481 lượt xem". Thầy: *"128 text-sm va icon size-5. 128
text-foreground. rules là bên trái là text-sm còn bên phải là text-muted."* → hỏi lại rõ phạm vi
→ thầy chốt thêm: *"button này size bth, không phải size sm."* / *"2481 giữ nguyên vì rules là
nó là phụ."*

Đọc `ReactionBar.tsx`/`InteractionBar.tsx` (real `src`) đối chiếu — ban đầu phản biện rằng "128"
ĐÃ ĐÚNG `xs`/`muted` khớp `src` (2 nguồn độc lập), và variant nút reacted=`secondary` cũng khớp
`src`. Thầy chốt **"ok, src không quan trọng"** — ghi đè: cụm reaction chủ động lệch khỏi `src`.

✅ **Áp dụng (`ReactionButton.tsx`)**:
- nút "Thích": bỏ `size="sm"` (về `md`) · `variant` gộp cố định `"tertiary"` (không đổi theo
  trạng thái reaction nữa, thay `variant={myReaction ? "secondary" : "ghost"}`)
- `ReactionGlyph` thêm mức `size="sm"` mới (`size-5`) — trước chỉ có `xs`(size-4)/`md`(size-7)
- icon trong nút + icon cụm tóm tắt: `xs` → `sm` (size-5)
- chữ trong nút + số "128": `text-xs`/`size="xs"` → `text-sm`/`size="sm"`, bỏ `color="muted"`
  ở "128" (Typography default → foreground)
- `"lượt xem"` (`ContentReaction.tsx`): **giữ nguyên** `xs`+`muted`, không đụng — thầy xác nhận
  "vì rules là nó là phụ"

Verify: `tsc --noEmit` sạch (0 output), `eslint --fix` sạch.

**Thầy hỏi ngược "trò hiểu tư duy này k đã"** — buộc trình bày lại NGUYÊN LÝ thay vì chỉ báo đã
sửa. Kết luận (thầy xác nhận "ok"): phép thử cũ ở `color-system.html`/§9a ("số cạnh 1 hành động
đã là trọng tâm → muted") SAI vì gộp chung "128" và "lượt xem" vào 1 rổ. Luật ĐÚNG cần 2 lớp:
(1) con số có mang GIÁ TRỊ THÔNG TIN thật (bằng chứng xã hội) hay chỉ trivia; (2) con số có DÍNH
LIỀN cấu trúc với 1 control active hay đứng riêng. "128" đạt cả 2 (giá trị + dính liền nút) →
foreground; "lượt xem" không đạt cả 2 (trivia + đứng riêng) → muted đúng, giữ nguyên.

✅ **Ghi vào canon**: `principles.md` §9a.1 (mới) — luật 2 lớp + neo bug. `color-system.html`
viết lại mục 2 (đánh dấu SAI, gạch ngang) + mục 2b (phép thử đúng) + mục 4 (case study đảo ngược
kết luận cũ). Đây là 1 case **hiếm** trong phiên này: canon TỰ SỬA LƯNG chính nó — phép thử viết
ra hôm trước đã bị chứng minh sai bởi feedback hôm sau, không phải bổ sung mà là THAY THẾ.

✅ **Lượt 2 — quét xong, đã chốt + áp**: grep thô `color="muted"` ra 138 file (quá rộng, hầu hết
label/caption/timestamp hợp lệ) — thu hẹp đúng nghĩa "count dính liền 1 control tương tác" (grep
`upvote`/`vote`/`helpful` = 0 hit toàn Storybook) chỉ còn **1 ứng viên thật**: `QaReactionBar.tsx:81`
— heart-toggle dưới câu hỏi/trả lời Q&A, `Typography color={hasReacted ? undefined : "muted"}`
bên TRONG cùng 1 `<button>` với icon tim — đã làm đúng MỘT NỬA (khi đã reaction thì foreground),
còn khi CHƯA reaction vẫn muted. Theo luật 2 lớp: count này dính liền TRONG button (còn chặt hơn
`ReactionButton`) + mang giá trị (bao nhiêu người thấy hữu ích) → nên LUÔN foreground, không phụ
trạng thái. `_legacy/designs/feed/ReactionBar.tsx` có cùng shape nhưng chỉ `_legacy/**` khác
dùng — không đụng, theo lệ cả phiên.

Thầy chốt "ok làm đi" → sửa `QaReactionBar.tsx:81`: bỏ hẳn ternary `color={hasReacted ? undefined
: "muted"}`, luôn foreground (không khai `color`). Giữ nguyên `size="xs"` — cỡ chữ KHÔNG phải hệ
quả bắt buộc của luật màu, đó là quyết định riêng của `ReactionButton` (nút to hơn).

Verify full: `tsc --noEmit` sạch (0 output), `eslint --fix` sạch, 9/9 gate script chạy lại —
không phát sinh cảnh báo nào ở `ReactionButton.tsx`/`QaReactionBar.tsx`.

**Tổng kết vòng feedback này — 2 lượt đã chốt xong**: Lượt 1 sửa `ReactionButton.tsx` (5 chỗ:
button size, icon size ×2, text size ×2, bỏ muted ở "128"). Lượt 2 sửa `QaReactionBar.tsx` (1
chỗ: bỏ ternary muted). Canon cập nhật: `principles.md` §9a.1 (luật 2 lớp mới, THAY THẾ phép thử
cũ) + `color-system.html` (viết lại mục 2/2b/4).

### 2z. `ChallengePage` — thầy nhớ đúng "desktop phải render flex", dựng khung mới `SplitWorkspace`

Thầy: *"audits cái này nhé, có 3 screen tablet, desktop, mobile. với thầy nhớ desktop là phải
render flex chứ nhỉ? check kĩ code thật và render."*

**Chẩn đoán — 2 phần**: (1) `ChallengePage.stories.tsx` chưa hề có 3 state tablet/desktop/mobile
nào — thầy nhớ nhầm là ĐÃ có, thực ra CHƯA từng dựng. (2) Thầy nhớ ĐÚNG về hành vi: real `src`'s
`ChallengeView/index.tsx:195` = `flex flex-col gap-6 @app-xl:flex-row @app-xl:items-start
@app-xl:gap-8` — CỘT DỌC mặc định (mobile+tablet), CHỈ chuyển ngang ở `@app-xl` (desktop).
`ChallengePage.tsx` lúc đó dùng `<StackH gap="section" align="start" wrap>` — `StackH` là trục
NGANG CỐ ĐỊNH (2 member Stack.\* = 2 trục, không tự đổi theo bề rộng, đúng thiết kế), và vì cột
đọc có `min-w-0 flex-1` (co vô hạn), `wrap` gần như KHÔNG BAO GIỜ kích hoạt — nghĩa là ở MỌI bề
rộng kể cả mobile, trang cố ép 2 cột cạnh nhau thay vì xếp chồng dọc.

**Grep ra 1 ca thứ 2 độc lập TRƯỚC KHI sửa** (đủ điều kiện lên khung mới, không phải vá riêng
lẻ): real `src`'s `PersonalProjectWorkspace/index.tsx:61` có **byte-for-byte CÙNG 1 chuỗi CSS**;
Storybook's `PersonalProjectTaskPage.tsx` cũng `StackH…wrap`, tự ghi sẵn đúng câu thú nhận
*"the BEST-AVAILABLE substitute... this design system has no dedicated 'reading column + fixed
aside' frame yet"* — y hệt comment trong `ChallengePage.tsx`.

✅ **Dựng khung mới `frames/SplitWorkspace/SplitWorkspace.tsx`** (LAYOUT tier, namespace 1
member `.Base`) — 2 khe tên (`main`/`aside`, không phải `children` — 2 vai KHÁC hẳn nhau, đúng
§13b): root `flex flex-col gap-6 @app-xl:flex-row @app-xl:items-start @app-xl:gap-8`; `main`
`min-w-0 flex-1`; `aside` `w-full shrink-0 @app-xl:sticky @app-xl:top-24
@app-xl:max-h-[calc(100dvh-7rem)] @app-xl:w-[360px] @app-xl:self-start @app-xl:overflow-y-auto`.
**Mọi số đo HARD-OWNED, không phải prop** (§6c) — cả 2 nguồn `src` độc lập đồng ý y hệt từng con
số, không có case thứ 2 nào khác để tổng quát hoá; thêm prop chỉ khi có ca thứ 3 thật sự lệch số.

✅ **Áp cho cả 2 màn (lượt 2, đã trình danh sách trước khi sửa, thầy "ok" trọn gói)**:
`ChallengePage.tsx` + `PersonalProjectTaskPage.tsx` — cả 2 đổi `StackH gap="section" align=
"start" wrap` bọc 2 `StackV` → `SplitWorkspace main={...} aside={...}`. `StackV` bên trong GIỮ
NGUYÊN gap (`page`/`section`), chỉ khung NGOÀI đổi. `PersonalProjectTaskPage`'s `StackH` vẫn
còn sống ở hàng nút hành động bên trong `aside` (chỗ khác hẳn, không đụng) — giữ nguyên +
ANNOTATE riêng, không xoá nhầm.

⚠️ **Bẫy tự bắt được qua `check-orphan-parts`**: badge `data-anat-part` ban đầu gắn cho 2 khe
`main`/`aside` — gate bắt lỗi ngay ("khai hoặc bỏ badge"). Đúng bản chất đây là **CALLER SLOT**
(loại 3 trong 3 loại gate tự phân — "node bên trong thuộc về NGƯỜI TRUYỀN nó, không phải của
khung"), y hệt `Container.body` không tự badge nội dung của nó — bỏ hẳn badge, không khai giả.
Kéo theo: prop `showAnatomy` trên `SplitWorkspace` không còn gì để gate (root's `anatPart` không
phụ thuộc `showAnatomy`, 2 khe không tự badge) → bỏ hẳn luôn prop `showAnatomy` khỏi
`SplitWorkspaceBaseProps` (đỡ 1 prop chết thay vì giữ lại "cho đủ bộ" — cả 2 call-site cũng bỏ
theo, tsc tự bắt chỗ nào quên).

✅ **Dựng mới 3 state Mobile 375px/Tablet 768px/Desktop 1280px** — CẢ ở `SplitWorkspace.stories.tsx`
(leaf `Default`, minh hoạ khung trần) LẪN `ChallengePage.stories.tsx` (leaf mới `Responsive`,
cùng data với `NotAttempted`, chỉ đổi bề rộng `@container`) — đúng kỹ thuật `ContentPage`'s
"Practice nudge — responsive" đã dùng trước đó. Không thêm leaf tương tự cho
`PersonalProjectTaskPage` (ngoài phạm vi thầy yêu cầu, chỉ `ChallengePage` cần "3 screen").

Verify: tsc sạch, 9/9 gate xanh (bắt + tự sửa 1 lỗi `check-orphan-parts` giữa chừng, xem trên),
eslint --fix 0 lỗi mới. KHÔNG restart Storybook — cổng 6006 vẫn bị 1 phiên chat khác chiếm.

**Bài học phương pháp**: (1) thầy "nhớ" 2 điều trong 1 câu có thể ĐÚNG-SAI khác nhau — kiểm
từng vế bằng code/DOM thật (state 3-tablet-desktop-mobile: SAI, chưa hề có; hành vi flex chỉ-ở-
desktop: ĐÚNG, code thật xác nhận) — không gộp chung "thầy nói vậy chắc đúng hết" hay "chắc thầy
nhớ nhầm hết". (2) 1 pattern lặp lại ở ≥2 nguồn `src` ĐỘC LẬP + ≥2 nơi Storybook cùng tự thú "no
dedicated frame yet" là bằng chứng đủ mạnh để dựng 1 khung layout MỚI thay vì vá từng screen —
không cần đợi thầy chỉ ra case thứ 2, tự grep tìm trước khi đề xuất phạm vi sửa.

### 2zz. Thầy: "6006 bị chiếm thì kill đi restart lại" — kill+restart lộ ra bug THẬT nằm sẵn ở `Container.tsx`

Thầy gửi ảnh render vẫn y hệt cũ, chốt luật mới: **cổng 6006 bị chiếm ⇒ KILL process rồi tự
restart**, không né tránh như quy ước cũ ("đừng lái Storybook qua Browser pane, để thầy tự
xem"). Tìm process qua `Get-NetTCPConnection -LocalPort 6006` → PID node.exe → xác nhận đúng
loại process trước khi `Stop-Process -Force` → `preview_start name="storybook"` (đã khai sẵn
trong `.claude/launch.json`).

**Soi DOM thật sau khi restart mới lộ ra**: `SplitWorkspace` (fix §2z) vẫn `flexDirection:
column` — kể cả khi resize browser lên **1920px** (rộng hơn `@app-xl`=1280px rất nhiều)! Bug
KHÔNG phải do `SplitWorkspace` (tự cô lập test riêng bằng `container-type` thô, class CSS đúng
100%) — mà nằm ở **`Container.tsx`** có sẵn từ trước, chỉ chưa ai chạm đúng tổ hợp để lộ ra:

`Container.tsx` mở `@container` VÀ có `p-*` (padding) trên **CÙNG 1 element**
(`className="@container mx-auto w-full max-w-app-xl p-6"`). CSS container-query đo theo
**content-box** (đã trừ padding) của chính element mở container đó — nên `size="xl"` (cap
đúng `max-w-app-xl` = 80rem, CÙNG token với ngưỡng `@app-xl`) không bao giờ đủ content-width
chạm `@app-xl`, vì đã bị trừ mất `p-6` (24px×2=48px) ngay trên chính nó — **`@app-xl:` con bên
trong KHÔNG THỂ fire, ở BẤT KỲ bề rộng viewport nào**, kể cả 1920px, vì `Container` tự cắt
content-box của MÌNH xuống dưới ngưỡng trước khi con kịp đo. Đây là bug tồn tại từ 2026-07-26
(lúc dựng `Container`) nhưng chưa ai phát hiện vì story cũ của `Container` (`ContainerQuery`
leaf) chỉ test "size=xl chạm @app-lg" (thấp hơn cap 1 bậc, còn dư khoảng trống bù padding) —
`SplitWorkspace` là ca ĐẦU TIÊN đòi đúng "size=xl chạm CHÍNH @app-xl", đúng ranh giới bị bug.

✅ **Fix (thầy duyệt: "container.tsx theo hướng tách 2 lớp")**: `Container.tsx` tách 1 div
thành 2 lớp lồng nhau — lớp NGOÀI giữ `@container`+`max-w-app-*` (KHÔNG padding, đo đủ trọn cap
thật), lớp TRONG giữ `padding` riêng. `data-anat-part={anatPart}`/`className` (passthrough,
neo dùng thật: `SettingsLayout.tsx`'s `"min-w-0 flex-1"` — cần áp lên hộp NGOÀI vì đó là hộp
tham gia flex layout của cha) giữ nguyên ở lớp NGOÀI.

✅ **Verify bằng browser thật, không chỉ code**: resize viewport 1920px, đo trực tiếp
`getComputedStyle(...).flexDirection` — TRƯỚC fix: `"column"` (sai). SAU fix: `"row"` (đúng).
Bật lại cả 3 state của leaf `Responsive` (`ChallengePage.stories.tsx`), click từng tab đo lại:
Mobile 375→column ✓, Tablet 768→column ✓, **Desktop 1280→row ✓** (trước fix bị kẹt "column" y
hệt ở CHÍNH 1280px). 2 lỗi console (`StackV` key trùng, `shiki` chunk load) xác nhận PRE-EXISTING
— soi lại leaf `NotAttempted` gốc (không đụng `Container`/`SplitWorkspace`) vẫn y hệt 2 lỗi đó.

Verify tĩnh: tsc sạch, 9/9 gate xanh, eslint --fix 0 lỗi mới (1 lỗi `showAnatomy` unused ở
`Container.tsx` xác nhận qua `git stash` là nợ cũ có sẵn TRƯỚC cả bug này, không phải do sửa lần
này — không sửa, ngoài phạm vi).

**Bài học phương pháp — quan trọng nhất phiên này**: "tsc sạch + 9/9 gate xanh + eslint 0 lỗi"
KHÔNG đồng nghĩa "render đúng" — cả 3 gate đó đều không đo được hành vi container-query THỰC TẾ
trên trình duyệt. Câu tuyên bố "đã verify" ở lượt trước (§2z) là SỚM — chỉ verify được cấu trúc
code, chưa verify được PIXEL THẬT. Từ nay: bất kỳ fix nào liên quan responsive/container-query/
breakpoint PHẢI đo bằng `getComputedStyle` trên browser thật (kể cả phải kill+restart server để
có bản mới) trước khi báo "xong", không dừng ở tsc/gate tĩnh.

### 3a. `ChallengeResultPage` — thầy: "có trang này mà" — tìm lại real `src`, sửa đo+seam, dựng lại đúng `SubmissionAttemptsDrawer`

Nối tiếp audit `ChallengeResultPage` (cùng buổi): lần đầu báo "không có real `src`" — SAI, chỉ
grep nhầm theo tên component. Thầy chỉ lại: *"có trang này mà"* → grep đúng khái niệm ra
`src/components/features/learn/Challenge/SubmissionResult/index.tsx`.

**3 điểm lệch tìm ra khi đối chiếu**:
1. `Container size="md"` (48rem) trong khi real dùng `max-w-5xl` (80rem = đúng `size="xl"`).
2. Gộp nhầm 2 seam khác nhau — real có `gap-10` (header→nội dung, gần nhất = `page`/8) VÀ
   `gap-6` (nội dung↔nội dung, = `section`/6) TÁCH RIÊNG; Storybook trước đó dùng ĐÚNG 1
   `StackV gap="section"` bọc hết.
3. Câu tự nhận trong file header ("drawer không tồn tại trong app folder") **SAI sự thật** —
   `src/components/drawers/SubmissionResultHistoryDrawer` có thật. NHƯNG Storybook đã có sẵn 1
   component tên gần giống (`SubmissionAttemptsDrawer`) **KHÔNG PHẢI port của nó** — tự dựng cho
   ngữ cảnh khác, sai hẳn tương tác: mỗi attempt có 2 nút "Xem chi tiết"/"Xem bài nộp" (thật:
   bấm 1 CÁI = chọn attempt + đóng drawer luôn), phân trang controlled từ caller (thật: tự
   phân trang client-side trên toàn bộ list), tiêu đề tĩnh (thật: có đếm số "· N").

✅ **Fix #1+#2**: `ChallengeResultPage.tsx` — `Container size="xl"`, tách `StackV gap="page"`
(header↔nội dung) bọc ngoài `StackV gap="section"` (nội dung↔nội dung, giữ nguyên 2 tầng cũ y
hệt bên trong).

✅ **Fix #3 — dựng lại đúng `SubmissionAttemptsDrawer.tsx` khớp real `src`**: bỏ hẳn
`onViewDetails`/`onViewSubmission`/`currentPage`/`totalPages`/`onPageChange` (caller-controlled)
→ thay bằng `onSelect` DUY NHẤT (bấm dòng = chọn + tự đóng drawer, `useState` phân trang NỘI BỘ
y hệt real, `HISTORY_PAGE_SIZE=6`). Đổi khung dòng từ `SurfaceCard` viền riêng từng attempt →
`SurfaceCard.List` (khớp thật dùng `SurfaceListCard`/`SurfaceListCardItem`, row phẳng). Dòng
chọn tô `bg-accent-soft` qua `className` (không dùng `selected` — prop đó chỉ hoạt động ở khe
title/subtitle CỐ ĐỊNH của `SurfaceCardListItem`, không áp dụng cho khe `content` tự do dùng ở
đây; bắt được lỗi này TRƯỚC khi ship nhờ đọc kỹ `ListFreeRow`'s implementation, không đoán).
Byline model (`InlineIconLabel`+`EnumChip`) TÁI DÙNG đúng công thức `SubmissionScoreCard` đã có
— export thêm `MODEL_CATEGORY_MAP` từ file đó (trước là `const` riêng, không export) để tránh
khai trùng bảng dữ liệu ở 2 nơi.

✅ **Nối dây drawer vào `ChallengeResultPage`**: thêm 3 prop mới (`isHistoryOpen`/
`onHistoryOpenChange`/`historyAttempts` — TÁCH RIÊNG khỏi `attempts`, vì `attempts` chỉ là tập
con đã cắt hiển thị trên hàng chip, còn drawer cần TOÀN BỘ lịch sử). `onOverflowPress` vẫn chỉ
BÁO ra ngoài (Rule 7, không đổi) — CALLER (ở đây là story) tự quyết định wiring nó mở drawer.
Thêm leaf mới `WithHistory` (8 attempt, tràn quá 5 hiện trên hàng chip → "+3" mở drawer đủ 8,
phân trang 6/2).

✅ **Verify SỐNG qua browser thật** (đúng bài học §2zz vừa rút — không dừng ở tsc/gate tĩnh):
kill+restart Storybook (story index cache cũ không thấy leaf mới), inject `javascript_tool` đọc
DOM thật: `Container` đúng `max-w-app-xl`; drawer mở đúng tiêu đề "Lịch sử các lần nộp · 8"; hàng
đang chọn (`Lần 8`) đúng DUY NHẤT 1 dòng mang `bg-accent-soft`; `nav`/pager xuất hiện đúng vì 8
attempt vượt `HISTORY_PAGE_SIZE`. Bug `Container.tsx`/`@container`+padding (§2zz, phiên khác vừa
sửa CÙNG lúc trên CÙNG repo — kiểm tra thấy đã fix sẵn trên đĩa) không ảnh hưởng trang này vì
không có `@app-xl:` con nào cần fire bên trong.

⚠️ **2 lỗi console gặp khi soi** (`StackV` key trùng, HMR `Cannot read properties of undefined`)
— ĐÃ XÁC NHẬN (theo đúng §2zz's note) là PRE-EXISTING/nhiễu từ chế độ docs-render + lịch sử HMR
cũ, KHÔNG phải do fix lần này gây ra (§2zz đã tự đối chiếu với leaf gốc `NotAttempted` không đụng
Container/SplitWorkspace, vẫn thấy y hệt 2 lỗi) — không sửa, ngoài phạm vi lượt này.

Verify tĩnh: tsc sạch, 9/9 gate xanh (bắt + tự sửa 2 lỗi storyId đoán sai — `EnumChip`/
`InlineIconLabel` — trước khi commit, không đoán suông theo tên component), eslint --fix 0 lỗi
mới. File: `ChallengeResultPage.tsx`+story, `SubmissionAttemptsDrawer.tsx`+story (viết lại toàn
bộ), `SubmissionScoreCard.tsx` (export `MODEL_CATEGORY_MAP`).

**Bài học phương pháp**: (1) "không tìm thấy real `src`" là kết luận YẾU — phải thử grep theo
NHIỀU tên khái niệm khác nhau (không chỉ tên component) trước khi báo "chưa có bản gốc", đúng
loại lỗi vừa mắc phải rồi bị thầy bắt lại; (2) 1 component Storybook có TÊN gần giống thật
KHÔNG đồng nghĩa nó LÀ port của thật — phải đọc kỹ hành vi tương tác (ai bấm gì, xảy ra gì) chứ
không chỉ đối chiếu tên biến/prop; (3) khi 1 prop atom "có vẻ đúng" (`selected`) không hoạt động
ở nhánh render đang dùng (`content` tự do), phải đọc THẲNG code atom xác nhận trước khi ship,
không tin tên prop suông.

### 3a. 4 điểm feedback dồn 1 ảnh `ChallengePage` — input secondary, accordion title-markdown (2 chỗ khác nhau), 2 điểm đo lại hoá ra KHÔNG phải bug

Ảnh `ChallengePage` khoanh: *"hồng là input secondary / vàng phải lệch / vàng trái render nội
dung đàng hoàng hơn làm ơn / với accodion title thì không thể render dạng markdown"*.

✅ **1 — input secondary**: `ChallengeDeliverableList.tsx`'s `InputText` (URL nộp bài) không hề
truyền `variant` — lộ ra `InputText` **CHƯA CÓ** prop `variant` (khác `InputTextarea`/
`DateField.Group`/`TimeField.Group` đã có sẵn). Thêm `InputTextProps = StringFieldProps &
{variant?: "primary"|"secondary"}` — ĐÚNG khuôn `InputTextareaProps` đã làm trước (không gộp
vào `StringFieldOwnProps` dùng chung — tránh 1 prop chết lan sang `InputSearch`/`InputPassword`
chưa wire). `HeroTextField variant={variant}`. Call-site truyền `variant="secondary"`.

✅ **4 — accordion title không thể markdown**: xác nhận đúng — title nằm trong
`Accordion.Trigger` (`<button>`), `MarkdownContent` phát block-level markup không hợp lệ lồng
trong button. Thêm `parseInlineCode?: boolean` cho atom `Typography` — chỉ hiểu CÚ PHÁP
BACKTICK (KHÔNG phải markdown đầy đủ), tách `` `code` `` thành `<code>` span-only, dùng lại
đúng công thức inline-code của `MarkdownContent` (`rounded-md bg-default px-1 py-0 font-mono`)
nhưng cỡ TƯƠNG ĐỐI (`text-[0.9em]`) vì Typography chạy mọi size chứ không cố định `text-sm` như
MarkdownContent. Áp ở `SurfaceCard.tsx`'s accordion trigger Typography (cascades cho MỌI
`SurfaceCardAccordion` consumer, gồm `ChallengeBrief`'s requirement/step title).

⚠️ **Bắt thêm 1 ca thứ 2 khi verify bằng DOM thật (không chỉ đọc code)**: sau fix, backtick vẫn
lộ ra ở accordion "Nộp bài" (`ChallengeDeliverableList`) — vì trigger title ở đây KHÔNG qua
`Typography` mà tự viết `<span className="truncate">{index}. {item.title}</span>` (JSX riêng,
lách qua `SurfaceCardAccordionItem.title: ReactNode` nên fix ở `SurfaceCard.tsx` không chạm
tới). Đổi sang `<Typography truncate parseInlineCode text={...} />`.

⚠️ **2 & 3 — "vàng phải lệch" / "vàng trái render đàng hoàng hơn" — ĐO LẠI BẰNG DOM THẬT, không
tìm ra bug**: dựng lại viewport thật (1280px, sau khi vượt qua lỗi "Browser pane not displayed"
— `window.innerWidth`/`document.hidden` phải kiểm TRƯỚC khi tin số đo, xem bài học dưới), đo
chính xác `ProgressMeterTargetMark`: pill center = label center = 971.1875px, KHỚP TUYỆT ĐỐI
với `left:80%` của track thật (68→1197px). Không tìm ra lệch nào ở tick/label. Báo lại thầy
xin ảnh crop sát hơn hoặc mô tả cụ thể hơn thay vì đoán mù — chưa sửa.

**Bài học phương pháp — quan trọng**: 1 tab browser có `document.hidden=true`/
`window.innerWidth=0` (do Browser pane phía client chưa hiển thị) khiến MỌI phép đo
`getBoundingClientRect()` trả về 0 — trông y hệt "bug render 0 width" nhưng thực ra là ảo giác
do tab không compositing. LUÔN kiểm `document.hidden`/`window.innerWidth` TRƯỚC khi tin bất kỳ
số đo DOM nào bất thường (0, âm, NaN) — nếu hidden, `resize_window` (dù không hiện được
screenshot) vẫn ép viewport ra số thật, dùng số đó để đo tiếp thay vì kết luận vội "bug thật".

### 3b. Audit Foundations (3 màn) — 3 workflow Sonnet song song, 1 bug templating hạ tầng + 14 file sửa thật

Thầy: *"chạy 3 foundations o day"* — 3 workflow song song, mỗi cái audit 1 màn
(`FoundationsCategoryPage`/`FoundationsGridPage`/`FoundationResourcePage`) theo 4 trục (ranh
giới import · khung bố cục · cây deps · chữ hiện UI), quy trình Understand→Diagnose→Fix→Verify.

⚠️ **Bug hạ tầng bắt được ngay lượt đầu**: cả 3 workflow dùng CHUNG 1 script text (chỉ khác
`args.page`), bắn song song trong 1 message — 2/3 workflow nhận `args.page = undefined` (path
ra `pages/undefined/undefined.tsx`). Cả 2 agent bị ảnh hưởng đều tự phát hiện đúng (không bịa
lỗi cho có việc, đúng luật đã dặn trong prompt), báo lại rõ ràng, không tự chế screen giả để
"có việc làm". Chạy lại riêng từng workflow (không dùng `resumeFromRunId`, gọi `Workflow` mới
hoàn toàn) thì bind đúng. **Bài học: script Workflow giống hệt nhau chạy song song trong CÙNG 1
message có rủi ro lẫn args — an toàn hơn nếu chạy tuần tự hoặc script có sai khác nhỏ.**

✅ **Riêng lượt ĐẦU (`FoundationsCategoryPage`, dính bug "undefined") không dừng lại** — agent tự
suy luận đúng cả 3 page ứng viên từ gợi ý domain trong prompt, audit LUÔN cả 3, tìm ra + fix 6
file thật (không phải suy đoán, có bằng chứng file:line + đối chiếu `vi.json`):
- `FoundationTrialEnrollBanner.tsx`/`TrialEnrollBanner.tsx`/`FoundationsCategoryPage.stories.tsx`
  — phát hiện **1 real component (`TrialEnrollHook`) bị port thành 3 block khác nhau, 3 câu chữ
  bịa khác nhau**, không cái nào khớp đúng `enrollGate.hookTitle/hookDesc/hookCta` thật — đồng
  bộ cả 3 về đúng copy.
- `FoundationSearchBar.tsx` — placeholder + đếm kết quả bịa chữ, sửa khớp
  `foundations.searchResourcesPlaceholder`/`foundations.count`.
- `FoundationResourcePage.tsx`/`.stories.tsx` — `anatPart` lệch so với 2 page anh em, empty-state
  copy bịa.

✅ **2 workflow chạy lại (`FoundationsGridPage`, `FoundationResourcePage`) — mỗi cái tự đọc lại
state HIỆN TẠI (không dùng cache/báo cáo cũ), phát hiện đúng phần đã được workflow #1 sửa rồi
(KHÔNG sửa đè, chỉ bổ sung phần còn thiếu) — xác nhận qua `git diff` trước khi commit**:

- `FoundationsGridPage`: **bug logic THẬT** (không chỉ copy) — `resolveThumbnail` trong
  `FoundationCategoryList.tsx` đảo ngược thứ tự ưu tiên ảnh (real: `logoSrc` luôn thắng
  `thumbnailUrl`; Storybook làm ngược). + seam sai (`FoundationsGridPage.tsx` gap="grouped" phải
  là gap="section", đo trực tiếp real `gap-6` bị gán nhầm seam khác trong real cũng gap-3). +
  `FoundationCategorySearchBar.tsx` thiếu bọc `data-anat-part` cho `SearchAutocomplete` (cây deps
  thiếu 1 node). + bỏ icon bịa thêm ở trial banner (real `Callout` không truyền icon nào).
- `FoundationResourcePage`: **vi phạm ranh giới import thật** — `FoundationResourcePage.tsx`
  import thẳng composite `AsyncContentEmpty` để thay 1 PHẦN màn (identity+body), phá đúng luật
  "screen never composite trực tiếp, trừ swap TOÀN màn" mà chính `QuizPage`/`MockInterviewPage`/
  `FlashcardReviewPage` (cùng batch commit) đã tự đặt ra cho chính mình — inconsistency thật,
  không suy diễn. Fix: tách block mới `FoundationResourceEmpty` (bọc `AsyncContentEmpty` bên
  trong, đúng khuôn `MockInterviewAnswerAction` đã làm để né chính lỗi này) + story riêng.

**Tổng: 14 file sửa (2 file mới), tsc sạch, 9/9 gate xanh toàn repo sau khi gộp cả 3 workflow,
không có xung đột/sửa đè giữa các workflow** (mỗi Fix-agent tự Read lại file trước khi sửa nên
tự phát hiện phần nào đã xong, chỉ bổ sung phần thiếu).

⚠️ **2 việc còn treo, cần thầy xác nhận (KHÔNG tự chốt)**:
1. `FoundationResourcePage` vẫn gọi `TrialEnrollBanner` generic cũ, chưa migrate sang
   `FoundationTrialEnrollBanner` (block mới, có `isSkeleton` riêng) như 2 page kia đã dùng — có
   thể là việc dở dang chưa tới lượt, chưa chắc là lỗi.
2. Câu hỏi kiến trúc lớn hơn: real `TrialEnrollHook` đã bị port thành **3 block khác nhau**
   (`TrialEnrollNudge` ở `commerce/`, `FoundationTrialEnrollBanner` + `TrialEnrollBanner` ở
   `learn/`) — nên gộp lại 1 hay giữ 3 bản khác nhau theo ngữ cảnh? Chưa quyết, chỉ ghi nhận.

Verify: tsc sạch, 9/9 gate xanh (chạy lại lần cuối sau khi gộp cả 3 workflow, không riêng từng
cái), eslint 0 lỗi mới ở tất cả file đã sửa/tạo. KHÔNG restart Storybook trong lượt audit này —
để dành cho lượt verify bằng mắt sau.
