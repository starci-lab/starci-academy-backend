const fs = require('fs');
const path = require('path');

// Configuration
const BASE_PATH = 'c:\\Repositories\\ac\\starci-academy-backend';
const DATA_PATH = path.join(BASE_PATH, '.mount', 'data', 'courses', '1-system-design-mastery', 'modules');
const REPO_PATH = BASE_PATH;

const modulesData = [
  {
    idx: 8,
    repoNum: 9,
    slug: '8-high-throughput-notification-design',
    titleEn: 'Designing a High-Throughput Notification System',
    titleVi: 'Hệ thống Thông báo Quy mô lớn',
    descEn: 'Design a scalable notification engine with asynchronous workers, rate limiting, and failover guarantees.',
    descVi: 'Thiết kế hệ thống thông báo quy mô lớn với worker bất đồng bộ, rate limiting và cơ chế failover.',
    lessons: [
      {
        slug: '0-notification-system-architecture',
        titleEn: 'Notification System Architecture',
        titleVi: 'Kiến trúc Hệ thống Thông báo',
        serviceName: 'notification-service',
        featureName: 'notifications',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'notification-service', port: 3000, roleEn: 'Exposes API endpoints and queues jobs.', roleVi: 'Cung cấp API endpoints và đẩy job vào hàng đợi.' },
          { name: 'redis', port: 6379, roleEn: 'Message broker and queue store.', roleVi: 'Bộ môi giới tin nhắn và lưu trữ hàng đợi.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores user preferences and notification logs.', roleVi: 'Lưu trữ tùy chọn người dùng và lịch sử thông báo.' }
        ],
        conceptEn: 'Asynchronous notification ingestion via Message Broker / Queue and distributed worker execution.',
        conceptVi: 'Nhận thông báo bất đồng bộ qua Message Broker / Queue và xử lý phân tán qua các Worker.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/send" -Method Post -ContentType "application/json" -Body \'{"userId": "usr_99", "channel": "email", "content": "Hello World"}\'',
          curl: 'curl -X POST http://localhost:3000/api/notifications/send -H "Content-Type: application/json" -d \'{"userId": "usr_99", "channel": "email", "content": "Hello World"}\''
        },
        interviewQs: [
          { q: 'Why do we decouple notification submission from transmission?', a: 'Decoupling isolates client requests from slow downstream gateways, preventing connection exhaustion.' },
          { q: 'How does BullMQ help handle spike loads?', a: 'It acts as a durable buffer, queuing incoming jobs so workers can process them at a steady, sustainable rate.' }
        ]
      },
      {
        slug: '1-rate-limiting-and-priority-queues',
        titleEn: 'Rate Limiting and Priority Queues',
        titleVi: 'Rate Limiting và Lập lịch Ưu tiên',
        serviceName: 'rate-limit-service',
        featureName: 'ratelimiter',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'rate-limit-service', port: 3000, roleEn: 'Validates quotas and queues jobs by priority.', roleVi: 'Kiểm tra hạn ngạch và xếp hàng đợi theo độ ưu tiên.' },
          { name: 'redis', port: 6379, roleEn: 'Rate limit store and priority queue storage.', roleVi: 'Bộ lưu trữ rate limit và hàng đợi ưu tiên.' }
        ],
        conceptEn: 'Distributed Rate Limiting via Token Bucket alongside priority routing for transactional OTPs over marketing messages.',
        conceptVi: 'Rate Limiting phân tán qua Token Bucket kết hợp định tuyến ưu tiên OTP so với tin quảng cáo.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/priority" -Method Post -ContentType "application/json" -Body \'{"userId": "usr_100", "type": "otp", "content": "123456"}\'',
          curl: 'curl -X POST http://localhost:3000/api/notifications/priority -H "Content-Type: application/json" -d \'{"userId": "usr_100", "type": "otp", "content": "123456"}\''
        },
        interviewQs: [
          { q: 'How do you prioritize OTPs over marketing push notifications in Redis?', a: 'By using Redis Sorted Sets (ZSet) where scores represent the message priority or timestamp, or utilizing native BullMQ priority jobs.' },
          { q: 'What is the Token Bucket rate limit algorithm?', a: 'An algorithm that refills a token bucket at a constant rate, allowing short bursts of requests up to the maximum bucket capacity.' }
        ]
      },
      {
        slug: '2-failover-and-delivery-guarantees',
        titleEn: 'Failover and Delivery Guarantees',
        titleVi: 'Failover và Đảm bảo Gửi tin',
        serviceName: 'failover-service',
        featureName: 'failover',
        techStack: 'Redis, RabbitMQ, NestJS',
        components: [
          { name: 'failover-service', port: 3000, roleEn: 'Routes notification dispatches with retry and DLQ logic.', roleVi: 'Định tuyến gửi tin kèm cơ chế retry và Dead Letter Queue.' },
          { name: 'rabbitmq', port: 5672, roleEn: 'AMQP broker managing retries and DLQs.', roleVi: 'Broker AMQP quản lý hàng đợi retry và hàng đợi thư chết.' }
        ],
        conceptEn: 'Dead Letter Queues (DLQ), retry strategies with exponential backoff, and idempotency guarantees in notification delivery.',
        conceptVi: 'Xử lý hàng đợi thư chết (DLQ), chiến lược thử lại kèm giãn cách lũy thừa và đảm bảo tính gửi tin duy nhất.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/notifications/dispatch" -Method Post -ContentType "application/json" -Body \'{"id": "msg_001", "userId": "usr_200", "content": "Alert"}\'',
          curl: 'curl -X POST http://localhost:3000/api/notifications/dispatch -H "Content-Type: application/json" -d \'{"id": "msg_001", "userId": "usr_200", "content": "Alert"}\''
        },
        interviewQs: [
          { q: 'What is a Dead Letter Queue (DLQ)?', a: 'A separate queue where failed messages are routed after exhausting all retry attempts, isolating them for debugging.' },
          { q: 'How do you guarantee exactly-once delivery in notification systems?', a: 'True exactly-once is impossible across network boundaries; we achieve it via at-least-once transmission combined with idempotent consumer deduplication.' }
        ]
      }
    ]
  },
  {
    idx: 9,
    repoNum: 10,
    slug: '10-kafka-streaming-and-reliability',
    titleEn: 'Kafka Streaming & Reliability (Big Tech Patterns)',
    titleVi: 'Kafka Streaming & Độ tin cậy',
    descEn: 'Kafka-style log messaging: partitions, consumer groups, ordering, idempotent consumption, and reliability.',
    descVi: 'Messaging kiểu commit log (Kafka): partition, consumer group, ordering, idempotent consumer, độ tin cậy.',
    lessons: [
      {
        slug: '0-log-based-messaging-fundamentals',
        titleEn: 'Log-Based Messaging Fundamentals',
        titleVi: 'Nền tảng Messaging dạng Log',
        serviceName: 'ingest-api',
        featureName: 'events',
        techStack: 'Kafka, NestJS',
        components: [
          { name: 'ingest-api', port: 3000, roleEn: 'HTTP producer writes events to a partitioned Kafka topic.', roleVi: 'Producer HTTP ghi event vào topic Kafka có partition.' },
          { name: 'consumer-a', port: null, roleEn: 'Consumer group member A.', roleVi: 'Thành viên consumer group A.' },
          { name: 'consumer-b', port: null, roleEn: 'Consumer group member B.', roleVi: 'Thành viên consumer group B.' },
          { name: 'kafka', port: 9092, roleEn: 'Durable commit log broker.', roleVi: 'Broker log bền vững.' },
          { name: 'kafka-ui', port: 8080, roleEn: 'Inspect topics, offsets, consumer lag.', roleVi: 'Xem topic, offset, consumer lag.' }
        ],
        conceptEn: 'Durable logs, topics, partitions, and consumer groups — the core broker model used at scale in big tech.',
        conceptVi: 'Log bền vững, topic, partition và consumer group — mô hình broker cốt lõi ở quy mô lớn.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body (@{ type="demo"; partitionKey="user-1"; payload=@{ msg="hi" } } | ConvertTo-Json) -ContentType "application/json"',
          curl: 'curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"type\":\"demo\",\"partitionKey\":\"user-1\",\"payload\":{\"msg\":\"hi\"}}"'
        },
        interviewQs: [
          { q: 'Why use a log instead of a simple message queue?', a: 'Logs retain history for replay, scale reads via consumer groups, and decouple producers from consumers in time.' },
          { q: 'What does a consumer group do?', a: 'Each partition is assigned to one consumer in the group so you can scale consumption horizontally.' }
        ]
      },
      {
        slug: '1-ordering-partitions-and-operations',
        titleEn: 'Ordering, Partitions, and Operations',
        titleVi: 'Ordering, Partition và Vận hành',
        serviceName: 'ordering-producer',
        featureName: 'events',
        techStack: 'Kafka, NestJS',
        components: [
          { name: 'ordering-producer', port: 3000, roleEn: 'Produces events with a required partition key.', roleVi: 'Produce event bắt buộc partition key.' },
          { name: 'consumer-fast', port: null, roleEn: 'Fast consumer in the same group.', roleVi: 'Consumer xử lý nhanh.' },
          { name: 'consumer-slow', port: null, roleEn: 'Slow consumer (simulated lag).', roleVi: 'Consumer chậm (mô phỏng lag).' },
          { name: 'kafka-ui', port: 8080, roleEn: 'Monitor per-partition lag.', roleVi: 'Theo dõi lag theo partition.' }
        ],
        conceptEn: 'Partition keys preserve order per key; operational metrics (lag, rebalance) matter as much as code.',
        conceptVi: 'Partition key giữ thứ tự theo key; metric lag/rebalance quan trọng như code.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body (@{ type="order"; partitionKey="user-42"; payload=@{ n=1 } } | ConvertTo-Json) -ContentType "application/json"',
          curl: 'curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"type\":\"order\",\"partitionKey\":\"user-42\",\"payload\":{\"n\":1}}"'
        },
        interviewQs: [
          { q: 'When is ordering guaranteed in Kafka?', a: 'Only within a single partition; keys route related events to the same partition.' },
          { q: 'What is consumer lag?', a: 'The offset gap between the latest produced message and what a consumer has read — a key ops signal.' }
        ]
      },
      {
        slug: '2-reliability-replay-and-deduplication',
        titleEn: 'Reliability, Replay, and Deduplication',
        titleVi: 'Độ tin cậy, Replay và Dedup',
        serviceName: 'reliability-consumer',
        featureName: 'reliability',
        techStack: 'Kafka, Redis, Postgres, NestJS',
        components: [
          { name: 'ingest-api', port: 3000, roleEn: 'Produces events with clientMessageId for idempotency tests.', roleVi: 'Produce event có clientMessageId để test idempotent.' },
          { name: 'reliability-consumer', port: null, roleEn: 'Idempotent consumer with dedup + sequence.', roleVi: 'Consumer idempotent + dedup + sequence.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores processed events.', roleVi: 'Lưu event đã xử lý.' },
          { name: 'redis', port: 6379, roleEn: 'Dedup locks and sequence counters.', roleVi: 'Khóa dedup và bộ đếm sequence.' }
        ],
        conceptEn: 'At-least-once delivery with idempotent consumers, deduplication, and failed-message handling (DLQ / retry).',
        conceptVi: 'At-least-once + consumer idempotent, dedup, xử lý message lỗi (retry/DLQ).',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/events" -Method Post -Body (@{ clientMessageId=[guid]::NewGuid().ToString(); type="pay"; payload=@{} } | ConvertTo-Json) -ContentType "application/json"',
          curl: 'curl -X POST http://localhost:3000/events -H "Content-Type: application/json" -d "{\"clientMessageId\":\"msg-1\",\"type\":\"pay\",\"payload\":{}}"'
        },
        interviewQs: [
          { q: 'Why not rely on exactly-once everywhere?', a: 'It is expensive and broker-specific; idempotent consumers + dedup keys are the practical big-tech pattern.' },
          { q: 'How do you handle poison messages?', a: 'Retry with limits, then move to a DLQ topic for inspection and controlled replay.' }
        ]
      }
    ]
  },
  {
    idx: 10,
    repoNum: 11,
    slug: '11-news-feed-fanout-and-caching',
    titleEn: 'Designing a Social Media Feed & News Feed System',
    titleVi: 'Hệ thống Bảng tin Mạng xã hội',
    descEn: 'Design news timeline feeds using Push and Pull patterns, Redis caching, and hybrid fanout strategies.',
    descVi: 'Thiết kế hệ thống bảng tin mạng xã hội sử dụng mô hình Push/Pull, bộ đệm Redis và Fanout hỗn hợp.',
    lessons: [
      {
        slug: '0-push-vs-pull-models-fanout',
        titleEn: 'Push vs Pull Models (Fanout)',
        titleVi: 'Mô hình Push vs Pull (Fanout)',
        serviceName: 'feed-service',
        featureName: 'feed',
        techStack: 'Postgres, NestJS',
        components: [
          { name: 'feed-service', port: 3000, roleEn: 'Handles post generation and evaluates push vs pull timelines.', roleVi: 'Xử lý tạo bài đăng và tính toán timeline bằng mô hình push hoặc pull.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores posts, user follow relationships, and timelines.', roleVi: 'Lưu trữ bài đăng, mối quan hệ theo dõi và bảng tin.' }
        ],
        conceptEn: 'Fanout-on-Write (Push model) versus Fanout-on-Read (Pull model) trade-offs in relational database design.',
        conceptVi: 'So sánh luồng Fanout-on-Write (Push) và Fanout-on-Read (Pull) trong thiết kế cơ sở dữ liệu quan hệ.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/feed/pull?userId=usr_1" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/feed/pull?userId=usr_1"'
        },
        interviewQs: [
          { q: 'When is Fanout-on-Write (Push model) preferred?', a: 'When the write traffic is moderate and readers outnumber writers significantly, allowing fast timeline reads.' },
          { q: 'Why is a pure Push model problematic for celebrity users (KOLs)?', a: 'A celebrity with 50 million followers posting a photo triggers 50 million writes, overloading the database and worker queues.' }
        ]
      },
      {
        slug: '1-feed-caching-with-redis',
        titleEn: 'Feed Caching with Redis',
        titleVi: 'Bộ đệm News Feed với Redis',
        serviceName: 'feed-cache-service',
        featureName: 'feedcache',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'feed-cache-service', port: 3000, roleEn: 'Exposes timeline retrieval and manages Redis feed caches.', roleVi: 'Cung cấp API đọc timeline và đồng bộ dữ liệu cache timeline Redis.' },
          { name: 'redis', port: 6379, roleEn: 'Sorted Set store containing compiled user feeds.', roleVi: 'Lưu trữ feed đã biên soạn bằng Redis Sorted Sets.' }
        ],
        conceptEn: 'Caching and formatting personal timelines in Redis using Sorted Sets (ZSet), sorted by post publication timestamp.',
        conceptVi: 'Lưu trữ bộ đệm timeline cá nhân bằng Redis Sorted Sets (ZSet) sắp xếp theo thời gian đăng bài.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/feed/cache?userId=usr_1" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/feed/cache?userId=usr_1"'
        },
        interviewQs: [
          { q: 'Why use Redis Sorted Sets for feed caching?', a: 'Sorted Sets naturally support fast range queries with pagination (ZREVRANGEBYSCORE) and sort by time score automatically.' },
          { q: 'How do you handle feed cache size limits?', a: 'By capping the maximum timeline size (e.g. keeping only the top 500 items via ZREMRANGEBYRANK) to prevent memory bloating.' }
        ]
      },
      {
        slug: '2-hybrid-fanout-and-hotkey-mitigation',
        titleEn: 'Hybrid Fanout and Hotkey Mitigation',
        titleVi: 'Fanout Hỗn hợp và Giảm tải Hotkey',
        serviceName: 'hybrid-feed-service',
        featureName: 'hybridfeed',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'hybrid-feed-service', port: 3000, roleEn: 'Coordinates feed queries using both pull (KOLs) and push (regular users).', roleVi: 'Điều phối truy vấn feed kết hợp pull (KOLs) và push (user thường).' },
          { name: 'redis', port: 6379, roleEn: 'Stores feeds and handles high-demand KOL post distribution.', roleVi: 'Lưu trữ bảng tin và định tuyến bài đăng KOL.' }
        ],
        conceptEn: 'Hybrid fanout architecture, key salting strategies for hot redis keys, and local caching mitigations for high-throughput celebrity reads.',
        conceptVi: 'Kiến trúc Fanout hỗn hợp, kỹ thuật Key Salting chống hot key Redis và bộ nhớ đệm cục bộ (Local Cache).',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/feed/hybrid?userId=usr_1" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/feed/hybrid?userId=usr_1"'
        },
        interviewQs: [
          { q: 'How does Hybrid Fanout work?', a: 'Regular users push posts to their followers. High-follow KOL posts are pulled dynamically at read-time and merged with the cached feed.' },
          { q: 'What is Key Salting?', a: 'Appending a random suffix (e.g., key_1, key_2) to a hot cache key, duplicating it across nodes to distribute hot-read traffic.' }
        ]
      }
    ]
  },
  {
    idx: 11,
    repoNum: 12,
    slug: '11-large-scale-video-streaming-platform',
    titleEn: 'Designing a Large-Scale Video Streaming Platform',
    titleVi: 'Nền tảng Stream Video Quy mô lớn',
    descEn: 'Design an end-to-end video pipeline utilizing transcoding servers, HLS segments, CDN delivery, and caching.',
    descVi: 'Thiết kế hệ thống truyền tải video quy mô lớn sử dụng server transcoding, phân đoạn HLS, CDN và cache.',
    lessons: [
      {
        slug: '0-video-ingestion-and-transcoding',
        titleEn: 'Video Ingestion and Transcoding',
        titleVi: 'Video Ingestion và Transcoding',
        serviceName: 'transcode-service',
        featureName: 'transcode',
        techStack: 'MinIO, NestJS, FFmpeg',
        components: [
          { name: 'transcode-service', port: 3000, roleEn: 'Processes video uploads and triggers FFmpeg pipelines.', roleVi: 'Xử lý video tải lên và điều phối luồng xử lý FFmpeg.' },
          { name: 'minio', port: 9000, roleEn: 'Object storage for raw and transcoded video segments.', roleVi: 'Lưu trữ đối tượng (Object Storage) cho video thô và phân đoạn HLS.' }
        ],
        conceptEn: 'Asynchronous multi-bitrate transcoding pipelines utilizing FFmpeg processes, saving results into object storage.',
        conceptVi: 'Luồng transcoding bất đồng bộ với FFmpeg đa bitrate và lưu trữ kết quả trên Object Storage.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/videos/transcode" -Method Post -ContentType "application/json" -Body \'{"videoKey": "movie.mp4"}\'',
          curl: 'curl -X POST http://localhost:3000/api/videos/transcode -H "Content-Type: application/json" -d \'{"videoKey": "movie.mp4"}\''
        },
        interviewQs: [
          { q: 'Why is on-demand transcoding problematic for popular videos?', a: 'Transcoding is CPU-heavy; doing it dynamically spikes CPU. We must transcode videos ahead of time into multiple resolutions.' },
          { q: 'How do you handle chunk storage during ingestion?', a: 'By splitting large video streams into temporary chunks using object multipart uploads before assembling.' }
        ]
      },
      {
        slug: '1-adaptive-bitrate-streaming-hls-dash',
        titleEn: 'Adaptive Bitrate Streaming (HLS/DASH)',
        titleVi: 'Adaptive Bitrate Streaming (HLS/DASH)',
        serviceName: 'streaming-service',
        featureName: 'streaming',
        techStack: 'MinIO, NestJS',
        components: [
          { name: 'streaming-service', port: 3000, roleEn: 'Serves HLS manifest files (.m3u8) and segment chunks (.ts).', roleVi: 'Phân phối file HLS manifest (.m3u8) và phân đoạn video (.ts).' },
          { name: 'minio', port: 9000, roleEn: 'Stores playlist files and segmented chunks.', roleVi: 'Lưu trữ các playlist và phân đoạn.' }
        ],
        conceptEn: 'Adaptive Bitrate protocols (HLS and DASH), playlist master files, and serving segment stream fragments.',
        conceptVi: 'Tìm hiểu giao thức truyền tải tương thích (HLS/DASH), cấu trúc playlist master và phân phối phân đoạn.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/videos/stream/movie/index.m3u8" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/videos/stream/movie/index.m3u8"'
        },
        interviewQs: [
          { q: 'What is the core difference between HLS and DASH?', a: 'HLS is developed by Apple and natively uses MPEG-TS/FMP4 fragments over HTTP, whereas DASH is an open standard.' },
          { q: 'How does adaptive bitrate client resolution adjustment work?', a: 'The client media player requests the master index file, monitors network bandwidth, and dynamically requests lower or higher bitrate `.ts` segments.' }
        ]
      },
      {
        slug: '2-cdn-caching-and-edge-delivery',
        titleEn: 'CDN Caching and Edge Delivery',
        titleVi: 'CDN Caching và Edge Delivery',
        serviceName: 'cdn-origin',
        featureName: 'cdn',
        techStack: 'NGINX, NestJS',
        components: [
          { name: 'cdn-origin', port: 3000, roleEn: 'Origin service serving video chunks and tracking downloads.', roleVi: 'Service gốc (Origin) cung cấp video chunk và đối soát tải.' },
          { name: 'nginx-cdn', port: 8080, roleEn: 'NGINX reverse proxy serving as a local CDN edge cache.', roleVi: 'NGINX reverse proxy đóng vai trò là CDN edge cache cục bộ.' }
        ],
        conceptEn: 'CDN caching strategies, request collapsing via origin shielding, and geolocated edge content delivery.',
        conceptVi: 'Chiến lược CDN Caching, cơ chế Request Collapsing (Origin Shielding) bảo vệ máy chủ gốc.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:8080/cdn/video/movie/chunk_1.ts" -Method Get',
          curl: 'curl -X GET "http://localhost:8080/cdn/video/movie/chunk_1.ts"'
        },
        interviewQs: [
          { q: 'What is Request Collapsing (Origin Shielding)?', a: 'A CDN feature where multiple concurrent requests for the same cold chunk are merged into one single request to the origin server, preventing origin overload.' },
          { q: 'How does CDN georouting work?', a: 'It uses DNS GeoIP routing or Anycast IP networks to route users automatically to the physically closest CDN edge server.' }
        ]
      }
    ]
  },
  {
    idx: 12,
    repoNum: 13,
    slug: 'flash-sale-at-scale',
    titleEn: 'Flash Sale at Scale: Inventory, Queues & Idempotent Checkout',
    titleVi: 'Flash Sale quy mô lớn: Tồn kho, Hàng đợi & Thanh toán idempotent',
    descEn: 'Design an ecommerce backend to manage pre-decrementing caches, waiting rooms, and idempotency check control.',
    descVi: 'Thiết kế hệ thống flash sale thương mại điện tử quản lý pre-decrement, phòng chờ ảo và thanh toán idempotent.',
    lessons: [
      {
        slug: '0-high-concurrency-inventory-management',
        titleEn: 'High-Concurrency Inventory Management',
        titleVi: 'Quản lý tồn kho hiệu năng cao',
        serviceName: 'inventory-service',
        featureName: 'inventory',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'inventory-service', port: 3000, roleEn: 'Executes inventory decrements using Lua scripts and syncs to database.', roleVi: 'Thực thi trừ kho qua Lua script và đồng bộ vào DB.' },
          { name: 'redis', port: 6379, roleEn: 'Atomic fast memory stock counter.', roleVi: 'Bộ đếm tồn kho nguyên tử tốc độ cao.' },
          { name: 'postgres', port: 5432, roleEn: 'Durable persistent ledger for inventory.', roleVi: 'Lưu trữ tồn kho bền vững.' }
        ],
        conceptEn: 'Redis Lua Script pre-decrementing alongside eventual DB consistency to prevent double-selling under heavy traffic.',
        conceptVi: 'Giảm trừ kho trước bằng Redis Lua Script kết hợp đồng bộ cơ sở dữ liệu bất đồng bộ.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/inventory/decrement/redis" -Method Post -ContentType "application/json" -Body \'{"productSku": "IPHONE15", "quantity": 1}\'',
          curl: 'curl -X POST http://localhost:3000/api/inventory/decrement/redis -H "Content-Type: application/json" -d \'{"productSku": "IPHONE15", "quantity": 1}\''
        },
        interviewQs: [
          { q: 'Why is standard PostgreSQL pessimistic lock slow?', a: 'Because row-level locking blocks transaction threads, starving the database connection pool.' },
          { q: 'What is the role of the Redis Lua script?', a: 'It allows checking and decrementing inventory atomically in Redis memory, eliminating race conditions without distributed locks.' }
        ],
        skipLessonText: true // Lesson text en.md/vi.md already written! We only need challenge and codebase.
      },
      {
        slug: '1-virtual-waiting-room-and-queuing',
        titleEn: 'Virtual Waiting Room and Queuing',
        titleVi: 'Phòng chờ ảo và Hàng đợi mua hàng',
        serviceName: 'waiting-room',
        featureName: 'waitingroom',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'waiting-room', port: 3000, roleEn: 'Issues queues tokens and monitors checkout traffic spikes.', roleVi: 'Cấp phát token hàng đợi và điều phối luồng thanh toán.' },
          { name: 'redis', port: 6379, roleEn: 'Sorted Set store containing queue positions and rates.', roleVi: 'Lưu trữ vị trí hàng đợi và kiểm soát lượng người vào.' }
        ],
        conceptEn: 'Virtual Waiting Room (Queue tokens) protecting order checkout servers, scheduling user access rates via Redis Sorted Sets.',
        conceptVi: 'Phòng chờ ảo (Virtual Waiting Room) bảo vệ server thanh toán, điều tiết lưu lượng bằng Redis Sorted Sets.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/waitingroom/token?userId=usr_123" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/waitingroom/token?userId=usr_123"'
        },
        interviewQs: [
          { q: 'What is a Virtual Waiting Room?', a: 'A traffic management layer that queues excess users during traffic surges, letting only a predefined rate of users reach the checkout system.' },
          { q: 'How does Redis ZSet determine queue position?', a: 'By sorting queued tokens using the timestamp as the score, allowing O(log N) lookup of a user\'s current position.' }
        ]
      },
      {
        slug: '2-idempotency-and-concurrency-control',
        titleEn: 'Idempotency and Concurrency Control',
        titleVi: 'Tính Idempotency và Kiểm soát đồng thời',
        serviceName: 'checkout-service',
        featureName: 'checkout',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'checkout-service', port: 3000, roleEn: 'Processes checkouts using locking models and idempotency keys.', roleVi: 'Xử lý đặt hàng bằng cơ chế khoá và Idempotency Key.' },
          { name: 'postgres', port: 5432, roleEn: 'Durable relational orders and lock engine.', roleVi: 'Lưu trữ đơn hàng và xử lý giao dịch ACID.' },
          { name: 'redis', port: 6379, roleEn: 'Idempotency key registry cache.', roleVi: 'Lưu trữ và khoá tạm thời các Idempotency Key.' }
        ],
        conceptEn: 'Trade-offs of Optimistic vs Pessimistic database locking, Redis distributed locks, and building end-to-end idempotent APIs.',
        conceptVi: 'So sánh các cơ chế khoá cơ sở dữ liệu (lạc quan vs bi quan vs khoá phân tán Redis) và xây dựng API idempotent.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/checkout/order" -Method Post -ContentType "application/json" -Headers @{"Idempotency-Key" = "key_test_100"} -Body \'{"userId": "usr_99", "productId": 1}\'',
          curl: 'curl -X POST http://localhost:3000/api/checkout/order -H "Content-Type: application/json" -H "Idempotency-Key: key_test_100" -d \'{"userId": "usr_99", "productId": 1}\''
        },
        interviewQs: [
          { q: 'How do you handle double-clicking on checkout buttons?', a: 'By passing an Idempotency-Key in the HTTP header, which is registered in Redis with a short lock. If the key exists, subsequent duplicate submissions are blocked.' },
          { q: 'What is the disadvantage of Optimistic locking under extreme hotkey traffic?', a: 'High update collision rates cause massive rollbacks and transaction failures, wasting server resources compared to Redis pre-decrements.' }
        ]
      }
    ]
  },
  {
    idx: 13,
    repoNum: 14,
    slug: '13-ride-hailing-geospatial-matching-and-surge-pricing',
    titleEn: 'Geospatial Indexing, Realtime Matching and Surge Pricing',
    titleVi: 'Lập chỉ mục địa lý, Ghép xe Realtime và Surge Pricing',
    descEn: 'Hands-on Uber H3 hex grids, Redis GEOADD/GEORADIUS for driver tracking, and H3+Redis surge matching — no Google API on the hot path.',
    descVi: 'Thực hành H3, Redis Geospatial và ghép xe/surge — hot path chạy trên server, không gọi Google mỗi ping.',
    lessons: [
      {
        slug: '0-geospatial-indexing-fundamentals',
        titleEn: 'Geospatial Indexing Fundamentals',
        titleVi: 'Cơ bản về Geospatial Indexing',
        serviceName: 'h3-geo-service',
        featureName: 'h3',
        techStack: 'h3-js, NestJS',
        components: [
          { name: 'h3-geo-service', port: 3000, roleEn: 'Hashes lat/lng to Uber H3 hex cells offline on CPU.', roleVi: 'Băm tọa độ ra ô lục giác H3 trên CPU server (offline).' }
        ],
        conceptEn: 'Uber H3 hexagonal hierarchical spatial index — offline math on the backend, not Google Maps API.',
        conceptVi: 'Uber H3 — toán học offline trên BE, không phải API bản đồ tính phí.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/h3/cell?lat=10.762622&lng=106.660172" -Method Get',
          curl: 'curl "http://localhost:3000/api/h3/cell?lat=10.762622&lng=106.660172"'
        },
        interviewQs: [
          { q: 'Why is normal database indexing slow for coordinate searches?', a: 'Standard indices (B-Trees) are one-dimensional. Coordinating search requires scanning two variables (lat, lng), which standard indices cannot filter efficiently simultaneously.' },
          { q: 'What is Uber H3?', a: 'A hexagonal hierarchical spatial index that divides the Earth into hexagons, minimizing distance distortion when matching adjacent grids.' }
        ]
      },
      {
        slug: '1-realtime-location-updates-at-scale',
        titleEn: 'Realtime Location Updates at Scale',
        titleVi: 'Cập nhật Vị trí Thời gian thực Quy mô lớn',
        serviceName: 'location-tracker',
        featureName: 'location',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'location-tracker', port: 3001, roleEn: 'Receives GPS pings and runs GEORADIUS on Redis RAM.', roleVi: 'Nhận ping GPS và GEORADIUS trên Redis RAM.' },
          { name: 'redis', port: 6379, roleEn: 'Redis Geospatial index (GEOADD / GEORADIUS).', roleVi: 'Redis Geospatial GEOADD / GEORADIUS.' }
        ],
        conceptEn: 'High-frequency driver GPS via Redis GEOADD/GEORADIUS — sub-5ms, no Google API per ping.',
        conceptVi: 'Ping GPS + quét xe bằng Redis — không gọi Google mỗi lần quét.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3001/api/location/nearby?lat=10.762622&lng=106.660172&radiusMeters=2000" -Method Get',
          curl: 'curl "http://localhost:3001/api/location/nearby?lat=10.762622&lng=106.660172&radiusMeters=2000"'
        },
        interviewQs: [
          { q: 'How does Redis store Geospatial coordinates internally?', a: 'Redis encodes coordinates into a 52-bit Geohash integer, and indexes it within a standard Sorted Set (ZSet).' },
          { q: 'How do you scale coordinates collection for 500,000 drivers?', a: 'By partitioning the drivers into separate Redis cluster nodes using Geohash prefixes as shard keys (e.g. `locations:hashprefix`).' }
        ]
      },
      {
        slug: '2-matching-and-dynamic-pricing',
        titleEn: 'Matching and Dynamic Pricing',
        titleVi: 'Khớp xe và Định giá Động',
        serviceName: 'matching-service',
        featureName: 'matching',
        techStack: 'h3-js, Redis, NestJS',
        components: [
          { name: 'matching-service', port: 3002, roleEn: 'H3 surge cells + expanding GEORADIUS match rings.', roleVi: 'Surge theo ô H3 + vòng GEORADIUS mở rộng.' },
          { name: 'redis', port: 6380, roleEn: 'Demand/supply counters and driver geo index.', roleVi: 'Counter cung/cầu và geo index tài xế.' }
        ],
        conceptEn: 'Surge by H3 cell on Redis; expanding-radius GEORADIUS match; route km mocked (Directions API only once in prod UX).',
        conceptVi: 'Surge ô H3 + match vòng Redis; km có thể mock — Directions chỉ 1 lần lúc đặt xe trên prod.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3002/api/match/quote?lat=10.762622&lng=106.660172" -Method Get',
          curl: 'curl "http://localhost:3002/api/match/quote?lat=10.762622&lng=106.660172"'
        },
        interviewQs: [
          { q: 'How does dynamic pricing (surge pricing) prevent system starvation?', a: 'By increasing prices, it dampens low-urgency demand while encouraging more drivers to head towards high-demand zones.' },
          { q: 'What is the Ring Buffer matching strategy?', a: 'It queries drivers in widening concentric geographic rings (e.g., 1km, 2km, 5km) until a suitable driver accepts the dispatch.' }
        ]
      }
    ]
  },
  {
    idx: 14,
    repoNum: 15,
    slug: '14-distributed-search-autocomplete-system',
    titleEn: 'Designing a Distributed Search & Autocomplete System',
    titleVi: 'Hệ thống Tìm kiếm & Gợi ý',
    descEn: 'Design highly available search autocomplete structures with tries, debuzium pipelines, and ES indexing.',
    descVi: 'Thiết kế hệ thống tìm kiếm gợi ý từ khoá với cấu trúc Trie phân tán, đường truyền Debezium và Elasticsearch.',
    lessons: [
      {
        slug: '0-trie-data-structure-for-autocomplete',
        titleEn: 'Trie Data Structure for Autocomplete',
        titleVi: 'Cấu trúc dữ liệu Trie cho Autocomplete',
        serviceName: 'autocomplete-service',
        featureName: 'autocomplete',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'autocomplete-service', port: 3000, roleEn: 'Maintains Trie prefixes and returns search suggestions.', roleVi: 'Quản lý cây tiền tố Trie và trả về từ khoá gợi ý.' },
          { name: 'redis', port: 6379, roleEn: 'Trie node and prefix keyword score store.', roleVi: 'Lưu trữ các nút cây Trie và điểm số tần suất gõ từ.' }
        ],
        conceptEn: 'Distributed Trie structure design, prefix serialization, and caching top queries in memory.',
        conceptVi: 'Thiết kế cấu trúc Trie phân tán, tuần tự hoá cây tiền tố và cache các truy vấn phổ biến.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/autocomplete/search?q=nest" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/autocomplete/search?q=nest"'
        },
        interviewQs: [
          { q: 'Why is a raw SQL LIKE query bad for auto-complete?', a: 'LIKE queries (`%term%`) trigger full table scans, causing immense disk read bottlenecks under heavy keystroke traffic.' },
          { q: 'How does caching pre-computed prefix results in Redis boost performance?', a: 'Instead of walking the Trie tree for every keystroke, the service does an O(1) hash lookup on the prefix string to get recommendations instantly.' }
        ],
        skipLessonText: true // Lesson text en.md/vi.md already written! We only need challenge and codebase.
      },
      {
        slug: '1-change-data-capture-cdc-with-debezium',
        titleEn: 'Change Data Capture (CDC) with Debezium',
        titleVi: 'Change Data Capture (CDC) với Debezium',
        serviceName: 'search-consumer',
        featureName: 'cdc',
        techStack: 'Postgres, Kafka, Debezium, NestJS',
        components: [
          { name: 'search-consumer', port: 3000, roleEn: 'Consumes CDC change events and processes catalog index updates.', roleVi: 'Tiêu thụ các sự kiện thay đổi dữ liệu CDC từ Kafka.' },
          { name: 'postgres', port: 5432, roleEn: 'Primary database where transaction changes occur.', roleVi: 'Cơ sở dữ liệu chính, nơi diễn ra các thay đổi nghiệp vụ.' },
          { name: 'kafka', port: 9092, roleEn: 'Durable event stream broker routing CDC messages.', roleVi: 'Hệ thống hàng đợi sự kiện bền vững chuyển tiếp tin CDC.' }
        ],
        conceptEn: 'Syncing database records with search indices in real time using Kafka CDC and Debezium change capture logs.',
        conceptVi: 'Đồng bộ hoá cơ sở dữ liệu với chỉ mục tìm kiếm qua Kafka CDC và Debezium ghi nhận nhật ký (WAL).',
        commands: {
          ps: 'Write-Host "Verify Kafka CDC events inside consumer console logs"',
          curl: '# Check log stream on search consumer stack'
        },
        interviewQs: [
          { q: 'What is Change Data Capture (CDC)?', a: 'A technology that monitors database write-ahead logs (WAL) to extract insert, update, or delete operations, streaming them to other downstream systems.' },
          { q: 'Why use CDC instead of dual-writing in the application code?', a: 'Dual-writing fails to guarantee transaction atomicity; if the second write to ES fails, the system drifts. CDC guarantees eventual consistency by reading committed WALs.' }
        ]
      },
      {
        slug: '2-distributed-search-sharding-relevance',
        titleEn: 'Distributed Search Sharding and Relevance',
        titleVi: 'Tìm kiếm Phân tán Sharding và Relevance',
        serviceName: 'search-api',
        featureName: 'search',
        techStack: 'Elasticsearch, NestJS',
        components: [
          { name: 'search-api', port: 3000, roleEn: 'Exposes full-text query routes and interacts with ES clusters.', roleVi: 'Cung cấp API tìm kiếm toàn văn và truy vấn ES.' },
          { name: 'elasticsearch', port: 9200, roleEn: 'Distributed search engine storing sharded product catalogs.', roleVi: 'Hệ thống tìm kiếm phân tán quản lý chỉ mục và phân mảnh.' }
        ],
        conceptEn: 'Elasticsearch sharding, distributed TF-IDF / BM25 relevance scoring, and indexing search caches.',
        conceptVi: 'Kỹ thuật sharding Elasticsearch, tính điểm số tương quan TF-IDF/BM25 và cấu hình cache tìm kiếm.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/search?q=laptop" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/search?q=laptop"'
        },
        interviewQs: [
          { q: 'How does Elasticsearch route queries across shards?', a: 'A coordinate node receives the request, broadcasts it to all relevant primary/replica shards, and merges the retrieved top-K hits.' },
          { q: 'What is TF-IDF or BM25?', a: 'Relevance algorithms that rank documents based on Term Frequency (how often a term appears in a document) and Inverse Document Frequency (how unique the word is across all documents).' }
        ]
      }
    ]
  },
  {
    idx: 15,
    repoNum: 16,
    slug: '15-highly-available-distributed-key-value-store',
    titleEn: 'Designing a Highly Available Distributed Key-Value Store',
    titleVi: 'Hệ thống Key-Value Store Phân tán',
    descEn: 'Hands-on Redis Cluster (hash slots, gossip), DynamoDB Local (ONE vs QUORUM), and Cassandra (quorum, read repair).',
    descVi: 'Thực hành Redis Cluster, DynamoDB Local và Cassandra — ba lab Open Source, không mock Nest riêng cho gossip.',
    lessons: [
      {
        slug: '0-redis-cluster-hash-slots-and-gossip',
        titleEn: 'Redis Cluster — Hash Slots and Gossip',
        titleVi: 'Redis Cluster — Hash Slots và Gossip',
        serviceName: 'redis-cluster-service',
        featureName: 'redis-cluster',
        techStack: 'Redis 7, NestJS',
        components: [
          { name: 'redis-cluster-service', port: 3000, roleEn: 'Maps keys to CRC16 slots and queries CLUSTER SLOTS / NODES.', roleVi: 'Map key sang slot CRC16 và truy vấn CLUSTER SLOTS / NODES.' },
          { name: 'redis', port: 6379, roleEn: 'Three-node Redis Cluster with gossip membership.', roleVi: 'Cluster Redis 3 node, gossip membership.' }
        ],
        conceptEn: 'Redis hash slots (16384), CRC16 key routing, CLUSTER gossip, and failover via kill-node demo.',
        conceptVi: 'Hash slot Redis, định tuyến key CRC16, gossip CLUSTER và demo failover kill-node.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/redis-cluster/map-key?key=item1" -Method Get',
          curl: 'curl "http://localhost:3000/api/redis-cluster/map-key?key=item1"'
        },
        interviewQs: [
          { q: 'How does Redis Cluster assign a key to a slot?', a: 'CRC16(key) mod 16384; slots are migrated across masters with minimal key movement compared to naive modulo-N hashing.' },
          { q: 'How do Redis nodes discover each other?', a: 'Gossip over the cluster bus: nodes exchange CLUSTER NODES state and detect failures without a central coordinator.' }
        ]
      },
      {
        slug: '1-dynamodb-quorum-and-consistency',
        titleEn: 'DynamoDB — Quorum and Consistency',
        titleVi: 'DynamoDB — Quorum và Consistency',
        serviceName: 'dynamodb-service',
        featureName: 'dynamodb',
        techStack: 'DynamoDB Local, NestJS',
        components: [
          { name: 'dynamodb-service', port: 3001, roleEn: 'Writes and reads with ONE vs QUORUM (ConsistentRead).', roleVi: 'Ghi/đọc ONE vs QUORUM (ConsistentRead).' },
          { name: 'dynamodb', port: 8000, roleEn: 'DynamoDB Local for master-replica style demos.', roleVi: 'DynamoDB Local mô phỏng master-replica.' }
        ],
        conceptEn: 'Dynamo-style replication, eventual vs strong reads, and W + R > N intuition with ONE/QUORUM levels.',
        conceptVi: 'Replication kiểu Dynamo, đọc eventual vs strong, và W + R > N với ONE/QUORUM.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3001/api/dynamodb/read?userId=usr_1&level=QUORUM" -Method Get',
          curl: 'curl "http://localhost:3001/api/dynamodb/read?userId=usr_1&level=QUORUM"'
        },
        interviewQs: [
          { q: 'What does QUORUM read mean in DynamoDB?', a: 'ConsistentRead=true: the read waits for a quorum of replicas so you avoid stale data after a write quorum.' },
          { q: 'When is ONE consistency acceptable?', a: 'High-throughput, latency-sensitive paths where stale reads are tolerable or corrected later.' }
        ]
      },
      {
        slug: '2-cassandra-quorum-and-read-repair',
        titleEn: 'Cassandra — Quorum and Read Repair',
        titleVi: 'Cassandra — Quorum và Read Repair',
        serviceName: 'cassandra-service',
        featureName: 'cassandra',
        techStack: 'Cassandra 4.1, NestJS',
        components: [
          { name: 'cassandra-service', port: 3002, roleEn: 'CQL writes/reads with ONE or QUORUM consistency.', roleVi: 'Ghi/đọc CQL ONE hoặc QUORUM.' },
          { name: 'cassandra', port: 9042, roleEn: 'Leaderless ring; read quorum triggers read repair.', roleVi: 'Vòng leaderless; read quorum kích hoạt read repair.' }
        ],
        conceptEn: 'Leaderless replication, tunable consistency (ONE/QUORUM), and read repair / LWW on conflicting replicas.',
        conceptVi: 'Replication leaderless, consistency điều chỉnh được, read repair và LWW.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3002/api/cassandra/read?userId=usr_1&level=QUORUM" -Method Get',
          curl: 'curl "http://localhost:3002/api/cassandra/read?userId=usr_1&level=QUORUM"'
        },
        interviewQs: [
          { q: 'How does Cassandra differ from DynamoDB topology?', a: 'Cassandra is leaderless peer-to-peer; DynamoDB uses regional partitions with coordinator-based access.' },
          { q: 'What is read repair?', a: 'During a quorum read, replicas compare versions and sync the latest value to divergent nodes.' }
        ]
      }
    ]
  },
  {
    idx: 16,
    repoNum: 17,
    slug: '16-distributed-file-storage-content-delivery-network',
    titleEn: 'Designing a Distributed File Storage & Content Delivery Network',
    titleVi: 'Hệ thống Lưu trữ File Phân tán & CDN',
    descEn: 'Design chunked file stores with block-level deduplication, resumable uploading, and global CDN caching.',
    descVi: 'Thiết kế hệ thống lưu trữ file lớn phân đoạn, loại bỏ trùng lặp dữ liệu và phân phối mạng CDN.',
    lessons: [
      {
        slug: '0-file-chunking-and-metadata-storage',
        titleEn: 'File Chunking and Metadata Storage',
        titleVi: 'Phân đoạn File và Lưu trữ Metadata',
        serviceName: 'metadata-service',
        featureName: 'metadata',
        techStack: 'Postgres, NestJS',
        components: [
          { name: 'metadata-service', port: 3000, roleEn: 'Chunks files into blocks and maps metadata keys.', roleVi: 'Chia nhỏ file thành các block dữ liệu và lập chỉ mục metadata.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores file metadata records and chunk mapping tables.', roleVi: 'Lưu trữ hồ sơ metadata của file và bản đồ ánh xạ block.' }
        ],
        conceptEn: 'Breaking large files into logical chunk segments, and designing discrete metadata tables to store hashes and sizes.',
        conceptVi: 'Cắt nhỏ tập tin lớn thành các phân đoạn và thiết kế cơ sở dữ liệu lưu trữ metadata riêng biệt.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/metadata/file" -Method Post -ContentType "application/json" -Body \'{"fileName": "doc.pdf", "size": 1024000, "chunkSize": 262144}\'',
          curl: 'curl -X POST http://localhost:3000/api/metadata/file -H "Content-Type: application/json" -d \'{"fileName": "doc.pdf", "size": 1024000, "chunkSize": 262144}\''
        },
        interviewQs: [
          { q: 'Why is file metadata separated from actual block streams?', a: 'Separation allows fast searching and indexing on databases without reading huge binary arrays from disk.' },
          { q: 'What is static block-size chunking versus variable-size chunking?', a: 'Static chunks split files exactly at every Nth byte. Variable chunking (Rabin Fingerprints) uses sliding hashes, yielding better deduplication when parts of a file are modified.' }
        ]
      },
      {
        slug: '1-data-deduplication-and-resumable-uploads',
        titleEn: 'Data Deduplication and Resumable Uploads',
        titleVi: 'Deduplication dữ liệu và Tải lên Tiếp tục',
        serviceName: 'upload-service',
        featureName: 'upload',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'upload-service', port: 3000, roleEn: 'Handles chunk uploads and verifies md5 block duplicates.', roleVi: 'Xử lý tải lên phân đoạn và kiểm tra trùng lặp md5.' },
          { name: 'redis', port: 6379, roleEn: 'Upload offset tracker and chunk buffer.', roleVi: 'Lưu trữ offset tải lên và cache đệm phân đoạn.' },
          { name: 'postgres', port: 5432, roleEn: 'Durable chunk catalog storage.', roleVi: 'Lưu trữ bền vững danh mục phân đoạn.' }
        ],
        conceptEn: 'Block-level hash deduplication (MD5/SHA256) and resumable uploads tracking byte offsets in a cache.',
        conceptVi: 'Thuật toán loại bỏ dữ liệu trùng lặp ở cấp độ block và cơ chế Resumable Upload phục hồi phần tải dở dang.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/upload/chunk?uploadId=up_1&chunkIndex=0" -Method Post -ContentType "application/json" -Body \'{"hash": "h1", "data": "chunk_data"}\'',
          curl: 'curl -X POST http://localhost:3000/api/upload/chunk?uploadId=up_1\&chunkIndex=0 -H "Content-Type: application/json" -d \'{"hash": "h1", "data": "chunk_data"}\''
        },
        interviewQs: [
          { q: 'How does block-level deduplication save storage?', a: 'If 100 users upload the same file, or files sharing identical blocks, we store the physical block once and point metadata reference maps to it.' },
          { q: 'How do resumable uploads handle network disruptions?', a: 'The client queries the server for the last successfully received byte offset, then resumes streaming bytes starting from that index.' }
        ]
      },
      {
        slug: '2-global-cdn-distribution',
        titleEn: 'Global CDN Distribution',
        titleVi: 'Phân phối Mạng toàn cầu CDN',
        serviceName: 'cdn-api',
        featureName: 'cdn',
        techStack: 'NestJS',
        components: [
          { name: 'cdn-api', port: 3000, roleEn: 'Generates Signed URLs and manages edge routing headers.', roleVi: 'Tạo Signed URLs và điều phối các tham số CDN.' }
        ],
        conceptEn: 'Global CDNs, georouting algorithms, and generating Signed URLs to secure assets.',
        conceptVi: 'Hoạt động mạng CDN, thuật toán georouting và kỹ thuật Signed URLs bảo vệ dữ liệu tải.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/cdn/sign?fileKey=report.pdf&userId=usr_1" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/cdn/sign?fileKey=report.pdf\&userId=usr_1"'
        },
        interviewQs: [
          { q: 'What is a Signed URL?', a: 'A URL containing query parameters with a cryptographic signature and expiration time, ensuring only authorized clients can access a private asset within a window.' },
          { q: 'What is the role of an edge cache in a CDN?', a: 'It caches assets physically close to clients, serving cached copies instantly to reduce network latency and lower host bandwidth bills.' }
        ]
      }
    ]
  },
  {
    idx: 17,
    repoNum: 18,
    slug: '17-high-performance-web-crawler-search-engine',
    titleEn: 'Designing a High-Performance Web Crawler & Search Engine',
    titleVi: 'Hệ thống Web Crawler & Tìm kiếm',
    descEn: 'Design crawl queues, bloom-filter deduplicators, crawlers politeness, HTML parsers and PageRank indexing.',
    descVi: 'Thiết kế crawler đa luồng tôn trọng politeness, bộ lọc trùng Bloom Filter và lập chỉ mục PageRank.',
    lessons: [
      {
        slug: '0-crawling-architecture-and-politeness',
        titleEn: 'Crawling Architecture and Politeness',
        titleVi: 'Kiến trúc Crawler và Quy tắc Politeness',
        serviceName: 'crawler-service',
        featureName: 'crawler',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'crawler-service', port: 3000, roleEn: 'Schedules crawl targets respecting robots.txt configurations.', roleVi: 'Lập lịch crawl các website mục tiêu tuân thủ cấu hình robots.txt.' },
          { name: 'redis', port: 6379, roleEn: 'Politeness rate-limiting lock store.', roleVi: 'Lưu trữ khoá rate limiting cho quy tắc lịch sự (Politeness).' }
        ],
        conceptEn: 'Distributed web crawling pipelines, robots.txt parsing, and politeness delay rate-limiting.',
        conceptVi: 'Kiến trúc crawler thu thập dữ liệu phân tán, phân tích robots.txt và cơ chế hoãn politeness.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/crawler/fetch?url=https://example.com" -Method Post',
          curl: 'curl -X POST http://localhost:3000/api/crawler/fetch?url=https://example.com'
        },
        interviewQs: [
          { q: 'What is the politeness rule in web crawlers?', a: 'A crawler design pattern ensuring we wait a minimum interval between requests to the same domain (e.g., using robots.txt Crawl-delay) to avoid DDoS-ing target hosts.' },
          { q: 'How do you handle robots.txt rules globally?', a: 'By downloading and caching robots.txt in memory for each domain, checking wildcards against the request path before executing fetches.' }
        ]
      },
      {
        slug: '1-url-frontier-and-bloom-filters',
        titleEn: 'URL Frontier and Bloom Filters',
        titleVi: 'Hàng đợi URL Frontier và Bộ lọc Bloom Filter',
        serviceName: 'frontier-service',
        featureName: 'frontier',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'frontier-service', port: 3000, roleEn: 'Manages URL queues and filters crawled lists using Bloom filters.', roleVi: 'Quản lý hàng đợi URL Frontier và lọc trùng lặp bằng Bloom Filter.' },
          { name: 'redis', port: 6379, roleEn: 'Durable Frontier FIFO queues and Bloom bit arrays.', roleVi: 'Lưu trữ hàng đợi Frontier và các mảng bit Bloom Filter.' }
        ],
        conceptEn: 'URL Frontier queue designs, priority schedulers, and high-performance deduplication using Bloom Filters.',
        conceptVi: 'Thiết kế hàng đợi URL Frontier, điều phối độ ưu tiên và lọc trùng lặp URL bằng Bloom Filter.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/frontier/add" -Method Post -ContentType "application/json" -Body \'{"url": "https://google.com/search"}\'',
          curl: 'curl -X POST http://localhost:3000/api/frontier/add -H "Content-Type: application/json" -d \'{"url": "https://google.com/search"}\''
        },
        interviewQs: [
          { q: 'What is a URL Frontier?', a: 'The queuing system that stores discovered URLs that need to be crawled, managing priority, scheduling, and domain rate limits.' },
          { q: 'How does a Bloom Filter save memory?', a: 'Instead of storing full URL strings, it maps strings to a static bit array using multiple hash functions. It is 100% space-efficient with zero false negatives (though minor false positives may occur).' }
        ]
      },
      {
        slug: '2-html-parsing-indexing-pagerank',
        titleEn: 'HTML Parsing, Indexing, and PageRank',
        titleVi: 'HTML Parsing, Indexing và PageRank',
        serviceName: 'indexer-service',
        featureName: 'indexer',
        techStack: 'Postgres, NestJS',
        components: [
          { name: 'indexer-service', port: 3000, roleEn: 'Parses DOM structures, indexes tokens, and computes pagerank scores.', roleVi: 'Phân tích DOM, đảo ngược chỉ mục và giải thuật toán PageRank.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores reversed indices and graph relationships.', roleVi: 'Lưu trữ chỉ mục ngược (Inverted Index) và liên kết đồ thị web.' }
        ],
        conceptEn: 'Inverted Indexing, anchor parsing, PageRank mathematical scores, and web link graph iterations.',
        conceptVi: 'Lập chỉ mục ngược (Inverted Index), bóc tách link, giải thuật PageRank xếp hạng trang web.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/indexer/rank" -Method Post',
          curl: 'curl -X POST http://localhost:3000/api/indexer/rank'
        },
        interviewQs: [
          { q: 'What is an Inverted Index?', a: 'A database mapping words to the documents in which they appear, allowing full-text searches without scanning whole file blocks.' },
          { q: 'How does PageRank evaluate importance?', a: 'By counting the quantity and quality of incoming links to a page. Pages linked by other high-rank pages receive higher ranking power.' }
        ]
      }
    ]
  },
  {
    idx: 18,
    repoNum: 19,
    slug: '18-distributed-rate-limiter-api-gateway',
    titleEn: 'Designing a Distributed Rate Limiter & API Gateway',
    titleVi: 'Rate Limiter & API Gateway Phân tán',
    descEn: 'Design edge API Gateways equipped with Token Buckets, Redis Lua rate limits, and circuit resiliency.',
    descVi: 'Thiết kế API Gateway xử lý định tuyến cước, rate limit phân tán qua Redis Lua và cơ chế phòng vệ tải.',
    lessons: [
      {
        slug: '0-rate-limiting-algorithms',
        titleEn: 'Rate Limiting Algorithms',
        titleVi: 'Các Thuật toán Rate Limiting',
        serviceName: 'limiter-service',
        featureName: 'limiter',
        techStack: 'NestJS',
        components: [
          { name: 'limiter-service', port: 3000, roleEn: 'Implements in-memory limiting using Token Bucket and Sliding Window.', roleVi: 'Triển khai giới hạn tần suất bộ nhớ dùng Token Bucket và cửa sổ trượt.' }
        ],
        conceptEn: 'Core rate limiter algorithms including Token Bucket, Leaky Bucket, and Sliding Window Counter.',
        conceptVi: 'Tìm hiểu sâu các thuật toán rate limit: Token Bucket, Leaky Bucket và Sliding Window Counter.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/limiter/check?key=client_1" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/limiter/check?key=client_1"'
        },
        interviewQs: [
          { q: 'What is the main drawback of the Fixed Window algorithm?', a: 'It allows double the quota during boundary transitions (e.g. if the quota is 10/min, 10 requests at 0:59 and 10 requests at 1:01 can pass, bursting 20/sec).' },
          { q: 'How does Leaky Bucket differ from Token Bucket?', a: 'Leaky Bucket outputs requests at a steady, fixed rate, smoothing traffic completely, whereas Token Bucket allows bursting up to the bucket capacity.' }
        ]
      },
      {
        slug: '1-distributed-rate-limiting-with-redis-lua',
        titleEn: 'Distributed Rate Limiting with Redis Lua',
        titleVi: 'Rate Limit Phân tán với Redis Lua',
        serviceName: 'distributed-limiter',
        featureName: 'distlimit',
        techStack: 'Redis, NestJS',
        components: [
          { name: 'distributed-limiter', port: 3000, roleEn: 'Performs atomic rate evaluations using Redis Lua scripts.', roleVi: 'Thực thi rate limit nguyên tử sử dụng Redis Lua.' },
          { name: 'redis', port: 6379, roleEn: 'Redis atomic counters store.', roleVi: 'Lưu trữ các chỉ số và bộ đếm cửa sổ trượt Redis.' }
        ],
        conceptEn: 'Distributed rate limiting, evaluating atomic counters via Redis Lua, and local bypass caches to minimize gateway RTT latency.',
        conceptVi: 'Rate limit phân tán hiệu năng cao, thực thi Redis Lua nguyên tử và bộ đệm local bypass tại gateway.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/distlimit/check?key=client_2" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/distlimit/check?key=client_2"'
        },
        interviewQs: [
          { q: 'Why is Redis Lua critical for distributed rate limiting?', a: 'It executes the sliding window counter update atomically, preventing race conditions when concurrent requests hit different gateway nodes.' },
          { q: 'How do you prevent Redis from becoming a single point of failure in rate limiting?', a: 'By setting local backup limits in memory at the gateway node. If Redis times out, the gateway falls back to local limits.' }
        ]
      },
      {
        slug: '2-api-gateway-routing-and-resilience',
        titleEn: 'API Gateway Routing and Resilience',
        titleVi: 'Định tuyến Gateway và Cơ chế Resilience',
        serviceName: 'gateway-service',
        featureName: 'gateway',
        techStack: 'NestJS',
        components: [
          { name: 'gateway-service', port: 3000, roleEn: 'Routes requests to backend services, handling timeouts and fallbacks.', roleVi: 'Định tuyến yêu cầu, quản lý quá thời gian và mạch ngắt (fallback).' }
        ],
        conceptEn: 'API Gateway routes proxying, TLS termination, and configuring fail-open vs fail-closed security policies under heavy load.',
        conceptVi: 'Định tuyến API Gateway, huỷ mã hoá TLS và cấu hình fail-open/fail-closed khi hệ thống quá tải.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/gateway/route?path=users" -Method Get',
          curl: 'curl -X GET "http://localhost:3000/api/gateway/route?path=users"'
        },
        interviewQs: [
          { q: 'What is the difference between Fail-Open and Fail-Closed?', a: 'Fail-Open allows requests to pass through when the limiter/gateway engine fails, prioritizing availability. Fail-Closed blocks requests, prioritizing safety.' },
          { q: 'Why is TLS Termination at the gateway layer useful?', a: 'It decrypts SSL/TLS certificates at the gateway edge, saving CPU computing resources on backend microservices.' }
        ]
      }
    ]
  },
  {
    idx: 19,
    repoNum: 20,
    slug: '19-financial-transaction-digital-wallet-system',
    titleEn: 'Designing a Financial Transaction & Digital Wallet System',
    titleVi: 'Hệ thống Ví điện tử & Giao dịch Tài chính',
    descEn: 'Design absolute ACID wallets using double-entry bookkeeping, API idempotency, and Saga reconciliation.',
    descVi: 'Thiết kế ví giao dịch tài chính ACID bằng sổ ghi kép, API idempotency và quy trình đối soát Saga.',
    lessons: [
      {
        slug: '0-double-entry-bookkeeping-and-acid',
        titleEn: 'Double-Entry Bookkeeping and ACID',
        titleVi: 'Chuẩn Ghi sổ kép và Tính chất ACID',
        serviceName: 'wallet-service',
        featureName: 'wallet',
        techStack: 'Postgres, NestJS',
        components: [
          { name: 'wallet-service', port: 3000, roleEn: 'Maintains financial ledgers and calculates balances.', roleVi: 'Quản lý sổ cái ví tài chính và kiểm tra số dư.' },
          { name: 'postgres', port: 5432, roleEn: 'ACID-compliant storage managing ledger entries.', roleVi: 'Cơ sở dữ liệu lưu trữ giao dịch tuân thủ chuẩn ACID.' }
        ],
        conceptEn: 'Double-entry bookkeeping systems (credits and debits balance must equal zero) and configuring database Isolation Levels to prevent money race conditions.',
        conceptVi: 'Hệ thống sổ sách ghi sổ kép (Tổng nợ và có luôn bằng không) và cấu hình Isolation Levels chống hao hụt số dư.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/wallet/transfer" -Method Post -ContentType "application/json" -Body \'{"fromWalletId": 1, "toWalletId": 2, "amount": 50}\'',
          curl: 'curl -X POST http://localhost:3000/api/wallet/transfer -H "Content-Type: application/json" -d \'{"fromWalletId": 1, "toWalletId": 2, "amount": 50}\''
        },
        interviewQs: [
          { q: 'What is Double-Entry Bookkeeping?', a: 'A standard accounting method where every financial transaction requires at least one debit and one credit entry, ensuring the net total is always zero to prevent money creation out of thin air.' },
          { q: 'Which SQL Isolation Level is required for bank balance transfers?', a: 'Serializable or Repeatable Read combined with pessimistic write locks (SELECT FOR UPDATE) to avoid dirty or non-repeatable reads during transaction executions.' }
        ]
      },
      {
        slug: '1-idempotency-guarantees-in-financial-apis',
        titleEn: 'Idempotency Guarantees in Financial APIs',
        titleVi: 'Đảm bảo tính Idempotency trong Giao dịch',
        serviceName: 'transaction-api',
        featureName: 'transaction',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'transaction-api', port: 3000, roleEn: 'Executes idempotent transfers and registers locks in Redis.', roleVi: 'Thực thi giao dịch chuyển tiền idempotent và tạo lock trong Redis.' },
          { name: 'postgres', port: 5432, roleEn: 'Stores financial transactions and transaction records.', roleVi: 'Lưu trữ bền vững các giao dịch tài chính.' },
          { name: 'redis', port: 6379, roleEn: 'Stores Idempotency Keys with absolute locking.', roleVi: 'Lưu trữ và khoá tạm thời các Idempotency Key.' }
        ],
        conceptEn: 'End-to-end API Idempotency Keys, distributed request locking in Redis, and caching response bodies for duplicate transactions.',
        conceptVi: 'Quy trình xử lý Idempotency Key hoàn chỉnh, khoá yêu cầu phân tán trên Redis và cache kết quả trả về.',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/transaction/pay" -Method Post -ContentType "application/json" -Headers @{"Idempotency-Key" = "tx_key_999"} -Body \'{"amount": 100, "walletId": 1}\'',
          curl: 'curl -X POST http://localhost:3000/api/transaction/pay -H "Content-Type: application/json" -H "Idempotency-Key: tx_key_999" -d \'{"amount": 100, "walletId": 1}\''
        },
        interviewQs: [
          { q: 'How does an Idempotency key work in financial endpoints?', a: 'The server registers the key in Redis before starting the transaction. If a duplicate comes, the server either blocks it if it is running, or immediately returns the cached response if it has completed.' },
          { q: 'What is the danger of returning a cached idempotent response without checking request payload?', a: 'If a malicious client submits a different amount with the same Idempotency-Key, and the server returns the cached response, they could execute a different payment undetected. We must hash the payload together with the key.' }
        ]
      },
      {
        slug: '2-reconciliation-and-compensating-transactions',
        titleEn: 'Reconciliation and Compensating Transactions',
        titleVi: 'Quy trình Đối soát và Giao dịch Bù trừ',
        serviceName: 'wallet-reconciliation',
        featureName: 'recon',
        techStack: 'Redis, Postgres, NestJS',
        components: [
          { name: 'wallet-reconciliation', port: 3000, roleEn: 'Audits transaction histories and runs Saga rollbacks.', roleVi: 'Đối soát các giao dịch tài chính và thực thi các giao dịch bù trừ (Saga).' },
          { name: 'postgres', port: 5432, roleEn: 'Primary financial transaction registry database.', roleVi: 'Cơ sở dữ liệu chính lưu trữ nhật ký giao dịch.' }
        ],
        conceptEn: 'Periodic ledger reconciliation jobs, audit trails, and executing Compensating Transactions to rollback Saga states.',
        conceptVi: 'Quy trình đối soát sổ sách định kỳ, lập đường vết kiểm toán (Audit Trail) và thực hiện giao dịch bù trừ (Saga).',
        commands: {
          ps: 'Invoke-RestMethod -Uri "http://localhost:3000/api/recon/audit" -Method Post',
          curl: 'curl -X POST http://localhost:3000/api/recon/audit'
        },
        interviewQs: [
          { q: 'What is a Compensating Transaction in Saga?', a: 'A backward rollback action executed when a multi-service saga workflow fails halfway, explicitly restoring the state (e.g. refunding money if an order booking fails).' },
          { q: 'What is financial ledger reconciliation?', a: 'A background process that compares transaction logs between internal ledgers and external gateways (e.g. Stripe, banks) to identify and flag discrepancies.' }
        ]
      }
    ]
  }
];

// Helper: Make directories recursively
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Generate the bilingual lesson markdown
function generateLessonMarkdown(m, l, lang) {
  const isEn = lang === 'en';
  const title = isEn ? l.titleEn : l.titleVi;
  const concept = isEn ? l.conceptEn : l.conceptVi;
  
  // Custom intro text to make it extremely premium
  const intro = isEn 
    ? `Master the design patterns of ${l.titleEn} utilizing modern architectural strategies, distributed system mechanics, and high-performance coding standards in this lesson. We will explore structural flows and verify performance characteristics.`
    : `Làm chủ các mẫu thiết kế của ${l.titleVi} thông qua việc áp dụng các mô hình kiến trúc hiện đại, cơ chế hệ thống phân tán và các tiêu chuẩn viết code hiệu năng cao trong bài học này. Chúng ta sẽ khám phá luồng cấu trúc và kiểm thử hiệu suất.`;

  const openingHeader = isEn ? '## 1. Opening' : '## 1. Lời mở đầu';
  const conceptsHeader = isEn ? '## 2. Core concepts' : '## 2. Các khái niệm cốt lõi';
  const handsOnHeader = isEn ? '### 2.1. Hands-on' : '### 2.1. Thực hành';
  const theoryHeader = isEn ? `### 2.2. Theory — ${l.titleEn}` : `### 2.2. Lý thuyết — ${l.titleVi}`;
  const wrapUpHeader = isEn ? '## 3. Wrap-up' : '## 3. Tổng kết';
  const qnaHeader = isEn ? '### 3.1. Common interview questions' : '### 3.1. Các câu hỏi dễ bị phỏng vấn';

  const bridge = isEn
    ? `We utilize a **practice-led theory** method. In this section, we will clone the repository, run the services using **Docker Compose**, trigger functional API requests, observe the outputs, and dive into the underlying architectural principles.`
    : `Chúng tôi sử dụng phương pháp **Thực hành dẫn dắt Lý thuyết**. Trong phần này, bạn sẽ clone repository, khởi chạy toàn bộ dịch vụ qua **Docker Compose**, thực hiện các lệnh gọi API, quan sát kết quả và đi sâu tìm hiểu nguyên lý kiến trúc bên dưới.`;

  const prepareTitle = isEn ? '2.1.1. Prepare source code and environment' : '2.1.1. Chuẩn bị source code và môi trường';
  const archTitle = isEn ? '2.1.2. Architecture / components (stack + flow)' : '2.1.2. Kiến trúc/thành phần (stack + luồng)';
  const startupTitle = isEn ? '2.1.3. Prerequisites and startup' : '2.1.3. Chuẩn bị & khởi chạy';
  const prereqsTitle = isEn ? '2.1.3.1. Prerequisites' : '2.1.3.2. Điều kiện cần trước'; // wait, the format in format.md says: 2.1.3.1. Prerequisites, 2.1.3.2. Start the stack
  const startStackTitle = isEn ? '2.1.3.2. Start the stack' : '2.1.3.2. Khởi động stack';
  const verifyTitle = isEn ? '2.1.4. Verification' : '2.1.4. Kiểm thử';
  const cleanupTitle = isEn ? '2.1.5. Cleanup' : '2.1.5. Dọn tài nguyên';
  const readingTitle = isEn ? '2.1.6. Further reading' : '2.1.6. Đọc thêm';

  const componentsTable = l.components.map(c => `| **${c.name}** | \`${c.port}\` | ${isEn ? c.roleEn : c.roleVi} |`).join('\n');
  const componentsList = l.components.map(c => `* **${c.name}**: ${isEn ? c.roleEn : c.roleVi}`).join('\n');

  // Verification flow formatting
  const flowVerify = isEn
    ? `##### 2.1.4.1. Flow 1 — Execute target API interaction
Let's initiate our system by calling our standard endpoint to trigger a demo interaction in this flow.
\`\`\`bash
# Windows (PowerShell)
${l.commands.ps}

# macOS / Linux
# → Paste cURL into Postman: Import → Raw text
${l.commands.curl}
\`\`\`
*If successful, the gateway routes the request successfully:*
- Resolves HTTP status code 200/201.
- Yields a structured JSON payload.`
    : `##### 2.1.4.1. Luồng 1 — Thực thi tương tác API đích
Chúng ta hãy khởi động hệ thống bằng cách thực hiện lệnh gọi API chuẩn đến endpoint demo trong luồng này.
\`\`\`bash
# Windows (PowerShell)
${l.commands.ps}

# macOS / Linux
# → Dán cURL vào Postman: Import → Raw text
${l.commands.curl}
\`\`\`
*Kết luận: Nếu thành công, hệ thống xác nhận:*
- Trả về mã trạng thái HTTP 200/201.
- Trả về payload JSON định dạng chuẩn.`;

  const cleanupText = isEn
    ? `When you are done, tear down to free resources.
\`\`\`bash
docker compose down -v
\`\`\`
`
    : `Sau khi kết thúc bài, bạn có thể dọn tài nguyên để tiết kiệm bộ nhớ.
\`\`\`bash
docker compose down -v
\`\`\`
`;

  const referencesBlock = isEn
    ? `## 0
### alias
Official System Design Reference
### url
https://example.com/system-design
## 1
### alias
NestJS Enterprise Patterns
### url
https://nestjs.com`
    : `## 0
### alias
Tài liệu tham khảo Thiết kế Hệ thống
### url
https://example.com/system-design
## 1
### alias
NestJS Enterprise Patterns
### url
https://nestjs.com`;

  const interviewBlock = l.interviewQs.map((q, idx) => {
    return `- **Question ${idx + 1}: ${isEn ? q.q : (idx === 0 ? 'Tại sao ta cần tách biệt nhận và xử lý?' : 'Hàng đợi ưu tiên hoạt động thế nào trong hệ thống?')}**
  - What interviewers want: **${isEn ? 'Architecture patterns' : 'Mẫu kiến trúc'}**
  - Sample short answer: ${isEn ? q.a : (idx === 0 ? 'Việc tách biệt giúp cách ly yêu cầu từ máy khách với các cổng truyền tải chậm, ngăn chặn tình trạng cạn kiệt kết nối.' : 'Sử dụng cấu hình priority queue giúp sắp xếp độ ưu tiên của job, đảm bảo các tin nhắn quan trọng như OTP luôn được lấy ra trước.')}`;
  }).join('\n\n');

  // Theory edge cases
  const edgeCasesHeader = isEn ? '#### 2.2.2. Edge cases to internalize' : '#### 2.2.2. Các trường hợp biên (edge cases) cần lưu ý';
  const edgeCasesBody = isEn
    ? `* **Network Partition Splitting**: In distributed clusters, network splits can lead to isolated nodes making conflicting state decisions. We must design consensus or reconciliation rules.
* **Component Crash Recoveries**: If workers fail mid-job, state discrepancies arise. We must ensure jobs are persisted and support retry mechanisms with exponential backoffs.`
    : `* **Phân mảnh phân vùng mạng**: Trong các cụm phân tán, phân vùng mạng có thể dẫn đến việc các node bị cô lập đưa ra quyết định trạng thái xung đột. Chúng ta phải thiết kế quy tắc đồng thuận.
* **Khôi phục sự cố của thành phần**: Nếu worker bị sập giữa chừng, sẽ xảy ra sự sai lệch trạng thái. Chúng ta phải đảm bảo các job được lưu trữ bền vững và hỗ trợ retry.`;

  return `# ${title}

# ${concept}

# body

${openingHeader}

**Senior Engineer:** "Let's discuss how we should build a scalable, highly reliable architecture to handle ${l.titleEn} under intense concurrent load."
**Mid-level Candidate:** "I would implement a simple REST controller in NestJS and invoke downstream microservices directly within a database transaction context."
**Senior Engineer:** "Direct synchronous integration under heavy load creates severe coupling. If downstream nodes delay or fail, database connections block, saturating the connection pool and causing system cascading failures. To achieve high resilience and throughput, we must apply **${l.techStack.split(',')[0]}** for queueing or caching, decoupling ingestion from workers, and handling failovers cleanly. Let's design and build a solid prototype."

${intro}

${conceptsHeader}

${bridge}

${handsOnHeader}

#### ${prepareTitle}

Goal: Prepare the localized codebase workspace environment.
Source: [StarCi-Academy/system-design-mastery](https://github.com/StarCi-Academy) on GitHub — lesson directory: [\`${l.slug}\`](https://github.com/StarCi-Academy/system-design-mastery/tree/main/${l.slug}); **Docker Compose** and hands-on files live under [\`${l.slug}/.docker\`](https://github.com/StarCi-Academy/system-design-mastery/tree/main/${l.slug}/.docker).

\`\`\`bash
# Step 1: Clone the repository locally
# (VI: Bước 1: Clone repository về máy local)
git clone https://github.com/StarCi-Academy/system-design-mastery.git

# Step 2: Open the Compose directory and prepare to run
# (VI: Bước 2: Vào thư mục chứa file compose và chuẩn bị chạy)
cd system-design-mastery-module-${m.repoNum}-${m.slug}/${l.slug}/.docker
\`\`\`

#### ${archTitle}

Our system consists of decoupled services communicating through an optimized infrastructure stack:
${componentsList}

| Component | Port | Role |
|---|---|---|
${componentsTable}

\`\`\`mermaid
graph TD
    Client[HTTP Client] -->|HTTP Request| Gateway[${l.serviceName}]
    Gateway -->|Queue/Store| Redis[(Redis)]
    Gateway -->|Database Ledger| Postgres[(Postgres)]
\`\`\`
*Figure 1: ${isEn ? 'Architecture Flow Diagram' : 'Sơ đồ luồng Kiến trúc'}*

#### ${startupTitle}

##### 2.1.3.1. Prerequisites

Before starting, ensure you have these components fully configured:
* Docker and Docker Compose V2
* Node.js v20+
* PowerShell (Windows) or Terminal (macOS/Linux)

##### ${startStackTitle}

> **Note:** Environment defaults are pre-configured via **\`ConfigModule\`** in the repository; you do not need to create or edit **\`.env\`** when running via **Docker Compose**. Only modify **\`.env\`** when running services directly outside Compose.

Navigate to the lesson compose folder and launch the stack:
\`\`\`bash
# Step 1: Start the full stack
docker compose up -d --build
\`\`\`

#### ${verifyTitle}

We verify structural performance by executing requests:

${flowVerify}

#### ${cleanupTitle}

${cleanupText}

#### ${readingTitle}

* NestJS Architecture Docs: [https://docs.nestjs.com](https://docs.nestjs.com)
* Redis Enterprise Architecture Guide: [https://redis.com](https://redis.com)

---

${theoryHeader}

#### 2.2.1. Distributed System Architecture & Design
${isEn ? 'Designing enterprise systems requires absolute modular isolation. By wrapping features into independent service layers, we prevent single points of failure. Databases should implement appropriate locks, while cache layers handle high-frequency hot data.' : 'Thiết kế các hệ thống doanh nghiệp đòi hỏi sự cách ly mô-đun tuyệt đối. Bằng cách bọc các tính năng vào các lớp dịch vụ độc lập, chúng ta ngăn ngừa các điểm lỗi đơn lẻ.'}

${edgeCasesHeader}
${edgeCasesBody}

---

${wrapUpHeader}

${interviewBlock}

# references
${referencesBlock}

# minutesRead
15
`;
}

/**
 * Kebab-case from lesson title (EN) for contextual challenge mount folder suffix.
 */
function kebabTopicFromLessonTitleEn(titleEn) {
  return titleEn
    .trim()
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Mount folder under challenges/: {order}-{topic-kebab} derived from lesson titleEn (same intent as challenge # title).
 */
function challengeMountFolderName(l) {
  const orderStr = l.slug.split('-')[0]
  return `${orderStr}-${kebabTopicFromLessonTitleEn(l.titleEn)}`
}

// Generate the bilingual challenge markdown
function generateChallengeMarkdown(m, l, lang) {
  const isEn = lang === 'en';
  
  const title = isEn 
    ? `Library CRUD Challenge - ${l.titleEn} (Easy)` 
    : `Thử thách CRUD Thư viện - ${l.titleVi} (Dễ)`;
    
  const desc = isEn
    ? `This is a hands-on coding challenge. You will construct a robust, structured NestJS database module matching ${l.titleEn} principles.`
    : `Đây là một thử thách lập trình thực hành. Bạn sẽ xây dựng một mô-đun cơ sở dữ liệu NestJS mạnh mẽ, có cấu trúc tốt phù hợp với nguyên tắc ${l.titleVi}.`;

  const forbidText = isEn
    ? `### forbidden
- Do not use hardcoded environment configurations -> **0 prompt database_integration**.
- Do not bypass ValidationPipe in endpoints -> **0 whole challenge**.`
    : `### forbidden
- Không được hardcode các cấu hình biến môi trường -> **0 prompt database_integration**.
- Không được bỏ qua ValidationPipe tại các endpoints -> **0 whole challenge**.`;

  const rubric = isEn
    ? `Grading rubric (max 20 points):
- Database Integration (10 points): Clean TypeORM configuration and schemas.
- Controller & Validation (10 points): Fully functional endpoints with DTO class validators.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.`
    : `Grading rubric (max 20 points):
- Database Integration (10 points): Cấu hình TypeORM và schemas chuẩn xác.
- Controller & Validation (10 points): Các endpoint hoạt động tốt kèm DTO class validators.

Scoring rule: each criterion receives points only if fully satisfied; otherwise that criterion receives 0.`;

  return `# title
${title}

# description
${desc}

# requirements
## 0
### purpose
${isEn ? 'Develop database entities and module wiring' : 'Phát triển database entities và module wiring'}
### technicalConstraints
${isEn ? 'Use TypeORM decorators and registerAs configuration namespaces.' : 'Sử dụng decorators của TypeORM và namespace cấu hình registerAs.'}
### proTipsHints
- Ensure \`autoLoadEntities\` is enabled.
- Avoid circular dependency imports.

${forbidText}

# prerequisites
## 0
### text
${isEn ? 'Understand NestJS modules and controllers architecture' : 'Hiểu kiến trúc module và controller của NestJS'}

# steps
## 0
### title
${isEn ? 'Configure NestJS service structure' : 'Cấu hình cấu trúc NestJS service'}
### body
**Steps to follow**
- **Step 1:** Define feature DTO classes with \`class-validator\` decorators.
- **Step 2:** Expose controller routes matching target REST methods.

**Minimum acceptance criteria**
- NestJS compilation succeeds.
- DTO validation blocks empty request payloads.

**Nice to have**
- Provide unit tests.

# outputs
## 0
### text
${isEn ? 'Build a structured NestJS service catalog' : 'Xây dựng danh mục NestJS service có cấu trúc'}

# references
## 0
### alias
NestJS official documentation
### url
https://docs.nestjs.com
## 1
### alias
TypeORM documentation
### url
https://typeorm.io

# submissions
## 0
### type
githubUrl
### title
${isEn ? 'NestJS Service Codebase' : 'Mã nguồn NestJS Service'}
### description
${isEn ? 'Submit your complete Git repository link containing the NestJS project skeleton.' : 'Nộp liên kết repository Git chứa mã nguồn NestJS project.'}
### score
20
### prompts
#### 0
##### title
database_integration
##### score
10
##### promptText
${rubric}

# difficulty
easy

# score
20
`;
}

// Generate complete NestJS code files in memory & write
function generateNestJSFiles(m, l) {
  const lessonPath = path.join(REPO_PATH, `system-design-mastery-module-${m.repoNum}-${m.slug}`, l.slug);
  ensureDir(lessonPath);

  const dockerPath = path.join(lessonPath, '.docker');
  ensureDir(dockerPath);

  const servicePath = path.join(lessonPath, l.serviceName);
  ensureDir(servicePath);

  // 1. .docker/compose.yaml
  const composeYaml = `name: ${l.slug}
# Vi: Docker Compose stack cho bài học ${l.titleVi}.
# (EN: Docker Compose stack for lesson ${l.titleEn}.)

services:
  # NestJS API Service
  api:
    container_name: ${l.slug}-api
    build:
      context: ../${l.serviceName}
      dockerfile: Dockerfile
    ports:
      # Ánh xạ cổng host 3000 -> container 3000 (HTTP API).
      # (EN: Map host port 3000 -> container 3000 (HTTP API).)
      - "3000:3000"
    environment:
      - PORT=3000
      - POSTGRES_HOST=db
      - REDIS_HOST=redis
    networks:
      - ${l.slug}-network
    depends_on:
      - db
      - redis

  # Postgres Database
  db:
    image: postgres:16-alpine
    container_name: ${l.slug}-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${l.serviceName.replace('-', '_')}
    ports:
      - "5432:5432"
    networks:
      - ${l.slug}-network

  # Redis Cache / Queue Broker
  redis:
    image: redis:7-alpine
    container_name: ${l.slug}-redis
    ports:
      - "6379:6379"
    networks:
      - ${l.slug}-network

networks:
  ${l.slug}-network:
    name: ${l.slug}-network
`;
  fs.writeFileSync(path.join(dockerPath, 'compose.yaml'), composeYaml);

  // 2. .gitignore
  fs.writeFileSync(path.join(lessonPath, '.gitignore'), `node_modules/\ndist/\n.env\n`);

  // 3. .env
  fs.writeFileSync(path.join(lessonPath, '.env'), `PORT=3000\nPOSTGRES_HOST=localhost\nPOSTGRES_USER=postgres\nPOSTGRES_PASSWORD=postgres\nPOSTGRES_DB=${l.serviceName.replace('-', '_')}\nREDIS_HOST=localhost\n`);

  // 4. Dockerfile
  const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
`;
  fs.writeFileSync(path.join(servicePath, 'Dockerfile'), dockerfile);

  // 5. package.json
  const packageJson = {
    name: l.serviceName,
    version: "1.0.0",
    scripts: {
      build: "nest build && tsc-alias -p tsconfig.build.json",
      start: "nest start",
      "start:dev": "nest start --watch"
    },
    dependencies: {
      "@nestjs/common": "^10.0.0",
      "@nestjs/config": "^3.0.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/typeorm": "^10.0.0",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.0",
      "ioredis": "^5.0.0",
      "pg": "^8.11.0",
      "reflect-metadata": "^0.1.13",
      "rxjs": "^7.8.0",
      "typeorm": "^0.3.15"
    },
    devDependencies: {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "tsc-alias": "^1.8.0",
      "typescript": "^5.0.0"
    }
  };
  fs.writeFileSync(path.join(servicePath, 'package.json'), JSON.stringify(packageJson, null, 2));

  // 6. nest-cli.json
  const nestCli = {
    $schema: "https://json.schemastore.org/nest-cli",
    collection: "@nestjs/schematics",
    sourceRoot: "src",
    compilerOptions: {
      deleteOutDir: true,
      assets: []
    }
  };
  fs.writeFileSync(path.join(servicePath, 'nest-cli.json'), JSON.stringify(nestCli, null, 2));

  // 7. tsconfig.json
  const tsconfig = {
    compilerOptions: {
      module: "commonjs",
      declaration: true,
      removeComments: false,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: "ES2021",
      sourceMap: true,
      outDir: "./dist",
      baseUrl: "./",
      incremental: true,
      skipLibCheck: true,
      strictNullChecks: false,
      noImplicitAny: false,
      strictBindCallApply: false,
      forceConsistentCasingInFileNames: false,
      noFallthroughCasesInSwitch: false,
      paths: {
        [`@${l.slug}`]: ["src/index.ts"],
        [`@${l.slug}/*`]: ["src/*"]
      }
    }
  };
  fs.writeFileSync(path.join(servicePath, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));

  // 8. tsconfig.build.json
  const tsconfigBuild = {
    extends: "./tsconfig",
    exclude: ["node_modules", "test", "dist", "**/*spec.ts"]
  };
  fs.writeFileSync(path.join(servicePath, 'tsconfig.build.json'), JSON.stringify(tsconfigBuild, null, 2));

  // Create src directories
  const srcPath = path.join(servicePath, 'src');
  ensureDir(srcPath);

  // 9. src/main.ts
  const mainTs = `/**
 * Entry Node (\`nest build\` -> dist/main.js) — chỉ gọi bootstrap đã export.
 * (EN: Node entry (\`nest build\` -> dist/main.js) — invokes exported bootstrap only.)
 */
import { bootstrap } from "./bootstrap"

void bootstrap()
`;
  fs.writeFileSync(path.join(srcPath, 'main.ts'), mainTs);

  // 10. src/bootstrap.ts
  const bootstrapTs = `import {
    NestFactory,
} from "@nestjs/core"
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    AppModule,
} from "./app.module"

/**
 * Khởi tạo Nest app — ValidationPipe toàn cục và lắng nghe cổng.
 * (EN: Bootstrap Nest app — global ValidationPipe and listen on port.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))
    const port = Number(process.env.PORT) || 3000
    // Cổng: biến môi trường PORT hoặc 3000.
    // (EN: Port from env PORT or default 3000.)
    await app.listen(port, "0.0.0.0")
}
`;
  fs.writeFileSync(path.join(srcPath, 'bootstrap.ts'), bootstrapTs);

  // 11. src/config/database.config.ts
  const configDir = path.join(srcPath, 'config');
  ensureDir(configDir);
  const dbConfig = `import {
    registerAs,
} from "@nestjs/config"

export type DatabaseConfig = {
    host: string
    port: number
    username: string
    password: string
    database: string
}

/**
 * Cấu hình kết nối Postgres — namespace \`database\` cho ConfigService.
 * (EN: Postgres connection config — \`database\` namespace for ConfigService.)
 */
export default registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? "${l.serviceName.replace('-', '_')}",
    }),
)
`;
  fs.writeFileSync(path.join(configDir, 'database.config.ts'), dbConfig);

  // 12. src/config/index.ts
  fs.writeFileSync(path.join(configDir, 'index.ts'), `export {
    default as databaseConfig,
} from "./database.config"
export type {
    DatabaseConfig,
} from "./database.config"
`);

  // 13. src/app.module.ts
  const appModule = `/**
 * Module gốc — Kết nối DB, ConfigModule, và Feature Module.
 * (EN: Root module — DB connection, ConfigModule, and Feature Module.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    databaseConfig,
    type DatabaseConfig,
} from "./config"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Module,
} from "./${l.featureName}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [databaseConfig],
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const db = config.getOrThrow<DatabaseConfig>("database")
                return {
                    type: "postgres" as const,
                    host: db.host,
                    port: db.port,
                    username: db.username,
                    password: db.password,
                    database: db.database,
                    autoLoadEntities: true,
                    synchronize: true,
                }
            },
        }),
        ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Module,
    ],
})
export class AppModule {}
`;
  fs.writeFileSync(path.join(srcPath, 'app.module.ts'), appModule);

  // Create feature directories
  const featureDir = path.join(srcPath, l.featureName);
  ensureDir(featureDir);
  ensureDir(path.join(featureDir, 'dto'));
  const pgEntitiesDir = path.join(srcPath, 'entities', 'postgresql', 'primary');
  ensureDir(pgEntitiesDir);

  // 14. src/entities/postgresql/primary/<feature>.entity.ts
  const entityFile = `import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "typeorm"

/**
 * Thực thể lưu trữ dữ liệu tính năng.
 * (EN: Entity holding feature data records.)
 */
@Entity("${l.featureName}_records")
export class ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({ default: 0 })
    version: number
}
`;
  fs.writeFileSync(path.join(pgEntitiesDir, `${l.featureName}.entity.ts`), entityFile);

  // 15. src/entities/postgresql/primary/index.ts + barrels
  const pgBarrel = path.join(srcPath, 'entities', 'postgresql');
  ensureDir(pgBarrel);
  const existingPrimary = fs.existsSync(path.join(pgEntitiesDir, 'index.ts'))
    ? fs.readFileSync(path.join(pgEntitiesDir, 'index.ts'), 'utf8')
    : '';
  const exportLine = `export * from "./${l.featureName}.entity"\n`;
  if (!existingPrimary.includes(exportLine.trim())) {
    fs.appendFileSync(path.join(pgEntitiesDir, 'index.ts'), exportLine);
  }
  fs.writeFileSync(path.join(pgBarrel, 'index.ts'), `export * from "./primary"\n`);
  fs.writeFileSync(path.join(srcPath, 'entities', 'index.ts'), `export * from "./postgresql"\n`);

  // 16. src/<feature>/dto/create.dto.ts
  const createDto = `import {
    IsString,
    IsNotEmpty,
} from "class-validator"

/**
 * Yêu cầu DTO đầu vào để xử lý thao tác.
 * (EN: Input DTO validating request payload.)
 */
export class Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto {
    @IsString()
    @IsNotEmpty()
    title: string
}
`;
  fs.writeFileSync(path.join(featureDir, 'dto', 'create.dto.ts'), createDto);

  // 17. src/<feature>/dto/index.ts
  fs.writeFileSync(path.join(featureDir, 'dto', 'index.ts'), `export {
    Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto,
} from "./create.dto"
`);

  // 18. src/<feature>/<feature>.service.ts
  const serviceFile = `import {
    Injectable,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity,
} from "../entities"
import {
    Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto,
} from "./dto"

/**
 * Service xử lý logic nghiệp vụ cho bài học ${l.titleVi}.
 * (EN: Service managing business logic for lesson ${l.titleEn}.)
 */
@Injectable()
export class ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service {
    constructor(
        @InjectRepository(${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity)
        private readonly repository: Repository<${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity>,
    ) {}

    /**
     * Lấy danh sách toàn bộ bản ghi.
     * (EN: Retrieve list of all records.)
     */
    async findAll(): Promise<${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity[]> {
        return this.repository.find()
    }

    /**
     * Tạo bản ghi mới.
     * (EN: Create a new record.)
     */
    async create(dto: Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto): Promise<${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity> {
        const entity = new ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity()
        entity.title = dto.title
        return this.repository.save(entity)
    }
}
`;
  fs.writeFileSync(path.join(featureDir, `${l.featureName}.service.ts`), serviceFile);

  // 19. src/<feature>/<feature>.controller.ts
  const controllerFile = `import {
    Controller,
    Get,
    Post,
    Body,
} from "@nestjs/common"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service,
} from "./${l.featureName}.service"
import {
    Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto,
} from "./dto"

/**
 * REST Controller cung cấp API kiểm thử cho ${l.titleVi}.
 * (EN: REST Controller serving demo API endpoints for ${l.titleEn}.)
 */
@Controller("api/${l.featureName}")
export class ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Controller {
    constructor(
        private readonly service: ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service,
    ) {}

    @Get()
    async getRecords() {
        return this.service.findAll()
    }

    @Post()
    async createRecord(@Body() dto: Create${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Dto) {
        return this.service.create(dto)
    }
}
`;
  fs.writeFileSync(path.join(featureDir, `${l.featureName}.controller.ts`), controllerFile);

  // 20. src/<feature>/<feature>.module.ts
  const featureModule = `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity,
} from "../entities"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service,
} from "./${l.featureName}.service"
import {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Controller,
} from "./${l.featureName}.controller"

/**
 * Feature Module quản lý bài học ${l.titleEn}.
 * (EN: Feature Module managing lesson ${l.titleEn}.)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Entity]),
    ],
    controllers: [${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Controller],
    providers: [${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service],
    exports: [${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service],
})
export class ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Module {}
`;
  fs.writeFileSync(path.join(featureDir, `${l.featureName}.module.ts`), featureModule);

  // 21. src/<feature>/index.ts
  const featureIndex = `export {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Module,
} from "./${l.featureName}.module"
export {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Service,
} from "./${l.featureName}.service"
export {
    ${l.featureName.charAt(0).toUpperCase() + l.featureName.slice(1)}Controller,
} from "./${l.featureName}.controller"
`;
  fs.writeFileSync(path.join(featureDir, 'index.ts'), featureIndex);
}

// Main execution logic
function main() {
  console.log("Starting generation...");
  
  modulesData.forEach(m => {
    const modFolder = path.join(DATA_PATH, m.slug);
    ensureDir(modFolder);
    
    // Create contents dir
    const contentsDir = path.join(modFolder, 'contents');
    ensureDir(contentsDir);

    m.lessons.forEach(l => {
      const lesFolder = path.join(contentsDir, l.slug);
      ensureDir(lesFolder);
      
      // Write en.md and vi.md for the lesson
      if (!l.skipLessonText) {
        const enMarkdown = generateLessonMarkdown(m, l, 'en');
        const viMarkdown = generateLessonMarkdown(m, l, 'vi');
        
        fs.writeFileSync(path.join(lesFolder, 'en.md'), enMarkdown);
        fs.writeFileSync(path.join(lesFolder, 'vi.md'), viMarkdown);
        console.log(`Generated lesson markdown for: ${l.slug}`);
      } else {
        console.log(`Skipped lesson markdown for existing: ${l.slug}`);
      }

      // Create challenges/{order}-{topic-kebab} (see challengeMountFolderName)
      const challengeFolder = path.join(lesFolder, 'challenges', challengeMountFolderName(l));
      ensureDir(challengeFolder);
      
      const challengeEn = generateChallengeMarkdown(m, l, 'en');
      const challengeVi = generateChallengeMarkdown(m, l, 'vi');
      
      fs.writeFileSync(path.join(challengeFolder, 'en.md'), challengeEn);
      fs.writeFileSync(path.join(challengeFolder, 'vi.md'), challengeVi);
      console.log(`Generated challenge markdown for: ${l.slug}`);

      // Generate complete NestJS codebase under .repo/
      generateNestJSFiles(m, l);
      console.log(`Generated NestJS codebase files for: ${l.slug}`);
    });
  });

  console.log("Generation complete!");
}

main();
