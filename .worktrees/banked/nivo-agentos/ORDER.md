# AgentOS — thứ tự nhận việc

Bank là danh sách mission dự kiến, không phải chuỗi operator đã được duyệt. Ready nghĩa là brief có thể được nhận để lập kế hoạch; không chứng nhận runtime hay cấp quyền chạy.

| ID | Ưu tiên | Giai đoạn | Trạng thái | Công việc | Phụ thuộc |
| --- | --- | --- | --- | --- | --- |
| AG-001 | P0 | 0 | ready | [Khóa phạm vi hai module Chatbot và Kế toán](workflows/ag-001/BRIEF.md) | — |
| AG-002 | P0 | 0 | ready | [Tiếp nhận bản sửa BE đã publish và kiểm lại Setup ở head cuối](workflows/ag-002/BRIEF.md) | — |
| AG-003 | P0 | 0 | ready | [Phát hành và dùng bản Grammar sửa hit-area của AgentOS](workflows/ag-003/BRIEF.md) | — |
| AG-004 | P0 | 1 | blocked | [Lập bộ hành trình và fixture kiểm chứng AgentOS](workflows/ag-004/BRIEF.md) | AG-001 |
| AG-005 | P0 | 1 | blocked | [Khép UX/UI Setup và khả năng thao tác trên điện thoại](workflows/ag-005/BRIEF.md) | AG-002, AG-003, AG-004 |
| AG-006 | P0 | 1 | blocked | [Chứng minh cổng Setup → Test → Apply → Live không bị đi vòng](workflows/ag-006/BRIEF.md) | AG-001, AG-002, AG-004 |
| AG-007 | P1 | 1 | blocked | [Khép luồng đăng ký → ví → mua AgentOS → cấp phát](workflows/ag-007/BRIEF.md) | AG-004 |
| AG-008 | P1 | 1 | blocked | [Tạo, cài và quản lý đúng hai module Chatbot/Kế toán](workflows/ag-008/BRIEF.md) | AG-004, AG-006 |
| AG-009 | P1 | 2 | blocked | [Hoàn thiện Chatbot: tiếp nhận → trả lời → bàn giao → đóng hội thoại](workflows/ag-009/BRIEF.md) | AG-006, AG-008 |
| AG-011 | P1 | 2 | blocked | [Hoàn thiện module Kế toán: chứng từ → phân loại → duyệt → ghi sổ](workflows/ag-011/BRIEF.md) | AG-001, AG-006, AG-008 |
| AG-012 | P1 | 2 | blocked | [Nối tri thức và chứng từ làm đầu vào cho Chatbot/Kế toán](workflows/ag-012/BRIEF.md) | AG-006, AG-008 |
| AG-013 | P1 | 2 | blocked | [Khép kênh hội thoại và luồng Execute của AgentOS](workflows/ag-013/BRIEF.md) | AG-004, AG-006 |
| AG-014 | P0 | 1 | blocked | [Đóng quyền truy cập đang mở khi Stop, hết hạn hoặc recovery](workflows/ag-014/BRIEF.md) | AG-004 |
| AG-015 | P1 | 2 | blocked | [Chứng minh recovery AgentOS trên runtime và dữ liệu giữ ở Core](workflows/ag-015/BRIEF.md) | AG-004, AG-014 |
| AG-018 | P1 | 3 | blocked | [Chứng minh quyền và ranh giới agent cho Chatbot/Kế toán](workflows/ag-018/BRIEF.md) | AG-009, AG-011, AG-012, AG-013 |
| AG-019 | P0 | 3 | blocked | [Thay khoảng trống e2e bằng bằng chứng API và browser thật](workflows/ag-019/BRIEF.md) | AG-005, AG-007, AG-008, AG-009, AG-011, AG-012, AG-013, AG-015 |
| AG-020 | P1 | 4 | blocked | [Đóng đợt AgentOS với đúng hai module Chatbot/Kế toán](workflows/ag-020/BRIEF.md) | AG-011, AG-018, AG-019 |

AG-001, AG-002, AG-003 có thể chuẩn bị đồng thời; không cho nhiều agent ghi cùng alias. Sau AG-004, tách đơn vị kiểm thử theo flow. Chatbot/Kế toán có thể nghiên cứu độc lập nhưng source writers vẫn phải tuần tự nếu cùng checkout. Đây là thứ tự đề xuất; re-observe hiện trạng trước khi nhận việc.
