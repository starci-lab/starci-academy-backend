# INSET — khoảng từ viền vào trong (`padding`)

> Trục này trả lời đúng một câu: **padding bên trong một khung/bề mặt là bao nhiêu.**
> Không trả lời khoảng cách GIỮA hai thứ (xem `seam/`), không trả lời margin (margin bị CẤM,
> xem `seam/context.md` §6). Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
---

## 1. THANG — năm bậc (2026-07-29: thêm `snug`), không có bậc thứ sáu

| Bậc | Class | px | Dùng cho |
|---|---|---|---|
| `flush` | `p-0` | 0 | nội dung CHẠM VIỀN: ảnh cover tràn mép, bảng cuộn ngang |
| `snug` | `p-2` | 8 | chrome nhỏ gọn: 1 mục sidebar thu gọn, nút icon nhỏ, 1 chip |
| `cozy` | `p-3` | 12 | mặt TRONG của một card — luật nhà (house rule) |
| `roomy` | `p-6` | 24 | bề rộng đo trang (measure) hoặc một container |
| `airy` | `p-8` | 32 | hero hoặc empty-state muốn "thở" |

SSOT của thang: `InsetScale` trong `.storybook/components/frames/_spacing.ts`. Bảng
`PADDING_CLASS: Record<InsetScale, string>` cùng file.

**Vì sao thêm `snug` (2026-07-29, xem JSDoc `_spacing.ts`)**: đếm lần đầu chỉ nhìn PROP
`padding` (46 call-site, đúng `0·3·6·8`) nên thang chốt 4 bậc, BỎ SÓT 34 call-site viết tay
CLASS `p-2` — toàn bộ đều là chrome nhỏ gọn, và gate lúc đó (§4.4) kiểm nhầm thang 6 bậc của
`SeamScale` nên im lặng; sửa gate về đúng `InsetScale` thì 34 chỗ đỏ đồng loạt: thang thiếu 1
bậc, không phải 34 chỗ sai. Bài học: đếm chỉ phủ MỘT cách viết (prop) mà bỏ cách viết kia
(class) sẽ báo thiếu; một gate kiểm tra SAI thang còn tệ hơn không có gate, vì im lặng đọc như
đồng ý.

Viết số trực tiếp (`padding={3}`) là **lỗi biên dịch** ở bất cứ khung nào gõ prop
`padding?: InsetScale` (`Container`, `Stack`/`Flex`, `SurfaceCard`, `DoubleTabsCard`) — nhưng
khác với `gap`, không phải MỌI `p-*` trong cây đều đi qua một prop kiểu union: xem §4.4 và §6.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Nội dung tự vẽ mép của chính nó và cần CHẠM SÁT viền ngoài (ảnh cover, media, bảng cuộn ngang)? | `flush` |
| 2 | Đây có phải MẶT TRONG của một card/tile ĐÃ CÓ biên nhìn thấy ngay (thường đi kèm `SurfaceCard`, đây là "luật nhà" mặc định của card)? | `cozy` |
| 3 | Đây là BỀ RỘNG ĐỌC/khung đo của một measure hay `Container` — bao NHIỀU nội dung con khác, không phải bản thân một card? | `roomy` |
| 4 | Đây là khu vực cố ý nhấn KHÔNG GIAN — hero bán hàng, trạng thái trống/khoá muốn "thở"? | `airy` |

**Trước khi tin kết quả cây: nếu component có `src` thật, ĐO nguồn đó.** Cây chỉ là đường lui
khi không có nguồn. Xem §5.

Phân biệt nhanh câu 2 với câu 3: `cozy` là bậc mặc định của **chính một card** (`SurfaceCard`
mặc định `padding="cozy"`); `roomy` là bậc mặc định của **khung đo/measure bao ngoài** nhiều
card (`Container` mặc định `padding="roomy"`). Một màn hình điển hình lồng cả hai: `Container
size="md" padding="roomy"` (khung trang) bọc nhiều `SurfaceCard padding="cozy"` (từng card) —
hai bậc khác nhau ở hai tầng khác nhau, không phải chọn 1 trong 2 cho toàn màn.

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết SỐ ngoài thang cho `p-*`/`p[trblxy]-*` (`p-4`, `p-5`, `p-1.5`…) ở tầng `frame`/`composite`/`viewer`/`block`/`layout`/`overlay`/`page`, KHÔNG khai `// inset-exception: <lý do>` | ✅ `check-padding.mjs` — sửa 2026-07-29, `SCALE` giờ đúng 5 giá trị `InsetScale` (§4.4 cũ SUPERSEDED); có khai exception hợp lệ thì HIỆN nhưng không đánh trượt (§4.5) |
| 2 | Con mang `margin` để tự đẩy khoảng thay vì nhận `padding` từ container (trừ whitelist `mt-auto`/`ms-auto`/bleed `-m-*`) | ✅ `check-padding.mjs` (rule `child-margin`) |
| 3 | Mở `@container` và có `padding` trên CÙNG một element (§4.2) | ⛔ không gate được — chỉ lộ khi đo DOM ở đúng viewport cap; kỷ luật: tách 2 lớp mỗi khi một khung tự mở `@container` |
| 4 | Viết `p-*` thô ở tầng `composite`/`block`/`layout`/`overlay`/`page` thay vì dùng prop `padding` của khung (`Container`/`Stack`/`Flex`/`SurfaceCard`) dù giá trị đúng thang | ⬜ **CHƯA — gate cần viết**: quét mọi `className` chứa `p[trblxy]?-(0\|2\|3\|6\|8)` ở tầng `GUARDED` mà KHÔNG đi qua object `PADDING_CLASS`/prop `padding` đã biết — hiện `check-padding.mjs` chỉ chặn SAI THANG, không chặn ĐÚNG THANG NHƯNG hand-roll |
| 5 | Làm tròn padding bất đối xứng của `src` thật về một bậc `InsetScale` đối xứng mà KHÔNG ghi chú lệch tại chỗ port (§4.3) | ⛔ không gate được — kỷ luật, ví dụ đã làm đúng: comment tại chỗ trong `EnrollGate.tsx` |
| 6 | Khai `// inset-exception:` mà không nêu LÝ DO, hoặc khai cho một chỗ KHÔNG PHẢI vendor-geometry/optical-nudge (§4.5) | ✅ `check-padding.mjs` bắt thiếu lý do bằng regex `/inset-exception:\s*\S/` (không có `\S` sau dấu `:` thì không khớp, vẫn tính là finding thường); đúng loại thì kỷ luật đọc — không có gate phân biệt "lý do hợp lý" |
| 7 | Áp `InsetScale` xuống tầng `atom` (đè lên hình học nội bộ atom tự sở hữu, vd `pr-9` của `Input`) | ⛔ không cần gate — atom được miễn có chủ đích (13z), xem §4.8 |

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
---

## 3. VÉT CẠN CA DỄ LẪN — đủ 6 cặp

Thang 4 bậc ⇒ `C(4,2) = 6` cặp. Liệt kê đủ 6, không chọn lọc.

### 3a. Ba cặp KỀ NHAU — trận đánh chính

| Cặp | Phép phân định DỨT KHOÁT |
|---|---|
| **`flush` ↔ `cozy`** | Nội dung có **tự vẽ nền/viền của chính nó** đến sát mép (ảnh, media, bảng) không? Có ⇒ `flush` (padding sẽ đè lên chính hình ảnh, sai). Nội dung là chữ/control thường (label, nút, form field) cần khoảng thở tối thiểu để không dính viền ⇒ `cozy`. |
| **`cozy` ↔ `roomy`** | Đây là **mặt của ĐÚNG MỘT card/tile** (biên card chính là biên padding) hay là **measure/container bao NHIỀU thứ con** (trong đó có thể có nhiều card khác)? Một card ⇒ `cozy`. Khung đo bao ngoài ⇒ `roomy`. |
| **`roomy` ↔ `airy`** | Đây là nội dung/trang **BÌNH THƯỜNG** hay một khu vực **cố ý nhấn không gian** để tạo cảm giác trống/sang trọng (hero bán hàng, empty-state, trạng thái khoá)? Bình thường ⇒ `roomy`. Cố ý nhấn ⇒ `airy`. |

### 3b. Các cặp còn lại — `flush` ↔ `roomy`, `cozy` ↔ `airy`, `flush` ↔ `airy`

Các cặp cách từ 2 bậc trở lên: phân vân ở đó là dấu hiệu cây vẽ sai, không phải chọn sai giá
trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn giá trị, mà vì đọc sai cấu trúc

1. **Nhầm INSET với SEAM vì cùng chữ, khác câu hỏi.** `gap="related"` và `padding="cozy"` đều
   là "một chữ trong `_spacing.ts`" nhưng trả lời hai câu khác nhau: seam hỏi hai thứ CÁCH NHAU
   bao nhiêu, inset hỏi một bề mặt HỞ ra bao nhiêu từ viền. Bẫy cụ thể đã cắn thật (đọc
   `Container.tsx` dòng lịch sử "2026-07-27"): `Container` ngày trước có slot `header`/
   `footer`/`gap` — `CourseContents` viết `gap="page"` **tưởng đó là padding của khung đo**,
   đo ra **0px** vì `Container` chỉ áp `gap` khi dùng slot, còn `children` thẳng thì không đi
   qua nhánh đó. Sửa: bỏ hẳn `gap`/slot khỏi `Container`, chỉ giữ đúng MỘT trách nhiệm —
   `padding`; nhịp giữa các con chuyển hẳn cho `Container > StackV` (seam là việc của `Stack`,
   không phải của khung đo).

2. **`@container` và `padding` không được đứng chung MỘT element.** Neo thật: `Container.tsx`
   — mở `@container` trên div có `p-*` khiến container-query đo theo content-box **đã trừ
   padding của chính nó**, nên `size="xl"` (cap đúng bằng `max-w-app-xl`) không bao giờ đủ rộng
   để chạm chính ngưỡng `@app-xl` — bug này **im lặng**, không tsc, không lint, chỉ lộ ra khi đo
   DOM ở viewport 1920px (`SplitWorkspace` kẹt `flex-col`). Đã fix bằng tách 2 lớp: lớp NGOÀI
   giữ `@container`+`max-w` (không padding), lớp TRONG giữ `padding`. Luật chung: bất cứ khung
   nào tự mở `@container` VÀ tự có `padding` phải tách 2 element.

3. **`InsetScale` chỉ biểu diễn padding ĐỀU BỐN CẠNH — không biểu diễn được bất đối xứng.**
   Hai neo thật cùng loại: `CollapsibleSidebar` (`px-3 py-6` ở rail thu gọn khác `p-6` ở panel
   mở — comment tại chỗ ghi rõ "`Stack`/`Flex` padding is a single uniform `InsetScale` step",
   nên khung này KHÔNG dùng `Container`/`Stack` cho phần chrome, tự viết class tay); `EnrollGate`
   (`src` thật `px-4 pb-6` bất đối xứng, port về `padding="roomy"` đối xứng — comment ghi thẳng
   "the ONE deviation from a byte-for-byte port, since the scale is symmetric and has no
   asymmetric step"). Bài học: khi `src` thật có padding lệch trục ngang/dọc, PHẢI chọn giữa
   (a) port xấp xỉ có Ý THỨC và ghi chú lệch ngay tại chỗ, hoặc (b) rơi khỏi khung, viết class
   tay — không được làm tròn rồi im lặng, người đọc sau sẽ tưởng đó là neo chính xác.

4. **⛔ SUPERSEDED (2026-07-29).** Bản trước của mục này ghi gate dùng nhầm thang 6 bậc của
   `SeamScale`. Đã sửa cùng ngày thêm bậc `snug` (§1): `SCALE` trong `check-padding.mjs` giờ
   đúng 5 giá trị `InsetScale` (`0·2·3·6·8`), không còn lẫn `1` của `SeamScale`. Giữ đoạn này
   làm lịch sử (đúng khuôn codebase: quyết định bị đảo không xoá, đánh dấu SUPERSEDED) — xem
   §6 dòng 1 đã cập nhật theo trạng thái mới.

5. **Ngoại lệ ĐƯỢC KHAI, không phải lách gate (2026-07-29, `check-padding.mjs`
   `EXCEPTION`/`inset-exception:`).** `InsetScale` chỉ mô hình MỘT hình: khoảng đều bốn cạnh
   của một BỀ MẶT. Hai hình thật nằm ngoài đó, đo được sau khi `snug` ra đời (§1) — chỉ còn
   đúng hai loại call-site off-scale hợp lệ:
   1. **Hình học VENDOR** — 1 pill, 1 `<code>` inline, thân popover. `chip.css` của HeroUI tự
      ban `px-2 py-1` — hình ngang-rộng-hơn-dọc thuộc về vendor, thang nhà cố ý không mô hình.
   2. **NUDGE THỊ GIÁC** — `pt-1`/`pb-1` một trục, canh chữ với 1 chấm/đường nối, cục bộ,
      không phải inset của một bề mặt.

   Khai bằng comment `// inset-exception: <lý do>` (hoặc `{/* ... */}` nếu ở vị trí JSX children
   thật — KHÔNG dùng `{/* */}` bên trong ngoặc JS thường như nhánh `? :`, đó là lỗi cú pháp, xem
   bẫy #6 dưới) ngay dòng chứa class hoặc dòng NGAY TRÊN. Lý do là BẮT BUỘC — 1 ngoại lệ không lý
   do là ngoại lệ câm, đúng thứ gate này sinh ra để chặn. Gate hiện `exempt` (không đánh trượt)
   nhưng vẫn IN RA — không biến mất khỏi report.

6. **Bẫy cú pháp khi khai exception TRONG một nhánh JS thường (`cond ? A : (...)`).** `{/* c */}`
   chỉ hợp lệ trong CHILDREN CONTEXT của JSX (giữa `>` và `<` của thẻ cha) — bên trong dấu ngoặc
   nhóm biểu thức JS thường (như 1 nhánh ternary) nó bị parse thành object rỗng `{}` rồi đứng
   cạnh phần tử JSX kế tiếp không toán tử nối = lỗi cú pháp thật (`TS1005`/`TS1382`...). Bắt
   được 2026-07-29 ở `Stepper.tsx`/`map.tsx` khi 1 phiên khác đang gõ dở đúng exception này. Sửa:
   dùng comment dòng thường `// ...` (không bọc `{}`) — comment dòng thường hợp lệ ở BẤT KỲ vị
   trí nào giữa các token JS/TS, kể cả trong ngoặc nhóm.

8. **Atom được MIỄN — dễ nhầm áp `InsetScale` xuống tận atom.** `check-padding.mjs` chỉ quét
   từ tầng `frame` trở lên (`GUARDED = {frame, composite, viewer, block, layout, overlay,
   page}` — tên tầng đọc từ folder thật trên đĩa, không còn `design`/`screen`, hai tên đó đã
   chết từ đợt dọn `tierOf()` cùng lý do ở `check-seams.mjs`); `atom`/`util` bị loại có chủ đích
   (13z: atom tự lo hình học bên trong của chính nó). Neo: `Input.tsx`, `Select.tsx` viết `pr-9`
   thẳng để chừa chỗ nút mắt/icon — đây là gate ĐANG ĐÚNG, không phải một vi phạm chưa bắt được.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của CHÍNH component đang sửa** (khai trong file header "ported from…") — ĐO nó.
   Chú ý §4.3: nếu `src` có padding bất đối xứng, `InsetScale` không tải được 1-1, phải đọc
   comment tại chỗ xem đã ghi nhận lệch hay chưa trước khi tin số port.
2. `_spacing.ts` JSDoc (bảng 46 call-site + bảng "word → class → what it is for") và default
   của từng khung thật (`Container` mặc định `roomy`, `SurfaceCard` mặc định `cozy`) — dùng khi
   (1) không tồn tại.
3. Cây quyết định §2 — chỉ dùng khi cả (1) và (2) đều không có (component hoàn toàn mới,
   chưa từng có trong `src`).

Neo cụ thể từng nhánh: [`example.html`](example.html).
