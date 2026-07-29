# BƯỚC 8 — DỌN TRÙNG LẶP (sau khi phẳng tên) · 2026-07-28

> FE `mtp` · `547bbf7f` + `871368f1`. **9/9 cổng xanh**, `tsc` 0, eslint 17 (nền cũ 34).
>
> Cách làm: 6 agent điều tra SONG SONG trên vùng rời nhau, **read-only**; mỗi kết luận có
> một agent khác cố PHẢN BÁC. Ghi ở đây vì nửa số kết luận bị bác — và bác đúng.

---

## 0. Ba con số của trò bị bác, cùng một lỗi

| Trò báo | Thật | |
|---|---|---|
| `Button.Group` 24 call-site | **2** | |
| composite `ButtonGroup` 10 call-site | **0** | |
| `ProgressMeter` 5 file đụng | **1** | |

Nguyên nhân chung: trò đếm **chuỗi xuất hiện** (`grep "Button.Group"`) chứ không đếm **import
thật**. Chuỗi đó có mặt trong doc comment, trong snippet `code:` của story, trong chính file
định nghĩa. Con số phồng lên 12 lần mà vẫn trông như một phép đo.

> **Luật:** "call-site" nghĩa là **import + JSX**, không phải sự xuất hiện của tên. Đếm bằng
> `from "<module>"` rồi mới đếm chỗ dùng.

---

## 1. Đã làm

### 1a. XOÁ composite `ButtonGroup`
0 consumer thật. Nó bọc `_legacy` Button (icon là `ReactNode`, `iconOnly` **không** ép
`ariaLabel`) trong khi atom `ButtonGroup` bọc `ButtonBase` hiện hành (union phân biệt bắt
buộc `prefixIcon`+`ariaLabel`). Hai component một khái niệm, bản kém hơn không ai dùng.

**Chưa làm (cố ý):** composite có `align`/`vertical` mà atom thiếu — `Form.tsx` đang tự chế
lại bằng `ALIGN_CLASS` + hack `w-full justify-between`. Port sang atom là **thêm prop mới**,
kéo theo nghĩa vụ story §12g (1 prop = 1 leaf). Việc riêng, không nhét vào lượt dọn.

### 1b. Đổi tên atom `Progress.Meter` → `ProgressGauge`
**Không phải trùng lặp.** Atom là thước đo tĩnh; composite `ProgressMeter` là block port 1:1
từ `src/components/blocks/stats/ProgressMeter`. Tên composite bị `src` neo ⇒ atom nhường.

> Đụng tên sau khi phẳng có HAI nghĩa: trùng lặp thật (1a) hoặc hai thứ khác nhau tình cờ
> cùng tên (1b). Phải mở cả hai file ra đọc mới phân biệt được — không suy từ con số.

### 1c. Stepper: 3 margin của con → cấu trúc
Hai cơ chế, không phải một lỗi lặp ba lần:
- `mt-3` ở connector = canh giữa **đoán bằng mắt** một đường 2px so với vòng tròn `size-8`
  ⇒ cho connector hộp `h-8 items-center`, để flex canh.
- Hai `mb-3` ở cột nhãn = thổi `stretch` để rail dọc cao thêm, tức **con giả khoảng cách**
  ⇒ trả về `gap-3` trên cha, chỉ trên trục dọc.

⚠️ Ca chưa story nào phủ: bước **không có mô tả** — khoảng cách đổi từ ~0px thành 12px.

---

## 2. ⭐ Cổng của trò sai, không phải component

`check-passthrough-block` (trò viết sáng cùng ngày) gắn cờ `ContinueLearning` với lý do:

> *"Formatting a string is not enough on its own, because a formatter is presentation work
> that belongs to whoever draws the thing."*

Canon §14d.1 hệ quả 1 nói **ngược hẳn**:

> *"Câu dẫn là phần TRÌNH BÀY ⇒ **block sở hữu**. Caller chỉ đưa dữ liệu miền; **block tự
> ghép câu**."*

`ContinueLearning` nhận `lessonIndex`/`lessonsRead`/`challengesDone` và ghép `Bài 4 · …` —
đúng thứ canon **bắt buộc**. Cổng đang phạt luật mà nó sinh ra để bảo vệ.

Sửa phép thử: từ *"có format không"* sang *"có BIẾT miền không"*. Kèm negative control
**hai chiều** — bắt được lớp bọc trần, và **không** bắt block tự ghép câu.

> **Luật:** một số 0 từ cái cổng vừa được NỚI là số đáng nghi nhất trong ngày. Nới xong phải
> chứng minh nó còn bắt được ca thật.

Kế hoạch agent đề xuất (đưa chuỗi ghép LÊN screen, truyền `title={...}` xuống block) cũng
phạm §14d.1 hệ quả 2 — *"KHÔNG truyền GENERIC / chuỗi đã format"*. Chính cổng viết
*"fold it into the child"*: gộp xuống CON, không đẩy lên CHA.

---

## 3. HAI VIỆC CHỜ THẦY CHỐT — cố ý không làm

### 3a. `Feedback` — ĐỪNG tách

Đề xuất tách `FeedbackCallout`/`FeedbackEmpty`/`FeedbackConfirm` thành `Callout` /
`ConfirmDialog` / gộp vào `AsyncContent` (bước 6 §2) bị **bác thẳng**:

`Feedback.tsx:10` ghi *"the ONE 'tell the user what's happening' KHUNG namespace
(**teacher confirmed 2026-07-25, canon §13a**)"*. §13a là *"Gom RỘNG… mọi khung mặt-thẻ về
`SurfaceCard.*` thay vì tách nhiều namespace nhỏ"* — phép thử là **cùng họ/tầng**, không phải
cùng hình. `SurfaceCard` (Base/Nested/Pressable/List/Accordion/CrossList/Placeholder) còn
khác hình nhau hơn `Feedback`, và **14 file khác** viện đúng lý lẽ §13a đó.

⇒ Lý lẽ "ba thứ này khác hình nên gom sai" ở bước 6 §2 **sai**. Muốn tách thì phải lật §13a,
mà đó là quyết định của thầy chứ không phải hệ quả của việc bỏ namespace.

### 3b. `AsyncContentEmpty` / `AsyncContentError` — chưa đủ căn cứ xoá

Nghi ngờ ban đầu (*"chỉ đặt icon mặc định"*) **không đúng**. Mỗi cái làm **ba** việc: icon mặc
định + ép `weight="duotone"` cho MỌI icon truyền vào + rút gọn `onRetry`/`retryLabel` thành
Button; `AsyncContentError` còn ghim `tone="danger"`. Về DOM thì 100% đến từ một
`<FeedbackEmpty/>`, nhưng ba hành vi kia là thật.

Xoá = đẩy ba hành vi đó vào `FeedbackEmpty` hoặc lên từng call-site. Thêm nữa còn 6 chỗ prose
trong story `CourseContents.*.Empty` và 2 chuỗi `branchName` trong `AsyncContent.tsx` phải
sửa theo.

⇒ **Câu hỏi cho thầy:** giữ (ba hành vi có thật, lớp mỏng nhưng có nghĩa) hay xoá (một cách
vẽ empty-state cho cả hệ)?

---

## 4. Còn treo

- Port `align`/`vertical` từ composite `ButtonGroup` đã xoá sang atom + story (§12g).
- `Form.tsx` tự chế `ALIGN_CLASS` — chờ 1a ở trên.
- `_legacy`: 5 storyId gãy (nợ ghi sổ), 378 leaf thiếu `code`.
- eslint 17 (15 `no-unused-vars` + 2 `no-adjacent-chip`) — có từ trước.
