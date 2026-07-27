# TƯ DUY 1 — LAYOUT HOÁ: từ SCREEN xuống ATOM

> Một trong 4 file tư duy. Bộ: `thinking-1-decompose` · `thinking-2-leaf-states` ·
> `thinking-3-design-tier` · `thinking-4-organization`.
> File này trả lời: **đứng trước một màn, tách nó thành cây component thế nào.**
> Luật chi tiết ở `principles.md`; file này là THỨ TỰ NGHĨ và chỗ dễ sai.

---

## 0. Ba câu trục — nhớ đúng ba câu này là đủ đi đường dài

| # | Câu | Hệ quả trực tiếp |
|---|---|---|
| **T1** | **Mỗi tầng sở hữu MỘT thứ.** atom sở hữu phần tử · layout sở hữu khoảng cách/khung · design sở hữu hình của một mẩu · block sở hữu chức năng + business · screen sở hữu danh sách chức năng | tranh chấp quyền = sai tầng, không phải "tuỳ trường hợp" |
| **T2** | **Đi xuống là DỮ LIỆU, không phải HÌNH.** prop là `string`/`number`/`enum`/mảng có kiểu | `ReactNode` là cửa cho caller nhét hình ⇒ chỉ mở ở tầng layout (slot) |
| **T3** | **Trạng thái nghỉ là CỜ chảy xuống, không phải cây thứ hai.** `isSkeleton` có ở cả 5 tầng | cấm `XxxLoading` dựng tay — neo thật: mirror vẽ 2 khối trong khi cây thật có 5 block |

---

## 1. Bảy bước, theo đúng thứ tự

### B1 · Viết DANH SÁCH CHỨC NĂNG — chưa nghĩ hình
Screen là một **danh sách chức năng**; mỗi chức năng = một block. Viết ra bằng lời:

> *"khoá này là gì · gate GitHub team · đổi trial→mua · quay lại chỗ dở · hôm nay làm gì · đi tiếp trong chương"*

Đọc danh sách phải ra được **trang làm gì**. Nếu một dòng không nói được nó phục vụ việc gì cho người học ⇒ nó không phải chức năng, nó là trang trí.

### B2 · Dựng KHUNG bằng tầng layout, KHÔNG bằng `div`

| Cần | Dùng | Đừng |
|---|---|---|
| khổ trang căn giữa | `Container.Base size padding` | `mx-auto max-w-3xl p-6` |
| cột dọc / hàng ngang | `Stack.V` / `Stack.H` (`gap: SpaceScale`) | `flex flex-col gap-10` |
| lưới | `Grid.Base columns gap` | `grid grid-cols-*` |
| hàng N phần tử cùng kiểu, tự tràn dòng | `Cluster.Base items` | `flex flex-wrap gap-2` |

**Vì sao bắt buộc:** `gap`/`padding` khai kiểu `SpaceScale` (union `0·1·2·3·6·8`) nên **off-scale là LỖI TYPE tại call-site**. Đây là chỗ duy nhất §10 được thi hành bằng máy. `max-w-3xl` **hôm nay** bằng `--container-app-md`, nhưng là NGUỒN KHÁC — token đổi thì lệch âm thầm.

### B3 · Mỗi chức năng gọi đúng MỘT block
- Block chưa có ⇒ **dựng ở tầng block**, đừng lắp tạm bằng atom/layout trong screen.
- Trước khi dựng, hỏi 3 câu (§14e): *phục vụ WHY gì · hệ đã có gì phục vụ WHY đó · có rồi thì dùng lại*.
- Neo sai thật: `KeepGoingPath` dựng mà bỏ qua bước 2, trong khi hệ đã có `UpNextCard` cùng họ WHY.

### B4 · Block chỉ LẮP — không sáng tạo hình
Block ghép `layout + atom + design`. Cần một **quyết định thẩm mỹ mới** ⇒ đẻ ở tầng **design** rồi block dùng lại.
Neo sai thật: `KeepGoingPath` tự vẽ `div.rounded-2xl.border` + tự chọn nhịp — đó là block lấn quyền design.

### B5 · Design KHÔNG biết miền — trừ đúng một ngoại lệ
Design là UI/UX thuần: không biết "bài học", "thử thách", "suất giá".
**Ngoại lệ (thầy chốt 2026-07-27):** design ĐƯỢC biết một **enum hiển thị** khi bảng ánh xạ của nó là **thang MÀU/HÌNH** (`enum → nhãn + tone`) — chọn màu là quyết định thẩm mỹ. Neo: `VariantChip.Difficulty`.
**Biên:** design chỉ giữ **BẢNG TRA**. Có `if` nghiệp vụ · có ngưỡng · quyết định hiện/ẩn · enum đè enum ⇒ **về block**. Neo: `KeepGoingPath.CONTENT_LEADING` ở lại block vì `locked` đè `state`.

### B6 · Atom bọc HeroUI, khoá API
Atom = phần tử người dùng chạm được. Cấm `children` (§12b) — mọi thứ đi bằng prop dữ liệu. Atom tự sở hữu size/weight/skeleton của mình; caller chỉ chọn "hình gì", không chọn "trông thế nào".

### B7 · Nối trạng thái

| Trạng thái | Cách làm |
|---|---|
| đang tải | `isSkeleton` chảy xuống TỪNG block; mỗi block tự vẽ hình nghỉ của nó |
| rỗng | `isEmpty` → `AsyncContent.Empty` thay **toàn bộ** spine |
| lỗi | `AsyncContent.Error` trong khung của block, không để lại card trắng |

---

## 2. Ai được import gì — bảng cứng

| Tầng | Được import | CẤM import |
|---|---|---|
| **screen** | block · **khung** layout (`Container`/`Stack`/`Grid`) | atom · design · `div` bố cục tay |
| **block** | design · layout · atom | block khác |
| **design** | layout · atom | block · screen · dữ liệu miền |
| **layout** | atom · layout khác | design · block |
| **atom** | HeroUI | mọi tầng trên |

Hai chỗ hay hiểu sai:
1. **Screen ĐƯỢC dùng khung layout.** Ghi chú cũ từng viết "screen không import layout" trong khi chính file screen đang import `Container`/`Stack` — luật tự đá nhau. Đúng là: được dùng KHUNG, cấm tự viết `div` bố cục.
2. **Atom viết `flex` tay là ĐÚNG** (§13z). "Bố cục đi qua khung" chỉ áp **từ tầng layout trở lên**.

---

## 3. Cây mẫu đã dựng thật — `CourseContents`

```
Container                     layout   ← khổ đọc + đệm trang
  Stack.V  gap-8              layout   ← tách VÙNG (identity ↔ nội dung)
    CourseBrief               block    → Page.Header
    Stack.V  gap-6            layout   ← nhịp giữa các block
      CourseTeamGate          block    → Feedback.Callout
      TrialConversionStrip    block    → SurfaceCard ⊃ PriceTag · PhaseScarcityNote
      ContinueLearning        block    → ContinueCard (design)
      LearnNudges             block    → SurfaceCard.List
      KeepGoingPath           block    → SurfaceCard.List
```

Closure đo được: **38 file** — 1 screen · 6 block · 4 design · 15 layout · 11 atom · 1 util.

---

## 4. Bốn chỗ sai đã cắn thật khi làm cây này

1. **Screen gọi thẳng design.** `ContinueCard` (design) từng nằm ngay trong screen, và screen tự ghép chuỗi `"Đã đọc 8/23 bài"`. Dấu hiệu lộ ra ngay trên cây Structure: năm node là `block`, một node lẻ là `design`. Sửa: thêm block `ContinueLearning` sở hữu câu chữ.
2. **Gọi tên FRAME thay vì tên BLOCK.** Header screen ghi `Feedback.Callout` trong khi block thật là `CourseTeamGate`. Tên sai ⇒ node không vào được cây (DOM phát `CourseTeamGate`), và tầng cũng sai.
3. **Cái khung đội tên của thứ nằm trong nó.** State rỗng gắn `anatPart="AsyncContent.Empty"` lên `Container` ⇒ node duy nhất trong cây là **cái khung** mang tên + link của nội dung, còn `Container` biến mất khỏi state đó.
4. **`gap` viết mà không có ai nhận.** `Container.Base` chỉ áp `gap` khi dùng slot `header`/`footer`; truyền `children` thẳng thì prop bị **bỏ im lặng**. Đo được: seam header→thẻ đúng **0px** trong khi code ghi `gap={8}`. Viết `gap` mà không ai nhận **tệ hơn không viết**, vì đọc code tưởng đã có nhịp.

**Đổi tên "Deps" thành "Structure" (thầy chốt 2026-07-27):** cây này suy từ DOM nên nó tả CẤU
TRÚC (cái gì lồng trong cái gì), không phải phụ thuộc (cái gì cần cái gì, đọc từ import).
Bằng chứng: `KeyValue.List` khai đúng vẫn không hiện vì `Popover.Content` render qua portal;
`Popover.Trigger`/`Popover.Content` hiện thành ANH EM dù logic lồng nhau. Nếu sau này muốn
cây phụ thuộc THẬT thì đó là một tab KHÁC đọc từ import, không phải sửa cái này.

---

## 5. Chờ thầy chốt

- **C1** — screen có được gọi `AsyncContent.Empty`/`.Error` (layout tier) trực tiếp không, hay phải qua một block `EmptyState`? Hiện đang gọi trực tiếp.
- **C2** — trục THIẾT BỊ (Desktop/Tablet/Mobile) có phải trục story không? Đo được: `Container size="md"` chặn 768px ⇒ **Tablet ≡ Desktop về cấu trúc**, chỉ khác lề trắng. Nếu giữ thì chọn width theo token `--container-app-*`, không phải số magic (768 nằm đúng trên mốc `@app-md` = giá trị tệ nhất).
- **C3** — closure còn **28 chuỗi tiếng Việt** là copy sản phẩm nằm rải trong 5 block, kèm `toLocaleString("vi-VN")` hard-code. Biên i18n đặt ở đâu?
