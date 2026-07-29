# SURFACE — bo góc · viền · bóng · nền (`variant` / `radius`)

> Trục này trả lời đúng một câu: **bo góc bao nhiêu, có viền không, có bóng không, nền màu gì.**
> Không trả lời khoảng cách (xem `seam/`), không trả lời padding (xem `inset/` — nhưng công thức
> đồng tâm ở §1 dùng padding làm biến số nên hai trục giao nhau ở đúng một điểm, xem §4.5).
> Neo code thật: [`example.html`](example.html).

---
# PHẦN A · NHẬN BIẾT — nạp phần này khi QUÉT
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

### 1c. ✅ ĐÃ CHỐT phần lớn 2026-07-29 — tokenize `SurfaceRadiusRole`, GIỮ `shadow-lg`, `shadow-sm` CHỜ (thu hẹp)
Grep tần suất toàn `.storybook/components` (`rounded-*`: 120 `rounded-full` · 46 `rounded-2xl` ·
44 `rounded-3xl` · 34 `rounded-xl`; `shadow-*`: 29 `shadow-surface` · 6 `shadow-field` · 6
`shadow-none` · 5 `shadow-lg` · 4 `shadow-sm`) — các giá trị này lặp đi lặp lại theo VAI TRÒ
rõ ràng (media→2xl, field→xl, pill→full, tile-restyle→`shadow-field`).

**Tokenize `SurfaceRadiusRole = "frame" | "media" | "field" | "pill"`: LÀM.** Luật đã trả lời —
áp đúng luật vừa dùng để chốt `InsetScale` thêm `snug` và `h6` KHÔNG thêm (cùng ngày 2026-07-29):
**một bậc/token chỉ sinh ra khi có người CHỌN nó vì nó KHÁC, không phải vì thư viện có sẵn.** Ba
vai trên không lẫn nhau (không chỗ nào media dùng `xl`, field dùng `2xl`) — 200 call-site chia
đúng 3 vai tách bạch là cùng loại bằng chứng với 34 call-site `p-2` từng đòi `snug` (khác biệt
thật), không phải như 8 chỗ `h6` (bị từ chối vì CÙNG vai `h5`, không phải bậc riêng).

**Xoá `shadow-lg` khỏi vùng surface: KHÔNG xoá — đây là VAI RIÊNG ("floating"), không phải
drift.** Đọc lại cả 3 chỗ sống (`FloatingActionButton.tsx:54`, `ContentAiSelectionAsk.tsx:91`,
`MindMapContinueButton.tsx:128,138`) — cả ba đều là mặt NỔI TRÊN nội dung khác (FAB cố định, chip
nổi, panel nổi trên canvas ReactFlow), không phải card nằm phẳng trên trang. Chính
`MindMapContinueButton.tsx:39-45` đã ghi rõ đây là JUDGEMENT CALL: *"the shadow is what tells the
eye this is on top of the canvas, not part of it"* — `shadow-lg` được CHỌN vì nó khác
`shadow-surface` (mặt phẳng), đúng điều kiện luật đòi hỏi để giữ một bậc riêng, không phải tiện
tay dùng số Tailwind có sẵn.

**`shadow-sm`: VẪN CHỜ, nhưng thu hẹp bằng đo lại.** Đếm `4` ở trên gộp cả code chết — 2/4 chỗ
(`_legacy/designs/rendering/RagSourceGraph/RagSourceGraph.tsx:70,93`) nằm trong `_legacy`, quy
ước đã dùng ở trục `press`/`reading-flow`: không tính là nguồn sống. Chỉ còn **2 chỗ sống thật**:
`QRCode.tsx:37` (viền quanh logo giữa mã QR, một biến thể pill nhỏ) và `FlowDiagram.tsx:55` (node
sơ đồ, đã có `border` cùng lúc — nghi double-fill giống Vạch cấm #2). Hai chỗ này KHÔNG rõ chung
một vai (badge nhỏ vs. node sơ đồ) và không có comment giải thích chủ ý như `shadow-lg` — chưa đủ
bằng chứng để tokenize thành role riêng, cũng chưa đủ để khẳng định là drift cần xoá. **Câu thật
cần mắt thầy:** (a) migrate 2 chỗ này về `shadow-field` (vai đã có, đơn giản từ vựng, nhưng
`field` vốn nghĩa input/button, dùng cho badge/diagram-node hơi lệch ngữ nghĩa) hay (b) giữ
nguyên, không tokenize (đúng ngữ cảnh hơn nhưng để 2 call-site trôi ngoài từ vựng)?

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

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết `rounded-*`/`shadow-*` ngoài từ vựng đã quan sát (vd `rounded-[10px]`, `shadow-[0_0_0_2px_red]`) | ⬜ **CHƯA** — không script nào trong `scripts/*.mjs` quét `rounded-`/`shadow-` (đã grep hết, 0 hit) |
| 2 | Một hộp vừa có `border` vừa có `shadow-surface` cùng lúc (double-fill §1a) | ⬜ **CHƯA** — gate cần viết: quét mọi `cn(...)` chứa cả `border` (không phải `border-none`) và `shadow-surface` |
| 3 | `variant="nested"` khi không có mặt cha bọc trực tiếp (đã cắn 2 lần thật, §4.2) | ⛔ **không gate được** — cần biết cây DOM cha thật, không regex hoá được — kỷ luật/soi mắt |
| 4 | Thêm ring/outline chọn mà không tắt bóng đi kèm (§4.3) | ⬜ **CHƯA** — gate cần viết: quét mọi `isSelected &&`/`isFocusVisible &&` cạnh `ring-`/`outline-` mà nhánh đó thiếu `shadow-none` |
| 5 | ROW (`NestedSection`, `SurfaceCardListItem`) tự thêm `rounded-*`/`border`/`shadow-*` riêng (vi phạm §7b ROW≠CARD) | ⬜ **CHƯA** |
| 6 | Truyền `className` restyle mặt thẻ vào wrapper ngoài thay vì `contentClassName` (§4.1) | ⬜ **CHƯA thường trực** — từng có script Node MỘT LẦN bắt bug này (`steps/13` §2p, quét 88 file gọi `SurfaceCard.*`), nhưng chưa đưa vào `scripts/*.mjs` sống |
| 7 | Áp công thức đồng tâm (`radius trong = ngoài − padding`, §4.5) cho KHUNG mặt lồng hoặc media thay vì chỉ PHẦN TỬ field | ⬜ **CHƯA** — chưa có gate phân biệt loại đối tượng trước khi áp công thức |

---
# PHẦN B · TRA KHI ĐÃ THẤY LỆCH — chỉ mở khi Phần A ra kết quả lệch
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

Các cặp cách từ 2 bậc trở lên: phân vân ở đó là dấu hiệu cây vẽ sai, không phải chọn sai giá trị (luật xuyên trục 3 ở INDEX.md). Quay lại §2.

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
   ✅ **ĐÃ XÁC NHẬN 2026-07-29 bằng đọc code trực tiếp — không còn là nghi vấn.**
   `.shadow-surface` biên dịch thành `box-shadow: var(--shadow-surface)` — literal, KHÔNG đi qua
   chuỗi biến `--tw-shadow`/`--tw-ring-shadow` mà Tailwind dùng để cộng dồn ring+shadow. Hai
   utility cùng đặt `box-shadow` trên một phần tử thì một cái NUỐT cái kia theo thứ tự trong
   stylesheet, không theo thứ tự viết trong `className`. `.SelectableGroup` xử lý đúng — dùng
   `outline` (không phải Tailwind `ring-*`) VÀ `!shadow-none` đi kèm lúc chọn
   (`SurfaceCard.tsx:1153`, comment tại dòng 1110-1113 giải thích đúng cơ chế trên). Đọc lại cả 3
   nhánh của `.Base` (`SurfaceCard.tsx:370, 390, 440` — nhánh không-pressable / link-pressable /
   actions-pressable) xác nhận **cả 3** ghép `surfaceFrame(variant)` (⇒ `shadow-surface` khi
   variant mặc định) với `isSelected && "ring-2 ring-accent"` mà KHÔNG có `!shadow-none` đi kèm —
   đúng công thức `.SelectableGroup` từng mắc trước khi sửa. Đây là BUG THẬT (không phải suy
   đoán), nhưng fix nằm ở `.storybook` — ngoài phạm vi trục này, không tự sửa ở đây (LUẬT CỨNG
   #2). Câu hỏi của CANON đến đây là hết; phần còn lại là backlog code.

4. **✅ ĐÃ CHỐT 2026-07-29 — `Nested` không gọi `surfaceFrame()` là CHỦ Ý, không phải copy-paste
   lệch.** Helper dùng chung `surfaceFrame()` (`surface-card-header.tsx:135-136`) LUÔN giữ
   `bg-surface` bất kể `variant` — nhưng helper này phục vụ `.Base` (thẻ ĐỘC LẬP, không có ràng
   buộc phải nằm trong mặt cha đã tô màu), nên cần giữ nền để tự đứng vững ở bất cứ đâu. `Nested`
   (`SurfaceCard.tsx:648-680`, docblock dòng 640-644) là một component KHÁC — "card-inside-card"
   — với hợp đồng sử dụng ghi thẳng trong JSDoc của chính nó: *"Parent context drives the shell:
   any filled parent surface → variant="nested""*, tức component này CHỈ được gọi khi mặt cha ĐÃ
   là một mặt tô màu sẵn. Với ràng buộc đó, `bg-transparent` là lựa chọn ĐÚNG: tránh chồng hai lớp
   `bg-surface` vô nghĩa (cùng một màu), viền vẫn đủ để phân định ranh giới trên nền cha đã có.
   Hai hàm cho hai KẾT QUẢ khác nhau vì phục vụ hai HỢP ĐỒNG sử dụng khác nhau (`.Base` không đảm
   bảo có cha tô màu, `Nested` đảm bảo có) — không phải một lỗi lặp code cần hợp nhất.

5. **✅ ĐÃ CHỐT — công thức đồng tâm (`radius trong = radius ngoài − padding`) và luật §1b (nested
   GIỮ 3xl) TRẢ LỜI HAI CÂU KHÁC NHAU, không mâu thuẫn — chỉ cần đọc đúng đối tượng đang hỏi.**
   Số đo thật: `surface` mặc định `rounded-3xl` (24px) + padding `cozy` (`p-3` = 12px,
   `PADDING_CLASS.cozy`, `_spacing.ts:129`) ⇒ công thức cho `24 − 12 = 12px = rounded-xl` — KHỚP
   ĐÚNG với field/input thật (`Input.tsx:687` `rounded-xl`). Nhưng padding `flush` (`p-0`) ⇒ công
   thức cho `24 − 0 = 24px = rounded-3xl`, trong khi `CoverImage.tsx:49,56` LUÔN cố định
   `rounded-2xl` (16px) bất kể padding — công thức đúng cho field, SAI cho media. **Luật:** công
   thức đồng tâm chỉ áp cho PHẦN TỬ (field) lồng bên trong một khung; KHÔNG áp cho KHUNG MẶT
   (nested card giữ 3xl theo §1b riêng biệt) và KHÔNG áp cho media (`CoverImage` cố định theo
   vai, không theo phép toán). Ba loại đối tượng, ba câu trả lời khác nhau — không phải một công
   thức chung bị lệch. **⬜ NỢ còn lại (công cụ, không phải quyết định):** chưa có gate tự động
   phân biệt "đang tính cho phần tử field" hay "đang tính cho khung mặt/media" trước khi áp công
   thức — thêm vào bảng §6 vạch cấm.

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
