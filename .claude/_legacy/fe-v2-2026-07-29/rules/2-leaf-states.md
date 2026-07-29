# TƯ DUY 2 — CHIA LEAF và VÉT CẠN STATE

> Một trong 4 file tư duy. File này trả lời: **một component có bao nhiêu leaf, và trong
> mỗi leaf phải render những state nào cho đủ.**
> Đây là chỗ canon từng tự đá nhau nhiều nhất, nên mọi luật dưới đây viết dạng đánh số để
> sửa/gỡ được từng cái.

---

## 0. Tiêu chí GỐC — một câu duy nhất

> **R0 · Tách leaf khi HÌNH DO CHÍNH COMPONENT VẼ đổi. Không tách khi chỉ DỮ LIỆU đổi.**

Từ R0 suy ra một phép thử sắc hơn, dùng được ngay không cần tra bảng:

> **Ai bật cái đổi này?**
> **CALLER bật** (prop có/không, slot có/không) ⇒ **LEAF**
> **DỮ LIỆU về** (0 · 1-3 · nhiều · `null`) ⇒ **STATE**, render nhiều hàng trong **MỘT** leaf

Phép thử này nhất quán ở cả 5 tầng: `viewer="paid"` và `isEmpty` là caller bật ⇒ leaf riêng; `seatsRemaining = 0/3/14`, `nextPhasePriceVnd = null` là dữ liệu ⇒ cùng một leaf.

---

## 1. Prop ĐƠN

| Kiểu prop | Leaf? | Leaf render gì | Neo |
|---|---|---|---|
| boolean bật hình (`divider`, `wrap`) | có | trạng thái **BẬT** (tắt đã là `Default`) | `Stack.H` leaf `Wrap` |
| **`isSkeleton`** | **có, ở CẢ 5 TẦNG** | hình nghỉ | thầy chốt 2026-07-27 |
| union (`tone`, `size`, `variant`) | có, **1 leaf** | **đủ union** trong một khung | `Chip` leaf `Tones` = 5 viên |
| string/number nội dung (`text`, `title`, `amount`) | không | — | §12g.2 |
| function làm mọc node / đổi thẻ bọc (`onRemove`, `onPress`, `href`) | có | trạng thái có handler | `Chip` `Removable` · `ListRow` `LinkRow` |
| function không đổi hình (`onValueChange`) | không | — | |
| prop chỉ vào `aria-*` (`ariaLabel`, `removeLabel`) | không | — | §12g.1 |

**Vì sao `isSkeleton` là leaf ở mọi tầng:** chủ của hình là chủ của skeleton (§12c). Component **tự vẽ** hình nghỉ của nó ⇒ đó là *hình đổi*, không phải *dữ liệu đổi*. Nên nó thoả R0 ở mọi tầng, không cần ngoại lệ.

---

## 2. Prop OBJECT / ARRAY — bốn câu, đúng thứ tự

**① Bắt buộc, và không có nó thì không có hình?** (`items` · `contents` · `options` · `rows`)
⇒ **nó CHÍNH LÀ `Default`**, không đẻ leaf riêng. `Default` render tập **tối thiểu đại diện** (1–3 phần tử).
Đo được: 14 prop dạng này trong hệ đều bắt buộc (không có `?`).

**② Tuỳ chọn (`?`) và SỰ CÓ MẶT làm mọc/mất node?** (`suggestions?` · `meta?` · `trailing?`)
⇒ **đúng 1 leaf = trạng thái CÓ**. Trạng thái không-có đã là `Default`.
Đừng đẻ hai leaf "có/không" — đó là vẽ `Default` hai lần.

**③ Field BÊN TRONG object có đổi hình không?**
- Field làm **mọc/mất node** ⇒ vẫn **KHÔNG** đẻ leaf riêng: đó là **state**, render thêm hàng trong leaf của prop đó.
- Field chỉ **đổi chữ** ⇒ cũng là state, cùng leaf.
Neo đo thật: `TrialConversionStrip` — `hasFreeLeft` chỉ thay `subtitle`, **cây node y nguyên** ⇒ hai leaf `PriceLoadedWithFreeLeft`/`PriceLoadedNoFreeLeft` cũ là sai, đã gộp thành `Default` render hai hàng.

**④ Prop `ReactNode` slot** (`leading` · `trailing` · `header` · `footer` · `body`)
Chỉ hợp lệ **từ tầng layout trở lên** (atom cấm `children`, §12b).
⇒ leaf chia theo **VÙNG**, không theo từng prop. Neo: `meta` + `trailing` render chung một `div ml-auto` ⇒ **một** leaf `MetaTrailing`.

---

## 3. `Default` nghĩa là gì — chốt một nghĩa

> **`Default` = LỜI GỌI TỐI THIỂU HỢP LỆ: chỉ prop BẮT BUỘC, không bật prop tuỳ chọn nào.**

Ba hệ quả suy ra được, khỏi phải nhớ thêm:
1. Prop bắt buộc **sinh cấu trúc** (`items`) ⇒ không có leaf riêng, nó **là** `Default`.
2. Prop bắt buộc là **trục hình duy nhất** (`difficulty`) ⇒ cũng không leaf riêng; `Default` render đủ union của nó.
3. Prop **tuỳ chọn** ⇒ luôn là leaf riêng, và `Default` không được bật cái nào.

Trước khi chốt, `Default` mang **ba nghĩa** khác nhau trong cùng hệ: (a) gọi trần ở atom, (b) lời gọi duy nhất khi `items` bắt buộc, (c) **chỉ là tên export** ở tầng screen — 12 file screen đều `export const Default` kể cả file Skeleton.

---

## 4. Luật hình thức của leaf — kiểm được bằng máy

| # | Luật | Máy kiểm được? |
|---|---|---|
| **L1** | Tên leaf = **TRỤC nó vẽ**: `Prop \`tone\`` · `Prop \`isSkeleton\`` · `TitleOnly`. Cấm đặt `Default` cho một leaf đang truyền `isSkeleton` | có |
| **L2** | Mỗi leaf render **ĐỦ union** của trục đó (thiếu một giá trị ⇒ giá trị đó sẽ mọc thành leaf lạc chỗ) | không |
| **L3** | Leaf `isSkeleton` phải **RẼ theo trục hình** của chính component (`variant: hero\|item` ⇒ skeleton hai hình) | không |
| **L4** | **MỌI leaf phải có `code`** — tab Code rỗng = leaf không nói được cách gọi | có |
| **L5** | Trần tổ hợp = **4**. Vượt thì chỉ render tổ hợp app **dùng thật**, và **ghi rõ đã cắt + cắt theo tiêu chí gì** (không im lặng) | không |

---

## 5. VÉT CẠN STATE — liệt kê TRƯỚC khi dựng

Bộ state chuẩn phải viết ra **trước**, không phát hiện dần khi code. Với **BLOCK** thì bảng này là **tài liệu nghiệp vụ**, vì state của block là điều kiện nghiệp vụ:

| Cột | Ghi gì |
|---|---|
| **State** | tên gọi ngắn |
| **Điều kiện nghiệp vụ** | dữ liệu nào sinh ra nó (`seats = 0`, `!isEnrolled \|\| isInTeam`) |
| **Hình đổi gì** | node nào mọc/mất, hay chỉ đổi chữ |
| **Leaf hay state** | theo phép thử §0 |

Mẫu đã điền thật — `PhaseScarcityNote`:

| State | Điều kiện | Hình đổi | Kết luận |
|---|---|---|---|
| đủ hai vế | `seats = N` + `nextPhasePriceVnd != null` | 4 item | **state** (trong `Default`) |
| không có vế tăng giá | `nextPhasePriceVnd == null` | **rụng** `Separator` + `PriceRiseClause` | **state** |
| không giới hạn suất | `seatsRemaining == null` | **render null** — im hẳn | **state** |
| hết suất | `seats = 0` | **CHƯA CÓ** — hiện in `"Còn 0 suất"`, sai nghiệp vụ | chờ thầy |
| gấp | `seats` nhỏ | **CHƯA CÓ** — không có bậc tone gấp | chờ thầy |

Bản `_legacy` từng có đủ bậc (`--many-seats` · `--few-seats` · `--one-seat-left` · `--unlimited`) ⇒ **thang gấp là ý định gốc, bị mất khi port**.

---

## 6. Hai dòng canon phải viết lại sau khi chốt R3

| Ở đâu | Câu hiện tại | Phải thành |
|---|---|---|
| `principles.md` §14d.2 | *"skeleton KHÔNG phải leaf"* | skeleton **là leaf ở mọi tầng** (§12c: chủ của hình là chủ của skeleton) |
| `principles.md` §14g bảng | *"Bỏ story `Skeleton`, giữ `Empty`"* | cả hai đẻ đơn vị: `Empty` vì cây khác, `Skeleton` vì component tự vẽ hình nghỉ |
| `screen-playbook.md` B5 | *"`Skeleton` là leaf riêng"* | **giữ nguyên** — playbook đang đúng, principles đang sai |

Nợ đo được của luật này: **33 file** đang vẽ skeleton lồng trong leaf khác — atom 11 · frame 17 · composite 1 · block 1 · screen 3.
Riêng `VariantChip.Difficulty` là **neo của luật CŨ** trong §14d.2, nên nó đảo chiều.

---

## 7. Chờ thầy chốt

- **C4** — ngưỡng "gấp" của suất: đúng `1-3`, hay theo tỉ lệ (`< 15%` số suất của phase)?
- **C5** — câu khi **hết suất**: hiện sẽ in `"Còn 0 suất giá Sớm"`. Câu đúng là gì, và vế "giá tăng lên sau đó" bỏ luôn?
- **C6** — leaf `Prop isSkeleton` ở tầng screen có nhân theo device không? Hiện 3 device × skeleton = 3 story.
- **C7** — tên leaf skeleton: `Skeleton` (atom đang dùng) hay `Prop \`isSkeleton\`` (khớp lối `Prop \`tone\``)? Chọn một để sửa cả bộ.

---

## 8. API `states[]` — panel biết leaf có bao nhiêu state (thầy chốt 2026-07-27)

Trước đó `BlockAnatomy` nhận một khối `children` + MỘT `note` + MỘT `code`, nên state chỉ là JSX
tác giả xếp tay: panel không biết có mấy state, không chỗ giải thích từng cái, và **cây Structure
(trước gọi "Deps", nay đổi vì cây tả CẤU TRÚC DOM chứ không phải phụ thuộc import, xem
`rules/1-decompose.md` §4) suy từ DOM của cả khối nên không đúng với state nào**. Nay:

```tsx
<BlockAnatomy
    name="PhaseScarcityNote"  tier="block"  leaf="Default"
    renderClassName="mx-auto max-w-xl"
    reason="Bất biến của CẢ leaf, viết một lần."
    states={[
        { name: "seatsRemaining = 14, nextPhasePriceVnd set", why: "…", code: `…`, render: <…/> },
        { name: "nextPhasePriceVnd = null",                   why: "…", code: `…`, render: <…/> },
    ]}
/>
```

| Trường | Luật |
|---|---|
`name` | **điều kiện dữ liệu**, viết như biểu thức: `seatsRemaining = null` · `freeLessonsRemaining = 0` · `contents = []`. Không phải nhãn cảm tính (`empty`, `urgent`). Không suy ra được biểu thức thì viết điều kiện dạng văn ngắn (`isSkeleton, price not yet arrived`) |
`why` | **đúng 2 câu văn xuôi**: câu 1 nói **render đổi gì** (node mọc/mất, hay chỉ đổi chuỗi nào), câu 2 nói **vì sao sản phẩm muốn thế**. Câu 3 chỉ khi có **cấm riêng của state đó** |
`code` | snippet **của chính state đó**, không phải của cả leaf |
`reason` | **bất biến của cả leaf**, viết MỘT lần, không lặp mỗi state |
`renderClassName` | bề ngang của **CHỦ THỂ** (`mx-auto max-w-xl`). Đừng bọc `BlockAnatomy` trong `div.max-w-*`: panel sẽ thừa hưởng và ba cột chữ bị nhồi |

**Ba thứ KHÔNG được viết vào `why`** — chúng làm LLM nhiễu chứ không giúp vẽ lại:

| Loại | Ví dụ đã cắn | Chỗ đúng |
|---|---|---|
tả lại thứ mắt đã thấy | *"giá in đậm, chip màu xanh"* | không viết, đã có `render` + `code` |
kể lịch sử | *"measured before splitting these apart"* | JSDoc file |
nhận xét meta | *"this is the baseline the other three are read against"* | `reason` của leaf |

**Vì sao khuôn này đáng giá:** 663 leaf cùng khuôn thì quăng nguyên `states[]` của một họ cho LLM
là nó có đủ **điều kiện** (`name`), đủ **cây** (câu 1 của `why`), đủ **giọng** (câu 2), và biết
**vạch không được vượt** (`reason`). `why` viết tự do thì mỗi leaf một kiểu, LLM phải suy diễn, và
suy diễn là chỗ nó bịa.

Leaf CHƯA di trú vẫn chạy (được coi là một state ẩn danh) nhưng panel dán nhãn khác
(`note (whole leaf)` thay vì `why this state`), vì `children` có thể đang chứa nhiều state.

### 8a. Leaf có trục là THANG thì `name` là QUAN HỆ, không phải giá trị (2026-07-27)

Luật `name` = "điều kiện dữ liệu" ở trên dành cho state sinh ra vì **dữ liệu**. Có một họ leaf
khác: state sinh ra vì **caller chọn một bậc trên thang** (`gap` · `size` · `variant`). Ở họ này
viết `name` là giá trị thì story **dạy sai**:

```tsx
name: "gap = 3"                      // ❌ nhắc lại đúng cái đã nằm trong `code`
name: "rows inside one surface"      // ✅ nói người đọc phải TRẢ LỜI câu gì để chọn
```

Đo được: 21 state trên 5 story thang gap đều tên `gap = N`, nên đọc hết cả 6 tab vẫn **không
biết chọn bậc nào** — con số đã in trong `code` ngay bên cạnh rồi. `name` chỉ có giá trị khi nó
nói **tiêu chí**, vì đó là thứ duy nhất người đọc không tự thấy trong hình.

Từ vựng dùng chung cho thang seam (đồng bộ với `rules/3` §1.0, đừng đặt lại chữ mới):
`one continuous thing` · `a mark and its label` · `peers in one set` ·
`rows inside one surface` · `regions of one page` · `features standing apart`.

Kèm theo: state ở **hai đầu thang thường là bậc SAI** cho chính khung đó (chip row ở `page` là
vô nghĩa). Vẫn giữ chúng, nhưng `why` phải **nói rõ nó là đầu sai**, chứ đừng tả trung tính —
LLM đọc story để chọn, nên một bậc trình bày trung tính là một bậc nó có thể copy.
