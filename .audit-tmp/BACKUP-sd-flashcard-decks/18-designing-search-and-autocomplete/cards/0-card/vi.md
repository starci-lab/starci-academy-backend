# question
<!-- @starci/seperator -->
Bạn đang thiết kế ô tìm kiếm cho một catalog 50 triệu sản phẩm. Người dùng gõ "wireless headphones" và mong nhận kết quả liên quan trong dưới 100ms. Tại sao bạn không thể chỉ chạy `SELECT ... WHERE name LIKE '%wireless headphones%'` trên bảng products, và bài toán cốt lõi mà một hệ thống search phải giải quyết là gì?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
junior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Search Basics
## 1
<!-- @starci/seperator -->
Latency
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Một câu `LIKE '%...%'` ép buộc full table scan vì dấu wildcard ở đầu làm mọi B-tree index trên `name` trở nên vô dụng, nên database đọc cả 50 triệu dòng cho mỗi query — tức hàng trăm mili-giây đến vài giây, và càng tệ hơn khi tải cao. Bài toán cốt lõi mà search giải quyết là ánh xạ một truy vấn free-text thành một tập tài liệu liên quan đã được xếp hạng trong vài chục mili-giây, đòi hỏi ba thứ mà `LIKE` không làm được: tokenize và chuẩn hóa văn bản (lowercase, stemming, bỏ dấu câu), tính trước một cấu trúc dữ liệu ánh xạ từ sang các tài liệu chứa nó, và chấm điểm các kết quả theo độ liên quan thay vì trả về theo thứ tự tùy ý. Câu trả lời chuẩn là xây inverted index offline và truy vấn cấu trúc đó thay vì bảng thô. Việc này biến "scan tất cả rồi substring-match" thành "tra hai từ rồi giao các posting list của chúng", nhanh hơn nhiều bậc.
:::

:::muted
**Trade-off** — Search đánh đổi chi phí lúc ghi và chi phí lưu trữ để lấy tốc độ lúc đọc: bạn phải duy trì một bản sao thứ hai của dữ liệu (index) cần được giữ đồng bộ với source of truth, và mỗi lần cập nhật tài liệu lại kích hoạt công việc re-index. Bạn cũng đánh đổi tính chính xác tuyệt đối để lấy độ liên quan — search trả về tài liệu xếp hạng theo một khái niệm mờ "khớp tốt đến đâu", không phải bộ lọc boolean chính xác như SQL, nên kết quả là gần đúng và được tinh chỉnh chứ không tất định. Với một catalog thì đây là đánh đổi đúng vì người dùng muốn kết quả khớp tốt nhất, không phải mọi dòng chứa đúng chuỗi con.
:::

:::muted
**Cạm bẫy & Failure-mode** — Sai lầm kinh điển là coi search như "chỉ cần thêm full-text index vào Postgres rồi xong", cách này chạy được ở quy mô nhỏ nhưng âm thầm xuống cấp khi corpus và lượng query tăng, và cho rất ít quyền kiểm soát tokenization, ranking, typo tolerance, và autocomplete. Một failure khác là quên rằng index là một store dẫn xuất: nếu pipeline indexing trễ hoặc hỏng, người dùng thấy sản phẩm cũ hoặc thiếu dù database vẫn đúng, và các bug này khó phát hiện vì cả hai hệ thống nhìn riêng lẻ đều có vẻ khỏe mạnh. Luôn coi index là eventually consistent với database và giám sát độ trễ indexing một cách tường minh.
:::
<!-- @starci/seperator -->
