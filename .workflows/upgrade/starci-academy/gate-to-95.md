<!-- starci-workflow: v2 -->

# gate-to-95

> **Đổi thước đo — 2026-08-17.** Tên file giữ nguyên vì nó là hồ sơ, nhưng **95% không còn là cửa
> dừng**. Lý do ở mục 0 ngay dưới. Phần còn lại của bản này viết trước khi đo lượt một; nó vẫn đúng
> về thứ tự sửa và về cách chống học vẹt, chỉ sai ở chỗ đặt một con số phán đoán làm điều kiện dừng.

## 0. Vì sao 95% không làm cửa dừng được

Lượt một đo được: layouts 46% · blocks 54% · principles 34% · patterns 59% · lints 68%.

Về số học thì 95% không vô vọng — trong 76 mục hụt có ~15 luật ảnh hưởng nhiều trang, ~12 luật một
trang, và 8 chỗ phải hỏi ngược. Nhưng có **hai loại điểm**, và chỉ một loại chịu nổi con số ấy.

**Loại máy đo được thì 100% đạt được, vì nhị phân.** Chuỗi lớp có nằm trong union đóng không. Host có
thuộc mười một thẻ không. `LeafProps` có đúng ba slot không. `eslint` xanh hay đỏ. Không có chỗ cho
phán đoán nên không có chỗ cho nhiễu.

**Loại phán đoán thì 95% nằm trong sai số của chính người chấm.** 165 mục, 95% nghĩa là tối đa tám
mục sai. Người chấm là một agent, và hạng `KHÁC MÀ ĐƯỢC` là hạng chủ quan nhất trong bốn hạng.

Bằng chứng lấy ngay từ phiên đo này, không phải lo xa: `gate-health.mjs` báo 18 dòng treo, rồi 149,
sự thật là 4. Và hai "mâu thuẫn canon" trong báo cáo lượt một đều là **dương tính giả** — `tokens.mjs`
soi đúng `classes`, và 285 trên 285 file có `meta` đều có block doc, tức 0 vi phạm chứ không phải 38.
Suýt đi sửa canon đang đúng. Dụng cụ còn lệch cỡ đó thì tranh 95% với 92% là tranh về nhiễu.

## 0b. Thước đo thay thế

| Gate | Thước | Ngưỡng |
|---|---|---|
| `layouts`, `blocks` | **conflict 0 · guess 0** | tuyệt đối |
| `principles`, `patterns`, `lints` | phần **máy kiểm được** | **100%**, nhị phân |
| cả năm | điểm phán đoán | **báo cáo, không đặt ngưỡng** |

Đo bằng `node scripts/gate-health.mjs`, thoát 0 khi sạch.

**conflict** là hai luật cùng áp một tình huống ra hai kết quả, cộng bốn dạng cấu trúc rẻ hơn: dòng
định tuyến không có chủ, link tới file không có, module thiếu record, neo trỏ repo đã nghỉ.
**guess** là một dòng agent mù phải bịa vì gate im, gom từ mục `GATE IM LẶNG Ở ĐÂU` của mọi proof.

Một hàng cố ý không có chủ — lối thoát khi không archetype nào vừa — ghi `by design` để máy đo phân
biệt với một lỗ hổng. Không có phân biệt đó thì cửa dừng không bao giờ mở, và một cửa không mở được
thì không phải cửa.

**Một gate 95% mà còn hai luật cãi nhau tệ hơn một gate 80% không mâu thuẫn.** Cái sau sai ở chỗ
biết trước; cái trước sai ở chỗ không ai đoán nổi.

Điểm phần trăm vẫn chạy mỗi vòng và vẫn đọc, vì nó cho biết hướng đi đúng hay sai. Nó chỉ không làm
cửa, vì nó không đủ chắc để làm cửa.

**Mốc 2026-08-17:** conflict **0** · guess **26** (patterns 3, lints 23).

---

Đưa **cả năm gate** đạt mục tiêu, và làm cho con số ấy nói lên điều gì thật.

Mốc hiện có: hai gate đầu, 6 màn, 165 mục — 85 TRÚNG · 4 KHÁC MÀ ĐƯỢC · 42 LỆCH · 34 THIẾU = **52%**.
Ba gate sau chưa có số. Proof ở `fe/layouts/proofs/` và `fe/blocks/proofs/`.

---

## 1. Vấn đề đo, phải giải trước mọi thứ khác

### Điểm nối chuỗi tụt dốc, và nó không nói gate nào hỏng

Gate 3 nhận đầu ra gate 2. Gate 2 sai thì gate 3 sai theo dù luật của nó hoàn hảo. Đo nối chuỗi rồi
kết luận "gate 5 tệ nhất" là kết luận về vị trí trong hàng, không phải về chất lượng luật.

Minh hoạ độ lớn: nếu cả năm gate cùng đạt 95% một cách độc lập, phần việc phụ thuộc chuỗi còn khoảng
`0.95⁵ ≈ 77%`. Đó là lý do ba gate sau phải đạt **100%**, không phải 95%: khi ba gate cuối không đẻ
lỗi mới, nối chuỗi còn `0.95 × 0.95 ≈ 90%`, và 95% đầu-cuối trở nên với tới được. Siết chặt ba gate
đóng chính là thứ cứu con số đầu-cuối.

### Nên mỗi gate có hai điểm

| Điểm | Đầu vào | Dùng để |
|---|---|---|
| **Độc lập** | đầu vào ĐÚNG lấy thẳng từ fixture | vặn luật. Đây là điểm chịu mục tiêu 95% |
| **Nối chuỗi** | đầu ra thật của gate trước | báo cáo trung thực. Không đặt mục tiêu |

Không tách hai điểm này thì mọi lỗi dồn về gate cuối, và ta đi sửa `lints` trong khi thủ phạm là
`layouts`.

### Mục tiêu theo gate, không phải một con số cho tất cả

Ba gate sau có **không gian lời giải đóng**. Lỗi của chúng không phải "không biết lựa chọn đó tồn
tại" mà là "chọn nhầm trong tập đã liệt kê". Đó là loại lỗi dễ chữa hơn hẳn.

| Gate | Không gian | Chấm bằng | Mục tiêu độc lập |
|---|---|---|---|
| `layouts` | mở, 4 archetype | người | **95%** |
| `blocks` | mở, 5 archetype | người | **95%** |
| `principles` | đóng: `LayoutClassName`, 11 `ContractHost` | **máy** | **100%** |
| `patterns` | đóng: `LeafProps` 3 slot, `BlockProps` 2 slot | **máy** | **100%** |
| `lints` | đóng: 17 rule module | **máy** | **100%** |

**Ba gate cuối phải là 100%, không phải 95%.** Không gian lời giải của chúng đóng: một chuỗi lớp
ngoài `LayoutClassName`, một props có bốn slot, một mã vi phạm `SPLIT-1` đều **sai khách quan**, không
phải "khác mà được". Chấp nhận 98% ở đây là chấp nhận 2% sai mà mình biết rõ là sai và đo được.

Hai gate đầu ở 95% vì chúng có `KHÁC MÀ ĐƯỢC` thật — nhiều bố cục cùng phục vụ được một yêu cầu.

### Bỏ trường `why`

`why` sinh ra khi lý do không có chỗ nào khác để ở. Có chuỗi gate rồi thì lý do **nằm trong chính
đường suy dẫn**: node này tồn tại vì gate 2 đặt khối đó vào vùng đó, vì gate 1 nói vùng đó giữ thứ
đứng yên, vì yêu cầu nói người xem cần thấy nó bất kể đang làm gì. Chép lại thành một câu văn là ghi
sự thật hai lần, và lần thứ hai sẽ lệch trước.

Bỏ nó có ba cái được: gate 3 hết phần văn xuôi nên **chấm máy được trọn vẹn**, không còn 292 câu phải
tự tay giữ cho khỏi cũ, và lý do không còn hai nguồn để mâu thuẫn nhau.

Sâu hơn nữa: chuỗi **phân giải về một contract**, và một contract đã tự nói nó là gì. Luật đặt tên
nằm ngay trong `contracts/index.ts:8-13`:

> `card` is not a name here — it says nothing about what goes inside, so anything can, and the entry
> stops constraining anything. `title-with-baseline-fact` says what it holds, so a wrong child is
> visible on sight.

Một key đặt đúng cộng với các slot có kiểu **đã là lý do, ở dạng kiểm được**. Câu `why` đứng cạnh nó
chính là thứ mà doc của `why` cấm: lặp lại tên key.

**Hệ quả: luật đặt tên trở thành thứ chịu lực.** Trước đây một key mờ nghĩa còn được câu `why` che
cho; bỏ `why` rồi thì key mờ nghĩa là lỗi thật, không phải chuyện thẩm mỹ. Và nó bắt được bằng máy ở
mức hữu ích: một key chỉ có một danh từ chung — `card`, `row`, `box`, `wrapper` — là dấu hiệu key
chưa nói nó chứa gì.

Đó là phép kiểm thay thế, và nó chặt hơn câu văn nó thay: một câu `why` sai không ai phát hiện, còn
một key sai thì đứa con sai lộ ra ngay khi nhìn.

---

## 2. Trần thật: ba loại hụt, ba cách chữa

| Loại | Chữa bằng | Có tính vào 95% không |
|---|---|---|
| Gate im lặng | thêm luật | có |
| Gate tự mâu thuẫn | chọn một vế, bỏ vế kia | có |
| Gate sai | sửa hoặc rút | có |
| **Yêu cầu im lặng** | **câu hỏi ngược** | có, **nếu hỏi đúng câu** |

Tám mục thuộc loại cuối: thông tin không có trong yêu cầu, không luật nào suy ra nổi. Viết luật ở đó
là bịa, và gate chuyển từ *thành thật bí* sang *tự tin sai*.

**Luật chấm, và nó quyết định 95% có đạt nổi không:**

> Mục "yêu cầu im lặng" tính **TRÚNG** khi gate **hỏi đúng câu hỏi**, tính **LỆCH** khi gate tự chọn
> một đáp án.

Fixture ghi sẵn câu nào bắt buộc phải hỏi. Không có luật này thì trần lý thuyết là 95% và phần còn
lại chỉ là dạy gate đoán mò cho khéo.

---

## 3. Chống học vẹt

Ba trang là tập nhỏ. Vặn đủ lâu thì 95% đến bằng cách nhớ đáp án rồi gãy ở trang thứ tư.

**Xoay vòng niêm phong.** Mỗi vòng chỉ đọc proof của hai trang; trang thứ ba niêm phong và điểm tính
trên nó.

| Vòng | Được đọc | Niêm phong |
|---|---|---|
| 1 | dashboard, courses | course-details |
| 2 | courses, course-details | dashboard |
| 3 | course-details, dashboard | courses |

**Fixture đóng băng.** `EXPECTED OUT` viết một lần. Sửa nó cho khớp luật mới là tự chấm điểm cho mình.

**Người chấm không phải người sửa**, và không được thấy diff luật.

**Mọi luật thêm vào phải có neo** — một dòng `REJECTED` thật, hoặc một `file:dòng` trong
`starci-academy-fe`. Luật viết ra chỉ để qua một mục chấm là học vẹt dạng tệ nhất.

---

## 4. Kế hoạch theo gate

### Gate 1 · layouts — 41-61% → 95%

**Vòng A, không thêm luật nào.** Bỏ cái hỏng trước, vì luật sai tệ hơn luật thiếu.
- Rút hoặc thu hẹp `L1`: `ShellNav` mount ở 6 route-group layout, đúng chỗ `L1` cấm. Luật gốc chỉ nói
  về owner **giữ trạng thái sống qua điều hướng**, đã bị khái quát quá tay.
- `L4`, `L6` không màn nào kiểm được. Không xoá — chúng có neo trong kho phán quyết. Ghi vào `## Owed`
  là cần một màn chứng minh.

**Vòng B, bốn luật đòn bẩy.**
| Luật | Màn |
|---|---|
| Overlay mount ở page owner như sibling; khối chỉ phát ý định mở | 4 |
| Nhánh hẹp khai cho MỌI archetype; rail đổi thành thanh dính đáy chỉ khi rail chứa một CAM KẾT | 3 |
| Khai rõ ngưỡng là viewport hay container; mặc định viewport | 3 |
| Một trang được phép mang nhiều tầng archetype cùng lúc | 2 |

### Gate 2 · blocks — 41-62% → 95%

**Vòng A, gỡ mâu thuẫn.**
- `standing-figure` "không có failed riêng" đụng thang state chuẩn. Chọn một vế.
- `standing-offer` "control vắng mặt chứ không disabled" đụng "pending là cây ready với isLoading".
- Trả `B7` về `patterns` — nó là luật tầng file, đặt nhầm nhà.
- Bù vế thiếu của `B6`: chỉ có "khi nào gộp", thiếu "dấu hiệu nào bắt phải tách". Hai lần viện dẫn
  đều ra kết luận sai.

**Vòng B, bốn luật đòn bẩy.**
| Luật | Màn |
|---|---|
| Cặp `component.tsx` thuần / `index.tsx` connected; nửa connected gọi **không prop** | 6 |
| `restingCount` khai ở contract, khối đọc ngược; là số hàng điển hình một lần trả, không phải page size | 5 |
| Khối tự sở hữu request khi **số lượng request đổi theo dữ liệu** | 4 |
| Chỉ cụm **tự đọc dữ liệu** mới có thang state; cụm nhận chuỗi đã chốt là **slot có / slot vắng** | 3 |

### Gate 3 · principles — chưa đo → **100%**

Không gian đóng, nên lỗi là **chọn nhầm thành viên hợp lệ**, không phải không biết lựa chọn tồn tại.
Cách chữa khác hẳn hai gate trên: không thêm luật, mà thêm **tiêu chí chọn**.

Ba phép kiểm bằng máy, chạy được ngay, cả ba phải 100%:
1. chuỗi lớp có nằm trong `LayoutClassName` không — nhị phân
2. `host` có thuộc 11 tag hợp lệ không — nhị phân
3. contract key có đúng cái mà tình huống này sinh ra không

**100% ở đây là một khẳng định kiểm được, không phải một lời hứa:** mọi chuỗi lớp mà app thật đang
dùng đều phải suy ra được từ một `Situation Code` nào đó. Bảng `Situation Codes` chính là hàm ánh xạ
tình huống sang lớp. Nếu app có một lớp mà không mã tình huống nào sinh ra nó, **bảng có lỗ**, và cái
lỗ đó đo được bằng một script quét ngược.

Đó là phép kiểm đáng viết đầu tiên: đọc mọi chuỗi lớp trong `starci-academy-fe`, đối chiếu với bảng
`Situation Codes` của `fe/principles/`, liệt kê lớp nào không có chủ. Con số đó chính là khoảng cách
tới 100%.

### Gate 4 · patterns — chưa đo → **100%**

Cũng đóng, và chấm bằng máy được nhiều hơn: `plugins/eslint-canon/the-split.mjs` đã có sẵn `SPLIT-1`
và `SPLIT-5`. Chạy đúng hai rule đó lên mã sinh ra là ra pass/fail, không cần ai phán.

Bốn phép kiểm, cả bốn phải 100%: split đúng nửa nào làm gì · `LeafProps` đúng 3 slot và `BlockProps`
đúng 2 · không lọt `className` hay `children` · data khai bằng `type` không `interface`.

Cả bốn đều nhị phân. Một props có `className` không phải "hơi khác chuẩn", nó phá cái hàng rào mà
`props.ts:45-46` dựng lên: *"No `className`: a caller who can restyle a node has become its second
owner."*

### Gate 5 · lints — chưa đo → 100%

Gate duy nhất chấm được hoàn toàn bằng máy. Hiện đang soi bằng mắt, tức điểm do một agent tự cho.

**Việc trước tiên là làm nó khách quan**, và nó cần thầy cho phép: ghi mã sinh ra vào một thư mục tạm
trong `starci-academy-fe` rồi chạy `npx eslint` trỏ vào đó. Không có bước này thì mọi con số của gate
5 đều là ý kiến.

---

## 5. Thứ tự làm

**Bước 0 — dựng năm `gate.schema.json`.** Chưa file nào tồn tại. Không có hợp đồng I/O thì không đo
được gate độc lập, vì không biết "đầu vào đúng" trông thế nào.

**Bước 1 — dựng máy chấm cho gate 3, 4, 5.** Ba script. Làm trước khi vặn luật, vì điểm khách quan
biến việc vặn luật từ tranh luận thành đo đạc.

**Bước 2 — chạy phép thử độc lập cho cả năm gate.** Mỗi gate nhận đầu vào đúng từ fixture. Đây là mốc
thật đầu tiên của ba gate sau.

**Bước 3 — vòng A cả hai gate đầu.** Chỉ bỏ cái hỏng, không thêm luật. Đo lại.

**Bước 4 — vòng B, theo đòn bẩy.** Tám luật đã liệt kê, sửa theo thứ tự số màn.

**Bước 5 — mười luật một-màn còn lại**, và tám câu hỏi ngược viết vào `gate.schema.json` dưới trường
`asks`.

**Bước 6 — xoay vòng niêm phong** cho tới khi đủ điều kiện dừng.

---

## 6. Điều kiện dừng

Không phải "đạt số một lần". Bốn điều cùng lúc:

1. **Điểm độc lập đạt mục tiêu từng gate** — **95 / 95 / 100 / 100 / 100** — trên trang **niêm phong**,
   ba vòng xoay liên tiếp, tức mỗi trang từng bị niêm phong ít nhất một lần. Ba con số 100 là nhị
   phân: một mục sai là chưa đạt, không có làm tròn.
2. **Không luật nào thiếu neo.**
3. **Không mâu thuẫn nội bộ** — không hai câu luật nào cùng áp một tình huống ra hai kết quả.
4. **Mục "gate im lặng" về 0** cho ba trang. Mục "yêu cầu im lặng" không cần về 0, nó chuyển thành
   câu hỏi.

Đạt 1 mà trượt 2 là học vẹt. Đạt 1-3 mà trượt 4 nghĩa là còn chỗ gate đang đoán mà chưa ai biết.

**Điểm nối chuỗi được báo cáo nhưng không đặt mục tiêu.** Nó là hệ quả của năm điểm độc lập, và ép nó
lên 95% sẽ buộc mỗi gate phải quanh 99% — mức không thực tế ở hai gate đầu.

---

## 7. Nợ

| Nợ | Xoá bằng |
|---|---|
| Năm `gate.schema.json` chưa tồn tại | mỗi shelf một file, `output` `$ref` sang `input` shelf kế |
| Gate 3, 4, 5 chưa có máy chấm | ba script, dùng `contracts/index.ts` và `plugins/eslint-canon/` |
| Gate 5 chấm bằng mắt | xin phép ghi mã sinh ra vào thư mục tạm rồi chạy `eslint` thật |
| 95 file còn khai `template: *-v2` | bỏ hậu tố, sửa ba regex trong `validate-design-modules.mjs`, chạy `npm run validate` |
| Ba trang là tập nhỏ | thêm trang thứ tư founder tự tin, làm tập kiểm cuối chưa từng vặn theo |
| `fe/layouts/` và `fe/blocks/` chưa có module nào | shelf mới chỉ có `proofs/`; luật đang nằm trong prompt của phép thử, chưa thành module |
