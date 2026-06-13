# question
<!-- @starci/seperator -->
Người dùng gõ "wireles hedphones" và vẫn mong tìm thấy wireless headphones. Thiết kế typo tolerance cho search của bạn. Làm sao bạn làm fuzzy matching với edit distance một cách hiệu quả, và bật fuzziness lên khiến bạn trả giá gì về precision và latency mà bạn phải kiểm soát?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
middle
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Typo Tolerance
## 1
<!-- @starci/seperator -->
Edit Distance
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Fuzzy matching mở rộng mỗi term của query thành tập các term trong dictionary nằm trong một khoảng cách Levenshtein (edit distance) nhỏ — thường là 1 cho từ ngắn và 2 cho từ dài hơn — rồi tìm trên hợp của các posting list của chúng. Tính edit distance với mọi term trong dictionary thì quá chậm, nên bạn làm việc sinh ứng viên cho rẻ: tính trước một deletion-neighborhood index (kiểu SymSpell), hoặc dùng n-gram overlap để shortlist các term tương tự, hoặc biên dịch một Levenshtein automaton quét term dictionary và chỉ chấp nhận các chuỗi trong khoảng cách k. Nhiều engine chỉ áp fuzziness khi một exact match trả về quá ít kết quả, và scale khoảng cách cho phép theo độ dài term để các term ngắn vẫn nghiêm ngặt. Với "hedphones" bạn sinh các term gần, tìm thấy "headphones" trong khoảng cách 1, và merge postings của nó vào tập ứng viên, tùy chọn giảm trọng số các fuzzy match để exact match vẫn xếp trên các correction.
:::

:::muted
**Trade-off** — Fuzziness đánh đổi trực tiếp precision và latency để lấy recall: mỗi term nở ra thành nhiều term ứng viên, nên bạn đọc và merge nhiều posting list hơn rất nhiều, làm phồng chi phí query — distance 2 trên một từ dài có thể khớp một neighborhood khổng lồ. Nó cũng đưa vào các false match (sửa "iphone" thành "phone" hoặc khớp một near-spelling không liên quan), làm hại precision. Các cần điều khiển là chặn edit distance theo độ dài term, yêu cầu prefix khớp (đa số typo không nằm ở chữ cái đầu), chỉ bật fuzziness khi exact recall thấp, và phạt các fuzzy hit trong scoring để correction không bao giờ vượt exact match. Mỗi cần mua lại latency hoặc precision với cái giá bắt được ít typo hơn.
:::

:::muted
**Cạm bẫy & Failure-mode** — Fuzziness không giới hạn là quả bom latency kinh điển: cho phép distance 2 trên các từ ngắn phổ biến làm nổ tập ứng viên và chi phí merge mỗi query, và vài query như vậy có thể bão hòa một node. Precision sụp đổ khi correction không bị phạt, nên một query exact-match sạch bắt đầu đẩy lên các near-spelling không liên quan. Typo tolerance cũng không sửa được mọi thứ — nó không xử lý lỗi phát âm ("nife" cho "knife"), tách từ sai, hay sai lệch ngữ nghĩa, vốn cần thêm công cụ (thuật toán phonetic, query rewriting, synonym). Cuối cùng, áp fuzziness cho autocomplete trên mỗi phím gõ đặc biệt nguy hiểm vì bạn trả chi phí expansion mỗi ký tự; hãy gate nó cẩn thận nếu không sẽ vỡ ngân sách dưới 50ms.
:::
<!-- @starci/seperator -->
