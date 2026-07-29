# B0 — MỞ PHIÊN

> **Phạm vi:** một lần. Read-only.

Dùng chung khuôn file phiên với lane feedback, để `starci-fe-story-feedback-end` đóng được cả
hai lane bằng một đường.

---

## VÀO

Tên màn thầy đưa, kèm hoặc không kèm mô tả.

## LÀM

**1. Chốt chế độ và nhánh nguồn.**

| Hỏi | Ra |
|---|---|
| Màn này đã có trong `.storybook` chưa? | Rồi ⇒ chế độ **SOI**, nhánh C |
| Chưa có, nhưng app có màn thật trong `src/`? | Có ⇒ chế độ **TẠO**, nhánh A |
| Chưa có, app cũng chưa có source? | ⇒ chế độ **TẠO**, nhánh B (sáng tạo từ biz spec) |

Không rõ ⇒ **hỏi thầy**, đừng đoán. Đoán sai nhánh là đi sai từ B1.

**2. Chốt đích ghi.** Màn sinh vào:

```
.storybook/components/<app>/{ pages, layouts, overlays }
.storybook/stories/<app>/…          ← cây story SOI GƯƠNG cây component
```

`<app>` là `starci`, `miamia` hoặc `nivo`. Đo 2026-07-29: `starci` đã có 20 page, 5 layout,
2 overlay; **`miamia` và `nivo` mới có overlay, chưa có page hay layout nào** — đó là chỗ nhánh
B dùng nhiều nhất.

**3. Kiểm tồn đọng.** Quét hai nguồn trước khi làm gì thêm:

- `.artifacts/feedback/` — có phiên nào **chưa đóng** trên cùng màn không? Có thì mở tiếp phiên
  đó, đừng đẻ phiên thứ hai.
- `grep` `.storybook/components/**` — đã có component tên tương tự chưa? Đây là chốt chặn quan
  trọng nhất của lane: **sinh trùng một component đã có là hỏng chính cái design-system đang
  dựng**.

**4. Dựng thư mục phiên** `.artifacts/feedback/<YYYY-MM-DD>-<màn-slug>/` và ghi `session.md`:

```markdown
# Phiên tạo/soi màn — <tên màn>

- chế độ: TẠO | SOI          nhánh: A source | B sáng tạo | C soi
- app: starci | miamia | nivo
- đích ghi: <đường dẫn components + stories>
- mở: <ngày>       trạng thái: ĐANG CHẠY
- component đã có tên gần giống: <kết quả grep, hoặc "không">

## Vùng
(lane này không dùng — phạm vi là cả màn)

## Vòng
(mỗi bước B1..B5 ghi một mục khi xong)

## Ngoài phạm vi
## Còn treo
```

**5. Chế độ SOI thì dựng CLOSURE ngay tại đây.** Đi theo import từ file màn (và mọi file
`_shared` nếu có), xuất danh sách file kèm tầng. **Mọi phép quét ở các bước sau chạy trên
closure này**, không quét cả repo — quét sai phạm vi thì mọi con số sau đều vô nghĩa.

## CỔNG ĐO

- Chế độ và nhánh đã chốt, ghi trong `session.md`.
- Đã grep trùng tên, kết quả ghi lại (kể cả khi không có).
- Chế độ SOI: closure ra danh sách file + tầng, và **không file nào trong closure trỏ
  `_legacy`**.

## RA

Đường dẫn thư mục phiên + một câu tóm tắt: màn nào, chế độ nào, có trùng tên gì không.

## DỪNG KHI

- Nhánh không rõ ⇒ hỏi.
- Grep thấy component tương đương đã tồn tại ⇒ **hỏi thầy reuse hay tách**, đừng tự dựng bản
  thứ hai.
- Tìm thấy phiên cũ chưa đóng trên cùng màn ⇒ hỏi: mở tiếp hay đóng cái cũ rồi mở mới.
