-- Manual seed of the 2 sample blog posts into blog_posts (local render).
-- Idempotent: delete-by-slug then insert. id/created_at/updated_at use DB defaults.

DELETE FROM blog_posts WHERE slug IN (
  'tu-redis-cache-sang-cqrs-projection',
  'kafka-vs-rabbitmq-chon-cai-nao'
);

INSERT INTO blog_posts
  (slug, title, excerpt, body, category, cover_image_url, reading_minutes, cta_url, cta_label, is_premium, published_at, is_published)
VALUES
(
  'tu-redis-cache-sang-cqrs-projection',
  jsonb_build_object(
    'en', $t0en$Why I dropped Redis caching for CQRS projections in StarCi$t0en$,
    'vi', $t0vi$Tại sao trò bỏ **Redis cache** để chuyển sang **CQRS projection** trong StarCi$t0vi$
  ),
  jsonb_build_object(
    'en', $e0en$Hand-written cache keys looked cheap until invalidation became a second source of truth. Here is how flat projections fed by CDC replaced them.$e0en$,
    'vi', $e0vi$Cache key viết tay nhìn thì rẻ, cho tới khi việc **invalidate** trở thành một nguồn sự thật thứ hai. Đây là cách **projection** phẳng nuôi bằng **CDC** thay thế nó.$e0vi$
  ),
  jsonb_build_object(
    'en', $b0en$For a long time the leaderboard, the dashboard stats and the trending list were all served from Redis. A read would hit a cache key, miss, run a heavy aggregate, and store the result. It worked — until every write path had to remember which keys to delete.

That is the real cost of caching: invalidation. The aggregate query is the easy part. The hard part is that enrolling in a course, finishing a lesson and submitting a challenge all touch the same numbers, so each of those writes grows a tail of cache.del(...) calls. Miss one and you serve stale data with a confident face.

We replaced that with a CQRS projection layer. Instead of caching the result of a heavy query, we keep a flat table that already holds the answer — user_stats, course_stats, per-user-per-course progress — and we let Change Data Capture (Debezium) stream the source writes into a listener that updates the projection. Reads become a single indexed SELECT. No JOIN storm, no cache key, no invalidation tail.

The win is not raw speed (Redis was fast). The win is that there is exactly one place that knows how a number is derived, and it reacts to writes instead of being told about them. A projection that drifts is a bug you can detect by replaying the log; a cache that drifts is just wrong.

It is not free. You pay with more tables, a CDC pipeline to operate, and eventual consistency you have to design around. For genuinely hot, simple flags we still use Redis (challenge progress, the enrolled-courses set). The rule we landed on: heavy read that fans out across rows becomes a projection; a tiny boolean that one write owns stays a cache.$b0en$,
    'vi', $b0vi$Một thời gian dài, **leaderboard**, thống kê **dashboard** và danh sách **trending** đều phục vụ từ **Redis**. Một lượt đọc sẽ chạm vào **cache key**, miss, chạy một câu **aggregate** nặng rồi lưu kết quả lại. Nó chạy được — cho tới khi mọi đường ghi đều phải nhớ xoá những key nào.

Đó mới là chi phí thật của cache: **invalidation**. Câu **aggregate** là phần dễ. Phần khó là khi **enroll** một khoá, học xong một bài, nộp một **challenge** đều đụng cùng những con số đó, nên mỗi đường ghi mọc thêm một đuôi cache.del(...). Quên một cái là bạn phục vụ dữ liệu cũ với gương mặt rất tự tin.

Bọn mình thay nó bằng một lớp **CQRS projection**. Thay vì cache kết quả của câu query nặng, mình giữ một bảng phẳng đã chứa sẵn câu trả lời — user_stats, course_stats, tiến độ theo từng user×khoá — rồi để **Change Data Capture** (Debezium) stream các đường ghi gốc vào một **listener** cập nhật **projection**. Đọc trở thành một câu SELECT đơn, có index. Không bão **JOIN**, không **cache key**, không đuôi **invalidate**.

Cái được không phải tốc độ thô (Redis vốn nhanh). Cái được là chỉ còn đúng một chỗ biết một con số được suy ra thế nào, và nó phản ứng với đường ghi thay vì bị thông báo. Một **projection** lệch là cái bug bạn phát hiện được bằng cách replay log; một **cache** lệch thì đơn giản là sai.

Nó không miễn phí. Bạn trả bằng nhiều bảng hơn, một **pipeline CDC** phải vận hành, và **eventual consistency** phải thiết kế để sống chung. Với những cờ thật sự nóng và đơn giản thì mình vẫn dùng **Redis** (tiến độ challenge, tập khoá đã enroll). Luật bọn mình chốt: đọc nặng fan-out qua nhiều dòng thì thành **projection**; boolean nhỏ do một đường ghi sở hữu thì giữ **cache**.$b0vi$
  ),
  'deep-dive', NULL, 9, '/courses/1-system-design-mastery',
  jsonb_build_object(
    'en', $c0en$Learn this in System Design Mastery$c0en$,
    'vi', $c0vi$Học sâu trong khoá System Design Mastery$c0vi$
  ),
  false, '2026-06-16', true
),
(
  'kafka-vs-rabbitmq-chon-cai-nao',
  jsonb_build_object(
    'en', $t1en$Kafka vs RabbitMQ: which one I pick for each job$t1en$,
    'vi', $t1vi$**Kafka** vs **RabbitMQ**: trò chọn cái nào cho từng bài toán$t1vi$
  ),
  jsonb_build_object(
    'en', $e1en$They both move messages, but one is a log and one is a queue. That single difference decides almost every real choice.$e1en$,
    'vi', $e1vi$Cả hai đều chuyển **message**, nhưng một bên là **log** còn một bên là **queue**. Chỉ khác biệt đó thôi đã quyết định gần như mọi lựa chọn thực tế.$e1vi$
  ),
  jsonb_build_object(
    'en', $b1en$People frame this as "which is faster" or "which is more popular". Both are the wrong question. The honest framing is: do you need a log, or do you need a queue?

RabbitMQ is a queue (a broker). A message is delivered to a consumer and then it is gone. Routing is rich — exchanges, bindings, dead-letter queues — and per-message acknowledgement is first class. This is what you want for work that must happen once: send this email, charge this card, encode this video. If a consumer crashes mid-job, the message requeues.

Kafka is a log. A message is appended to a partition and stays there for a retention window, and consumers track their own offset. Nothing is "consumed away" — ten different services can read the same events at their own pace, and a new service can replay from the beginning. This is what you want for a stream of facts that many readers care about: user activity, domain events, the CDC feed behind our projections.

So the real test is replay and fan-out. If you would ever want to add a second consumer next quarter and have it see history, that is Kafka. If the message is a command that one worker should execute exactly once and then forget, that is RabbitMQ.

In StarCi we run both, on purpose. Job execution — judging code, encoding video, sending notifications — sits on a queue, because each job runs once and ordering across jobs does not matter. The activity and projection backbone sits on a log, because many listeners derive different views from the same events and we want to be able to rebuild any of them by replaying. Picking by "speed" would have hidden that the two systems are answering two different questions.$b1en$,
    'vi', $b1vi$Người ta hay đặt vấn đề kiểu "cái nào nhanh hơn" hoặc "cái nào phổ biến hơn". Cả hai đều là câu hỏi sai. Cách đặt thành thật là: bạn cần một **log**, hay cần một **queue**?

**RabbitMQ** là một **queue** (một **broker**). Một **message** được giao cho **consumer** rồi biến mất. Định tuyến rất phong phú — **exchange**, **binding**, **dead-letter queue** — và **ack** từng message là công dân hạng nhất. Đây là thứ bạn muốn cho việc phải xảy ra một lần: gửi email này, trừ tiền thẻ này, encode video này. **Consumer** chết giữa chừng thì message được **requeue**.

**Kafka** là một **log**. Một **message** được **append** vào một **partition** và nằm đó suốt một khoảng **retention**, còn **consumer** tự giữ **offset** của mình. Không gì bị tiêu thụ mất đi — mười service khác nhau đọc cùng tập sự kiện theo nhịp riêng, và một service mới có thể **replay** từ đầu. Đây là thứ bạn muốn cho một dòng sự thật mà nhiều bên đọc quan tâm: hoạt động người dùng, **domain event**, dòng **CDC** đứng sau các **projection** của bọn mình.

Vậy phép thử thật sự là **replay** và **fan-out**. Nếu quý sau bạn có thể muốn thêm một **consumer** thứ hai và cho nó thấy lịch sử, đó là **Kafka**. Nếu message là một mệnh lệnh mà một **worker** nên chạy đúng một lần rồi quên, đó là **RabbitMQ**.

Ở StarCi bọn mình chạy cả hai, một cách có chủ đích. Thực thi **job** — chấm code, encode video, gửi thông báo — nằm trên **queue**, vì mỗi job chạy một lần và thứ tự giữa các job không quan trọng. Xương sống **activity** và **projection** nằm trên **log**, vì nhiều **listener** suy ra các góc nhìn khác nhau từ cùng tập sự kiện và bọn mình muốn dựng lại bất kỳ cái nào bằng cách **replay**. Chọn theo tốc độ sẽ che mất việc hai hệ thống đang trả lời hai câu hỏi khác nhau.$b1vi$
  ),
  'deep-dive', NULL, 8, '/courses/1-system-design-mastery',
  jsonb_build_object(
    'en', $c1en$Go deeper in System Design Mastery$c1en$,
    'vi', $c1vi$Đào sâu trong khoá System Design Mastery$c1vi$
  ),
  false, '2026-06-15', true
);

SELECT slug, title->>'vi' AS title_vi, category, published_at FROM blog_posts ORDER BY published_at DESC;
