# ASYNC — rỗng, lỗi, đang tải thì vẽ gì và ai vẽ

> Trục này trả lời đúng một câu: **rỗng, lỗi, đang tải thì vẽ gì, và ai (atom/composite/
> block/screen) được vẽ nó.** Không trả lời hình skeleton trông ra sao (xem `skeleton/`),
> chỉ trả lời BỐN NHÁNH của một vùng dữ liệu và ai được đứng ra chọn nhánh.
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG — bốn nhánh, không có nhánh thứ năm

Đây KHÔNG phải một `type` enum xuất ra (không có `type AsyncState = ...` trong code). Bốn
nhánh là bốn điều kiện của **switch thật** trong `AsyncContent.Base`, đọc trực tiếp từ
`.storybook/components/composites/async/AsyncContent/AsyncContent.tsx` dòng 185-224 (comment
thứ tự ưu tiên ở dòng 173-177):

| Nhánh | Điều kiện thật (props `AsyncContent.Base`) | Ai vẽ hình |
|---|---|---|
| `error` | `error` truthy **VÀ** `errorContent` được cấp — thắng cả `isLoading` | `AsyncContentError` (dòng 275-288) |
| `loading` | `isLoading` true (khi `error` chưa kích hoạt) | slot `skeleton` — cây `Skeleton.*` caller tự đưa |
| `empty` | `isEmpty` true (sau khi qua `error`, `loading`) | `AsyncContentEmpty` nếu có `emptyContent`, không thì `null` |
| `content` | còn lại | `content ?? children` |

SSOT thang: JSDoc dòng 174-177 ghi thẳng chuỗi ưu tiên **"error → loading → empty → content"**,
và code dòng 200-212 là if/else-if theo ĐÚNG thứ tự đó — đây là trường hợp hiếm THANG và CÂY
QUYẾT ĐỊNH là MỘT, không phải hai thứ tách rời.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi đúng thứ tự if/else-if trong code, dừng ở YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | `error` có giá trị **VÀ** đã truyền `errorContent`? | `AsyncContentError` — dừng |
| 2 | (chưa) `isLoading` đang `true`? | slot `skeleton` — dừng |
| 3 | (chưa) `isEmpty` là `true`? | có `emptyContent` ⇒ `AsyncContentEmpty`; không có ⇒ `null` (vùng tự ẩn) — dừng |
| 4 | còn lại | `content`/`children` thật |

**Cây thứ hai — AI được gọi nhánh này** (tách khỏi cây trên vì canon chưa chốt, xem §6/C1):

| # | Hỏi | Ra |
|---|---|---|
| 1 | Vùng mất trắng là **TOÀN BỘ hàm render của screen** (id không resolve ra gì)? | SCREEN gọi thẳng `AsyncContentEmpty`, return sớm TOÀN BỘ — tiền lệ `CourseContents`/`ModulePage`/`MindMapPage` |
| 2 | Vùng có **khung riêng cần bảo toàn** (card/accordion) khi lỗi/rỗng/tải? | BLOCK quyết định cờ; khung đã có trục riêng (`isSkeleton`/`emptyState` của chính nó) thì DÙNG TRỤC ĐÓ, không ép qua `AsyncContent.Base` — ca `SubmissionFindingsList` |
| 3 | Vùng đang tải nhưng KHÔNG đổi cấu trúc, chỉ shimmer từng phần? | không phải trục này — đó là `isSkeleton` chảy xuống atom/composite tự vẽ hình nghỉ của nó (§B7, không qua `AsyncContent`) |
| 4 | Còn lại (vùng có khung riêng, không phải toàn màn, không phải chỉ shimmer)? | BLOCK gọi `AsyncContent.Base` (đa số ca: `LeaderboardBoard`, `SubmissionAttemptSelector`, `ConsultantDirectoryGrid`) |

Atom KHÔNG BAO GIỜ xuất hiện ở cây thứ hai: atom không biết dữ liệu (canon B6, `rules/1-decompose.md`),
nên không có khái niệm "vùng đang tải/lỗi/rỗng" để tự quyết.

---

## 3. VÉT CẠN — bốn nhánh có THỨ TỰ (không phải thang vô hướng) + trục thứ hai ai sở hữu

### 3a. Sáu cặp trạng thái — `C(4,2) = 6`, tính theo KHOẢNG CÁCH trong chuỗi ưu tiên `error(1)·loading(2)·empty(3)·content(4)`

**Ba cặp KỀ NHAU (khoảng cách 1) — nơi lẫn thật xảy ra:**

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| `error` ↔ `loading` | **Error có set VÀ có `errorContent` không?** Có ⇒ `error` LUÔN THẮNG dù `isLoading` vẫn `true` (vd background refetch sau khi đã lỗi) — không có chuyện "đang tải thì lỗi phải chờ". | ✅ `SubmissionFindingsList` file header dòng 66-68 tự phát biểu đúng luật này ("Error still outranks a stale isLoading/isSkeleton") |
| `loading` ↔ `empty` | **`isLoading` đã chắc chắn về `false` chưa?** Mảng rỗng KHÔNG tự động là "rỗng thật" nếu request đầu vẫn đang chạy — phải đợi `isLoading=false` rồi mới tin `isEmpty`. Caller tự rút gọn điều kiện, `AsyncContent` không tự suy. | neo: JSDoc dòng 133-136 "Pass an already-reduced condition, e.g. `isLoading && items.length === 0`" |
| `empty` ↔ `content` | **Đếm `length` thật, không suy từ giá trị falsy khác.** `undefined` (chưa fetch xong) KHÔNG PHẢI `isEmpty=true`; chỉ mảng đã fetch xong và dài 0 mới là `isEmpty`. | neo: `emptyContent` optional, "Left empty → the empty branch renders null" (dòng 146-148) — thiếu cấu hình bị hiểu nhầm là "rỗng nhưng không nói gì", không phải "chưa biết" |

**Hai cặp cách 1 bậc (khoảng cách 2) — chỉ ghi câu hỏi cấp trên chưa trả lời:**

| Cặp | Đọc thế nào |
|---|---|
| `error` ↔ `empty` | Phân vân ở đây nghĩa là chưa trả lời được "request có thất bại không" (câu của cặp `error`↔`loading`) — quay lại đó trước. |
| `loading` ↔ `content` | Phân vân ở đây nghĩa là chưa trả lời được "phản hồi đã về chưa" (câu của cặp `loading`↔`empty` / `empty`↔`content`) — quay lại đó trước. |

**Một cặp cách xa nhất (khoảng cách 3) — cố ý không có phép thử:**

`error` ↔ `content` — phân vân ở đây là dấu hiệu **chưa trả lời được CẢ HAI câu cấp trên**
(request thất bại hay thành công, đã về hay chưa). Dừng chọn nhánh, đọc lại toàn chuỗi
ưu tiên từ đầu, đừng cố phân định trực tiếp cặp này.

Đếm lại: 3 + 2 + 1 = 6 = `C(4,2)`. Đủ.

### 3b. Trục thứ hai — ai sở hữu (`atom`/`composite`/`block`/`screen`) — tiêu chí dừng: đủ 4×4 = 16 ô, mỗi ô có nhãn

| Trạng thái | `atom` | `composite` | `block` | `screen` |
|---|---|---|---|---|
| **error** | ⛔ không biết dữ liệu | ✅ `AsyncContentError` vẽ hình khi được bảo | ✅ SỞ HỮU quyết định + chọn 1 trong 2 đường (`AsyncContent.Base` hoặc bounded riêng, ca `SubmissionFindingsList`) | ⛔ chưa thấy ca nào — 0/34 file `pages/**` import `AsyncContentError` |
| **loading** | ⛔ (hình nghỉ riêng của atom là trục `skeleton/` khác) | ✅ `AsyncContent.Base` nhận `isLoading`, hiện slot `skeleton` | ✅ SỞ HỮU cả quyết định lẫn hình: tính `isLoading`+`isSkeleton` gộp 1 nhánh, tự vẽ cây `Skeleton.*` | ⬜ chỉ CHUYỂN TIẾP `isSkeleton` xuống từng block (§B7), không tự vẽ |
| **empty** | ⛔ | ✅ `AsyncContentEmpty` vẽ hình mặc định (`TrayIcon`+title+action) | ✅ THƯỜNG: tính `isEmpty`, gọi `AsyncContent.Base` hoặc gọi thẳng bounded trong khung riêng | ⚠️ CÓ TIỀN LỆ NHƯNG CHƯA CHỐT LUẬT — xem §6 C1 |
| **content** | ⛔ (là nguyên liệu, không "sở hữu" cả vùng) | ⬜ chỉ chuyển tiếp `content ?? children`, không tạo ra nội dung | ✅ SỞ HỮU — cung cấp `content`/`children` thật | ⬜ chỉ xếp block vào khung, không tự có nội dung riêng |

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn nhánh, mà vì đọc sai ai được gọi

1. **Bọc trong hàm nội bộ KHÔNG PHẢI tách tầng thật.** `FoundationResourcePage.tsx` dòng
   111-123 định nghĩa `FoundationResourceEmpty` như một hàm KHÔNG EXPORT ngay trong chính file
   screen, rồi gọi `AsyncContentEmpty` bên trong — nhìn giống "đã tách block riêng" nhưng vẫn
   là code TẦNG SCREEN (không nằm trong `blocks/**`, không có story riêng). `steps/13-feedback-
   anatomy-registry.md` dòng 1574-1579 ghi rằng hướng fix ĐÚNG là "tách BLOCK MỚI
   `FoundationResourceEmpty` … + story riêng", nhưng grep toàn repo lại ngày 2026-07-29
   (`grep -rl "FoundationResourceEmpty" .storybook/components`) vẫn chỉ ra ĐÚNG 1 file — chính
   `FoundationResourcePage.tsx`.

   **ĐÃ CHỐT (đo code, không cần thầy):** đọc thẳng `FoundationResourcePage.tsx` dòng 34-36 và
   156-193 xác nhận HAI việc, không phải một nghi vấn: (a) fix đã ghi sổ là đã làm nhưng CHƯA
   lên tới đĩa thật; (b) chính comment file header của nó TRÍCH SAI hành vi thật của
   `CourseContents` — tự nhận "same idiom `CourseContents` uses … scoped to the part", trong
   khi `CourseContents.tsx` dòng 115-117 (`if (isEmpty) return <CourseContentsEmpty />`) thật sự
   return sớm TOÀN BỘ render, không hề "scoped". `isEmpty` ở `FoundationResourcePage` chỉ thay
   MỘT PHẦN màn (dòng 159-165: `TrialEnrollBanner` đứng NGOÀI switch `isEmpty`) — đây là VI PHẠM
   xác nhận được bằng đo code, không phải nghi vấn cần hỏi thầy. Neo trích nhầm nằm NGAY TRONG
   SRC (comment của chính file đó), không phải trong canon trục này.

   Câu THẬT SỰ còn treo (screen có được gọi thẳng composite hay không, kể cả khi thay TOÀN BỘ
   màn) đã dồn về §6 câu **C1** — viết lại ở đó cho gọn, kèm hai lựa chọn cụ thể; không lặp lại
   ở đây.

2. **`error`/`isEmpty` = true mà thiếu props kèm theo bị rơi xuống nhánh dưới, không báo gì.**
   `error` truthy nhưng thiếu `errorContent` ⇒ dòng 200 `if (error && errorContent)` false ⇒
   rơi qua kiểm `isLoading` như thể không có lỗi. `isEmpty` true nhưng thiếu `emptyContent` ⇒
   vẽ `null`, vùng biến mất im lặng (dòng 146-148, 206-208). Dễ tưởng "cứ set cờ là nhánh tự
   hiện" — sai, phải cấp cả props nội dung đi kèm.

3. **Layout gọi thẳng composite là "ngoại lệ có chủ ý", không phải mẫu để chép.**
   `HeadhuntingCompaniesLayout.tsx` dòng 31-39 tự thừa nhận: rail điều hướng thật CHƯA XÂY, nên
   dùng `AsyncContentEmpty` làm chỗ đứng TRUNG THỰC thay vì giả một `div`. Đây là gap CÓ NHÃN
   cho một block CHƯA TỒN TẠI — không phải tiền lệ cho việc bỏ qua ranh giới import khi block
   đã có sẵn nhưng ngại wiring.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Code thật của `AsyncContent.Base`** (dòng 173-224) — nguồn cao nhất cho THỨ TỰ ƯU TIÊN
   bốn nhánh (§1/§2 trên). Không nguồn nào được lật ngược "error → loading → empty → content".
2. **Tiền lệ đã dựng** (đọc trực tiếp từng page/block) — dùng khi quyết "ai gọi" (block hay
   screen), vì canon B7 chỉ có 3 dòng, không đủ chi tiết cho mọi ca.
3. **Ghi chú trong file header của chính component đang lệch mặc định** (`SubmissionFindingsList`,
   `PlaygroundPreparePage`, `HeadhuntingCompaniesLayout`) — là BẰNG CHỨNG THẬT cho LÝ DO một ca
   cố tình khác thường, nhưng KHÔNG PHẢI luật đã chốt nếu một ca khác (`FoundationResourcePage`)
   mâu thuẫn nó — xem BẪY #1.
4. **`steps/13-feedback-anatomy-registry.md`** — ghi Ý ĐỊNH sửa, KHÔNG PHẢI bằng chứng đã áp.
   Luôn đối chiếu lại đĩa thật (`git log`/grep) trước khi tin một dòng nhật ký.
5. **`rules/1-decompose.md` §B7** — canon tổng quát 3 dòng, dùng khi không có ca cụ thể nào ở
   trên (xem `example.html` §1 cho neo đủ).

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Tự viết if/else khác thứ tự `error → loading → empty → content` (vd để `empty` đè `error`) | ⛔ không gate được — kỷ luật, đọc code |
| 2 | Screen import `AsyncContent` (switch) hoặc `AsyncContentError` trực tiếp | ⬜ CHƯA — gate cần viết: quét import trong `pages/**` + `layouts/**`, báo đỏ nếu thấy 2 tên đó (`AsyncContentEmpty` vẫn có tiền lệ, chờ **C1** chốt) |
| 3 | `AsyncContentEmpty`/`Error` gọi ở tầng screen chỉ thay MỘT PHẦN cây thay vì return sớm TOÀN BỘ | ⬜ CHƯA — gate cần viết: nếu `pages/**` có `isEmpty` mà JSX của `AsyncContentEmpty` không nằm ở nhánh return-sớm bọc toàn hàm render, báo đỏ (bẫy #1) |
| 4 | Block bọc `AsyncContent`/`AsyncContentEmpty` mà không thêm domain gì (chỉ đổi tên) | ✅ `check-passthrough-block.mjs` |
| 5 | `error`/`isEmpty` = true mà không kèm `errorContent`/`emptyContent`, tưởng nhánh tự hiện | ⛔ không gate được — hành vi runtime (bẫy #2) |
| 6 | Tin nhật ký "đã fix" mà không đối chiếu lại code thật trên đĩa | ⛔ không gate được — kỷ luật quy trình (bẫy #1) |

**Câu hỏi CHƯA CÓ ĐÁP ÁN CHÍNH THỨC (đưa lên thầy):**

- **C1** — nguồn tra đúng như được chỉ: `rules/1-decompose.md` §2 "bảng cứng" (dòng 100-106,
  cập nhật 2026-07-28) cấm TUYỆT ĐỐI screen import composite, không ghi ngoại lệ nào. Nhưng
  §5 (dòng 155) của CHÍNH file đó — SỬA CÙNG một commit `8c191396bb`, cùng ngày — liệt lại
  ĐÚNG câu hỏi này là "Chờ thầy chốt" và tự ghi "Hiện đang gọi trực tiếp". Tức là đây KHÔNG phải
  canon của trục này trích neo sai — rules tự mâu thuẫn với chính nó, và mâu thuẫn đó vẫn đứng
  nguyên tới hôm nay.

  Đo code 2026-07-29: **6/6 tiền lệ trên đĩa đều import thẳng** `AsyncContentEmpty` ở tầng
  `pages/**`/`layouts/**` (`CourseContents`, `ModulePage`, `MindMapPage`, `PlaygroundPreparePage`,
  `FoundationResourcePage`, `HeadhuntingCompaniesLayout`) — không ca nào tách qua block. 5/6 ca
  tuân theo một ngưỡng CHUNG dù chưa được ghi vào §2: chỉ gọi thẳng khi thay TOÀN BỘ hàm render
  bằng return sớm (chuẩn: `CourseContents.tsx:115-117`); riêng `FoundationResourcePage` lệch
  ngưỡng đó — đã đóng riêng ở bẫy #1 trên bằng đo code, KHÔNG phải phần đang hỏi ở đây. Chưa
  từng có ca nào gọi thẳng `AsyncContentError` ở tầng screen.

  Hai lựa chọn RA HÌNH KHÁC NHAU thật trên đĩa: **(a)** viết thêm một dòng ngoại lệ vào §2
  ("trừ khi thay TOÀN BỘ render bằng return sớm") — giữ nguyên 5 tiền lệ, chỉ sửa riêng
  `FoundationResourcePage` cho khớp ngưỡng đó; ít file đổi nhất. **(b)** bỏ hẳn ngoại lệ, ép cả
  6 tiền lệ tách thành block `<Screen>EmptyState` riêng (đúng nghĩa đen §2) — 6 block + 6 story
  mới, đổi cây import của cả 6 screen/layout. ⚠️ CHỜ THẦY CHỐT: chọn (a) hay (b)?
