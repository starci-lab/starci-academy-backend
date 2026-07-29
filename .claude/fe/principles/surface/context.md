# SURFACE — bo góc · viền · bóng · nền (`variant` / `radius`)

> Trục này trả lời đúng một câu: **bo góc bao nhiêu, có viền không, có bóng không, nền màu gì.**
> Không trả lời khoảng cách (xem `seam/`), không trả lời padding (xem `inset/` — nhưng công thức
> đồng tâm ở §1 dùng padding làm biến số nên hai trục giao nhau ở đúng một điểm, xem §4.5).
> Neo code thật: [`example.html`](example.html).

---

## 1. THANG

### 1a. Thang THẬT đã tokenized — `SurfaceCardVariant`, 2 giá trị
SSOT: `export type SurfaceCardVariant = "surface" | "nested"` —
`surface-card-header.tsx:123`, hàm dựng class `surfaceFrame()` cùng file dòng 135-136.

| Giá trị | Class | Ý nghĩa |
|---|---|---|
| `surface` (mặc định) | `rounded-3xl bg-surface shadow-surface` | mặt **NGOÀI CÙNG**, nổi khỏi nền trang bằng BÓNG |
| `nested` | `rounded-3xl border border-default` (+ `bg-surface` qua `surfaceFrame()`, riêng `Nested` tự vẽ lại thành `bg-transparent` — xem §4.4) | mặt **LỒNG** trong một mặt khác, viền THAY bóng vì bóng biến mất ở dark mode |

### 1b. Phụ — `radius: "xl" | "3xl"`, chỉ tồn tại trên `.Nested`
`SurfaceCardNestedProps.radius` (`SurfaceCard.tsx:544`) — mặc định `"3xl"` (24px), `"xl"` (12px)
dùng cho ngữ cảnh chật (chat bubble). Cơ số thật: `--radius: 0.5rem` (8px) tại
`src/app/globals.css:215`, `rounded-3xl = 3×radius = 24px`, `rounded-xl = 1.5×radius = 12px`,
`rounded-2xl = 2×radius = 16px` (đọc lại tại đúng file, không phải số Tailwind mặc định gõ tay).

### 1c. ⚠️ NỢ — phần còn lại KHÔNG có union type, chỉ là class rời từng file
Grep tần suất toàn `.storybook/components` (`rounded-*`: 120 `rounded-full` · 46 `rounded-2xl` ·
44 `rounded-3xl` · 34 `rounded-xl`; `shadow-*`: 29 `shadow-surface` · 6 `shadow-field` · 6
`shadow-none` · 5 `shadow-lg` · 4 `shadow-sm`) — các giá trị này lặp đi lặp lại theo VAI TRÒ
rõ ràng (media→2xl, field→xl, pill→full, tile-restyle→`shadow-field`) nhưng **KHÔNG có
`SurfaceRadiusRole`/`SurfaceShadowRole` nào gom chúng thành union** như `SurfaceCardVariant` đã
làm. `shadow-lg`/`shadow-sm` là Tailwind thô, rơi ngoài từ vựng thiết kế (khả năng là DRIFT).
**Đề xuất (CHỜ THẦY CHỐT):** tokenize `SurfaceRadiusRole = "frame" | "media" | "field" | "pill"`
map cứng `{3xl, 2xl, xl, full}`, và xoá `shadow-lg`/`shadow-sm` khỏi vùng surface. Đưa vào
`choThayChot`.

---

## 2. CÂY QUYẾT ĐỊNH

| # | Hỏi | Ra |
|---|---|---|
| 1 | Mặt này có một mặt cha (`bg-surface`/`bg-surface-secondary`/modal/drawer/page-card) bọc **NGAY TRỰC TIẾP** quanh nó không? | KHÔNG ⇒ mặt NGOÀI CÙNG ⇒ `variant="surface"` (mặc định). CÓ ⇒ sang #2 |
| 2 | Phần lồng có chiếm gần **TRỌN THÂN** mặt cha không (phép thử TỈ LỆ, không phải phép thử nơi-chốn)? | Gần trọn ⇒ khung lồng là THỪA — bỏ khung, để nó là mặt DUY NHẤT (cha hoá `frameless`). Chỉ một phần nhỏ ⇒ `variant="nested"` |
| 3 | Đây là RENDER MỘT KHUNG mặt, hay đang tô một PHẦN TỬ bên trong (ảnh bìa / field / chip)? | Khung mặt ⇒ dừng ở #1-#2. Phần tử ⇒ sang #4 |
| 4 | Phần tử là media (cover/thumbnail) hay field (input/select/button) hay pill (chip/avatar/switch) hay ROW (hàng trong danh sách đã có khung cha)? | media ⇒ `rounded-2xl` cố định · field ⇒ `rounded-xl`/`rounded-field` · pill ⇒ `rounded-full` · ROW ⇒ **KHÔNG bo/viền/bóng riêng** (§7b, đọc từ khung cha) |
| 5 | Đang thêm `ring`/`outline` chọn (`isSelected`/`isFocusVisible`) lên một mặt vốn đã `shadow-surface`? | CÓ ⇒ bắt buộc tắt bóng cùng lúc (`!shadow-none`) — hai lớp box-shadow không cộng dồn được, xem §4.3 |

**Trước khi tin cây: nếu component có `src` thật, ĐO nguồn đó.** Cây chỉ là đường lui.

---

## 3. VÉT CẠN CA DỄ LẪN — 4 hình dạng mặt THẬT, `C(4,2) = 6` cặp

Chỉ `surface`/`nested` là giá trị của MỘT prop chung (§1a). Nhưng "bo góc/viền/bóng/nền" của
cả cụm `SurfaceCard.*` thật ra có **4 hình dạng mặt** phân biệt được bằng mắt và bằng code — hai
cái còn lại không đi qua prop `variant` mà là quy ước riêng của thành phần khác. Xếp theo TRỌNG
LƯỢNG mặt tăng dần (không chrome → chỉ viền đứt → viền liền → viền/bóng đầy đủ) cho ra một thang
có thứ tự, nên áp dụng được đúng cách đếm `C(N,2)` như trục `seam`. Đã grep hết
`rounded-|shadow-|border` trong `SurfaceCard.tsx` — không tìm thấy hình dạng thứ 5.

| Bậc | Hình dạng | Neo |
|---|---|---|
| 1 | `bare` (ROW) | không viền, không bóng, không bo riêng — mượn khung cha (§7b) |
| 2 | `placeholder` | chỉ viền ĐỨT NÉT (`border-2 border-dashed`), không nền, không bóng |
| 3 | `nested` | viền LIỀN NÉT, không bóng |
| 4 | `surface` | bóng (`shadow-surface`) + nền riêng, không viền |

### 3a. Ba cặp KỀ NHAU

| Cặp | Phép phân định DỨT KHOÁT |
|---|---|
| `bare` ↔ `placeholder` | Đây là **HÀNG DỮ LIỆU THẬT** trong danh sách, hay một **Ô TRỐNG mời thêm mới**? Dữ liệu thật ⇒ `bare`. Ô trống, chờ bấm ⇒ `placeholder` |
| `placeholder` ↔ `nested` | Viền này có kèm **NỘI DUNG THẬT** bên trong không, hay chỉ báo "chỗ này trống, bấm để thêm"? Có nội dung thật, đang lồng trong một mặt cha ⇒ `nested`. Trống, tĩnh, chờ hành động ⇒ `placeholder` |
| `nested` ↔ `surface` | Cây §2 câu 1: có mặt cha bọc NGAY TRỰC TIẾP không? CÓ ⇒ `nested`. KHÔNG (đây là mặt ngoài cùng) ⇒ `surface` |

### 3b. Hai cặp CÁCH MỘT BẬC

| Cặp | Đọc thế nào |
|---|---|
| `bare` ↔ `nested` | Phân vân ở đây nghĩa là chưa trả lời được "đây có phải MỘT KHUNG hoàn chỉnh tự đứng được không, hay chỉ là một dòng trong danh sách của khung khác". Một ROW không bao giờ tự đứng thành card — trả lời câu đó trước |
| `placeholder` ↔ `surface` | Phân vân nghĩa là đang nhầm "ô trống mời thêm" với "thẻ đã có dữ liệu thật". Kiểm: props truyền vào là `icon`+`label` tĩnh của `Placeholder`, hay là nội dung/data thật của một card? |

### 3c. Một cặp CÁCH XA — cố ý không có phép thử

`bare` ↔ `surface`: một cái là ROW mượn khung của khung khác, một cái CHÍNH LÀ khung. Phân vân ở
đây là dấu hiệu đọc sai CẤP cha-con (đang so một PHẦN với CÁI CHỨA nó), không phải chọn sai giá
trị. Dừng, vẽ lại cây cha-con trước khi chọn tiếp.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn giá trị, mà vì đọc sai cấu trúc

1. **`className` rơi vào sai wrapper ⇒ "card ma" thứ hai lộ ra sau card thật (ĐÃ CẮN THẬT).**
   `.Base` có 2 prop tách tầng: `className` → luôn rơi vào `<section>` NGOÀI CÙNG (không nền);
   `contentClassName` → rơi vào khung thẻ THẬT (`rounded-3xl bg-surface shadow-surface`).
   `PressableGroup`'s tile builder từng truyền `TILE_CHROME` (`"rounded-2xl shadow-field"`) qua
   `className` (nhầm) — `box-shadow` không cần nền vẫn vẽ được nên `<section>` ngoài (bo 16px,
   bóng riêng) hiện ra như một card thứ hai nấp sau thẻ thật (bo 24px). Fix + quét lại 88 file
   gọi `SurfaceCard.*` không ra ca thứ hai. Bài học: đo `outerHTML`/`getComputedStyle`, không
   suy luận CSS lý thuyết.

2. **`variant="nested"` chọn cho một mặt thực ra là NGOÀI CÙNG — lặp lại 2 LẦN THẬT.**
   `ContentHeader` và `ContentRelatedList.tsx:131` đều từng đặt `variant="nested"` dù không có
   mặt cha nào bọc quanh. Lỗi không nằm ở "chọn nhầm giữa 2 giá trị" — nằm ở **đọc sai xem có
   mặt cha hay không** trước khi tới bước chọn giá trị (câu 1 của cây §2 chưa được hỏi thật).

3. **Ring chọn không tắt bóng đi kèm ⇒ hai lớp box-shadow không cộng dồn, một cái BIẾN MẤT.**
   `.shadow-surface` biên dịch thành `box-shadow: var(--shadow-surface)` — literal, KHÔNG đi qua
   chuỗi biến `--tw-shadow`/`--tw-ring-shadow` mà Tailwind dùng để cộng dồn ring+shadow. Hai
   utility cùng đặt `box-shadow` trên một phần tử thì một cái NUỐT cái kia theo thứ tự trong
   stylesheet, không theo thứ tự viết trong `className`. `.SelectableGroup` đã xử lý đúng
   (`!shadow-none` đi kèm `outline` chọn, `SurfaceCard.tsx:1136-1140`, có comment giải thích rõ
   lý do) nhưng `.Base`'s `isSelected && "ring-2 ring-accent"` (dòng 369/389/439) **không** kèm
   `!shadow-none` — nghi vấn cùng lỗi, CHƯA xác nhận bằng đo DOM, cần thầy chốt.

4. **⚠️ CHỜ THẦY CHỐT — `Nested` tự vẽ lại frame thay vì gọi `surfaceFrame()`, và LỆCH nền khi
   `nested`.** Helper dùng chung `surfaceFrame()` (`surface-card-header.tsx:135-136`) LUÔN giữ
   `bg-surface` bất kể `variant`, chỉ đổi viền/bóng. Nhưng `Nested` (`SurfaceCard.tsx:677`)
   không gọi helper này — tự viết `variant === "nested" ? "border border-default bg-transparent"
   : "bg-surface shadow-surface"`, tức khi `nested` thì BỎ LUÔN nền (`bg-transparent`) thay vì
   giữ `bg-surface`. Hai đường code cho "cùng một khái niệm nested" cho ra 2 kết quả nền khác
   nhau. Chưa rõ đây là chủ ý (để border "trong suốt" lộ màu mặt cha) hay là copy-paste lệch.

5. **⚠️ CHỜ THẦY CHỐT — công thức đồng tâm (`radius trong = radius ngoài − padding`) và luật
   §1b của canon [`principles/surface/context.md`](../surface/context.md) (chính trục này —
   nested surface GIỮ 3xl, chỉ media/field bước xuống) TRẢ LỜI HAI CÂU
   KHÁC NHAU nhưng dễ áp nhầm chỗ.** Số đo thật: `surface` mặc định `rounded-3xl` (24px) +
   padding `cozy` (`p-3` = 12px, `PADDING_CLASS.cozy`, `_spacing.ts:129`) ⇒ công thức cho
   `24 − 12 = 12px = rounded-xl` — KHỚP ĐÚNG với field/input thật (`Input.tsx:687`
   `rounded-xl`). Nhưng padding `flush` (`p-0`) ⇒ công thức cho `24 − 0 = 24px = rounded-3xl`,
   trong khi `CoverImage.tsx:49,56` LUÔN cố định `rounded-2xl` (16px) bất kể padding. Công thức
   đúng cho field, SAI (không khớp thực tế) cho media. Không được áp công thức đồng tâm cho
   KHUNG mặt lồng (đó là luật riêng biệt §1b: giữ 3xl) — công thức chỉ có bằng chứng khớp cho
   PHẦN TỬ field bên trong, chưa có bằng chứng khớp cho media.

---

## 5. NEO THẬT — thứ tự ưu tiên khi hai nguồn đá nhau

1. **`src` thật của chính component đang sửa** — vd `src/components/blocks/cards/SurfaceListCard/
   index.tsx:48-77` còn giữ tên prop cũ `bordered?: boolean` (trước khi `.storybook` đổi sang
   `variant`), nhưng CÙNG một logic border-xor-shadow. Đây là bằng chứng gốc của cả trục.
2. Canon [`principles/surface/context.md`](../surface/context.md) §1 (đã CHỐT 2026-07-26, trước
   đây `principles.md §1`) — nguồn tay của luật border/shadow + radius-giữ-3xl.
3. Memory đã chốt riêng (không nằm trong repo, ở user memory store): `concentric-radius-formula`
   (công thức toán, đính chính 2026-07-14) và `surface-in-surface-ratio-test` (phép thử TỈ LỆ,
   2026-07-16) — cả hai đã CHỐT nhưng CHƯA bake hết vào [`principles/INDEX.md`](../INDEX.md)
   (memory tự ghi "rule NÀY chưa bake vào canon").
4. Cây §2 — chỉ dùng khi (1) không tồn tại.

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết `rounded-*`/`shadow-*` ngoài từ vựng đã quan sát (vd `rounded-[10px]`, `shadow-[0_0_0_2px_red]`) | ⬜ **CHƯA** — không script nào trong `scripts/*.mjs` quét `rounded-`/`shadow-` (đã grep hết, 0 hit) |
| 2 | Một hộp vừa có `border` vừa có `shadow-surface` cùng lúc (double-fill §1a) | ⬜ **CHƯA** — gate cần viết: quét mọi `cn(...)` chứa cả `border` (không phải `border-none`) và `shadow-surface` |
| 3 | `variant="nested"` khi không có mặt cha bọc trực tiếp (đã cắn 2 lần thật, §4.2) | ⛔ **không gate được** — cần biết cây DOM cha thật, không regex hoá được — kỷ luật/soi mắt |
| 4 | Thêm ring/outline chọn mà không tắt bóng đi kèm (§4.3) | ⬜ **CHƯA** — gate cần viết: quét mọi `isSelected &&`/`isFocusVisible &&` cạnh `ring-`/`outline-` mà nhánh đó thiếu `shadow-none` |
| 5 | ROW (`NestedSection`, `SurfaceCardListItem`) tự thêm `rounded-*`/`border`/`shadow-*` riêng (vi phạm §7b ROW≠CARD) | ⬜ **CHƯA** |
| 6 | Truyền `className` restyle mặt thẻ vào wrapper ngoài thay vì `contentClassName` (§4.1) | ⬜ **CHƯA thường trực** — từng có script Node MỘT LẦN bắt bug này (`steps/13` §2p, quét 88 file gọi `SurfaceCard.*`), nhưng chưa đưa vào `scripts/*.mjs` sống |
