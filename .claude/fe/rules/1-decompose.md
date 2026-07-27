# TƯ DUY 1 — DỰNG KHUNG: từ SCREEN xuống ATOM

> Một trong 4 file tư duy. Bộ: `thinking-1-decompose` · `thinking-2-leaf-states` ·
> `thinking-3-shape-tier` · `thinking-4-organization`.
> File này trả lời: **đứng trước một màn, tách nó thành cây component thế nào.**
> Luật chi tiết ở `principles.md`; file này là THỨ TỰ NGHĨ và chỗ dễ sai.

---

## 0. Ba câu trục — nhớ đúng ba câu này là đủ đi đường dài

| # | Câu | Hệ quả trực tiếp |
|---|---|---|
| **T1** | **Mỗi tầng sở hữu MỘT thứ.** atom sở hữu phần tử · frame sở hữu khoảng cách/khung · composite sở hữu hình của một mẩu · block sở hữu chức năng + miền · screen sở hữu danh sách chức năng | tranh chấp quyền = sai tầng, không phải "tuỳ trường hợp" |
| **T2** | **Đi xuống là DỮ LIỆU, không phải HÌNH.** prop là `string`/`number`/`enum`/mảng có kiểu | `ReactNode` là cửa cho caller nhét hình ⇒ chỉ mở ở tầng frame (slot) |
| **T3** | **Trạng thái nghỉ là CỜ chảy xuống, không phải cây thứ hai.** `isSkeleton` có ở cả 5 tầng | cấm `XxxLoading` dựng tay — neo thật: mirror vẽ 2 khối trong khi cây thật có 5 block |

---

## 1. Bảy bước, theo đúng thứ tự

### B1 · Viết DANH SÁCH CHỨC NĂNG — chưa nghĩ hình
Screen là một **danh sách chức năng**; mỗi chức năng = một block. Viết ra bằng lời:

> *"khoá này là gì · gate GitHub team · đổi trial→mua · quay lại chỗ dở · hôm nay làm gì · đi tiếp trong chương"*

Đọc danh sách phải ra được **trang làm gì**. Nếu một dòng không nói được nó phục vụ việc gì cho người học ⇒ nó không phải chức năng, nó là trang trí.

### B2 · Dựng KHUNG bằng tầng frame, KHÔNG bằng `div`

| Cần | Dùng | Đừng |
|---|---|---|
| khổ trang căn giữa | `Container size padding` | `mx-auto max-w-3xl p-6` |
| cột dọc / hàng ngang | `StackV` / `StackH` (`gap: SeamScale`) | `flex flex-col gap-10` |
| lưới | `Grid columns gap` | `grid grid-cols-*` |
| hàng N phần tử cùng kiểu, tự tràn dòng | `Cluster items` | `flex flex-wrap gap-2` |

**Vì sao bắt buộc:** `gap` khai kiểu `SeamScale`, `padding` khai `InsetScale` — **union chữ**,
nên off-scale là **LỖI TYPE tại call-site**. Đây là chỗ duy nhất §10 được thi hành bằng máy.
`max-w-3xl` **hôm nay** bằng `--container-app-md`, nhưng là NGUỒN KHÁC — token đổi thì lệch âm thầm.

> **Thang là CHỮ, không phải số** (thầy chốt 2026-07-27). `gap="grouped"`, không phải `gap={3}`.
>
> | `SeamScale` | lớp | hỏi gì để chọn |
> |---|---|---|
> | `flush` | `gap-0` | hai thứ là MỘT đơn vị nghĩa (tiêu đề + phụ đề)? |
> | `tight` | `gap-1` | một cái là DẤU gắn vào cái kia (icon trước nhãn)? |
> | `related` | `gap-2` | chúng NGANG HÀNG trong một tập (dãy chip, hai nút)? |
> | `grouped` | `gap-3` | chúng là HÀNG xếp trong một mặt (list row, caption dưới chủ)? |
> | `section` | `gap-6` | chúng là VÙNG khác nhau của một thứ (header/body/footer)? |
> | `page` | `gap-8` | chúng là CHỨC NĂNG riêng trên trang (block cạnh block)? |
>
> `InsetScale` cho `padding`: `flush(p-0) · cozy(p-3) · roomy(p-6) · airy(p-8)` — **bốn** bậc.
>
> Ca khó nhất là `related` vs `grouped` (chỗ đông call-site nhất): **đảo chỗ hai cái mà nghĩa
> không đổi ⇒ ngang hàng ⇒ `related`.** Thứ tự mang nghĩa, hoặc mỗi hàng một loại khác nhau
> ⇒ hàng của một mặt ⇒ `grouped`.

### B3 · Mỗi chức năng gọi đúng MỘT block
- Block chưa có ⇒ **dựng ở tầng block**, đừng lắp tạm bằng atom/frame trong screen.
- Trước khi dựng, hỏi 3 câu (§14e): *phục vụ WHY gì · hệ đã có gì phục vụ WHY đó · có rồi thì dùng lại*.
- Neo sai thật: `KeepGoingPath` dựng mà bỏ qua bước 2, trong khi hệ đã có `UpNextCard` cùng họ WHY.

### B4 · Block chỉ LẮP — không sáng tạo hình
Block ghép `frame + atom + composite`. Cần một **quyết định thẩm mỹ mới** ⇒ đẻ ở tầng
**composite** rồi block dùng lại.
Neo sai thật: `KeepGoingPath` tự vẽ `div.rounded-2xl.border` + tự chọn nhịp — đó là block lấn
quyền composite.

> ⚠️ **Tầng `design` đã XOÁ 2026-07-28.** Mọi câu cũ dạng "đẻ ở tầng design" đọc thành
> **composite**. Block ĐƯỢC import block (một thứ trong miền dựng được từ một thứ khác trong
> miền) — nhưng phải **kiếm được tầng của nó**: xem `check-passthrough-block`.

### B5 · Composite KHÔNG biết miền — trừ đúng một ngoại lệ
Composite là UI/UX thuần: không biết "bài học", "thử thách", "suất giá".
**Ngoại lệ (thầy chốt 2026-07-27):** composite ĐƯỢC biết một **enum hiển thị** khi bảng ánh xạ
của nó là **thang MÀU/HÌNH** (`enum → nhãn + tone`) — chọn màu là quyết định thẩm mỹ. Neo:
`VariantChipDifficulty`.
**Biên:** composite chỉ giữ **BẢNG TRA**. Có `if` nghiệp vụ · có ngưỡng · quyết định hiện/ẩn ·
enum đè enum ⇒ **về block**. Neo: `KeepGoingPath.CONTENT_LEADING` ở lại block vì `locked` đè `state`.

### B6 · Atom bọc HeroUI, khoá API
Atom = phần tử người dùng chạm được. Cấm `children` (§12b) — mọi thứ đi bằng prop dữ liệu. Atom tự sở hữu size/weight/skeleton của mình; caller chỉ chọn "hình gì", không chọn "trông thế nào".

### B7 · Nối trạng thái

| Trạng thái | Cách làm |
|---|---|
| đang tải | `isSkeleton` chảy xuống TỪNG block; mỗi block tự vẽ hình nghỉ của nó |
| rỗng | `isEmpty` → `AsyncContentEmpty` thay **toàn bộ** spine |
| lỗi | `AsyncContentError` trong khung của block, không để lại card trắng |

---

## 2. Ai được import gì — bảng cứng

> Cập nhật 2026-07-28: `layout` → **`frame`** · `design` **XOÁ** · thêm tầng **`heroui`** hiện
> ra trong panel anatomy.

| Tầng | Được import | CẤM import |
|---|---|---|
| **screen** | block · **khung** frame (`Container`/`Stack*`/`Grid`) | atom · composite · `div` bố cục tay |
| **block** | composite · frame · atom · **block khác** (§dưới) | screen |
| **composite** | frame · atom | block · screen · dữ liệu miền |
| **frame** | atom · frame khác | composite · block |
| **atom** | HeroUI | mọi tầng trên |

**Block ĐƯỢC import block** kể từ khi tầng design bị xoá — nhưng luật cũ "block không bọc
block" từng là thứ DUY NHẤT chặn chuỗi `A→B→C`. Thay bằng: **block bọc đúng một con phải KIẾM
được tầng của nó** — một điều kiện nghiệp vụ, một quyết định, một luật, **hoặc chính CÂU CHỮ**
(biến dữ liệu miền có kiểu thành câu người đọc). Cổng `check-passthrough-block` canh.

Hai chỗ hay hiểu sai:
1. **Screen ĐƯỢC dùng khung frame.** Ghi chú cũ từng viết "screen không import khung" trong khi chính file screen đang import `Container`/`Stack` — luật tự đá nhau. Đúng là: được dùng KHUNG, cấm tự viết `div` bố cục.
2. **Atom viết `flex` tay là ĐÚNG** (§13z). "Bố cục đi qua khung" chỉ áp **từ tầng frame trở lên**.

---

## 3. Cây mẫu đã dựng thật — `CourseContents`

```
Container                     frame    ← khổ đọc + đệm trang
  StackV  gap="page"          frame    ← tách VÙNG (identity ↔ nội dung)
    CourseBrief               block    → PageHeader
    StackV  gap="section"    frame    ← nhịp giữa các block
      CourseTeamGate          block    → FeedbackCallout
      TrialConversionStrip    block    → SurfaceCard ⊃ PriceTag · PhaseScarcityNote
      ContinueLearning        block    → ContinueCardHero (block)
      LearnNudges             block    → SurfaceCardList
      KeepGoingPath           block    → SurfaceCardList
```

Closure đo được: **38 file** — 1 screen · 6 block · 4 composite · 15 frame · 11 atom · 1 util.
(Số đo TRƯỚC khi xoá tầng design; giữ nguyên vì nó neo cho bốn lỗi ở §4.)

---

## 4. Bốn chỗ sai đã cắn thật khi làm cây này

1. **Screen gọi thẳng một mẩu hình.** `ContinueCard` từng nằm ngay trong screen, và screen tự ghép chuỗi `"Đã đọc 8/23 bài"`. Dấu hiệu lộ ra ngay trên cây Structure: năm node cùng một tầng, một node lẻ khác tầng. Sửa: thêm block `ContinueLearning` sở hữu câu chữ.
2. **Gọi tên KHUNG thay vì tên BLOCK.** Header screen ghi `FeedbackCallout` trong khi block thật là `CourseTeamGate`. Tên sai ⇒ node không vào được cây (DOM phát `CourseTeamGate`), và tầng cũng sai.
3. **Cái khung đội tên của thứ nằm trong nó.** State rỗng gắn `anatPart="AsyncContentEmpty"` lên `Container` ⇒ node duy nhất trong cây là **cái khung** mang tên + link của nội dung, còn `Container` biến mất khỏi state đó.
4. **`gap` viết mà không có ai nhận.** `Container` chỉ áp `gap` khi dùng slot `header`/`footer`; truyền `children` thẳng thì prop bị **bỏ im lặng**. Đo được: seam header→thẻ đúng **0px** trong khi code ghi `gap="page"`. Viết `gap` mà không ai nhận **tệ hơn không viết**, vì đọc code tưởng đã có nhịp.

**Đổi tên "Deps" thành "Structure" (thầy chốt 2026-07-27):** cây này suy từ DOM nên nó tả CẤU
TRÚC (cái gì lồng trong cái gì), không phải phụ thuộc (cái gì cần cái gì, đọc từ import).
Bằng chứng: `KeyValue.List` khai đúng vẫn không hiện vì `Popover.Content` render qua portal;
`Popover.Trigger`/`Popover.Content` hiện thành ANH EM dù logic lồng nhau. Nếu sau này muốn
cây phụ thuộc THẬT thì đó là một tab KHÁC đọc từ import, không phải sửa cái này.

---

## 5. Chờ thầy chốt

- **C1** — screen có được gọi `AsyncContentEmpty`/`AsyncContentError` (composite) trực tiếp không, hay phải qua một block `EmptyState`? Hiện đang gọi trực tiếp.
- **C2** — trục THIẾT BỊ (Desktop/Tablet/Mobile) có phải trục story không? Đo được: `Container size="md"` chặn 768px ⇒ **Tablet ≡ Desktop về cấu trúc**, chỉ khác lề trắng. Nếu giữ thì chọn width theo token `--container-app-*`, không phải số magic (768 nằm đúng trên mốc `@app-md` = giá trị tệ nhất).
- **C3** — closure còn **28 chuỗi tiếng Việt** là copy sản phẩm nằm rải trong 5 block, kèm `toLocaleString("vi-VN")` hard-code. Biên i18n đặt ở đâu?

---

## 4a. PANEL: CỬA VÀO CÂY LÀ storyId THẬT HOẶC tier: heroui (thầy chốt 2026-07-27)

Panel chỉ nhận một part vào cây Structure khi part đó khai `storyId` trỏ tới một story có thật,
hoặc khai `tier: "heroui"`. Thiếu cả hai, part vẫn render ra DOM (`data-anat-part` vẫn có mặt),
nhưng nó vô hình trong cây: không tsc lỗi, không eslint báo, không gate nào đỏ. Đo được ngày
2026-07-27: **153 part / 56 file** dùng ngoài cây kiểu này.

BA LOẠI part, BA CÁCH XỬ:

1. **Component thật** (có file impl riêng) ⇒ khai `storyId` trỏ đúng story của nó.
2. **Part nội bộ của một atom** (không đứng một mình, không có story riêng) ⇒ khai `storyId`
   của CHÍNH atom cha, hoặc bỏ badge luôn.
3. **Slot của caller** (`Body`, `Action`, `Content`...) ⇒ bỏ badge. Node bên trong slot thuộc về
   người TRUYỀN VÀO, không thuộc về component đang khai slot đó.

Đừng nhầm hai câu hỏi. Câu "import gì mà không khai" dễ hơn, số nhỏ hơn nhiều (**9**). Câu
"badge gì mà rơi ngoài cây" khó hơn, số lớn hơn hẳn (**153/56**). Gate xanh câu này không nói
gì về câu kia.

TÊN node = TÊN COMPONENT THẬT, không phải tên vai trò nó đang đóng. Vai trò đi vào field `role`,
không đi vào tên. Trùng tên là vô hại, vì panel gom node theo phần tử DOM thật đang render, không
theo tên.

MEMBER của một namespace (`.Base`, `.Inline`, `.Prominent`...) LÀ LEAF, không phải STATE. Caller
gọi hai tên khác nhau nghĩa là hai cửa vào khác nhau, không phải hai nhánh dữ liệu của cùng một
cửa. Neo sai đã cắn: `PriceTag.Inline` và `PriceTag.Prominent` từng bị gộp chung thành hai state
trong MỘT leaf, trong khi đúng ra là hai leaf riêng.
