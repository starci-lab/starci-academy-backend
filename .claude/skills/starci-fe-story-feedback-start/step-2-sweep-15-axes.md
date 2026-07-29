# B2 — QUÉT ĐỦ 15 TRỤC

> **Trục nạp:** cả mười lăm, xem [`principles/INDEX.md`](../../fe/principles/INDEX.md)
> **Phạm vi:** mọi vùng đã chọn ở B1, **lặp lại đầy đủ ở MỖI vòng**. Read-only — bước này chỉ
> đề xuất, không sửa.

Đây là bước lõi. Ra một **ma trận vùng × trục**, và ma trận đó **không được có ô trống**.

---

## Vì sao phải vét cạn, không được quét "chỗ nào thấy nghi"

Đo 2026-07-29: một caret trong control render sai một bậc cỡ, trong khi `tsc` sạch, **cả mười
cổng xanh**, eslint sạch. Không cổng nào phủ trục `icon`, nên không có gì đỏ lên cả.

Quét theo linh cảm tái lập đúng điểm mù đó — linh cảm chỉ nhìn vào chỗ mình đã biết là hay sai.
Ma trận là thứ làm chỗ sót **lộ ra thành một ô trống**, thay vì im lặng biến mất.

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
| **N/A** | trục không áp cho vùng này | **lý do** — không bao giờ để trống suông |

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

`round-<n>.md` trong thư mục phiên:

```markdown
# Vòng <n> — <ngày>

## Ma trận
| Vùng | flow | prom | async | frame | naming | seam | inset | surf | text | icon | color | button | press | md | skel |
|------|------|------|-------|-------|--------|------|-------|------|------|------|-------|--------|-------|----|----- |
| R1   | ĐẠT  | ĐẠT  | N/A   | ĐẠT   | ĐẠT    | LỆCH | ĐẠT   | ĐẠT  | ĐẠT  | LỆCH | ĐẠT   | N/A    | ĐẠT   |N/A | LỆCH |

## Chi tiết ô LỆCH
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

Trình ma trận cho thầy. **DỪNG, chờ thầy phản hồi** — sang B3.

## DỪNG KHI

- Còn **một ô trống** ⇒ chưa được trình. Ô trống nghĩa là chưa quét, không phải "không có gì".
- Một trục ra kết luận cần đổi **canon** chứ không phải đổi code ⇒ ghi vào `session.md` mục
  `còn treo`, nêu rõ với thầy, và **đừng tự sửa `principles/`** — việc đó thuộc
  `starci-fe-story-feedback-end`, và cần hai nguồn độc lập.
- Số đo mâu thuẫn với source ⇒ **tin số đo**, nhưng phải nói ra mâu thuẫn đó, vì nó thường là
  dấu hiệu vendor đang ghi đè.
