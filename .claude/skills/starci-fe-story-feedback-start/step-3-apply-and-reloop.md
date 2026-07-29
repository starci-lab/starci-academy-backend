# B3 — ÁP SỬA + LẶP LẠI

> **Phạm vi:** một vòng. Đây là bước DUY NHẤT của lane được ghi vào code.

Thầy phản hồi ma trận ở B2, trò áp đúng phần đã duyệt, verify, ghi sổ, rồi quay lại B2 quét
lại — **không phải quét phần còn lại, mà quét lại từ đầu**.

---

## VÀO

`round-<n>.md` đã trình + phản hồi của thầy.

## LÀM

**1. Đọc phản hồi cho đúng ba loại.** Ba loại này xử khác hẳn nhau, gộp là hỏng:

| Thầy nói | Nghĩa | Làm gì |
|---|---|---|
| "sửa đi" / "ok" / "chốt" trên một ô | duyệt ô đó | áp |
| "không, cái này để nguyên" | bác ô đó | **ghi lý do vào `session.md`** — vòng sau đừng đề xuất lại |
| bằng chứng mới (ảnh, ví dụ đối chứng, nguồn khác) | phán quyết của trò có thể sai | **đi kiểm chứng bằng số đo**, rồi kết luận theo bằng chứng |

Với loại thứ ba: **không đổi ý theo cảm tính, cũng không cố thủ giữ ý mình.** Hai lỗi đối xứng
đều bị cấm. Đi đọc DOM/CSS thật (đừng đoán từ ảnh chụp), rồi nói kết luận kèm số. Thấy thầy
đúng thì xác nhận **kèm bằng chứng**, không phải "vâng thầy đúng". Thấy chưa khớp thì nói rõ
lệch ở đâu để thầy quyết.

⚠️ Ô nào thầy **không nhắc tới** thì **không phải là đã duyệt**. Nó vẫn treo. Hỏi lại hoặc để
sang vòng sau — im lặng không bao giờ là đồng ý.

**2. Áp đúng phần đã duyệt, không hơn.** Sửa đúng ô đã chốt, đúng tầng đã trình ở B2. Thấy chỗ
khác giống hệt cũng **không tiện tay sửa** — nó nằm ở mục `ngoài-phạm-vi`, chờ thầy mở vòng
riêng.

Đổi ý giữa chừng về cách sửa (thấy cách khác hay hơn lúc đang gõ) ⇒ **dừng, trình lại**, đừng
tự đổi rồi báo sau.

**3. Verify.** Theo đúng thứ tự này, và đừng bỏ bước nào vì "chắc không liên quan":

```bash
npx tsc --noEmit
node scripts/check-no-namespace.mjs && node scripts/check-story-ids.mjs && node scripts/check-seams.mjs && node scripts/check-inline-types.mjs && node scripts/check-padding.mjs && node scripts/check-one-instance-per-state.mjs && node scripts/check-member-as-state.mjs && node scripts/check-orphan-parts.mjs && node scripts/check-passthrough-block.mjs && node scripts/check-deps-coverage.mjs
npx eslint .storybook
```

⚠️ `check-story-coverage.mjs` là cổng thứ 11 và **đang chết** — đừng chạy, đừng sửa cho xanh.
Nó đòi bản vẽ phải soi gương công trình, đo 2026-07-29 báo thiếu 162/162 nên không mang tin gì.

**Rồi ĐO LẠI DOM** đúng những giá trị vừa sửa, so với `baseline.json`. Cổng xanh **không chứng
minh** hình đúng: lỗi tầng layout không làm vỡ `tsc` vì class Tailwind sai tên thì im lặng không
sinh CSS. Neo 2026-07-29: `Container` có bug container-query không bao giờ fire, mà `tsc` + cả
mười cổng + eslint đều xanh.

Có thêm/xoá/đổi tên file story thì **restart Storybook** (watcher Windows kẹt), xác nhận bằng
`curl -s http://localhost:6006/index.json`.

⚠️ Sau khi restart mà tab cũ vẫn báo lỗi khớp code **trước khi sửa** ⇒ đó là chunk HMR ôi, không
phải bug. **Mở tab MỚI**, đừng navigate lại tab cũ.

**4. Ghi sổ vòng vào `session.md`** — ngay bây giờ, không để dồn tới cuối phiên:

```markdown
### Vòng <n> — <ngày>
- duyệt và đã áp: <ô nào> → <file:dòng>
- thầy bác: <ô nào> — lý do: <ghi lại, vòng sau đừng đề xuất lại>
- còn treo: <ô thầy chưa nhắc tới>
- verify: tsc sạch · 10/10 cổng · eslint sạch · DOM đo lại: <trước> → <sau>
- canon có cần đổi không: <có/không, nếu có thì trục nào và vì sao>
```

Dòng cuối là thứ `starci-fe-story-feedback-end` sẽ đọc. Bỏ trống nó là bỏ mất lý do phiên này
tồn tại.

## CỔNG ĐO

- Mọi ô đã áp đều có `file:dòng` thật.
- `tsc` sạch · 10/10 cổng xanh · eslint sạch.
- DOM đo lại **khác baseline đúng ở chỗ đã sửa**, và không khác ở chỗ khác. Khác chỗ khác nghĩa
  là sửa lan ra ngoài phạm vi — báo ngay.
- `session.md` đã có mục vòng này.

## RA

Báo thầy: đã áp gì · thầy bác gì · còn treo gì · verify ra sao · số đo trước sau.

## DỪNG KHI

⛔ **Luôn luôn — chờ thầy quyết đi tiếp hay dừng.**

- Thầy muốn thêm vòng ⇒ quay lại [B2](step-2-sweep-15-axes.md) và **quét lại ĐỦ 15 trục từ
  đầu**, không phải quét nốt phần dở. Sửa xong thì hình đổi, mà hình đổi thì trục khác có thể
  vừa lệch đi — đây chính là lý do vòng lặp tồn tại.
- Thầy muốn thêm/bớt vùng ⇒ quay lại [B1](step-1-select-regions.md).
- Thầy gọi dừng ⇒ chạy `starci-fe-story-feedback-end`.
