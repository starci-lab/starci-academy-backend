# BƯỚC 10 — MÀN `Quiz` (Hỏi nhanh): CÂY + BẢNG STATE

> **CHƯA VIẾT CODE.** Barrier của `steps/1`, giống bước 9.
>
> Nguồn: `learn/flashcards/quiz/page.tsx` · `learn/flashcards/quiz/sessions/[sessionId]/page.tsx`
> → cả hai render `<Flashcards />`; lõi là `Flashcards/QuizSession/index.tsx` (1431 dòng).

---

## 1. PHẠM VI — hai `page.tsx`, không hơn

| Route | Dựng gì |
|---|---|
| `quiz/page.tsx` | `<Flashcards />` — vào thẳng phần dựng phiên |
| `quiz/sessions/[sessionId]/page.tsx` | `<Flashcards resumeQuizSessionId={id} />` — nối lại phiên đang dở |

### ⛔ Cái trò suýt kê vào mà nó KHÔNG thuộc màn này

`FlashcardQuizResult` — nhìn thì rất hợp lý vì nó là "kết quả bài quiz". Nhưng nó chỉ chạy khi
`resultQuizSessionId` được set, mà prop đó do route **`.../result`** truyền; hai `page.tsx`
trên **không bao giờ** set nó. Cùng đúng loại lỗi đã cắt ở bước 9 §1 — một thứ *liên quan tới*
màn không phải là một thứ *của* màn.

`EnrollGate` cũng có mặt ở `learn/layout.tsx`. Ở đây nó do `Flashcards` dựng cho riêng khoang
quiz nên **có** thuộc phạm vi — nhưng phải nhớ nó là hai chỗ dựng khác nhau, không phải một.

---

## 2. Danh sách chức năng

> *"đang ở đâu · học thẻ hay hỏi nhanh · mở khoá khi đang dùng thử · dựng một phiên ·
> làm bài · xem lại phiên vừa xong · xem mình đã luyện thế nào"*

**BẢY** câu.

`QuizSessionSkeleton` không vào danh sách: nó là hình nghỉ của "làm bài", tức **state**.
`ConfirmDialog` (thoát giữa chừng) cũng không: nó là **overlay** một nút mở ra.

---

## 3. Điều quyết định hình: màn này có BA PHA nối tiếp, không phải ba tab

`QuizPhase = setup · active · recap`. Khác hẳn màn Content — ở đó tab là **lối vào song song**,
người đọc nhảy qua lại tuỳ ý. Ở đây ba pha là **một đường một chiều**: dựng phiên → làm bài →
xem lại. Không có đường quay ngược trừ khi bỏ phiên.

⇒ Chúng **không** phải state của một leaf. Mỗi pha là một cây DOM khác hẳn ⇒ **ba leaf** của
screen.

| Pha | Khung | Vì sao |
|---|---|---|
| `setup` | khoang thường, có mode switch | vẫn đang chọn, chưa cam kết |
| `active` | **`WorkSessionHeader`**, mode switch BIẾN MẤT | đang làm bài, đổi chế độ giữa chừng là mất phiên |
| `recap` | `WorkSessionHeader` | vẫn trong phiên, đang tự chấm |

> Chi tiết đắt nhất: **thanh chuyển chế độ biến mất từ `active` trở đi.** Đó không phải sơ
> suất bố cục — nó là cách màn nói rằng người học đang trong một phiên, và một lối thoát duy
> nhất (nút thoát trên `WorkSessionHeader`) có xác nhận.

---

## 4. Cây component đề xuất

```
QuizScreen                                      screen
  Container size="md"                           frame
    StackV gap="page"                           frame
      QuizBrief                                 block   ← đang ở đâu
      ┌─ pha SETUP ─────────────────────────────────────┐
      │ StackV gap="section"                     frame  │
      │   FlashcardModeSwitch                    block  │  ← học thẻ / hỏi nhanh
      │   ┌─ đang dùng thử ─────────────────────────┐   │
      │   │ QuizEnrollGate                   block  │   │  ← mở khoá
      │   └────────────────────────────────────────┘   │
      │   ┌─ đã ghi danh ───────────────────────────┐   │
      │   │ QuizSetup                        block  │   │  ← chọn cấp + độ dài + bắt đầu
      │   │ QuizProgressPanel                block  │   │  ← lịch sử · thống kê
      │   └────────────────────────────────────────┘   │
      └──────────────────────────────────────────────────┘
      ┌─ pha ACTIVE ────────────────────────────────────┐
      │ WorkSessionHeader                        block  │  ← đang làm bài, có lối thoát
      │ QuizQuestion                             block  │  ← một câu + ô trả lời + chấm
      └──────────────────────────────────────────────────┘
      ┌─ pha RECAP ─────────────────────────────────────┐
      │ WorkSessionHeader                        block  │
      │ QuizRecapList                            block  │  ← lật từng thẻ, tự chấm
      └──────────────────────────────────────────────────┘
```

**Sáu block mới:** `QuizBrief` · `FlashcardModeSwitch` · `QuizEnrollGate` · `QuizSetup` ·
`QuizProgressPanel` · `QuizQuestion` · `QuizRecapList` (bảy — `WorkSessionHeader` đã có ở `src`
nhưng **chưa có** trong Storybook, nên là tám).

### 4a. Ghép từ gì

| Block | Ghép từ | Đã có? |
|---|---|---|
| `QuizBrief` | `PageHeader` · `Breadcrumbs` · `Typography` | ✅ |
| `FlashcardModeSwitch` | `Tabs` (atom) | ✅ — **cùng hình với `ContentTabBar`** (xem §6) |
| `QuizEnrollGate` | `FeedbackEmpty` · `Button` | ✅ |
| `QuizSetup` | `SurfaceCard` · `Chip` · `Button` · `TextField` · `FeedbackCallout` · `ContinueCard` | ✅ |
| `QuizProgressPanel` | `Tabs` · `SurfaceCardList` · `StatGridCard` | ✅ |
| `QuizQuestion` | `SurfaceCard` · **`MarkdownContent`** · `TextField` · `Button` · `Chip` | ✅ (viewer vừa dựng) |
| `QuizRecapList` | `SurfaceCard` · `MarkdownContent` · `RatingBar` · `Chip` | ⚠️ **`RatingBar` chỉ có ở `_legacy`** |
| `WorkSessionHeader` | `Typography` · `Button` · `ConfirmDialog` | ⚠️ **chưa có trong Storybook** |

> `MarkdownContent` vừa dựng ở bước 9 đã **trả nợ ngay**: nó là thứ vẽ mặt trước/mặt sau của
> thẻ. Đúng như dự đoán ở bước 9 §3a — một viewer dùng lại được ở màn khác.

---

## 5. BẢNG STATE

### 5a. `QuizScreen` — leaf theo PHA

| Leaf | State | Điều kiện |
|---|---|---|
| `Setup` | `content` | vào thẳng, chưa có phiên dở |
| | `content-resume` | có phiên đang dở ⇒ thêm thẻ "tiếp tục phiên" |
| | `locked` | đang dùng thử ⇒ khoang thay bằng gate |
| | `loading` | đang hỏi server còn phiên dở không |
| `Active` | `content` | đang làm bài |
| | `empty` | cấp đã chọn **không còn thẻ nào** ⇒ mời chọn cấp khác |
| `Recap` | `content` | xem lại các thẻ vừa làm |

### 5b. Từng block

| Block | Bộ state |
|---|---|
| `QuizBrief` | `loading` · `content` |
| `FlashcardModeSwitch` | `content` — **không có `loading`**, cùng lý do `ContentTabBar` |
| `QuizEnrollGate` | `content` |
| `QuizSetup` | `loading` · `content` · `content-resume` · `pending` (đang bốc thẻ) · `error` |
| `QuizProgressPanel` | `loading` · `content` · `empty` (chưa luyện lần nào) |
| `QuizQuestion` | `content` · `pending` (đang chấm) · `content-graded` (đã có kết quả) · `empty` |
| `QuizRecapList` | `content` · `content-partially-rated` (còn thẻ chưa tự chấm) |
| `WorkSessionHeader` | `content` · `pending` (đang thoát) |

---

## 6. ⚠️ MỘT NGHI NGỜ TRÙNG LẶP — phải trả lời TRƯỚC khi dựng

`FlashcardModeSwitch` và `ContentTabBar` (vừa dựng ở bước 9) **có thể là cùng một block**: cả
hai là một hàng tab chọn *cách xem*, cả hai bọc atom `Tabs`, cả hai cố ý không skeleton.

Khác biệt duy nhất là **từ vựng**: Content có `content/sandbox/challenges/aiLab`, Quiz có
`study/quiz`. Mà theo §14d.1 chính cái từ vựng đó là thứ block sở hữu — nên có thể chúng là
**hai block đúng nghĩa**, không phải trùng lặp.

⇒ Đây đúng loại câu mà bước 8 dạy: **đụng tên không tự động là trùng lặp**, phải mở cả hai ra
đọc (neo: atom `Progress.Meter` vs composite `ProgressMeter` — hai thứ khác nhau thật).

**Trò nghiêng về GIỮ HAI BLOCK** và ghi chéo vào header của cả hai, vì mỗi cái sở hữu một bộ
từ vựng miền riêng. Nhưng đây là quyết định của thầy, không phải của trò.

---

## 7. BA CÂU CHỜ THẦY CHỐT

1. **`FlashcardModeSwitch` vs `ContentTabBar`** — hai block, hay một block generic nhận danh
   sách mode? (Trò nghiêng: hai. Xem §6.)
2. **`WorkSessionHeader` và `RatingBar`** — dựng mới ở tầng nào? `WorkSessionHeader` ở `src`
   nằm trong `blocks/navigation`; `RatingBar` hiện chỉ có ở `_legacy`. Cả hai đều dùng cho
   nhiều loại phiên (quiz · flashcard · mock interview) nên trò đọc là **block dùng chung**,
   không phải block của riêng quiz.
3. **Thứ tự dựng.** Trò đề xuất `QuizBrief` → `FlashcardModeSwitch` → `QuizEnrollGate` →
   `WorkSessionHeader` → `QuizSetup` → `QuizQuestion` → `QuizRecapList` → `QuizProgressPanel`.
   Bốn cái đầu nhẹ và độc lập, ra hình sớm để thầy fixback trước khi trò đụng `QuizSetup`
   (cái nặng nhất, 5 state).

---

## 8. Nợ mang sang từ bước 9

Màn `Content` còn **`ContentArticle`** và **`ContentScreen`** chưa dựng. Cả hai đã hết phụ
thuộc (`MarkdownContent` xong rồi) — làm lúc nào cũng được, không chặn quiz.
