# FRAME — dùng khung nào để xếp

> Trục này trả lời đúng một câu: **dùng khung nào để xếp: `Stack` · `Cluster` · `Grid` ·
> `Split` · `Container`.**
> Không trả lời khoảng cách bao nhiêu (xem `seam/`), không trả lời đệm bao nhiêu (xem `inset/`
> — chưa dựng, tạm đọc `rules/3-shape-tier.md` §2). Neo code thật: [`example.html`](example.html).

---

## 1. THANG — sáu khung (2026-07-29: thêm `ResponsiveRow`), không có khung thứ bảy

SSOT đếm cũ: `continue.md` dòng 81 — *"frame: không biết nội dung, chỉ quyết trục · seam · canh
— 5 (`Cluster` `Container` `Grid` `Split` `Stack`)"*. Số đã lên 6 cùng ngày `Stack`/`Flex` học
`as`/`inline` (xem dưới) và `ResponsiveRow` ra đời — `continue.md` CHƯA cập nhật con số, đọc
bảng này làm nguồn thật. Đây KHÔNG phải một union type (mỗi khung là một component riêng), nên
"thang" ở đây đọc từ props THẬT quyết định hợp đồng của từng khung.

| Khung | File | Props THẬT quyết định hợp đồng | Ý nghĩa |
|---|---|---|---|
| `Stack.V` / `Stack.H` | `frames/Stack/Stack.tsx` — `StackBaseProps` | `children: ReactNode` (bắt buộc — §13b: 1 trục, KHÔNG có "items") | 1 trục, con **tuỳ ý**, khác kiểu nhau. `wrap` chỉ có ở `.H`. |
| `Cluster` | `frames/Cluster/Cluster.tsx` — `ClusterBaseProps` | `items: ReadonlyArray<ClusterItem>` (bắt buộc, **`children` bị cấm** — không khai trong props) | N phần tử **cùng kiểu**, tự tràn dòng, thứ tự không mang nghĩa. |
| `Grid` | `frames/Grid/Grid.tsx` — `GridBaseProps` | `items` + `columns: GridColumns` (bắt buộc cả hai) | Lưới **2 chiều thật** — ô thẳng cột qua nhiều dòng, số cột đổi theo bề rộng container (`@app-*`). CỐ ĐỊNH số cột — item ít hơn số cột để trống, không giãn đều (khác `ResponsiveRow`). |
| `Split` | `frames/Split/Split.tsx` — `SplitBaseProps` | `start`/`end: ReactNode` (2 slot TÊN, không có `children`) | Đúng **HAI phía có vai trò cố định**: `start` được co (`min-w-0`), `end` không co (`shrink-0`). |
| `Container` | `frames/Container/Container.tsx` — `ContainerBaseProps` | `size?`/`padding?` + `body`/`children` (1 slot duy nhất) | **Khổ đọc** — căn giữa, giới hạn bề rộng, đệm quanh trang. Từ 2026-07-27 **không còn** `gap`/`header`/`footer` (xem §4a). |
| `ResponsiveRow` | `frames/ResponsiveRow/ResponsiveRow.tsx` — `ResponsiveRowProps` | `items` + `columns: 1\|2` + `at: "sm"\|"md"\|"lg"` (bắt buộc cả ba) | Lưới CỐ ĐỊNH `columns` cột dưới bậc `at`, chuyển thẳng sang **flex 1 hàng giãn đều** (N ô tự chia đều bề rộng, không để trống dù ít ô) từ `at` trở lên. Chỉ 1 bậc chuyển, không gap phía flex (seam ở đó là `border-l`, không phải khoảng trắng — xem file header). |

**Không tính vào thang này** (dù cùng nằm trong `frames/`):
- `Flex` — `⛔ INTERNAL` ngay trong code: không story, chỉ `Stack.tsx` được import. Bộ máy phía
  dưới `Stack`, không phải lựa chọn caller. Từ 2026-07-29 nhận thêm `as?: "div"|"section"|
  "figure"|"span"|"li"` (khung `Stack` cũng forward prop này) — một khung KHÔNG còn ép cứng
  `<div>`, gọi được `<section>`/`<li>`/`<figure>`/`<span>` khi HTML thật cần tag đó (danh sách
  cần `<section>`, ảnh cần `<figure>`, dòng chip nằm TRONG một câu văn cần `<span>` để không cắt
  câu — `<div>` là block-level, chèn vào giữa câu sẽ vỡ dòng). Kèm `inline?: boolean` (render
  `inline-flex` thay `flex`, cho khung cần ôm sát nội dung thay vì chiếm cả dòng, vd
  `ProgressRing` đứng cạnh chữ chạy). **Bẫy TS đã bắt (2026-07-29)**: gõ `as` bằng
  `ElementType`/`keyof JSX.IntrinsicElements` (union MỌI thẻ HTML) làm TypeScript giao (intersect)
  props của TẤT CẢ thẻ trong union — void element (`img`/`input`/`br`…) không nhận `children` nên
  giao ra `children: never`, thẻ ĐỘNG không render được kể cả khi default là `"div"`. Sửa: thu
  hẹp `as` về ĐÚNG 5 tag khung thật sự render, không dùng type rộng hơn nhu cầu thật.
- `SplitWorkspace` — 2 slot `main`/`aside` nhưng là **hình cụ thể đã đóng băng số đo** (aside
  `360px`, breakpoint `@app-xl`), dựng cho ĐÚNG 1 tình huống lặp 2 lần thật (`ChallengeView`,
  `PersonalProjectWorkspace`), không phải câu trả lời chung — xem §4.4.

---

## 2. CÂY QUYẾT ĐỊNH — hỏi từ trên xuống, dừng ở câu YES đầu tiên

| # | Hỏi | Ra |
|---|---|---|
| 1 | Đang cần giới hạn **bề rộng đọc** + đệm quanh **MỘT khối**, không quan tâm bên trong sắp ra sao? | `Container` — rồi **lặp lại cây này** cho nội dung bên trong (`Container` gần như luôn bọc một `Stack.V`) |
| 2 | Đang sắp NHIỀU phần tử. Có **đúng 2 phần tử**, mỗi phần tử một **vai trò cố định** (đầu ↔ cuối), và một phía **phải co được** (truncate an toàn) trong khi phía kia **giữ nguyên kích thước**? | `Split` |
| 3 | N phần tử (kể cả N=2) **cùng một kiểu lặp lại**, đổi chỗ hai đứa bất kỳ **không đổi nghĩa**, cần tự tràn dòng khi hết chỗ ngang, **không cần thẳng cột** giữa các dòng? | `Cluster` |
| 4 | Cần chia thật thành **CỘT đều nhau, thẳng hàng cả 2 chiều** (dòng dưới phải khớp cột với dòng trên), số cột đổi theo bề rộng container? | `Grid` |
| 4b | Giống câu 4 (N ô cùng kiểu, số cột theo container) NHƯNG số ô có thể ÍT hơn số cột và cần TỰ GIÃN ĐỀU lấp hết bề rộng ở bậc rộng, thay vì để trống cột? | `ResponsiveRow` — chỉ 1 bậc chuyển (`at`), không phải nhiều bậc như `Grid` |
| 5 | Còn lại: 1 trục duy nhất, con **tuỳ ý** (khác kiểu nhau, không lặp cùng kiểu) | `Stack.V` (dọc) hay `Stack.H` (ngang) theo hướng đọc chính |

**Trước khi tin cây: hợp đồng PROPS thắng cảm giác.** `Cluster`/`Grid`/`Split` không khai
`children` trong type — nếu nội dung của bạn không thể diễn tả bằng `items`/`start`+`end` mà
buộc phải nhét `ReactNode` tuỳ ý, đó là bằng chứng ngay lập tức rằng bạn đang ở nhánh `Stack`,
bất kể cây trên nói gì.

---

## 3. VÉT CẠN CA DỄ LẪN — đủ `C(5,2) = 10` cặp

Thang 5 khung ⇒ `C(5,2) = 10` cặp: `Stack↔Cluster` · `Stack↔Grid` · `Stack↔Split` ·
`Stack↔Container` · `Cluster↔Grid` · `Cluster↔Split` · `Cluster↔Container` · `Grid↔Split` ·
`Grid↔Container` · `Split↔Container`. Liệt kê đủ 10, phân 3 nhóm theo **mức độ đã cắn thật**,
không theo khoảng cách vật lý (trục này là CÂY rẽ nhánh, không phải một thang tuyến tính như `seam`).

### 3a. Bốn cặp ĐÃ CẮN THẬT (hoặc đang cắn) — mỗi cặp một phép phân định dứt khoát

| Cặp | Phép phân định DỨT KHOÁT | Đã cắn thật |
|---|---|---|
| **`Stack.H` ↔ `Cluster`** | N phần tử có **CÙNG KIỂU LẶP LẠI** và đổi chỗ hai đứa bất kỳ **không đổi nghĩa** không? Đúng ⇒ `Cluster` (`items`). Khác kiểu nhau (icon trộn nút trộn chữ) hoặc thứ tự mang nghĩa ⇒ `Stack.H` (`children`). | ⚠️ **CHỜ THẦY CHỐT** — xem §3a ghi chú dưới |
| **`Stack.H` ↔ `Split`** | Có **ĐÚNG 2** phần tử, một phía **PHẢI co được** (truncate an toàn) còn phía kia **giữ nguyên**? Đúng ⇒ `Split`. Sai (≥3 phần tử, hoặc cả hai bên đều không được co, hoặc cần bọc dòng cả cụm) ⇒ `Stack.H`. | ✅ 21 call-site thật |
| **`Stack.V` ↔ `Container`** | Câu hỏi đang trả lời là **QUAN HỆ giữa các con** hay **bề rộng+đệm của chính khối**? Quan hệ giữa con ⇒ `Stack`. Bề rộng đọc, không quan tâm bên trong ⇒ `Container`. | ✅ 1 lần, đã sửa |
| **`Cluster` ↔ `Grid`** | Các dòng sau có cần **THẲNG CỘT** với dòng trước không (dòng 2 cột 1 phải khớp dưới dòng 1 cột 1)? Cần thẳng cột thật, số cột đổi theo bề rộng ⇒ `Grid`. Chỉ cần tràn dòng như chữ ⇒ `Cluster`. | Neo dùng cả hai đúng việc, chưa ghi nhận lẫn |

**⚠️ CHỜ THẦY CHỐT (`Stack.H` ↔ `Cluster`):** `continue.md` mục 7 và `rules/3-shape-tier.md` §3
tự liệt chính câu này là **CHƯA CHỐT** — *"cùng 'hàng ngang', khác đường vào (`items` vs
`children`)"*. Phép phân định ở bảng trên là quy ước ĐANG VẬN HÀNH (đọc từ `QuotaBar.tsx:131-134`,
xem `example.html`), không phải luật đã thầy duyệt.

**`Stack.H`↔`Split` "đã cắn" dù không phải một crash:** 21 call-site cần đúng hợp đồng `Split`
vẫn tự viết `min-w-0`/`shrink-0` bằng `StackH`, trong khi `Split` có **0 người dùng thật** ngoài
story của chính nó — cắn âm thầm hơn crash, xem §4.2.

### 3b. Bốn cặp — câu hỏi CẤP TRÊN chưa trả lời, không viết phép thử riêng

| Cặp | Câu cấp trên chưa trả lời |
|---|---|
| `Grid` ↔ `Split` | §2.3/§2.4: "N Ô LẶP cần thẳng cột, hay ĐÚNG 2 VAI TRÒ cố định?" |
| `Grid` ↔ `Container` | §2.1: "đang SẮP NHIỀU CON hay đang BỌC KHỔ ĐỌC một khối?" |
| `Cluster` ↔ `Container` | Cùng câu §2.1 — `Cluster` sắp nhiều, `Container` bọc một. |
| `Cluster` ↔ `Split` | §2.2/§2.3: "N phần tử LẶP CÙNG KIỂU, hay ĐÚNG 2 VAI TRÒ khác kiểu?" |

### 3c. Hai cặp CÁCH XA — cố ý không có phép phân định

`Stack` ↔ `Grid` · `Split` ↔ `Container`. **Phân vân ở đây là dấu hiệu CÂY VẼ SAI, không phải
chọn sai.** `Stack` trả lời "1 trục, con tuỳ ý"; `Grid` trả lời "lưới 2 chiều đều nhau" — hai câu
hỏi khác hẳn nhau. `Split` (2 vai trò một hàng) và `Container` (khổ đọc bọc một khối) cũng không
cùng loại câu hỏi. Viết phép phân định cho hai cặp này là hợp thức hoá một lỗi đọc cấu trúc.

---

## 4. BẪY CẤU TRÚC — sai không phải vì chọn khung, mà vì đọc sai cây

1. **`Container` từng ôm luôn nhịp bên trong nó.** Có `gap`/`header`/`footer`, gọi truyền thẳng
   `children` thì `gap` bị **bỏ IM LẶNG** (đo `0px` dù code ghi `gap="page"`). Sửa 2026-07-27: bỏ
   ba prop đó; giờ **luôn** phải `Container > Stack.V` — seam là việc của `Stack`. Neo:
   `rules/3-shape-tier.md` §2.

2. **`Split` dựng xong nhưng 0 người dùng thật — nguy hiểm hơn drift đang chạy.** Grep toàn repo:
   `Split` chỉ được import ở đúng story của chính nó. Trong khi đó **21 call-site thật** cần đúng
   hình dạng của nó (2 vai trò, một bên co) vẫn `StackH gap=... justify="between"` rồi tự tay viết
   `min-w-0`/`shrink-0` — `QuotaBar.tsx:131-134` còn tự ghi comment giải thích chọn `StackH` chứ
   không phải `Cluster`, không hề nhắc `Split`. Đúng luật `3-shape-tier` §4: *"khái niệm dựng
   xong 0 consumer nguy hiểm hơn drift đang chạy"* — chỉ khác chiều: người ta đi VÒNG QUA nó.

3. **Khung mới kế thừa `Container` phải soi lại bẫy `@container`+`padding` trên CÙNG element.**
   `@container` đo content-box **sau khi trừ padding của chính element đó**, nên ở `size="xl"`
   (đúng ngưỡng `@app-xl`) nội dung có padding **không bao giờ** chạm ngưỡng, dù viewport 1920px.
   Lộ ra khi dựng `SplitWorkspace` lồng trong `Container size="xl"`. Sửa: tách 2 lớp — `div`
   ngoài giữ `@container`+`max-w` (không padding), `div` trong giữ `padding`.

4. **Thiếu khung chuyên biệt ⇒ `Stack.H`+`wrap` bị chế thành "khung giả".** `ChallengePage` và
   `PersonalProjectTaskPage` cùng dùng `StackH gap="section" wrap` bọc 2 `StackV` để giả lập
   "cột đọc + cột hành động dính" — cả hai tự ghi CÙNG một câu *"the BEST-AVAILABLE substitute...
   no dedicated frame yet"*. `wrap` không có ngưỡng breakpoint thật, cột chính co vô hạn ⇒ hàng
   gần như KHÔNG BAO GIỜ wrap, 2 cột dính nhau ở MỌI bề rộng kể cả mobile. Luật rút ra: **2 nơi
   độc lập tự nhận "chưa có khung cho ca này" bằng đúng một câu là đủ điều kiện dựng khung MỚI**
   (`SplitWorkspace`), không phải tiếp tục vá bằng `Stack`.

5. **`Grid.span` bị chặn cứng `1|2`, không escape hatch vị trí tuỳ ý** — vì `col-start-2` từng vỡ
   layout mobile ở `GroupPressableCard`. Cần hình khác là composite/block mới, không phải prop `Grid`.

6. **Đếm call-site: `Stack` chiếm 471/604 ≈ 78% tổng lượt gọi 5 khung** (`Cluster` 35 · `Grid`
   25 · `Split` 14 · `Container` 51). Không tự nó là lỗi, nhưng `Stack` là khung DUY NHẤT nhận
   `children` tự do (4 khung còn lại đòi `items`/slot tên cố định) nên luôn "vừa" về biên dịch kể
   cả khi ngữ nghĩa sai — cơ chế đứng sau bẫy #2 và #4.

---

## 5. NEO THẬT — thứ tự ưu tiên khi phân vân

1. **Hợp đồng PROPS thật của khung** (§1) thắng cảm giác trước tiên — `children` bị cấm ở
   `Cluster`/`Grid`/`Split` là ràng buộc TYPE, không phải quy ước đọc được hay không.
2. **Cây quyết định §2** — dùng khi (1) không đủ để quyết (vd nội dung diễn tả được bằng cả
   `items` lẫn `children`).
3. **Tần suất call-site hiện có (§4.6) CHỈ LÀ DỮ LIỆU tham khảo, không phải luật.** `Stack`
   đông nhất không có nghĩa `Stack` luôn đúng — xem bẫy #2, #4: chính chỗ `Stack` bị dùng nhiều
   nhất lại là chỗ nó đang thế chỗ một khung khác đáng lẽ đúng hơn.

Neo cụ thể từng nhánh: [`example.html`](example.html).

---

## 6. VẠCH CẤM

| # | Cấm | Gate |
|---|---|---|
| 1 | Viết bố cục TAY (`flex`/`grid` + `gap-*` trong `className`) ở tầng composite/block/screen thay vì gọi khung | ✅ `check-seams.mjs` |
| 2 | `gap` ngoài thang `0·1·2·3·6·8` (6 bậc `SeamScale`) hoặc `padding` ngoài thang `0·3·6·8` (4 bậc `InsetScale`) | ✅ compiler (union literal) · viết class tay thì ✅ `check-seams.mjs` (gap) và ✅ `check-padding.mjs` (padding + margin của con) |
| 3 | Truyền `gap` vào khung tự sở hữu nhịp hàng (`SurfaceCard.List` và họ hàng — KHÔNG áp cho `Stack`/`Cluster`/`Grid`/`Split`/`Container`, 5 khung này nhận `gap` từ caller là ĐÚNG) | ✅ `check-seams.mjs` (bảng `LIST_FRAMES`) |
| 4 | Chọn SAI khung nhưng vẫn biên dịch được (`StackH`+`justify="between"` thay `Split`; `Cluster` thay `Stack.H` hoặc ngược lại) | ⛔ không gate được — cần đọc ngữ nghĩa. Bằng chứng: 21/21 call-site cần hợp đồng `Split` hiện đều đi vòng qua `StackH` (§3a, §4.2) |
| 5 | Dựng khung MỚI mà chưa grep xác nhận **≥2 ca thật độc lập** dùng đúng comment "chưa có khung cho ca này" | ⛔ không gate được — kỷ luật. Neo LÀM ĐÚNG: `SplitWorkspace` grep ra `ChallengePage` + `PersonalProjectTaskPage` trước khi dựng (§4.4). **Neo NGOẠI LỆ có chủ đích:** `ResponsiveRow` (2026-07-29) dựng với đúng 1 call-site (`StatRibbon`) — không đạt bar `≥2`, nhưng thầy tự chốt sau khi nghe rõ ràng buộc thật (`Grid` cố định cột để trống ô, `Flex` không đổi display-type theo breakpoint, ép vào 1 trong 2 sẽ vỡ hình hoặc phải viết `basis-[calc(...)]` tay — chính thứ canon chống). Ghi lại để lần sau KHÔNG lấy đây làm tiền lệ "1 ca là đủ" — đây là thầy chốt tay từng ca, không phải hạ bar chung. |
| 6 | Khung MỚI tự mở `@container` và đặt `padding` trên CÙNG một element (bẫy §4.3) | ⬜ **CHƯA — gate cần viết**: quét mọi file `frames/*.tsx` khai `"@container"` trong cùng chuỗi `className` với `PADDING_CLASS[...]`/`p-*` trên cùng một node JSX |
