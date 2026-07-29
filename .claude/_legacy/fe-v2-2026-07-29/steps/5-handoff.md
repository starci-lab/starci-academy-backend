# STEP 5 — BÀN GIAO

> Phase 5 của workflow. Gồm **S10**. 1 agent synth.
> Luật cần đọc: [`rules/4-organization.md`](../rules/4-organization.md) §6 (ba bài học về dao gác).

---

## S10 · Viết bàn giao

| | |
|---|---|
| **VÀO** | cổng cuối xanh (Phase 4) |
| **LÀM** | ghi 5 phần: bảng **trước/sau** · việc đã làm theo `file:line` · **nợ còn lại** · **câu chờ thầy chốt** · lệnh chạy lại |
| **CỔNG ĐO** | mọi con số trong báo cáo phải **truy được về một lệnh**. Số nào không truy được thì **bỏ khỏi báo cáo** |
| **RA** | phần thêm vào `continue.md` |
| **DỪNG KHI** | — |

---

## Khuôn báo cáo

### 1. Bảng trước / sau
Chỉ những phép đo đã có trong baseline Phase 0. Không thêm phép đo mới ở cuối — không có số "trước" thì không chứng minh được gì.

| Phép đo | Trước | Sau | Lệnh |
|---|---|---|---|
| … | | | |

### 2. Việc đã làm
Theo `file:line`, gom theo tầng. Mỗi dòng nói **sửa gì** và **vì sao** (neo § hoặc số đo).

### 3. Nợ còn lại
Phân biệt rõ ba loại — người sau xử khác nhau:

| Loại | Nghĩa |
|---|---|
| **nợ ghi sổ** | biết, cố ý để lại (vd 5 link gãy trong `_legacy`) |
| **nợ chưa xử** | trong phạm vi nhưng chưa làm, kèm số lượng chính xác |
| **chờ thầy chốt** | không tự quyết được, kèm phương án đã cân |

### 4. Câu chờ thầy chốt
Mỗi câu: **hiện trạng → hai phương án → con nghiêng cái nào + vì sao**. Không hỏi mở kiểu "thầy muốn thế nào".

### 5. Lệnh chạy lại
Dán được vào terminal, chạy lại đúng bộ đo của báo cáo.

---

## Ba điều PHẢI viết trong báo cáo, dù có ai hỏi hay không

1. **Chỗ luật tự đá nhau** phát hiện được trong phiên — kèm hai câu trích nguyên văn từ hai file.
2. **Chỗ instrument của mình từng sai** và con số sai là bao nhiêu. Người sau tin số của mình, nên phải biết số nào từng phồng.
3. **Gate nào chưa qua negative control** — nếu còn cái nào, ghi thẳng là "chưa đáng tin".

Neo thật cho cả ba: trong ca `CourseContents`, canon `§14d.2` và `screen-playbook` B5 nói ngược nhau về skeleton · 5 bộ đếm từng sai (8188→305 · 49→6 · 154→73 · 993→2 · 663→156) · `check-story-ids` từng báo sạch khi đang mù 10 khai báo.

---

## Ra khỏi Phase 5 khi

- [ ] bảng trước/sau đủ cặp số
- [ ] nợ chia đúng 3 loại
- [ ] mỗi câu chờ chốt có phương án + nghiêng
- [ ] đã ghi 3 điều bắt buộc ở trên
