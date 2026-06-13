# question
<!-- @starci/seperator -->
Hãy giải thích inverted index đứng sau product search của bạn. Người dùng query "wireless noise cancelling". Cụ thể bạn xây cấu trúc dữ liệu gì lúc index, và từng bước nó biến truy vấn ba từ đó thành một tập ứng viên nhỏ trong vài mili-giây thay vì scan cả corpus như thế nào?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Inverted Index
## 1
<!-- @starci/seperator -->
Posting Lists
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Lúc index, bạn phân tích mỗi tài liệu thành các term đã chuẩn hóa (tokenize, lowercase, stem, bỏ stopword) và xây một dictionary ánh xạ mỗi term tới một posting list: tập document ID đã sắp xếp chứa term đó, thường kèm vị trí và term frequency theo từng tài liệu. Với "wireless noise cancelling" bạn tra ba posting list — `wireless`, `noise`, `cancel` (sau stemming) — và giao chúng bằng cách duyệt song song các list đã sắp xếp, dịch con trỏ ở ID nhỏ nhất, độ phức tạp là O(tổng postings) chứ không phải O(corpus). Vì list đã sắp xếp, bạn dùng skip pointer để nhảy qua các khoảng trống lớn, nên giao một term hiếm với một term phổ biến vẫn rẻ. Phép giao cho ra một tập ứng viên nhỏ gồm các tài liệu chứa cả ba term, và term frequency cùng vị trí đã lưu sẽ nuôi bộ chấm điểm relevance để xếp hạng các ứng viên đó. Toàn bộ tra-cứu-và-merge chỉ chạm vào postings của ba term, không phải 50 triệu dòng, đó là lý do nó xong trong vài mili-giây.
:::

:::muted
**Trade-off** — Inverted index đọc nhanh nhưng tốn kém để duy trì và lưu trữ: mỗi lần insert hay update tài liệu đều phải phân tích lại văn bản và chèn vào nhiều posting list, nên write rate cao tạo áp lực indexing và index luôn trễ một chút so với nguồn. Bạn cũng phải chọn lưu bao nhiêu cho mỗi posting — thêm vị trí cho phép phrase query nhưng làm index phình to, còn lưu term frequency cho phép chấm điểm tốt hơn nhưng tốn thêm bộ nhớ. Nén (delta-encode các doc ID đã sắp xếp, variable-byte hoặc PForDelta) thu nhỏ index đáng kể nhưng thêm việc CPU để giải mã lúc query, đánh đổi bộ nhớ lấy compute.
:::

:::muted
**Cạm bẫy & Failure-mode** — Cạm bẫy về tính đúng đắn lớn nhất là phân tích lệch nhau giữa indexing và querying: nếu bạn stem hoặc lowercase tài liệu nhưng không làm với query (hoặc dùng tokenizer khác), các term âm thầm không khớp và kết quả nhìn như hỏng mà không có lỗi. Lựa chọn stopword và stemming cũng cắn — bỏ "not" hoặc over-stem có thể đổi nghĩa, và các term cực phổ biến tạo posting list khổng lồ chi phối chi phí giao. Ở quy mô lớn, một posting list không giới hạn cho một hot term (hoặc một query toàn từ phổ biến) có thể làm nổ latency, nên bạn cần skip list, early termination, và đôi khi cap theo từng term; bỏ qua điều này để một query bệnh lý làm xuống cấp cả node.
:::
<!-- @starci/seperator -->
