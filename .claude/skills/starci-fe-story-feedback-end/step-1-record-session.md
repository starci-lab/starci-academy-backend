# BƯỚC 1 — CHỐT SỔ PHIÊN

> **Phạm vi:** một lần, lúc thầy gọi dừng.

Gộp mọi vòng rời rạc thành một bản ghi **đọc được từ đầu lạnh** — người mở nó sáu tháng sau,
không có context của phiên, vẫn hiểu chuyện gì đã xảy ra và tại sao.

---

## VÀO

Thư mục phiên `.artifacts/feedback/<ngày>-<đích>/` gồm `session.md`, `baseline.json`, và các
`round-<n>.md`.

## LÀM

**1. Kiểm phiên có thật sự chạy đủ không.** Trước khi chốt, soi ba thứ:

- Vòng cuối đã verify chưa (tsc · 10 cổng · eslint · đo lại DOM)?
- Có ô nào **thầy chưa nhắc tới** mà vẫn đang treo không?
- Mục `ngoài-phạm-vi` có gì không?

Thiếu verify ở vòng cuối thì **chạy verify trước**, đừng chốt sổ một phiên chưa xanh.

**2. Viết bản ghi cuối vào cuối `session.md`:**

```markdown
---

## ĐÃ ĐÓNG — <ngày>

### Phiên này sửa gì
<vài dòng văn xuôi: đích là gì, thầy thấy sai chỗ nào, kết cục ra sao>

### Số đo, trước và sau
| Thứ | Trước | Sau |
|---|---|---|
| <giá trị đã sửa> | <baseline> | <đo lại> |

### Từng vòng
| Vòng | Duyệt và áp | Thầy bác (kèm lý do) |
|---|---|---|

### Còn treo — thứ CHƯA làm
<danh sách. Rỗng thì ghi thẳng "không còn gì", đừng bỏ trống mục này>

### Ngoài phạm vi — thấy nhưng cố ý không sửa
<danh sách, kèm lý do vì sao để lại>

### Canon có cần đổi không
<trỏ sang kết quả bước 2>
```

**3. Đổi trạng thái** ở đầu `session.md` từ `ĐANG CHẠY` sang `ĐÃ ĐÓNG — <ngày>`, để bước B0 của
phiên sau không nhặt nhầm nó thành phiên còn dở.

**4. Ghi `audit.md` — bộ nhớ cache cho lần audit sau trên cùng đích.**

```
.artifacts/feedback/<đích-slug>/audit.md
```

(Lưu ý: đường dẫn này KHÔNG có ngày, khác thư mục phiên `<ngày>-<đích-slug>/` — nó sống lâu
hơn một phiên, để phiên sau ở ngày khác vẫn tìm thấy.)

```markdown
# Audit — <đích>, chốt <ngày>

- storyId: <id>
- hash: <hash của tổ hợp DOM đo được + mọi file source đã đọc lúc chốt vòng cuối>

## Ma trận cuối cùng
| Vùng | flow | prom | async | frame | naming | seam | inset | surf | text | icon | color | button | press | md | skel |
|------|------|------|-------|-------|--------|------|-------|------|------|------|-------|--------|-------|----|----- |
(chỉ giữ phán quyết CUỐI của mỗi ô sau khi đã sửa/duyệt — không giữ lịch sử từng vòng, đó là
việc của `session.md`)
```

Chỉ ghi `audit.md` khi **mọi ô `LỆCH` trong ma trận đã được xử lý** (áp sửa, hoặc thầy bác kèm
lý do rồi giữ nguyên có chủ ý). Ô `LỆCH` chưa xử vẫn còn trong `audit.md` thì lần sau B0 đọc
hash khớp sẽ **bỏ qua đúng chỗ cần sửa** — đây là lỗi nghiêm trọng của cơ chế cache, kiểm kỹ
trước khi ghi.

## CỔNG ĐO

- Vòng cuối đã verify xanh.
- Mọi mục trong bản ghi đều có nội dung — mục rỗng phải ghi rõ là rỗng, không được để trống.
- Trạng thái phiên đã đổi sang `ĐÃ ĐÓNG`.
- `audit.md` đã ghi, và **không còn ô `LỆCH` nào trong đó chưa xử lý**.
- Hash trong `audit.md` bao cả DOM lẫn source — không hash source một mình (xem lý do ở B0 §2b).

## RA

`session.md` đã chốt. Báo thầy một đoạn ngắn: phiên sửa gì, số đo đổi thế nào, còn treo gì.

## DỪNG KHI

- Vòng cuối chưa verify ⇒ verify trước, đừng chốt.
- Còn ô treo mà thầy chưa từng nhắc ⇒ **nêu ra trước khi đóng**, hỏi thầy bỏ hay để vòng sau.
  Đóng im lặng là cách một đề xuất bị mất tích.
