---
name: starci-fe-story-feedback-end
description: >
  Đóng một phiên feedback đang chạy: chốt sổ phiên trong `.artifacts/feedback/`, rồi CẬP NHẬT
  `principles/` nếu trong lúc feedback lộ ra canon chưa chuẩn. Hai việc, và việc thứ hai mới là
  lý do skill này tồn tại — nếu thầy phải feedback một chuyện mà canon LẼ RA đã trả lời được,
  thì lỗi nằm ở canon, không nằm ở lượt sửa. Skill phân biệt dứt khoát ba ca: canon ĐÚNG mà code
  sai (chỉ sửa code, không đụng canon) · canon CÂM (thiếu hẳn ca này, phải bổ sung) · canon SAI
  (dạy ngược thực tế đo được, phải sửa kèm neo ngày và before/after). Luật chặn phình canon: một
  ví dụ không thành luật, muốn nâng thành luật chung phải có ĐỦ HAI nguồn độc lập, không thì ghi
  rõ là neo vào đúng ca đó. Cập nhật `principles/<trục>/context.md` thì phải cập nhật luôn
  `example.html` của cùng trục, vì hai file đó chia theo NGƯỜI ĐỌC chứ không phải chia nội dung.
  Dùng khi thầy gõ `/starci-fe-story-feedback-end`, hoặc nói "đóng phiên", "xong rồi ghi lại
  đi", "chốt phiên feedback", "ghi canon lại". Cũng dùng để đóng phiên của
  `starci-fe-story-create` vì hai lane dùng chung khuôn file phiên.
---

# /starci-fe-story-feedback-end — đóng phiên, và sửa canon nếu canon sai

> **Canon:** [`fe/principles/INDEX.md`](../../fe/principles/INDEX.md) — 15 trục
> **Chỗ lưu phiên:** `D:/Repositories/starci-academy/.artifacts/feedback/`

## Vì sao skill này tồn tại

Phần ghi sổ là phần dễ. Phần thật là câu hỏi sau đây, hỏi cho từng thứ thầy đã phải feedback:

> **Canon lẽ ra đã trả lời được câu này chưa?**

Rồi mới thấy: **cứ mỗi lần thầy phải feedback một chuyện mà canon đáng lẽ đã chặn được, đó là
một lỗ hổng của canon, không phải một lượt sửa code.** Đóng phiên mà không hỏi câu đó thì phiên
sau thầy lại feedback đúng chuyện ấy.

Phân tích bốn mươi vòng feedback cho thấy **một nửa** số lần thầy phải lên tiếng thuộc loại máy
bắt được. Skill này là chỗ biến từng lần đó thành một dòng luật hoặc một cổng.

## Hai bước

| Bước | Làm gì |
|---|---|
| [1 · chốt sổ phiên](step-1-record-session.md) | gộp mọi vòng thành một bản ghi đọc được, đánh dấu phiên ĐÃ ĐÓNG, và **liệt kê thứ còn treo** |
| [2 · cập nhật canon](step-2-update-principles.md) | phân loại từng feedback thành canon-đúng / canon-câm / canon-sai, rồi chỉ sửa hai loại sau |

Bước 2 **có thể ra kết quả là không sửa gì**. Đó là kết quả hợp lệ và hay gặp — canon đúng, code
sai, sửa code là xong. Ép phải ghi thêm luật sau mỗi phiên là cách chắc chắn nhất để canon phình
lại thành thứ không ai đọc.

## Ba luật chặn canon phình

**Một ví dụ không thành luật.** Muốn nâng một quan sát thành luật canon-wide phải có **đủ hai
nguồn độc lập** cùng ra một kết luận. Chỉ có một thì vẫn ghi, nhưng ghi rõ *"neo vào đúng ca
này"*, không viết thành câu phổ quát.

**Nghi cái NEO trước, đừng nghi cái luật.** Thấy code lệch canon thì khả năng cao là canon
**trích neo nhầm**, không phải luật sai. Neo 2026-07-29: canon dạy Tier A dùng `bold` rồi dẫn
hai file trong `src` đang `semibold` ra làm minh hoạ — mà `src` là công trình, được phép lệch
bản vẽ. Câu tưởng là mâu thuẫn hoá ra chỉ là dẫn chứng sai.

**Sửa `context.md` thì sửa luôn `example.html`.** Hai file của một trục chia theo **người đọc**
(LLM đọc để quyết · mắt người soi), không chia theo nội dung. Sửa một bên là làm hai bên lệch
nhau — đúng cái bệnh mà cấu trúc này sinh ra để chặn.

## Luật cứng

- **Không tự chốt thay thầy.** Đề xuất sửa canon phải trình cho thầy duyệt trước khi ghi.
- **`git fetch` trước khi ghi canon.** Repo canon có nhiều phiên cùng ghi; kiểm
  `git log HEAD..origin/mtp --oneline` rồi mới sửa, đừng đè bản của phiên khác.
- **Thứ còn treo phải hiện ra, không được im.** Mục cuối bản ghi là danh sách việc chưa xong.
  Neo: một đề xuất đã trình mà thầy không bác từng bị lạc giữa chừng vì cuộc trò chuyện rẽ
  hướng, hai lượt sau thầy phải hỏi lại mới lộ.
