# ICON — dùng icon nào, cỡ nào, weight nào, có nên có icon không

> Trục này trả lời đúng một câu: **có nên có icon ở đây không, và nếu có thì cỡ/weight/tương
> tác của nó là gì.** Không trả lời khoảng cách icon↔chữ (xem `seam/`), không trả lời màu nền
> icon (xem `color/` khi dựng). Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
---

## 1. THANG — bốn thang con, không phải một thang phẳng

Icon không có MỘT trục giá trị như `gap`. Bốn câu hỏi độc lập ghép lại mới ra một quyết định
đủ. Ba trong bốn thang có type/hằng số THẬT trong code; thang SIZE suy từ Tailwind theme thật
(không phải TS union, không bịa).

**1a. BỘ ICON — hằng số đã chốt, không phải lựa chọn:**

| Giá trị | Trạng thái |
|---|---|
| `@phosphor-icons/react` | ✅ DUY NHẤT — 161 file dùng (đếm thật, xem `example.html` §1) |
| `@gravity-ui/icons` | ⛔ CẤM — 0 file còn dùng, chỉ còn kẹt trong `package.json` |
| glyph HeroUI tự vẽ trong slot `Indicator` | ⛔ CẤM — phải override, xem §1a.1 |

**1a.1. GLYPH CỦA VENDOR CŨNG LÀ MỘT BỘ ICON** (thầy chốt 2026-07-29)

Luật "một bộ duy nhất" thường bị đọc là "một dòng `import` duy nhất", nên bộ thứ hai lọt vào
bằng cửa sau: **HeroUI tự vẽ glyph khi slot `Indicator` bỏ trống**. Không có `import` nào để
grep, không gate nào bắt, nhưng trên màn hình vẫn là hai bộ icon với hai độ dày nét khác nhau.

Đọc thẳng source vendor (`node_modules/@heroui/react/dist/components/*`), có ba hành vi KHÁC
nhau, và gộp chúng làm một là chỗ sai:

| Slot | Vendor làm gì khi bỏ trống | Override thế nào |
|---|---|---|
| `Accordion.Indicator` · `Select.Indicator` | tự vẽ `IconChevronDown` | truyền Phosphor làm `children`. Vendor `cloneElement` và **giữ nguyên `data-expanded` + `data-slot`**, nên hiệu ứng xoay 180° khi mở **vẫn chạy** — animation bám `data-expanded`, không bám glyph |
| `Checkbox.Indicator` | tự vẽ HAI svg khác nhau cho `selected` và `indeterminate` | **BẮT BUỘC dạng HÀM** `children(state)`, xem bẫy §4.x |
| `Radio.Indicator` | **không vẽ icon nào** — chỉ là `<span>` bọc `children`, cái chấm là CSS của slot | ⛔ **KHÔNG override.** Chấm tròn là HÌNH HỌC, không phải icon (§1b) — nhét Phosphor vào là hiểu ngược chính luật này |

Cỡ vẫn tra bảng §1c như mọi icon khác, **không có con số riêng cho indicator**: caret trong
`Select`/`Accordion` là vị trí `DIV` (nằm trong control), không phải `TEXT`.

**1b. VỊ TRÍ icon — 2 giá trị, quyết định công thức size:**

| Giá trị | Ý nghĩa |
|---|---|
| `TEXT` | icon TRẦN cạnh chữ chạy, không Ô bọc riêng (`Typography.prefixIcon`/`suffixIcon`) |
| `DIV` | icon BÊN TRONG 1 Ô/control có nhịp riêng (tab, button, chip) |

**1c. SIZE — 5 giá trị thật đang dùng** (đếm bằng grep, xem `example.html` §1):

| Class | px | Đếm thật | Vị trí `TEXT` khớp `text-*` | Vị trí `DIV` khớp `text-*` |
|---|---|---|---|---|
| `size-3` | 12 | 24 | `text-xs` (font-size 1:1) | — |
| `size-3.5` | 14 | 46 | `text-sm` | — |
| `size-4` | 16 | 110 | `text-base` | `text-xs` (line-height) |
| `size-5` | 20 | 124 | — | `text-sm` (line-height) |
| `size-6` | 24 | 22 | — | `text-base` (line-height) |

SSOT số đo: `node_modules/tailwindcss/theme.css` — mỗi bậc `text-*` có `font-size` VÀ
`line-height` mặc định đi kèm, hai cột trên tra ra từ đúng hai số đó (không phải quy ước bịa).

**1d. WEIGHT — type thật `IconWeight = "regular" | "bold"`**, khai lại tại chỗ ở ≥8 primitive
(`Avatar`, `IconTile`, `ImageDropzone`, `Chip`, `Tabs`, `Menu`, `Popover`, `Typography`,
`SurfaceCard`) thay vì import type của Phosphor — cố ý, để không khoá cả cây vào một lib.

| Giá trị | Khi nào |
|---|---|
| `regular` | size từ `size-5` trở lên |
| `bold` | size nhỏ hơn `size-5` (bù nét mảnh do thu nhỏ) |

**"Có nên có icon không" KHÔNG phải thang giá trị** — đó là một GATE nhị phân (giữ / bỏ) nằm ở
bước đầu cây quyết định §2, áp riêng cho icon TRANG TRÍ cạnh một fact đã đủ nghĩa bằng chữ.

---

## 2. CÂY QUYẾT ĐỊNH — ba nhánh độc lập, mỗi nhánh dừng ở YES đầu tiên

### 2a. Nhánh chính — có icon không, cỡ bao nhiêu, weight nào

| # | Hỏi | Ra |
|---|---|---|
| 1 | Icon này trang trí cạnh **1 fact TĨNH đã tự đủ nghĩa bằng chữ** ("2 phút đọc", "N phản hồi")? | sang câu 2 |
| 2 | (nếu 1=YES) Icon có phải ký hiệu **"quốc dân"** — ai nhìn cũng đọc ra ngay, không cần liên tưởng (check, khoá)? | YES→giữ, sang câu 3. NO→**BỎ ICON, dừng ở đây** |
| 3 | Icon đang nằm **TRẦN cạnh chữ chạy** hay **TRONG 1 Ô/control**? | TRẦN→vị trí `TEXT`, tra size = font-size 1:1 (bảng 1c). TRONG Ô→vị trí `DIV`, tra size = line-height (bảng 1c) |
| 3′ | NGOẠI LỆ: icon là **caret/chevron điều hướng** (trailing `>` affordance, không phải icon nội dung)? | size do PRIMITIVE sở hữu cố định — hiện thực đo được = `size-4` + `bold` muted (xem BẪY §4.2, mâu thuẫn với canon cũ) |
| 4 | Size vừa ra có **nhỏ hơn `size-5`**? | YES→`weight="bold"`. NO (size-5 trở lên)→`weight="regular"` |

Bước 1 = "có phải trang trí cạnh fact tĩnh" **không áp cho icon trong `Button`/`Link` tương tác**
(search, refresh, play, back…) — đó là icon CHỨC NĂNG, luôn giữ, đi thẳng sang câu 3.

### 2b. Nhánh phụ — icon có Ý NGHĨA TƯƠNG TÁC thì animation nào (chỉ khi hover/click được)

| Ngữ nghĩa icon | Animation |
|---|---|
| **ARROW** (CTA "Xem thêm →") | trượt theo hướng khi hover: `transition-[translate] group-hover:translate-x-1` |
| **CARET** điều hướng tĩnh (`>` trong list-row/pager) | ĐỨNG YÊN, không trượt |
| **CHEVRON** mở/đóng (accordion, dropdown) | xoay 180°: `transition-transform data-[open]:rotate-180` |
| **ROTATE/refresh/retry/sync** | quay khi bấm hoặc đang xử lý: `animate-spin` |

### 2c. Nhánh phụ — icon có Ý NGHĨA TRẠNG THÁI thì màu nào (khác icon trang trí ở 2a)

Dùng lại type `AlertStatus` (`"default"|"accent"|"success"|"warning"|"danger"`), KHÔNG tự chế
bảng màu hẹp hơn — kể cả khi ca đang sửa chỉ cần đúng 1-2 giá trị.

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Dùng bộ icon khác `@phosphor-icons/react` (kể cả `@gravity-ui/icons` còn trong `package.json`) | ⬜ **CHƯA — gate cần viết**: quét import icon lib ngoài whitelist, trừ `react-icons` brand-logo (`ProgrammingLanguageTabs`, khác hẳn ngữ nghĩa) |
| 1b | **Để trống slot `Indicator` của HeroUI** (`Accordion` · `Select` · `Checkbox` · `Chip`/`Alert` close) và để vendor tự vẽ glyph — đó là bộ icon thứ hai lọt vào bằng cửa sau, không `import` nào để grep (§1a.1) | ⬜ **CHƯA — gate viết được**: quét JSX tìm `<*.Indicator />` tự đóng, whitelist `Radio.Indicator` vì nó không vẽ icon |
| 1c | Override `Checkbox.Indicator` bằng node thay vì bằng hàm ⇒ indeterminate hiện dấu check (bẫy §4.7) | ⬜ **CHƯA — gate viết được**: `Checkbox.Indicator` có children mà children KHÔNG phải arrow function |
| 2 | Weight ngoài 2 nấc `regular`/`bold` (`thin`/`light`/`duotone`) | ⬜ **CHƯA — gate cần viết**: quét giá trị literal truyền vào `weight=` |
| 3 | Size icon ngoài 5 giá trị thang (`size-4.5`, `size-7`…) | ⬜ **CHƯA — gate cần viết**, cùng dạng `check-seams.mjs` nhưng cho class icon |
| 4 | Bảng `Record<Size, Weight>` gán CÙNG một giá trị cho mọi key (bẫy `StepBadge`) | ⬜ **CHƯA — gate cần viết**: quét object literal 2 key trở lên có type `Weight`/`IconWeight`, báo đỏ nếu mọi value giống nhau |
| 5 | Khai prop icon bằng type cụ thể của 1 lib (`PhosphorIcon`, `IconType`…) | ⬜ **CHƯA — gate cần viết**: quét import type từ `@phosphor-icons/react` dùng làm kiểu prop |
| 6 | Tra bảng size mà chưa xác định TRẦN hay TRONG Ô (bẫy `ContentModeNav`) | ⛔ không gate được — đòi hỏi biết NGỮ CẢNH render, không suy được từ text tĩnh — kỷ luật |
| 7 | Giữ icon trang trí không phải ký hiệu "quốc dân" cạnh fact đã đủ nghĩa bằng chữ | ⛔ không gate được — đòi hỏi phán đoán ngữ nghĩa "ai cũng hiểu ngay hay cần liên tưởng" — kỷ luật |
| 8 | Icon cùng hàng khác KHUÔN hình học (tam giác trần cạnh vòng tròn) | ⛔ không gate được — đòi hỏi so hình học giữa các icon, không phải so text — kỷ luật |

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
---

## 3. VÉT CẠN CA DỄ LẪN

Bốn thang con ⇒ bốn phép đếm riêng, không gộp thành một con số giả.

### 3.0. Cặp VỊ TRÍ — `C(2,2) = 1` cặp

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| `TEXT` ↔ `DIV` | Icon có Ô/control BỌC RIÊNG với padding/line-height của chính nó không? Có ⇒ `DIV`, tra theo line-height. Không, icon TRẦN cạnh chữ chạy ⇒ `TEXT`, tra theo font-size. | ✅ 1 lần — `ContentModeNav` (đã sửa `size-4`→`size-5`) |

### 3.1. Cặp SIZE — 5 giá trị ⇒ `C(5,2) = 10` cặp

**3.1a. Bốn cặp KỀ NHAU:**

| Cặp | Phép phân định |
|---|---|
| `size-3` ↔ `size-3.5` | `text-xs` hay `text-sm` đang bao icon (vị trí `TEXT`)? Tra thẳng cột font-size bảng 1c, không đoán. |
| `size-3.5` ↔ `size-4` | Cùng câu hỏi trên, `text-sm` hay `text-base`? Đây cũng là cặp `TEXT`↔`DIV` chéo (`text-xs` DIV = `size-4`) — phải biết vị trí trước khi tra. |
| `size-4` ↔ `size-5` | Đây CHÍNH là cặp `ContentModeNav` từng sai: icon trong Ô `text-sm` phải `size-5` (line-height), không phải `size-4` (font-size của `text-xs`). Hỏi: icon có Ô bọc không — có thì line-height thắng. |
| `size-5` ↔ `size-6` | `text-sm` hay `text-base` đang bao icon vị trí `DIV`? Tra cột line-height bảng 1c. |

**3.1b. Sáu cặp còn lại của `C(5,2)`:** Các cặp cách từ 2 bậc trở lên: phân vân ở đó là dấu hiệu cây vẽ sai, không phải chọn sai giá trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

### 3.2. Cặp WEIGHT — `C(2,2) = 1` cặp

| Cặp | Phép phân định |
|---|---|
| `regular` ↔ `bold` | Size vừa chọn có `< size-5` không? Có ⇒ `bold`. `size-5` trở lên ⇒ `regular`. KHÔNG chọn theo gu — bảng SIZE→WEIGHT phải khác nhau theo TỪNG size, ép cứng một weight cho mọi size trong cùng 1 component là bẫy (xem §4.4). |

### 3.3. Tổ hợp SIZE×WEIGHT — 5×2 = 10 ô, vét cạn theo lưới đầy đủ

| | `regular` | `bold` |
|---|---|---|
| `size-3` | ❌ nét quá mảnh | ✅ đúng |
| `size-3.5` | ❌ nét quá mảnh | ✅ đúng |
| `size-4` | ❌ nét quá mảnh | ✅ đúng |
| `size-5` | ✅ đúng (chuẩn) | ❌ nét quá nặng, lệch nhịp hàng |
| `size-6` | ✅ đúng | ❌ nét quá nặng |

Tiêu chí dừng: mọi ô của lưới 5×2 đã có phán quyết, không còn ô nào bỏ ngỏ.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn số, mà vì đọc sai ngữ cảnh

1. **Tra bảng size TRƯỚC khi biết vị trí.** `ContentModeNav.tsx` lấy `size-4` cho icon trong
   `Tabs.Tab` (`text-sm`) — đúng công thức icon=TEXT của `text-xs`, sai vì icon đó là icon=DIV.
   Đã sửa `size-5` (xem `example.html` §2). Luôn trả lời "TRẦN hay TRONG Ô" trước khi mở bảng 1c.

2. **✅ ĐÃ CHỐT 2026-07-29: caret KHÔNG có cỡ cố định — nó bằng cỡ chữ nó đứng cạnh.**
   Thầy: *"caret thì trùng size text"*.

   Lỗi của canon cũ không nằm ở con số `size-3`, mà ở chỗ **biến nó thành HẰNG SỐ**. Caret đi
   qua đúng bảng §1c như mọi icon khác: hỏi vị trí (`TEXT` hay `DIV`) trước, rồi tra cỡ chữ.
   Ba ngữ cảnh cho ba đáp án, và đó là lý do một hằng số không bao giờ đúng hết.

   Đo lại cùng ngày, sau khi tách theo VỊ TRÍ thay vì gộp thành một con số:

   | Chỗ | Vị trí | Cạnh gì | Đang là | Theo bảng §1c |
   |---|---|---|---|---|
   | `Disclosure.tsx` caret cạnh nhãn | `TEXT` | `text-sm` | `size-4` | **`size-3.5`** |
   | `Select.tsx` trong `HeroSelect.Indicator` | `DIV` | control | `size-4` | tra hàng `DIV`, không phải hàng `TEXT` |
   | `ArchitectureFlow` dấu nối giữa 2 node | không phải caret điều hướng | sơ đồ | `size-3` | ngoài trục này |

   Bài học đắt hơn con số: **"5/5 call-site đều `size-4`" là phép đếm ĐÚNG nhưng đọc SAI** —
   năm chỗ đó không cùng một loại, nên sự đồng nhất của chúng không chứng minh được điều gì.
   Đếm mà không tách theo trục quyết định thì con số càng lớn càng dễ dẫn tới kết luận sai.

   ⬜ Việc còn lại: sửa các call-site vị trí `TEXT` từ `size-4` về `size-3.5`. Chưa làm vì
   `.storybook` đang có phiên khác ghi (2026-07-29 19:33) — không sửa chồng.

3. **Weight ép cứng một giá trị cho mọi size trong cùng bảng.** `StepBadge.tsx` từng để
   `weight="bold"` cố định cho cả `sm` (`size-4`) lẫn `md` (`size-5`) — `md` vì thế đậm hơn mọi
   glyph `size-5` khác trong hệ. Đây là ca NGƯỢC với lỗi hay gặp (quên bold ở cỡ nhỏ), nên quét
   theo hướng "thiếu bold" không bao giờ bắt được nó — phải quét bảng SIZE→WEIGHT có đủ 2 giá
   trị khác nhau theo từng key.

4. **Icon cùng một hàng khác KHUÔN hình học**, không chỉ khác size/weight. `KeepGoingPath` từng
   để `PlayIcon` (tam giác trần) cạnh `CheckCircleIcon`/`CircleIcon` (hai icon tròn) → gãy nhịp
   hàng dù size/weight đều đúng. Sửa `PlayCircleIcon` (play trong vòng tròn, cùng khuôn hai anh
   em). Bẫy này không nằm trong bảng số nào — phải NHÌN cả hàng, không chỉ đọc từng ô.

5. **Áp nhầm gate "quốc dân" cho icon chức năng.** Gate §2a câu 1-2 chỉ áp icon trang trí cạnh
   fact TĨNH; icon trong nút bấm/liên kết tương tác (search, refresh, play) luôn giữ vì nó là
   affordance, không phải minh hoạ — nhầm lẫn ở đây làm mất icon chức năng thật cần thiết.

6. **Khai prop icon bằng type cụ thể của một lib** (`icon?: PhosphorIcon`) thay vì
   `ComponentType<SVGProps<SVGSVGElement> & { weight?: IconWeight }>` — khoá cả cây phụ thuộc
   vào một nhà cung cấp, đổi lib sau này phải sửa mọi chữ ký. Neo: `AsyncContent` từng dính.

7. **Override `Checkbox.Indicator` bằng MỘT node thay vì bằng HÀM.** Đọc source vendor:
   `typeof children === "function" ? children(state) : children`, với `state` mang `isSelected`
   và `isIndeterminate`, và khi bỏ trống nó vẽ **hai svg khác nhau** cho hai trạng thái đó.
   Truyền thẳng `<CheckIcon />` thì **trạng thái indeterminate cũng hiện dấu check** — sai
   trạng thái, và sai một cách im lặng: không lỗi biên dịch, không lỗi lint, và ảnh chụp
   trạng thái mặc định trông hoàn toàn bình thường.

   ```tsx
   <HeroCheckbox.Indicator>
       {({ isIndeterminate }) => isIndeterminate ? <MinusIcon weight="bold" /> : <CheckIcon weight="bold" />}
   </HeroCheckbox.Indicator>
   ```

8. **Override `Radio.Indicator`.** Nó KHÔNG vẽ icon — chỉ là `<span>` bọc `children`, cái chấm
   tròn do CSS của slot vẽ. Đây là bẫy ngược với bẫy 7: chỗ cần override thì bỏ qua, chỗ không
   phải icon thì lại nhét icon vào. Phép phân định: **vendor có tự vẽ glyph khi slot trống
   không** — có thì đó là bộ icon thứ hai, phải override; không thì đó là hình học, để yên.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **Số đo Tailwind thật** (`tailwindcss/theme.css` font-size + line-height) cho bảng SIZE — đây
   là nguồn khách quan nhất, không phải quy ước nội bộ.
2. **Primitive đang sở hữu icon đó** (vd `SurfaceCard.trailingIcon`, `Typography.ICON_CLS`) — ĐO
   giá trị thật nó đang ép, kể cả khi khác với canon prose (xem BẪY §4.2).
3. Cây quyết định §2 — chỉ dùng khi (2) không tồn tại (component mới, chưa có primitive sở hữu).

Neo cụ thể từng nhánh: [`example.html`](example.html).
