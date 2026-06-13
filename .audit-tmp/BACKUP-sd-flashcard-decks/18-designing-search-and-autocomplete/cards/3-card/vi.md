# question
<!-- @starci/seperator -->
Search của bạn trả về đúng các tài liệu ứng viên nhưng thứ tự cảm thấy sai — người dùng phàn nàn sản phẩm tốt nhất không nằm trên đầu. Hãy giải thích cách bạn xếp hạng kết quả: TF-IDF và BM25 nằm ở đâu, khi nào chuyển sang learned ranking, và làm sao trộn relevance văn bản với các tín hiệu kinh doanh như doanh số, rating, margin mà không phá vỡ niềm tin.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Ranking
## 1
<!-- @starci/seperator -->
BM25
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Xếp hạng theo hai giai đoạn. Giai đoạn một (retrieval) dùng một scorer lexical rẻ trên tập ứng viên: TF-IDF tính trọng số một term theo tần suất xuất hiện trong tài liệu so với độ hiếm của nó trên toàn corpus, còn BM25 cải tiến bằng cách bão hòa term frequency (lần xuất hiện thứ mười thêm rất ít) và chuẩn hóa theo độ dài tài liệu, đó là lý do BM25 là default hiện đại. Giai đoạn hai (re-ranking) lấy vài trăm ứng viên đầu và áp một mô hình giàu hơn — một mô hình learning-to-rank (cây gradient-boosted như LambdaMART, hoặc một neural ranker) huấn luyện trên dữ liệu click và conversion — kết hợp điểm BM25 với các feature như rating, tốc độ bán, độ mới, tình trạng còn hàng, cá nhân hóa, và margin. Bạn giữ retrieval nhanh và thiên về recall, rồi chỉ tiêu compute cho một tập nhỏ trong lúc re-ranking chính xác. Tín hiệu kinh doanh đi vào dưới dạng feature có giới hạn hoặc boost nhân để chúng nghiêng thứ tự mà không lấn át relevance.
:::

:::muted
**Trade-off** — Chấm điểm lexical (BM25) dễ diễn giải, rẻ, không cần dữ liệu huấn luyện, nhưng mù về ngữ nghĩa và ý định; learned ranking bắt được nhiều tín hiệu hơn nhiều nhưng cần dữ liệu labeled hoặc feedback ngầm, một feature pipeline, hạ tầng huấn luyện, và giám sát cẩn thận, và nó có thể là black box. Trộn thêm tín hiệu kinh doanh đánh đổi relevance thuần lấy doanh thu: boost margin quá mạnh thì bạn đẩy lên các sản phẩm người dùng không muốn, làm hại engagement dài hạn để chạy theo GMV ngắn hạn. Bản thân thiết kế hai giai đoạn đánh đổi một chút recall (cái gì bị bỏ sót ở giai đoạn một thì không bao giờ re-rank lại được) để có thể chạy một mô hình đắt trên một tập ứng viên nhỏ.
:::

:::muted
**Cạm bẫy & Failure-mode** — Failure nổi bật là over-tune theo metric kinh doanh đến mức kết quả trông như quảng cáo, xói mòn niềm tin người dùng và rốt cuộc cả conversion — guardrail "relevance phải chi phối" tồn tại có lý do. Mô hình learned âm thầm xuống cấp do feedback loop (bạn huấn luyện trên click đã bị chính ranking của bạn làm thiên lệch, củng cố những gì vốn đã trên đầu) và do training/serving skew khi feature tính offline khác online. BM25 có bẫy riêng: tham số `k1`/`b` chưa tinh chỉnh, hoặc bỏ length normalization, làm tài liệu dài thắng không công bằng. Luôn A/B test thay đổi ranking trên engagement thật, để ý popularity bias đè bẹp item mới hoặc ngách, và giữ một sàn relevance để boost kinh doanh có thể sắp lại các kết quả tốt nhưng không bao giờ chèn kết quả tệ vào.
:::
<!-- @starci/seperator -->
