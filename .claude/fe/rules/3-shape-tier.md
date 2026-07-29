# TƯ DUY 3 — DỰNG HÌNH ở tầng COMPOSITE / BLOCK: gap · padding · chọn component

> Một trong 4 file tư duy. File này trả lời: **đứng trong một composite/block, quyết định
> khoảng cách bao nhiêu, dùng khung nào, đệm bao nhiêu.**
> Đây là phần dễ làm đúng-luật-mà-sai-mắt nhất, nên mỗi luật kèm neo ĐO ĐƯỢC.

---

## 0. THANG: KHÔNG CÓ NGOẠI LỆ (thầy chốt 2026-07-27)

Thang là `0 · 1 · 2 · 3 · 6 · 8`. Không có bậc nào khác. Ngoại lệ CHỈ tồn tại khi thầy cho phép.

> ⚠️ **Cập nhật 2026-07-27/28: API là CHỮ, không phải số.** `gap: SeamScale`
> (`flush·tight·related·grouped·section·page`) và `padding: InsetScale`
> (`flush·cozy·roomy·airy`). Cùng thang px, nhưng caller chọn QUAN HỆ chứ không chọn bậc —
> xem `rules/1-decompose.md` §B2. Mọi câu `gap={3}` dưới đây đọc thành `gap="grouped"`.

**Vì sao thang nhảy `12 -> 24`:** mỗi bậc phải phân biệt được VỀ Ý. Cho phép `16` và `20`
nghĩa là mỗi người gõ một số theo cảm giác, thang mất tác dụng ngay.

**NEO 1 (`ProgressMeter`):** `mt-5` = 20px tồn tại lâu vì 20px ĐÚNG BẰNG chiều cao cái pill
(`h-5`), nên nó trông như một PHÉP ĐO chứ không phải một lựa chọn, và cái vỏ đo đó làm nó qua
mặt mọi lần review. Nó vẫn là một lựa chọn. Clearance lấy BẬC ĐẦU TIÊN VƯỢT QUA vật cản, tức
là 24. Sửa thành `pt-6`: đổi cả `mt` thành `pt` (khoảng này thuộc BÊN TRONG hộp, vì nhãn nói
trên mép trên của chính hộp đó) và `5` thành `6` (lên thang).

**NEO 2:** agent được giao "giữ nguyên pixel" đã chọn giữ pixel bằng cách PHÁ THANG (`gap-7`
cộng `pt-5`), đổi một vi phạm lấy hai. Ràng buộc nói thiếu một vế thì agent tối ưu đúng vế
được nói. Giao việc phải nói CẢ HAI: giữ pixel VÀ bậc phải trên thang; không đạt được cả hai
thì DỪNG LẠI và báo.

**Cảnh báo:** mọi lần định mở ngoại lệ đều bắt đầu bằng câu "cái này đặc biệt vì...". Trong
một phiên đã suýt mở hai lần: `-m-3` của StatRibbon, `mt-5` của ProgressMeter.

---

## 1. GAP — đọc theo QUAN HỆ, không đọc theo TẦNG

Thang: `flush(0) · tight(1) · related(2) · grouped(3) · section(6) · page(8)`. Ngoài thang là sai (§10c, xem §0 luật KHÔNG NGOẠI LỆ).

### 1.0 Prop `gap` viết bằng CHỮ, không viết bằng SỐ (thầy chốt 2026-07-27)

```tsx
<Stack.V gap="grouped">   // ✅ nói QUAN HỆ
<Stack.V gap={3}>         // ❌ compile error — số không còn nằm trong type
```

`SeamScale = "flush" | "tight" | "related" | "grouped" | "section" | "page"`, SSOT ở
`.storybook/components/frames/_spacing.ts`. Số chỉ còn tồn tại **một chỗ duy nhất**: bảng
`GAP_CLASS` dịch chữ sang class Tailwind. Đo thật sau khi chuyển: 0 · 4 · 8 · 12 · 24 · 32px.

**Vì sao bắt buộc là chữ, không phải cho đẹp:** con số **không phát biểu điều gì**, nên đọc
review không thấy sai. `gap={8}` giữa nhãn và giá trị chỉ là một con số ai đó gõ; `gap="page"`
giữa nhãn và giá trị là một **lời khẳng định sai rành mặt** — hai thứ này chỉ tình cờ ở chung
trang. Đổi sang chữ tức là **dời chỗ sai từ khâu đo pixel về khâu đọc câu**.

**Chọn bậc = trả lời SÁU câu, đọc từ trên xuống, dừng ở câu ĐÚNG đầu tiên:**

| Hai thứ cạnh nhau LÀ GÌ với nhau? | Bậc |
|---|---|
| **một thứ liền mạch** — có seam là nói dối về nội dung (thân bảng, hàng chung viền) | `flush` |
| **một dấu gắn vào nhãn của nó** — không đứng riêng được (icon + chữ của chính nó) | `tight` |
| **đồng hạng trong một tập** — mỗi cái nguyên vẹn, không cái nào sở hữu cái nào (chip row) | `related` |
| **hàng nằm trong một mặt** — cùng ở trong một card (phổ biến nhất cả hệ) | `grouped` |
| **vùng của một trang** — mỗi bên có tiêu đề riêng, người đọc gọi tên riêng | `section` |
| **hai tính năng chỉ chung trang** — giải thích được liên hệ thì bậc thật HẸP HƠN | `page` |

**Phép thử tách `related` với `grouped` (chỗ hay lẫn nhất):** thử **đổi chỗ hai con**. Đổi mà
người đọc vẫn hiểu ⇒ đồng hạng ⇒ `related`. Đổi mà người đọc lú ⇒ có thứ tự ⇒ `grouped`.

### 1.0a `padding` viết bằng CHỮ, không phải bằng SỐ (thầy chốt 2026-07-27)

```tsx
<Container.Base padding="roomy">   // ✅ nói MẶT này ôm nội dung chật tới đâu
<Container.Base padding={6}>       // ❌ compile error — số không còn nằm trong type
```

`InsetScale = "flush" | "cozy" | "roomy" | "airy"`, SSOT ở
`.storybook/components/frames/_spacing.ts`.

| Bậc | class | Dùng khi |
|---|---|---|
| `flush` | `p-0` | nội dung chạm mép (ảnh cover, bảng cuộn ngang) |
| `cozy` | `p-3` | ruột một thẻ, luật nhà |
| `roomy` | `p-6` | khổ trang, container |
| `airy` | `p-8` | hero, empty state |

**BỐN bậc chữ, không phải sáu:** đo trên cây trước khi đặt tên — 46 call-site chỉ dùng
0/3/6/8, KHÔNG một chỗ nào dùng 1 hay 2. Hai bậc chưa ai vói tới là hai cách nữa để tuỳ tiện.
Một thang giành được bậc bằng cách **ĐƯỢC CHỌN**, không phải bằng cách tồn tại trong Tailwind.

**Vì sao tách khỏi `SeamScale`, không dùng chung một bộ từ:** từ-seam trả lời "hai thứ này
là gì với nhau" — nói QUAN HỆ giữa hai thứ, không nói về bên trong MỘT mặt, nên
`padding="related"` là câu vô nghĩa. Từ-inset trả lời câu khác: mặt này ôm nội dung chật tới
đâu. Hai câu hỏi khác nhau thì không thể dùng chung một bộ từ.

**Hệ quả cho cổng:** phần "padding lệch thang" của `check-padding.mjs` nay **THUA** — compiler
giữ thay (viết `padding={6}` là lỗi biên dịch, khỏi cần cổng soi). Phần "margin của con" thì
**vẫn cần cổng**, vì không kiểu nào cấm được một chuỗi `className` tuỳ tiện.

| Quan hệ giữa hai thứ cạnh nhau | Bậc | Ai sở hữu |
|---|---|---|
| bên trong MỘT phần tử (icon + nhãn của cùng một dòng) | `tight` **1** | chính phần tử đó |
| tiêu đề + phụ đề = **một đơn vị nghĩa** | `flush` **0** | `TitledText` |
| phần tử **cùng một cụm** (chip row · meta · nút cạnh nút) | `related` **2** | parent |
| **hàng/khối xếp trong một cụm** (list rows · caption của giá) | `grouped` **3** | parent |
| **VÙNG khác nhau** (cụm đầu ↔ khối giá ↔ CTA · header ↔ body ↔ footer) | `section` **6** | block |
| **block ↔ block** trên trang | `section 6` / `page 8` | screen |

**Luật quan trọng nhất của mục này — và là chỗ con đã sai một lần:**

> Ma trận §10b ghi *"composite ↔ composite = section(6)"*. **Đừng áp câu đó máy móc.**
> Hỏi **QUAN HỆ**, không hỏi tầng: hai composite mà một cái là **caption của cái kia** thì
> chúng là **một cụm** ⇒ seam là `grouped(3)`, còn `section(6)` dành cho seam **quanh** cụm đó.

Neo đo thật (`TrialConversionStrip`, khổ card 512px):

| Nhịp | Đọc ra gì |
|---|---|
| `24 / 12 / 24 / 24` (áp máy móc "composite↔composite = 6") | **4 dải trôi** — dòng "Còn 12 suất" xa cụm giá đúng bằng khoảng cách tới CTA ⇒ **mất cha**. §10 cấm nhịp đều chính vì thế |
| `24 / 12 / 12 / 24` (đọc theo quan hệ) | **2 nhóm** — [cụm đầu] · [khối giá ⊃ giá + caption] · [CTA] |

**Kiểm nhanh nhịp:** liệt kê các seam của một khung theo thứ tự dọc. Nếu dãy số **gần như đều nhau**, gần chắc là sai — nhịp phải kể ra được nhóm.

### Hai chủ cho một seam = luôn sai
- `padding` thuộc **CONTAINER**; con **nhận**, không tự thêm.
- `gap` thuộc **PARENT** (người compose); con không biết khoảng của mình.
- `margin` của con: **CẤM**, trừ whitelist `mt-auto` · `ml-auto`/`ms-auto` · bleed `-mx-*`.

Neo đo thật: `KeyValue.List` đã có `gap = "grouped"` mặc định (nó **tự sở hữu** nhịp hàng), mà call-site truyền `gap="tight"` vào ghi đè từ ngoài ⇒ **hai chủ một seam**. Sửa đúng là **bỏ hẳn prop**, không phải đổi bậc.

**Bài học về CỔNG, không phải về hình (2026-07-27):** luật "truyền `gap` vào khung tự sở hữu
nhịp" có cổng `check-seams` canh, nhưng regex ghim `gap=\{(\d+)\}`. Ngày thang đổi sang chữ,
cổng **vẫn báo xanh trong khi không còn kiểm gì cả** — nó tìm một cú pháp đã tuyệt chủng.
⇒ Đổi từ vựng của một prop thì phải **đi soi lại mọi cổng nhắc tên prop đó**, và mỗi cổng chỉ
được tin sau khi **negative control** (cắm lỗi giả, thấy đỏ, gỡ ra). Cổng nay khớp **cả hai**
từ vựng, cộng luật mới `numeric-seam`: số trên khung của mình = chưa di trú.

Phân biệt để không báo oan:
- Khung nhận **children/slot của caller** (`Stack.*` · `Cluster` · `Grid`) ⇒ truyền `gap` vào là **ĐÚNG**, vì seam giữa các con là của parent. `Container` đã **bỏ hẳn `gap`** (2026-07-27) — nó chỉ còn khổ đọc + padding, không nằm trong danh sách này nữa.
- Khung tự render **hàng lặp từ `items`** (`KeyValue.List` · `SurfaceCard.List`) ⇒ nhịp hàng là **nội bộ**, truyền `gap` vào là ghi đè.

---

## 2. PADDING

| Chỗ | Bậc | Ghi chú |
|---|---|---|
| card / surface | `padding="cozy"` (`p-3`) | card sở hữu; nội dung không tự thêm |
| khổ trang (`Container`) | `padding="roomy"` (`p-6`) | mặc định của web measure |
| ảnh cover / bảng cuộn ngang | `padding="flush"` (`p-0`) | nội dung chạm mép |
| hero / empty-state | `padding="airy"` (`p-8`) | |
| trong field / control | do atom tự lo | caller không truyền vào |

**Bẫy ĐÃ SỬA (2026-07-27):** `Container.Base` từng chỉ áp `gap` khi dùng slot `header`/`footer` — truyền `children` thẳng thì `gap` bị **bỏ im lặng** (đo được seam **0px** trong khi code ghi `gap="page"`). Viết một prop mà không ai nhận **tệ hơn không viết**, vì đọc code tưởng đã có nhịp. Đã bỏ hẳn `gap`/`header`/`footer` khỏi `Container`; nó chỉ còn giữ **khổ đọc** và **padding** (xem `continue.md` §1).

---

## 3. CHỌN KHUNG — cây quyết định

```
Cần sắp xếp mấy thứ cạnh nhau?
├─ 1 trục, con là ARBITRARY (khác kiểu nhau)        → Stack.V / Stack.H
├─ 1 trục, con là N PHẦN TỬ CÙNG KIỂU, tự tràn dòng → Cluster.Base (items)
├─ 2 chiều, chia cột                                → Grid.Base (columns)
├─ Khổ đọc căn giữa + đệm trang                     → Container.Base
├─ Đúng HAI phía có tên (trái ↔ phải)               → Split.Base
└─ Danh sách hàng trong một mặt card                → SurfaceCard.List
```

Hai chỗ hay chọn sai:
1. **`Split` không phải `Stack.H`.** `Split` có hợp đồng: phía `start` **được co** (`min-w-0`), phía `end` không co. Neo đo thật: dùng `Split` cho hàng giá làm chip `−33%` rớt dòng, cột trái bị bóp còn 216px trong khi nút chiếm 248px, hàng giá cao lên 61px. Giá là **SỐ** — bóp nó vô nghĩa. Hàng đó cần **wrap**, tức `Stack.H` + `wrap`.
2. **`Cluster` không phải `Stack.H`.** `Stack.H` nhận `children` bất kỳ; `Cluster` nhận `items` — N phần tử cùng kiểu + tự tràn dòng. (Ranh giới này chưa chốt hẳn, xem `continue.md` §3.2.)

---

## 4. CHỌN COMPONENT — thứ tự bắt buộc trước khi đẻ cái mới

1. Cái này phục vụ **WHY** gì? (CTA đẩy hành động · trình bày để đọc)
2. Hệ **đã có** composite/block nào phục vụ WHY đó chưa?
3. Có rồi ⇒ **dùng lại** (thêm prop **dữ liệu** nếu thiếu). Chưa có ⇒ mới dựng.

- Cùng WHY, khác hình ⇒ **gộp**. Khác WHY, giống hình ⇒ **tách member**. Hình là hệ quả, WHY là gốc.
- Component **không có WHY riêng** (`SurfaceCard`, `HighlightCard`, `SectionCard`) là **khung trung tính** ⇒ thuộc tầng **frame**, không phải composite.
- Dấu hiệu hệ đang đẻ khái niệm thừa: **một việc có ≥2 đường làm**. Đã đo: 4 cách đặt nhãn cho một khối (`Page.Header` · `eyebrow` của ContinueCard · `SurfaceCardHeader` · `Section.Header` với **0 consumer**).
- Khái niệm dựng xong **0 consumer** nguy hiểm hơn drift đang chạy: drift là hai đường đang đi, còn nó là đường thứ ba **đang chờ** người vô tình đi vào.

---

## 5. CẤM ở tầng composite/block — không có ngoại lệ

| Cấm | Vì sao |
|---|---|
| `variant?` / `size?` cho caller chọn hình | mở một lối là bản chuẩn hết chuẩn; muốn tự do hình thì gọi **thẳng atom/layout** |
| `label?` / `heading?` / `ctaLabel?` | câu dẫn là **trình bày** ⇒ block sở hữu. Caller chỉ đưa **dữ liệu miền** |
| `icon?` để đổi glyph | ánh xạ nghĩa→hình là của block |
| `className` để **restyle** | chỉ được dùng để **đặt chỗ** (`mb-4`, `flex-1`) |
| chuỗi **đã format** (`meta="8 chương · ~14 giờ"`) | caller quyết đơn vị + dấu ngăn ⇒ block hết sở hữu hình |
| **bịa case** | chỉ dựng biến thể app **dùng thật**. Phép thử: *"màn nào đang cần case này?"* — không chỉ ra được ⇒ không dựng |

Neo thật: `VariantChip.Difficulty` từng mở `label?` + `variant?: "pill"|"bare"` → bị bắt, sửa lại còn `difficulty` là trục duy nhất quyết cả nhãn lẫn màu. `KeepGoingPath`/`LearnNudges` từng có `bordered` cho ca "surface-in-surface" mà **app không có ca đó** → xoá cả prop lẫn story.

**Neo mới (2026-07-28) — "className để restyle" cụ thể hoá cho CSS PHỨC TẠP:** `ContentRelatedList`
(block) viết tay `className="underline-offset-4 decoration-[var(--separator-tertiary)]
group-hover:underline"` lên một `Typography` để mô phỏng "cả hàng hover thì title gạch chân" —
đúng loại vi phạm hàng "className để restyle" đã cấm, chỉ là dạng CSS arbitrary-value/pseudo
phức tạp thay vì `bg-red-500` đơn giản nên dễ lọt mắt hơn. **Luật**: CSS phức tạp (arbitrary
value `[...]`, pseudo-class `group-hover:`/`peer-*`) chỉ được viết ở tầng **atom**,
**frame ("layouts")**, hoặc **composite** — nơi nó được ĐÓNG GÓI thành một PROP có tên
(state), không phải tầng block/screen tự tay ráp chuỗi Tailwind. Sửa đúng: thêm prop
`underlineOnGroupHover` cho atom `Typography` (atom tự giữ chuỗi CSS bên trong nó), block chỉ
gọi `<Typography underlineOnGroupHover />`. Xem `atoms/text/Typography/Typography.tsx`.

**Neo mới (2026-07-28) — route qua 1 `className` prop CÓ SẴN không miễn trừ vi phạm.** Khi
build `ContentCommentThread`, đường viền thụt lề reply (`border-l pl-3 @app-sm:pl-4`) được
chuyển từ `<div className={cn(...)}>` sang truyền y hệt vào khe `className` sẵn có của
`StackH` — thầy vẫn bắt: "sao cái này trò không render kiểu container hay gì? mà phải viết
thô vậy?". Một prop `className` passthrough đã tồn tại ở khung KHÔNG biến CSS phức tạp
truyền vào nó thành hợp lệ — cái khung phải sở hữu nó bằng 1 PROP RIÊNG có tên (ở đây:
`nested?: boolean` thêm vào `StackBaseProps`, `frames/Stack/Stack.tsx`), không phải nhận hộ
qua cổng chung. Lý do thầy nêu: tối thiểu code trùng (nhiều nơi cần "thụt lề 1 bậc" sẽ viết
lại đúng 3 class đó) + strict rules phải đồng bộ CHO CẢ APP hiểu, không chỉ 1 chỗ workaround.

---

## 6. Chỗ audit — dao đã dựng

```bash
node scripts/check-seams.mjs
```

Kiểm 3 việc, đều là **sự thật đo được** chứ không phải phán đoán:
1. **bố cục viết TAY** ở tầng composite/block/screen (`flex`/`grid` + `gap-*` trong className) — vì spacing viết tay **vô hình với type `SeamScale`**, là lối duy nhất còn lọt off-scale.
2. **`gap` truyền vào khung tự sở hữu nhịp** — hai chủ một seam (cảnh báo, không chặn: bảng số liệu dày là ca thật).
3. **bậc off-scale** ngoài `0·1·2·3·6·8`; file nào **tự khai ngoại lệ** bằng `eslint-disable no-fractional-spacing` thì được tôn trọng và **đếm riêng** cho khỏi mất dấu.

Nó **KHÔNG** chấm "bậc này đúng chưa" — cái đó cần biết **quan hệ** giữa hai thứ, chỉ người đọc thấy. Kết quả hiện tại: **6 chỗ off-scale** (nợ có sẵn ở atom/util), 0 bố cục tay.

---

## 7. Chờ thầy chốt

- **C8** — §10b có nên thêm nấc **`caption`** (một composite là chú thích của composite kia) để câu "composite ↔ composite = 6" không còn bị áp máy móc? Hiện con xử bằng cách đọc quan hệ, nhưng luật viết trong canon vẫn là câu cũ.
- **C9** — `Stack.H.PriceRow` cần **631px** mà card thật chỉ có **488px** ⇒ CTA **luôn** xuống dòng, `wrap` không phải phòng xa mà là trạng thái thường trực. Để nút xuống dòng full-width có chủ ý, hay thu nút nhỏ để nằm cạnh giá?
- **C10** — 6 chỗ `gap-1.5`/`gap-4` còn lại ở `Input` · `FieldFrame` · `TabsBase`: sửa về thang, hay khai ngoại lệ như `BlockAnatomy` đã làm?
