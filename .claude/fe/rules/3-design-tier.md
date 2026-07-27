# TƯ DUY 3 — DỰNG HÌNH ở tầng DESIGN / BLOCK: gap · padding · chọn component

> Một trong 4 file tư duy. File này trả lời: **đứng trong một design/block, quyết định
> khoảng cách bao nhiêu, dùng khung nào, đệm bao nhiêu.**
> Đây là phần dễ làm đúng-luật-mà-sai-mắt nhất, nên mỗi luật kèm neo ĐO ĐƯỢC.

---

## 1. GAP — đọc theo QUAN HỆ, không đọc theo TẦNG

Thang: `flush(0) · tight(1) · related(2) · grouped(3) · section(6) · page(8)`. Ngoài thang là sai (§10c).

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

### 1.0a `padding` vẫn là SỐ — cố ý

`padding` **không phải seam giữa hai thứ**, nó là **lòng** của một mặt. Từ vựng quan hệ không
tả được nó: `padding="related"` không phát biểu gì cả. Nên `SpaceScale = 0|1|2|3|6|8` giữ
nguyên số, và **đặt tên cho thang lòng là quyết định riêng, còn để mở.**

| Quan hệ giữa hai thứ cạnh nhau | Bậc | Ai sở hữu |
|---|---|---|
| bên trong MỘT phần tử (icon + nhãn của cùng một dòng) | `tight` **1** | chính phần tử đó |
| tiêu đề + phụ đề = **một đơn vị nghĩa** | `flush` **0** | `TitledText` |
| phần tử **cùng một cụm** (chip row · meta · nút cạnh nút) | `related` **2** | parent |
| **hàng/khối xếp trong một cụm** (list rows · caption của giá) | `grouped` **3** | parent |
| **VÙNG khác nhau** (cụm đầu ↔ khối giá ↔ CTA · header ↔ body ↔ footer) | `section` **6** | block |
| **block ↔ block** trên trang | `section 6` / `page 8` | screen |

**Luật quan trọng nhất của mục này — và là chỗ con đã sai một lần:**

> Ma trận §10b ghi *"design ↔ design = section(6)"*. **Đừng áp câu đó máy móc.**
> Hỏi **QUAN HỆ**, không hỏi tầng: hai design mà một cái là **caption của cái kia** thì
> chúng là **một cụm** ⇒ seam là `grouped(3)`, còn `section(6)` dành cho seam **quanh** cụm đó.

Neo đo thật (`TrialConversionStrip`, khổ card 512px):

| Nhịp | Đọc ra gì |
|---|---|
| `24 / 12 / 24 / 24` (áp máy móc "design↔design = 6") | **4 dải trôi** — dòng "Còn 12 suất" xa cụm giá đúng bằng khoảng cách tới CTA ⇒ **mất cha**. §10 cấm nhịp đều chính vì thế |
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
- Khung nhận **children/slot của caller** (`Stack.*` · `Cluster` · `Grid` · `Container`) ⇒ truyền `gap` vào là **ĐÚNG**, vì seam giữa các con là của parent.
- Khung tự render **hàng lặp từ `items`** (`KeyValue.List` · `SurfaceCard.List`) ⇒ nhịp hàng là **nội bộ**, truyền `gap` vào là ghi đè.

---

## 2. PADDING

| Chỗ | Bậc | Ghi chú |
|---|---|---|
| card / surface | `p-3` | card sở hữu; nội dung không tự thêm |
| khổ trang (`Container`) | `padding={6}` | mặc định của web measure |
| trong field / control | do atom tự lo | caller không truyền vào |

**Bẫy đã cắn:** `Container.Base` chỉ áp `gap` khi dùng slot `header`/`footer`. Truyền `children` thẳng thì `gap` bị **bỏ im lặng** — đo được seam **0px** trong khi code ghi `gap={8}`. Viết một prop mà không ai nhận **tệ hơn không viết**, vì đọc code tưởng đã có nhịp.

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
2. Hệ **đã có** design/block nào phục vụ WHY đó chưa?
3. Có rồi ⇒ **dùng lại** (thêm prop **dữ liệu** nếu thiếu). Chưa có ⇒ mới dựng.

- Cùng WHY, khác hình ⇒ **gộp**. Khác WHY, giống hình ⇒ **tách member**. Hình là hệ quả, WHY là gốc.
- Component **không có WHY riêng** (`SurfaceCard`, `HighlightCard`, `SectionCard`) là **khung trung tính** ⇒ thuộc tầng **layout**, không phải design.
- Dấu hiệu hệ đang đẻ khái niệm thừa: **một việc có ≥2 đường làm**. Đã đo: 4 cách đặt nhãn cho một khối (`Page.Header` · `eyebrow` của ContinueCard · `SurfaceCardHeader` · `Section.Header` với **0 consumer**).
- Khái niệm dựng xong **0 consumer** nguy hiểm hơn drift đang chạy: drift là hai đường đang đi, còn nó là đường thứ ba **đang chờ** người vô tình đi vào.

---

## 5. CẤM ở tầng design/block — không có ngoại lệ

| Cấm | Vì sao |
|---|---|
| `variant?` / `size?` cho caller chọn hình | mở một lối là bản chuẩn hết chuẩn; muốn tự do hình thì gọi **thẳng atom/layout** |
| `label?` / `heading?` / `ctaLabel?` | câu dẫn là **trình bày** ⇒ block sở hữu. Caller chỉ đưa **dữ liệu miền** |
| `icon?` để đổi glyph | ánh xạ nghĩa→hình là của block |
| `className` để **restyle** | chỉ được dùng để **đặt chỗ** (`mb-4`, `flex-1`) |
| chuỗi **đã format** (`meta="8 chương · ~14 giờ"`) | caller quyết đơn vị + dấu ngăn ⇒ block hết sở hữu hình |
| **bịa case** | chỉ dựng biến thể app **dùng thật**. Phép thử: *"màn nào đang cần case này?"* — không chỉ ra được ⇒ không dựng |

Neo thật: `VariantChip.Difficulty` từng mở `label?` + `variant?: "pill"|"bare"` → bị bắt, sửa lại còn `difficulty` là trục duy nhất quyết cả nhãn lẫn màu. `KeepGoingPath`/`LearnNudges` từng có `bordered` cho ca "surface-in-surface" mà **app không có ca đó** → xoá cả prop lẫn story.

---

## 6. Chỗ audit — dao đã dựng

```bash
node scripts/check-seams.mjs
```

Kiểm 3 việc, đều là **sự thật đo được** chứ không phải phán đoán:
1. **bố cục viết TAY** ở tầng design/block/screen (`flex`/`grid` + `gap-*` trong className) — vì spacing viết tay **vô hình với type `SpaceScale`**, là lối duy nhất còn lọt off-scale.
2. **`gap` truyền vào khung tự sở hữu nhịp** — hai chủ một seam (cảnh báo, không chặn: bảng số liệu dày là ca thật).
3. **bậc off-scale** ngoài `0·1·2·3·6·8`; file nào **tự khai ngoại lệ** bằng `eslint-disable no-fractional-spacing` thì được tôn trọng và **đếm riêng** cho khỏi mất dấu.

Nó **KHÔNG** chấm "bậc này đúng chưa" — cái đó cần biết **quan hệ** giữa hai thứ, chỉ người đọc thấy. Kết quả hiện tại: **6 chỗ off-scale** (nợ có sẵn ở atom/util), 0 bố cục tay.

---

## 7. Chờ thầy chốt

- **C8** — §10b có nên thêm nấc **`caption`** (một design là chú thích của design kia) để câu "design ↔ design = 6" không còn bị áp máy móc? Hiện con xử bằng cách đọc quan hệ, nhưng luật viết trong canon vẫn là câu cũ.
- **C9** — `Stack.H.PriceRow` cần **631px** mà card thật chỉ có **488px** ⇒ CTA **luôn** xuống dòng, `wrap` không phải phòng xa mà là trạng thái thường trực. Để nút xuống dòng full-width có chủ ý, hay thu nút nhỏ để nằm cạnh giá?
- **C10** — 6 chỗ `gap-1.5`/`gap-4` còn lại ở `Input` · `FieldFrame` · `TabsBase`: sửa về thang, hay khai ngoại lệ như `BlockAnatomy` đã làm?
