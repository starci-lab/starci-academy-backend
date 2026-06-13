# question
<!-- @starci/seperator -->
Mọi request trong đợt bán đều đọc và ghi đúng cùng một sản phẩm và đúng cùng một counter tồn kho, nên một cache shard và một counter trở thành một hot key duy nhất đang tan chảy trong khi phần còn lại của cluster ngồi chơi. Bạn xử lý vấn đề hot-key cho cả đọc lẫn ghi như thế nào?
<!-- @starci/seperator -->
# level
<!-- @starci/seperator -->
senior
<!-- @starci/seperator -->
# tags
## 0
<!-- @starci/seperator -->
Hot Key
## 1
<!-- @starci/seperator -->
Sharding
<!-- @starci/seperator -->
# answer
<!-- @starci/seperator -->
:::muted
**Giải pháp** — Chia bài toán thành hot key đọc và hot key ghi. Với đọc, chi tiết sản phẩm gần như tĩnh, nên phục vụ từ CDN và từ cache in-memory cục bộ trên từng node với TTL ngắn, để đại đa số lượt đọc không bao giờ chạm tới shard cache chia sẻ; bạn cũng có thể nhân bản key ra nhiều node hoặc thêm một hậu tố ngẫu nhiên nhỏ để dàn đọc qua nhiều shard. Với ghi, shard cái counter duy nhất thành N sub-counter (với 1.000 suất, mười bucket mỗi cái 100), định tuyến mỗi decrement về một bucket bằng cách hash người dùng, và coi đợt bán là hết hàng khi tất cả bucket về không — cách này dàn contention qua N key và gấp N lần throughput. Một tinh chỉnh phổ biến là gộp in-memory cục bộ: mỗi app node giữ một lát tồn kho nhỏ được cấp theo lô từ counter trung tâm, phục vụ decrement cục bộ, và chỉ quay lại nguồn khi lát của nó sắp cạn.
:::

:::muted
**Trade-off** — Chia counter đánh đổi tính chính xác của góc nhìn toàn cục lấy throughput ghi: tại bất kỳ thời điểm nào không một nơi nào biết chính xác tổng còn lại, và bạn có thể bán hơi lệch giữa các bucket, nên phải chấp nhận hạch toán xấp xỉ kèm một bước reconcile. Gộp in-memory cục bộ còn nhanh hơn nhưng nới rộng cửa sổ nơi một node giữ stock đã reserve nhưng chưa bán, có thể khiến vài suất cuối bị mắc kẹt trên một node trong khi người dùng nơi khác thấy hết hàng. Nhân bản key đọc cải thiện fan-out đọc nhưng nhân lên công việc invalidate và rủi ro bất nhất ngắn khi sản phẩm thay đổi giữa đợt bán.
:::

:::muted
**Cạm bẫy & Failure-mode** — Failure đặc trưng là âm thầm: monitoring cho thấy cluster ở 10% CPU trong khi một node hay shard bị ghim ở 100% và tail latency bùng nổ, vì metric tổng hợp che giấu hot key duy nhất. Với counter chia bucket, một hash kém hoặc định tuyến lệch sẽ rút cạn vài bucket trong khi số khác còn đầy, nên đợt bán báo hết hàng dù stock vẫn reserve được — bạn phải cân bằng lại hoặc cho request bị cạn rơi xuống các bucket chưa rỗng. Lát cục bộ có thể làm mắc kẹt tồn kho ở cuối đợt bán (suất reserve trên một node không còn traffic), nên cần một flush-back định giờ cho các reservation chưa bán. Và stampede khi cache miss là chí mạng ở đây: nếu hot read key hết hạn đúng đỉnh, hàng nghìn request đồng thời tái sinh nó lên database trừ khi bạn dùng request coalescing hoặc chiến lược never-expire kèm refresh bất đồng bộ.
:::
<!-- @starci/seperator -->
