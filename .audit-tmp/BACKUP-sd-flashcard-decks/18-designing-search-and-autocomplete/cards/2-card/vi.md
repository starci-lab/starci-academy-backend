# question
<!-- @starci/seperator -->
Thiết kế autocomplete bắn ra theo từng phím gõ khi người dùng đang gõ trong ô tìm kiếm. Nó phải trả về top gợi ý trong dưới 50ms, xếp hạng theo độ phổ biến, cho hàng triệu người dùng. So sánh trie với prefix-indexed n-gram, và giải thích làm sao bạn lấy được gợi ý đã xếp hạng theo popularity nhanh đến vậy.
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Autocomplete
## 1
<!-- @starci/seperator -->
Trie
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Xây cấu trúc prefix trên tập các query phổ biến, không phải trên corpus tài liệu, để autocomplete tìm "người ta đã gõ gì" thay vì "sản phẩm nào tồn tại". Một trie ánh xạ mỗi prefix tới các nút con cháu của nó; tối ưu mấu chốt là tính trước và cache, tại mỗi nút, top-K completion theo popularity (một list nhỏ đã sắp xếp hoặc snapshot của heap), nên khi gõ một phím bạn đi tới nút prefix trong O(độ dài prefix) và đọc thẳng top-K đã cache — không cần duyệt subtree lúc query. Phương án thay thế, prefix-indexed n-gram, lưu các edge n-gram (hoặc chuỗi completion key theo prefix) trong inverted index hoặc completion suggester của một search engine, dễ shard, dễ update và dễ tích hợp với hạ tầng sẵn có hơn nhưng tốn bộ nhớ hơn và cho ngữ nghĩa prefix kém chính xác hơn. Dù cách nào, bạn phục vụ gợi ý từ bộ nhớ, debounce phím phía client, và giữ các hot prefix trong cache để request trung vị không bao giờ chạm disk, đó là cách bạn giữ p99 dưới 50ms.
:::

:::muted
**Trade-off** — Trie với top-K đã cache đọc cực nhanh nhưng cứng nhắc khi update: tính lại top-K của một nút khi popularity của một query đổi sẽ lan ngược lên mọi tổ tiên, nên nó ưu tiên batch rebuild định kỳ hơn là tươi real-time, và một trie in-memory cho tập query lớn rất ngốn RAM và phải shard theo prefix. Index n-gram / suggester update tăng dần hơn và tái dùng search cluster của bạn, đánh đổi một phần latency và bộ nhớ phình to để lấy sự đơn giản vận hành và khớp fuzzy/giữa-chuỗi dễ hơn. Bạn cũng đánh đổi độ phủ lấy tốc độ: chỉ cache top-K mỗi nút nghĩa là các completion long-tail hiếm có thể bị bỏ, điều này thường chấp nhận được vì người dùng muốn gợi ý phổ biến.
:::

:::muted
**Cạm bẫy & Failure-mode** — Failure phổ biến nhất là fan-out không giới hạn ở prefix ngắn: một prefix một chữ cái có hàng triệu con cháu, nên nếu không có top-K tính trước bạn phải duyệt một subtree khổng lồ mỗi phím gõ và vỡ ngân sách latency. Quên debounce phía client làm backend bị dội một request mỗi ký tự, nhân tải lên gấp mười. Staleness là cái bẫy khác — nếu cập nhật popularity trễ, bạn cứ gợi ý xu hướng của hôm qua hoặc tệ hơn là gợi ý cho các query giờ chẳng trả về gì. Cuối cùng, autocomplete phải tôn trọng bộ lọc an toàn và cá nhân hóa (không gợi ý phản cảm hay hết hàng, kết quả theo locale); gắn thêm những thứ này lúc query có thể âm thầm đẩy bạn vượt trần 50ms nếu không bake sẵn vào các list đã cache.
:::
<!-- @starci/seperator -->
