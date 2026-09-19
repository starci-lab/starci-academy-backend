# Second brain của Chatbot và Kế toán

Đây là cách hiểu nghiệp vụ đề xuất để chốt trong AG-001 và triển khai/kiểm chứng trong AG-012. Phân biệt rõ kiến trúc mong muốn với đường code đã quan sát; chưa tuyên bố hai module có second brain hoàn chỉnh.

## Với người dùng

Second brain là bộ tri thức và trí nhớ của module về nghề, doanh nghiệp và công việc đã diễn ra. Người dùng cung cấp thông tin một lần, kiểm tra và cập nhật khi cần; module dùng đúng phiên bản và quyền để xử lý các công việc tiếp theo.

| Lớp | Chatbot | Kế toán | Nguồn và người chịu trách nhiệm |
| --- | --- | --- | --- |
| Kiến thức chung | Cách hỏi bổ sung, bảo vệ dữ liệu, bàn giao | Bằng chứng, thẩm quyền, dấu vết kiểm tra | Nivo biên soạn và phát hành theo phiên bản |
| Kiến thức nghề | Xử lý yêu cầu khách, SLA, điều kiện chuyển người | Kiểm chứng từ, phân loại, kiểm soát duyệt, đối soát | Gói nghiệp vụ riêng của module; chuyên môn cần được kiểm chứng |
| Hiểu doanh nghiệp | Sản phẩm, bảng giá, chính sách, giọng điệu, người phụ trách | Đơn vị, tiền tệ, quy tắc tài khoản/phân loại, kỳ, hạn mức và người duyệt | Chủ doanh nghiệp nhập ở Setup hoặc cấp tài liệu/nguồn dữ liệu; kiểm tra trước Apply |
| Hồ sơ công việc | Hội thoại, yêu cầu đang mở, bàn giao, kết quả đã xác nhận | Chứng từ, giao dịch, bản ghi sổ, công nợ, phê duyệt và điều chỉnh | Sự kiện và bản ghi của hệ thống nghiệp vụ có kiểm soát |

Ví dụ: khách hỏi đổi hàng thì Chatbot lấy đúng chính sách đang có hiệu lực và hồ sơ cuộc trao đổi. Chủ doanh nghiệp hỏi công nợ thì Kế toán đọc các bản ghi đã ghi nhận, chỉ rõ chứng từ và khoản chưa đối soát. Nó không suy đoán số dư từ một đoạn chat cũ.

Thông tin công ty có thể dùng chung khi được cấp quyền. Hồ sơ tài chính không mặc nhiên chia sẻ cho Chatbot; một quyền tra trạng thái thanh toán chỉ trả thông tin được phép. Hội thoại mới có thể tạo gợi ý cập nhật tri thức nhưng không tự trở thành chính sách đáng tin cậy.

## Đối chiếu kỹ thuật hiện tại

- Gói nghề xuất phát từ repo dữ liệu `nivo-data`. `ModuleKnowledgePackageService` lấy snapshot Git theo SHA, parse và pin package/version/digest; fallback mount chỉ áp dụng trong điều kiện nonproduction được code cho phép. Snapshot quan sát nằm ở `.gitmounts/data/solution-modules/support-desk/1.0.0` và `finance-copilot/1.0.0`.
- Mỗi gói hiện chỉ có **hai tài liệu ngắn**: Chatbot là `support-basics.md`, `handoff-and-sla.md`; Kế toán là `finance-basics.md`, `approval-controls.md`. Nội dung là hướng dẫn nền về bằng chứng, SLA và phê duyệt; chưa phải kho chuyên môn đầy đủ hay dữ liệu của khách hàng.
- Có pipeline tạo chunk, embedding, index và snapshot/digest. Publisher module được đọc sử dụng `cloudEmbedding` với platform embedding key; không lấy mô tả Local/Cloud trong tài liệu sản phẩm làm bằng chứng đường chạy thực tế. Common corpus có cơ chế publish snapshot riêng.
- Desired-state compiler mang theo package/version, document keys, các shared knowledge source được kiểm ownership, tool/channel bindings và agent configuration.
- Đường `ModuleOperationAiService.studioTurn` được đọc gửi draft business facts cho Setup/Test và immutable applied context cho Execute, cùng tin nhắn hiện tại. Hàm này không tự gọi truy xuất kho tri thức hay đọc lịch sử hội thoại. Điều đó xác nhận một khoảng trống ở đường này; chưa kết luận mọi dedicated runtime path đều không có retrieval.
- Luồng cần chứng minh khi hoàn thiện: tài liệu/nguồn được cấp quyền → kiểm tra và lập chỉ mục → truy xuất theo workspace/module/version → đưa bằng chứng vào ngữ cảnh → trả lời có nguồn hoặc gọi API có quyền → lưu kết quả đã xác nhận. Tách dữ liệu văn bản phục vụ tìm kiếm với dữ liệu giao dịch phục vụ tính toán và ghi sổ.

## Tiêu chí hoàn thiện

Mỗi câu trả lời nghiệp vụ phải xác định được nguồn, phạm vi quyền và phiên bản; thông tin lỗi thời, mâu thuẫn, thiếu hoặc bị thu hồi có cách xử lý rõ. Mỗi kết quả nghiệp vụ phải có bằng chứng từ hệ thống sở hữu nó. Kiểm thử cả truy xuất đúng nguồn, từ chối chéo workspace/module, cập nhật/xóa nguồn và số liệu kế toán đọc lại từ API. Việc cài gói tri thức không tự chứng minh model đã sử dụng nó.

Nguồn quan sát và fingerprint được ghi trong [evidence.json](evidence.json). Công việc tương ứng: [AG-001](workflows/ag-001/BRIEF.md), [AG-011](workflows/ag-011/BRIEF.md), [AG-012](workflows/ag-012/BRIEF.md).
