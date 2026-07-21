# Principle — Tự phản biện TRƯỚC khi trình (không đợi thầy chỉ mới sửa)

> Nguyên tắc xuyên-suốt/governance (họ `principles/*`, cùng nhà với [[design-restraint]]). Rút từ 1 chuỗi ca thật 2026-07-14 (`CourseCard`/`AddToCartButton`) mà **mọi lỗi đều được sửa ĐÚNG trong < 1 giây SAU khi thầy chỉ tay** — chứng tỏ không thiếu kiến thức, chỉ thiếu bước tự soát trước khi trình. Bổ trợ mọi skill `starci-fe-*` (cả brainstorm, apply, scan, feedback).

## Rule of thumb
**Trước khi trình BẤT KỲ output nào (hướng thiết kế · code đã sửa · finding audit · "đã xong") — dừng 1 nhịp, tự đóng vai thầy và tìm chỗ thầy SẼ bắt bẻ. Nếu tìm ra, sửa TRƯỚC. "Thỏa mãn đúng chữ yêu cầu" là ĐIỀU KIỆN CẦN, không phải ĐỦ.**

## Bẫy gốc (root pattern — đừng lặp)
Chốt ngay ở **đáp án đầu tiên nghe hợp lý** thỏa mãn *đúng 1 rule đang chăm chú* rồi trình ra — chỉ thật sự cân nhắc lại KHI bị chỉ đích danh. 4 biểu hiện cùng 1 gốc, từ 1 phiên:
- **Chỉ hoán vị, gọi là "5 hướng khác nhau"** (`starci-fe-block-variants` round 1): 5 hướng chỉ đổi VỊ TRÍ cùng bộ phần tử — thỏa "5 hướng" theo nghĩa hẹp nhất, không tự hỏi "phần tử này có nên tồn tại / đổi LOẠI không" cho tới khi thầy hỏi *"sao không render 2 nút lớn, hay ở đây không cần cart button?"*.
- **Nhảy vào lựa chọn đầu tiên, bỏ điểm giữa** (`AddToCartButton` variant): `danger` (đọc thô "destructive = danger") → `secondary` (đọc thô câu sửa của thầy) → mất 2 lượt mới tới `danger-soft` — 1 rule ĐÃ NẰM SẴN trong canon suốt, chỉ vì không cross-check trước khi trả lời.
- **Tin lời tự thuật thay vì kiểm chứng** (bug grid/line): tự viết "áp cùng pattern cho cả 2 layout" nhưng KHÔNG grep lại để xác nhận đã chạm đủ 2 render-site → 1 layout sống sót với code cũ, thầy phải chỉ *"tách nút tiếp tục học ở khóa full ra"*.
- **Áp 1 rule, mù rule kề bên trong CÙNG đoạn** (2 mũi tên CTA): áp "arrow cho mọi CTA" (`button.md` §2) mà bỏ qua "nút KHÔNG icon = sub-CTA" nằm ngay dưới cùng section → 2 nút cạnh nhau cùng arrow, nhạt hierarchy.

## Cách áp (STRICT — bake vào mọi skill FE)
1. **Đọc HẾT section canon liên quan, không chỉ dòng đang chăm chú.** 1 rule vừa áp có thể XUNG ĐỘT với rule kề bên trong cùng file (thường coexist chính vì chúng tương tác). Khi thêm/nhân bản 1 phần tử CẠNH phần tử có sẵn → audit nó với MỌI rule chi phối tổ hợp đó, không chỉ rule vừa nghĩ ra.
2. **Kiểm chứng bằng hành động, không bằng lời kể.** Câu "tôi đã làm X đồng nhất / cho cả 2 nơi" phải được XÁC NHẬN (grep/đọc lại 2 nơi), không narrate rồi tin. Đụng nhiều render-site giống nhau → grep lại tất cả sau khi sửa.
3. **Đừng chốt ở lựa chọn khả dĩ ĐẦU TIÊN.** Ít nhất cân nhắc điểm giữa / phương án thứ 2 (vd `danger` ↔ `secondary` còn có `danger-soft` ở giữa) — nhất là khi canon đã có sẵn trục thứ 3.
4. **Với skill sinh-lựa-chọn (brainstorm/variants):** trước khi show, tự hỏi *"thầy có nói '5 cái này giống nhau' / 'bỏ sót hướng hiển nhiên' không?"* — chúng có THỰC SỰ khác trục và phủ đủ không gian không (`starci-fe-block-variants` đã bake luật "đủ 3 loại biến đổi: vị trí · loại/trọng số · tồn-tại").
5. **Với skill apply/feedback:** trước khi nói "xong", tự hỏi *"tôi chạm ĐÚNG gốc chưa · còn rule kề nào mâu thuẫn · claim 'đồng nhất' đã kiểm chưa · còn render-site nào sót không?"*.
6. **Với skill scan/audit:** trước khi trình finding, tự phản biện mỗi finding (false-positive?) VÀ phản biện độ phủ (bỏ sót surface/modality nào?).

## Vì sao
Phản ứng tốt-khi-bị-chỉ nhưng không tự-soát-trước = đẩy việc QA sang thầy, mỗi vòng tốn 1 lượt corrective. Bước "tự đóng vai thầy phản biện" biến thầy từ người-bắt-lỗi thành người-duyệt — output lần đầu đã gần đúng thay vì chờ nắn 3 lượt.

## Liên quan
- [[design-restraint]] (cùng họ governance — chất lượng-mặc-định) · [[grounded-in-data]] (không bịa — kiểm chứng thật) · [[single-source-render]]. Ghi memory gốc: `feedback-self-critique-before-presenting` + `feedback-audit-adjacent-canon-rules-before-shipping`.
