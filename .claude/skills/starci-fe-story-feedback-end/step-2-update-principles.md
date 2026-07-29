# BƯỚC 2 — CẬP NHẬT CANON

> **Đích ghi:** `.claude/fe/principles/<trục>/context.md` **và** `example.html` cùng trục
> **Phạm vi:** một lần, sau khi sổ phiên đã chốt.

Đây là phần thật của skill. Câu hỏi duy nhất, hỏi cho **từng** thứ thầy đã phải feedback trong
phiên:

> **Canon lẽ ra đã trả lời được câu này chưa?**

---

## VÀO

`session.md` đã chốt, đặc biệt dòng `canon có cần đổi không` của mỗi vòng.

## LÀM

**1. Phân loại từng feedback vào đúng một trong ba ca.** Ba ca xử khác hẳn nhau:

| Ca | Dấu hiệu nhận ra | Xử |
|---|---|---|
| **Canon ĐÚNG, code sai** | mở `context.md` của trục, cây quyết định ra đúng đáp án đã sửa | **KHÔNG đụng canon.** Sửa code là xong |
| **Canon CÂM** | đi hết cây quyết định mà không nhánh nào nhận ca này | **BỔ SUNG** — thêm nhánh vào §2, thêm cặp vào §3 |
| **Canon SAI** | canon ra một đáp án, đo thực tế ra đáp án khác, và đo mới đúng | **SỬA**, kèm neo ngày và before/after |

⚠️ **Ca một là ca hay gặp nhất, và ra kết quả "không sửa gì" là hợp lệ.** Ép mỗi phiên phải đẻ
thêm một dòng luật là cách chắc chắn nhất để canon phình lại thành thứ dài quá nên không ai đọc
— đúng cái đã giết `principles.md`.

**2. Trước khi kết luận là canon SAI, nghi cái NEO trước.**

Neo 2026-07-29: canon dạy Tier A dùng `bold`, rồi dẫn hai file trong `src` đang `semibold` ra
làm minh hoạ. Trò từng treo câu hỏi này lên hỏi thầy, trong khi §3b của **chính file đó** đã trả
lời. Mâu thuẫn đó không phải luật sai — nó là **dẫn chứng sai**, và `src` là công trình, được
phép lệch bản vẽ.

🧭 Phép thử: luật nói một đằng, còn thứ nó **dẫn ra làm bằng chứng** nói một nẻo ⇒ sửa dẫn
chứng, giữ luật.

**3. Kiểm đủ hai nguồn độc lập trước khi nâng thành luật chung.**

Một quan sát, một file, một lần render **không thành luật**. Muốn viết câu phổ quát ("mọi chỗ
đều vậy") phải có hai nguồn độc lập cùng ra một kết luận. Chưa đủ thì vẫn ghi, nhưng ghi rõ:

> *Neo vào đúng ca này, chưa đủ nguồn để thành luật chung.*

**4. Ghi vào canon.** `git fetch origin mtp` và kiểm `git log HEAD..origin/mtp --oneline`
trước — repo canon có nhiều phiên cùng ghi.

Ghi vào **đúng mục** của khuôn sáu phần, đừng nhét bừa vào cuối file:

| Loại phát hiện | Vào mục |
|---|---|
| một giá trị mới của thang | §1 THANG |
| một nhánh hỏi còn thiếu | §2 CÂY QUYẾT ĐỊNH |
| hai giá trị hay lẫn nhau | §3 VÉT CẠN CA DỄ LẪN |
| chọn đúng giá trị mà vẫn sai vì đọc sai cấu trúc | §4 BẪY CẤU TRÚC |
| hai nguồn đá nhau, ai thắng | §5 NEO THẬT |
| thứ không bao giờ được làm | §6 VẠCH CẤM (kèm đánh dấu gate viết được hay không) |

Mỗi đoạn thêm vào phải mang **ngày** và **before/after cụ thể**, không viết chung chung. Và phải
rút được một **câu luật khái quát** đủ để áp cho ca tương lai khác hình nhưng cùng bản chất —
chép lại ca cụ thể thì lần sau khác hình một chút là không ai nhận ra.

**5. Sửa `example.html` của cùng trục.** Bắt buộc, không phải tuỳ chọn.

Hai file của một trục chia theo **người đọc**: `context.md` cho LLM đọc để quyết,
`example.html` cho mắt người soi. Chia theo người đọc nên chúng không trùng nội dung, và **vì
thế** chúng không được phép lệch nhau. Sửa một bên mà bỏ bên kia là tự tay tạo ra cái lệch mà
cấu trúc này sinh ra để chặn.

Trong `example.html`, ca mới render **ca SAI cạnh ca ĐÚNG**, kèm phép phân định — không được
trỏ sang file khác bắt người đọc tự mở.

**6. Vạch cấm mới thì hỏi luôn: có viết được cổng không?**

Thêm một dòng vào §6 mà đánh dấu ⬜ (viết script được mà chưa ai viết) thì nêu ra với thầy. Một
nửa số lần thầy phải feedback thuộc loại máy bắt được — mỗi dòng ⬜ là một lần feedback tương lai
tiết kiệm được.

## CỔNG ĐO

- Mọi feedback trong phiên đã được phân vào đúng một trong ba ca.
- Mỗi đoạn canon thêm vào có ngày, có before/after, và có câu luật khái quát.
- Trục nào sửa `context.md` thì `example.html` cùng trục đã sửa theo.
- Đã `git fetch` và không đè lên commit của phiên khác.

## RA

Trình thầy **trước khi ghi**: đề xuất sửa canon nào, ở trục nào, vì sao thuộc ca câm hay ca sai.
Thầy duyệt rồi mới ghi.

Ghi xong thì cập nhật dòng `canon có cần đổi không` trong `session.md` trỏ tới đúng chỗ đã sửa.

## DỪNG KHI

- Phát hiện chỉ có **một nguồn** mà muốn viết thành luật chung ⇒ hạ xuống thành neo ca cụ thể,
  hoặc hỏi thầy có nguồn thứ hai không.
- Sửa canon sẽ **đụng nhiều hơn một trục** ⇒ dừng và hỏi. Một phát hiện chạm nhiều trục thường
  là dấu hiệu ranh giới giữa các trục vạch chưa đúng, và đó là quyết định của thầy.
- `git log HEAD..origin/mtp` có commit mới đụng đúng file định sửa ⇒ đọc diff của họ trước,
  đừng ghi đè.
