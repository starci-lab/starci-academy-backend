# B2 — QUÉT ĐỦ 15 TRỤC

> **Trục nạp:** **PHẦN A** của cả mười lăm trục, xem
> [`principles/INDEX.md`](../../fe/principles/INDEX.md)
> **Phạm vi:** mọi vùng đã chọn ở B1, **lặp lại đầy đủ ở MỖI vòng**. Read-only — bước này chỉ
> đề xuất, không sửa.

Đây là bước lõi. Ra một **ma trận vùng × trục**, và ma trận đó **không được có ô trống**.

## Hai nhịp con: B2a triage rẻ trước, B2b đào sâu chỉ ở ô nghi ngờ

Neo 2026-07-29: quét đủ 15 trục × 5 vùng bằng cách cho MỖI trục một agent đọc đủ 6 file source
+ viết lý lẽ dài tốn **~1,7 triệu token một lượt** — phần lớn số đó đổ vào những ô mà kết cục
vẫn là `ĐẠT`. Đọc sâu cho một ô rồi kết luận "không có gì sai" là chi phí thật nhưng không mang
tin gì mới. Tách làm hai nhịp để chỉ trả chi phí đọc sâu ở đúng chỗ có khả năng sai:

| Nhịp | Đọc gì | Model | Ra gì |
|---|---|---|---|
| **B2a · triage** | CHỈ **Phần A** của trục (§1 thang, §2 cây) + số đo DOM đã có sẵn (`baseline.json`/vùng đã đo). **KHÔNG đọc file source.** | `sonnet`, effort mặc định | mỗi ô: `CHẮC ĐẠT` hoặc `NGHI NGỜ` |
| **B2b · đào sâu** | Phần A + **Phần B** (§3 vét cạn, §4 bẫy, §5 neo) + toàn bộ file source liên quan | `sonnet` | phán quyết cuối `ĐẠT`/`LỆCH`/`CÂM`/`N/A`, đủ bằng chứng như mục "Mỗi ô ma trận" dưới |

**B2a chạy cho MỌI ô** (15 trục × N vùng) — đây là bước không được bỏ, vì chính B2a là thứ giữ
lời hứa "không sót trục nào". **B2b chỉ chạy cho ô B2a đánh `NGHI NGỜ`** — số ô này thường nhỏ
hơn nhiều so với tổng, đó là chỗ tiết kiệm thật.

🧭 **Phép thử `CHẮC ĐẠT` — chỉ được gắn khi CẢ BA đúng, thiếu một thì phải là `NGHI NGỜ`:**
1. Số đo DOM khớp **chính xác** một hàng trong bảng thang §1 (không phải "gần đúng" hay "có vẻ
   hợp lý").
2. Câu hỏi trong cây §2 trả lời được dứt khoát chỉ bằng số đo đang có, không cần đọc thêm điều
   kiện nào từ source (vd không cần biết "icon này TRẦN hay TRONG Ô" mà phải đoán).
3. Giá trị không rơi vào một **cặp dễ lẫn đã biết** (nếu §1/§2 của trục có nhắc một cặp thường
   bị nhầm gần giá trị đang xét, tự động chuyển `NGHI NGỜ`, kể cả khi câu 1-2 đều qua).

Ba dấu hiệu bắt buộc `NGHI NGỜ`, không được tự tin gắn `ĐẠT`: giá trị số đo và giá trị bảng
**gần nhưng không khớp hệt** · nguồn số đo (DOM) và câu hỏi cây đòi hỏi bối cảnh mà B2a không có
sẵn (vd cần biết vendor có ghi đè className không — B2a không đọc source nên không biết) · trục
này từng có neo lỗi thật trong Phần A (mọi trục có mục "BẪY" trong Phần A tóm tắt/trỏ tới, coi
là tín hiệu rủi ro cao).

⚠️ **Thà `NGHI NGỜ` nhầm còn hơn `ĐẠT` nhầm.** B2a sai theo hướng cẩn trọng thì tốn thêm một
lượt B2b không cần thiết — phí nhưng an toàn. B2a sai theo hướng liều thì một ô `LỆCH` thật biến
mất khỏi ma trận vĩnh viễn, đúng lỗi mà cả lane này dựng ra để chặn.

## Chạy B2 qua Workflow (nhiều vùng cùng lúc): gom theo TRỤC, không theo VÙNG

Neo 2026-07-30 (mở đồng thời `QuizPage` + `MockInterviewPage`, 16 vùng): lượt đầu dựng Workflow
theo **VÙNG** — mỗi vùng một agent, và MỖI agent đó tự đọc lại cả 15 file `context.md`. Cùng một
bộ tài liệu tĩnh (Phần A của 15 trục) bị đọc lặp **16 lần**, và B2b (nếu chạy một-ô-một-agent)
sẽ nổ tới **240 agent** cho ma trận 16×15. Thầy chốt thẳng: *"này đốt token quá"*.

**Đường đúng: đảo trục thành ĐƠN VỊ FAN-OUT, vùng thành dữ liệu inline.**

| | Sai (theo VÙNG) | Đúng (theo TRỤC) |
|---|---|---|
| B2a | 1 agent / vùng, mỗi agent đọc lại cả 15 file canon | 1 agent / trục, đọc ĐÚNG 1 file canon, phán cho **mọi vùng cùng lúc** bằng props/baseline đã có sẵn (inline trong prompt, không phải file cần mở) |
| Số agent B2a | N vùng | **15**, cố định, không phụ thuộc N vùng |
| Số lượt đọc canon | N vùng × 15 trục | **15**, đúng bằng số trục |
| B2b | 1 agent / ô NGHI NGỜ | 1 agent / trục **có ít nhất một ô NGHI NGỜ**, gom hết các vùng nghi của trục đó vào MỘT lượt đọc Phần A+B |
| Số agent B2b (tệ nhất) | N vùng × 15 trục | **15** (thường ít hơn — chỉ trục nào có ô nghi) |

Lý do đảo được: 15 file `context.md` là **tài liệu tĩnh, không đổi theo vùng** — đọc một lần dùng
được cho mọi vùng trong CÙNG một lượt gọi agent. Ngược lại, props/baseline của một vùng là **text
ngắn, rẻ** (đã có sẵn từ B1/B0, không cần mở file để lấy) — nên đưa thẳng vào prompt dạng inline
cho mọi agent trục, không bắt agent tự đi đọc lại.

⚠️ **Không áp dụng khi chỉ có 1-2 vùng** — lúc đó theo-vùng và theo-trục tốn ngang nhau, đừng vẽ
kiến trúc thừa cho việc nhỏ. Chỉ đảo khi số vùng ≥ số trục (15), vì đó là lúc chiều lặp thắng thế.

## Nạp hai tầng, không nạp cả bộ

Mỗi `context.md` chia hai tầng đọc (2026-07-29). Quét theo đúng hai nhịp này:

| Nhịp | Nạp gì | Để làm gì |
|---|---|---|
| **Phát hiện** | **PHẦN A** của cả 15 trục (§1 thang · §2 cây · §6 vạch cấm) | điền phán quyết cho mọi ô của ma trận |
| **Tra sâu** | **PHẦN B** của **đúng trục ra `LỆCH`** (§3 vét cạn · §4 bẫy · §5 neo) | lấy phép phân định và cách sửa cho ô đó |

⚠️ **Đừng nạp PHẦN B của trục ra `ĐẠT` hoặc `N/A`.** Cả bộ là 2 580 dòng, dài hơn
`principles.md` đã bị khai tử vì quá dài; nạp hết mỗi vòng là tái lập đúng bệnh đó. Riêng Phần A
của 15 trục là 1 243 dòng, vừa sức nạp trọn — và Phần A đã đủ để **phát hiện**, đó là toàn bộ
việc của nhịp đầu.

---

## Vì sao phải vét cạn, không được quét "chỗ nào thấy nghi"

Đo 2026-07-29: một caret trong control render sai một bậc cỡ, trong khi `tsc` sạch, **cả mười
cổng xanh**, eslint sạch. Không cổng nào phủ trục `icon`, nên không có gì đỏ lên cả.

Quét theo linh cảm tái lập đúng điểm mù đó — linh cảm chỉ nhìn vào chỗ mình đã biết là hay sai.
Ma trận là thứ làm chỗ sót **lộ ra thành một ô trống**, thay vì im lặng biến mất.

⚠️ **B2a/B2b không phải "quét theo linh cảm" — đọc kỹ khỏi lẫn.** B2a vẫn chạy CHO MỌI ô, không
bỏ trục nào; nó chỉ đổi ĐỘ SÂU đọc (Phần A thay vì Phần A+B+source), không đổi ĐỘ RỘNG (vẫn đủ
15×N ô). "Quét theo linh cảm" mà luật này cấm là chọn TRƯỚC một tập con trục để quét, dựa vào
chỗ mình đoán hay sai — khác hẳn quét đủ rồi phân loại độ tin cậy sau.

Cùng ngày còn một neo nữa cho thấy phép đếm không thay được phép vét: *"5/5 call-site đều
`size-4`"* là phép đếm ĐÚNG nhưng đọc SAI, vì năm chỗ đó không cùng một loại. Đếm mà không tách
theo trục thì con số càng lớn càng dễ dẫn tới kết luận sai.

---

## Thứ tự quét — đừng đảo

Quét theo đúng thứ tự phụ thuộc; trục sau đọc kết quả của trục trước.

```
1  reading-flow  ─┐
2  prominence  ───┼─→ 4 frame ──→ 6 seam ──┐
3  async  ────────┘     ├→ 7 inset ────────┼─→ 15 skeleton
                        └→ 8 surface ──────┘   (soi gương hình
                  5 naming                       đã chốt xong)
   prominence ───→ 9 text ──→ 10 icon
              ├──→ 11 color
              └──→ 12 button ──→ 13 press
                   14 markdown
```

Hai ràng buộc đã trả giá mới rút ra, **cấm đảo**:

- **`icon` sau `text`** — cỡ icon tra theo cỡ chữ nó đứng cạnh. Chốt icon trước rồi chữ đổi cỡ
  là icon đứng lại một mình. Neo `ContentModeNav`, và caret `Select`/`Accordion` 2026-07-29.
- **`skeleton` cuối cùng** — shimmer soi gương một hình, nên hình phải chốt xong. Neo
  `TrialEnrollBanner`: skeleton chép từ block khác, mang theo bug `<div>` nằm trong `<p>`, sống
  nhiều tháng vì chưa từng render thật.

---

## Mỗi ô ma trận

| Phán quyết | Nghĩa | Bắt buộc kèm |
|---|---|---|
| **ĐẠT** | giá trị hiện tại đi qua cây quyết định của trục và ra đúng nó | số đo thật + giá trị cây ra |
| **LỆCH** | cây ra một giá trị khác | bốn thứ ở dưới |
| **CÂM** | trục ÁP ĐƯỢC, nhưng đi hết cây mà **không nhánh nào nhận ca này** | sang [B4 tra cứu](step-4-research-when-silent.md) |
| **N/A** | trục **không áp** cho vùng này | **lý do** — không bao giờ để trống suông |

⚠️ **`CÂM` khác `N/A`, đừng gộp.** `N/A` là *"vùng này không có thứ đó"* (nhãn tĩnh thì không có
đường async). `CÂM` là *"vùng này CÓ thứ đó mà canon không nói phải chọn giá trị nào"* — tức là
một lỗ hổng của canon, và lỗ hổng thì phải hiện ra chứ không được giấu dưới nhãn `N/A`.

⛔ **TRƯỚC KHI ghi `CÂM`, kiểm §5 NEO THẬT của trục đó.** Cây quyết định câm KHÔNG có nghĩa là
canon câm: luật xuyên trục 1 (`principles/INDEX.md`) nói **neo thật ghi đè suy luận**, nên nếu
nguồn thật của CHÍNH component đang xét đã tự trả lời — file `src` gốc, hoặc một comment
`AUDIT`/`⭐`/`thầy chốt` ngay trong file `.storybook` ghi rõ lý do đã chọn giá trị đó — thì ô này
**không phải `CÂM`**, mà là `ĐẠT` (neo giải thích được) hoặc `LỆCH` (neo nói khác cái đang render).
Đọc neo trước, kết luận sau.

Neo của chính luật này (2026-07-30, phiên `ChallengePage/Graded` round-1): hai ô
`ChallengeHeader`×`prominence` và `ChallengeBrief`×`skeleton` bị ghi `CÂM` rồi treo cả phiên —
soi lại thì **cả hai đều tự trả lời được trong đúng file đang xét** (`ChallengeHeader.tsx` có sẵn
đoạn giải thích vì sao `difficulty` chỉ khai 3 tier trong 5 tier thật: bảng màu `EnumChip` chỉ có
5 tone, hai tier còn lại ở `src` dùng palette riêng — tức là một quyết định ĐÃ CÓ, không phải lỗ
hổng canon). Đánh `CÂM` cho một ô đã có neo là tự tạo việc B4 không cần thiết, và tệ hơn: nó báo
sai rằng canon có lỗ hổng ở chỗ vốn không có.

Mỗi ô **LỆCH** phải mang đủ bốn thứ, thiếu một là chưa đủ để trình thầy:

1. **Đang là gì** — số đo thật (`getComputedStyle`), không phải đọc source. Source nói ý định,
   DOM nói sự thật, và hai cái lệch nhau thường xuyên hơn tưởng.
2. **Đúng phải là gì** — giá trị cây quyết định của trục ra, dẫn kèm mục trong `context.md`.
3. **Sửa ở TẦNG NÀO** — và đây là chỗ hay sai nhất, xem luật dưới.
4. **Còn chỗ nào giống vậy** — chỉ liệt tên, chưa đi sửa.

### Luật tầng của cách sửa

**CSS phức tạp** (arbitrary value `[...]`, pseudo-class `group-hover:`/`peer-*`, animation) chỉ
được đóng gói ở **atom · frame · composite** — **KHÔNG BAO GIỜ** ở block hay page.

Một prop `className` sẵn có ở khung **không miễn trừ luật này**. Nếu đề xuất là "nhét CSS qua
`className` có sẵn" thì đó vẫn là vi phạm — quay lại tìm một **prop có tên** hoặc một atom mới.

---

## Đo thế nào

Số đo phải lấy từ DOM thật của story đang chạy, không phải từ đọc file.

```js
(function () {
    const el = document.querySelector('[data-anat-part="<tên vùng>"]')
    const cs = getComputedStyle(el)
    return JSON.stringify({
        fontSize: cs.fontSize, lineHeight: cs.lineHeight, fontWeight: cs.fontWeight,
        gap: cs.gap, padding: cs.padding, borderRadius: cs.borderRadius,
        color: cs.color, rect: el.getBoundingClientRect(),
    }, null, 1)
})()
```

⚠️ **Trước mọi số đo, xác nhận viewport.** `document.hidden` bật hoặc `window.innerWidth` bằng 0
thì mọi rect trả 0 và code lành trông y hệt đang vỡ.

⚠️ **Vendor ghi đè im lặng.** Khai `className` trên một node mà thư viện `cloneElement` nó thì
class của mình **bị nuốt hoàn toàn**, source ghi một đằng DOM ra một nẻo. Neo 2026-07-29:
`Select` khai `size-4` trên icon con, DOM đo ra **14px** vì HeroUI ghi đè bằng slot recipe của
nó. Đây đúng là loại lỗi mà đọc source không bao giờ thấy.

---

## RA

**B2a ra trước, làm căn cứ chọn ô nào vào B2b:**

```markdown
## Triage (B2a) — vòng <n>
| Vùng | flow | prom | async | frame | naming | seam | inset | surf | text | icon | color | button | press | md | skel |
|------|------|------|-------|-------|--------|------|-------|------|------|------|-------|--------|-------|----|----- |
| R1   | ĐẠT  | ĐẠT  | N/A   | ĐẠT   | ĐẠT    | NGHI | ĐẠT   | ĐẠT  | ĐẠT  | NGHI | ĐẠT   | N/A    | ĐẠT   |N/A | NGHI |

Ô NGHI NGỜ vòng này: R1·seam, R1·icon, R1·skel — sang B2b.
```

**B2b ra ma trận cuối, ghi vào `round-<n>.md`:**

```markdown
# Vòng <n> — <ngày>

## Ma trận cuối (B2a "CHẮC ĐẠT" giữ nguyên thành ĐẠT, B2b thay thế các ô NGHI NGỜ)
| Vùng | flow | prom | async | frame | naming | seam | inset | surf | text | icon | color | button | press | md | skel |
|------|------|------|-------|-------|--------|------|-------|------|------|------|-------|--------|-------|----|----- |
| R1   | ĐẠT  | ĐẠT  | N/A   | ĐẠT   | ĐẠT    | LỆCH | ĐẠT   | ĐẠT  | ĐẠT  | LỆCH | ĐẠT   | N/A    | ĐẠT   |N/A | LỆCH |

## Chi tiết ô LỆCH (chỉ từ B2b)
### R1 · icon
- đang: 14px (đo DOM) — source khai `size-4` nhưng HeroUI cloneElement nuốt class
- đúng: `size-5` — vị trí DIV, cạnh `text-sm` ⇒ tra line-height (icon §1c)
- sửa ở: atom `Select.tsx`, chuyển class lên wrapper `Indicator`
- chỗ khác giống: `Accordion.tsx`

## Ô N/A và lý do
- R1 · async: vùng này là nhãn tĩnh, không có đường fetch nào

## Ngoài phạm vi (KHÔNG sửa vòng này)
- `ContentPager` cũng dính đúng pattern caret — ghi sổ, chờ vòng riêng
```

⚠️ **Ma trận cuối phải trọn 15 trục × mọi vùng, dù B2b chỉ chạy trên một phần.** Ô `CHẮC ĐẠT`
của B2a đi thẳng vào ma trận cuối thành `ĐẠT` — không quét lại. Không được để ma trận cuối chỉ
hiện những ô vừa đào sâu, vì thế thì "không còn ô trống" (luật gốc của bước này) lại mất hiệu
lực.

Trình ma trận cuối cho thầy. **DỪNG, chờ thầy phản hồi** — sang B3.

## DỪNG KHI

- Còn **một ô trống** trong ma trận CUỐI ⇒ chưa được trình. Ô trống nghĩa là chưa quét, không
  phải "không có gì" — kể cả khi nó dừng ở B2a với `CHẮC ĐẠT`, vẫn phải có mặt trong ma trận cuối.
- B2a đánh dấu `CHẮC ĐẠT` cho một ô mà không đủ cả ba điều kiện của phép thử ⇒ đó là `NGHI NGỜ`
  bị gắn nhầm, phải đưa vào B2b.
- Một trục ra kết luận cần đổi **canon** chứ không phải đổi code ⇒ ghi vào `session.md` mục
  `còn treo`, nêu rõ với thầy, và **đừng tự sửa `principles/`** — việc đó thuộc
  `starci-fe-story-feedback-end`, và cần hai nguồn độc lập.
- Số đo mâu thuẫn với source ⇒ **tin số đo**, nhưng phải nói ra mâu thuẫn đó, vì nó thường là
  dấu hiệu vendor đang ghi đè.
