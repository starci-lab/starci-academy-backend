# Domain — System Design Mastery (`1-system-design-mastery`)

> Đặc tả DOMAIN của khóa: **định vị · bản đồ giáo trình · quy ước RIÊNG domain**. Grounded từ 24 module thật + `contents.md`/`challenges.md`/`coding.md` (SD deltas trên generic FS). Đây là "khóa DẠY GÌ + đặc thù"; KHÔNG lặp format (ở `contents.md`).

## 1. Định vị
- **Đối tượng + outcome:** developer nâng cao — **kiến trúc phân tán · scalability · pattern production**. Tự tin **phỏng vấn System Design** + thiết kế hệ thống **production-ready**.
- **Trục domain:** từ **fundamentals** → **building blocks** (DB/K8s/messaging/cache/search/observability/security) → **hệ thống thật** (feed/video/flash-sale/ride-hailing/wallet/chat/...). Mỗi module dạy 1 building-block HOẶC mổ xẻ 1 hệ thống hoàn chỉnh.

## 2. Bản đồ giáo trình (24 module — grounded)
| Cụm | Module |
|---|---|
| **Nền tảng** | 0 fundamentals-of-system-design · 1 database-fundamentals |
| **Hạ tầng / building blocks** | 2 kubernetes-fundamentals · 3 communication-patterns · 4 kafka-streaming · 5 rabbitmq-job-queues · 6 redis-mastery · 7 monitoring-observability · 8 security-identity · 9 elasticsearch-and-cdc |
| **Hệ thống thật (capstone-grade)** | 10 feed-ranking · 11 video-delivery · 12 ecommerce-flash-sale · 13 ride-hailing · 14 distributed-search-autocomplete · 15 distributed-rate-limiter · 16 distributed-file-storage-cdn · 17 web-crawler-search-engine · 18 distributed-locks-leader-election · 19 distributed-transactions-wallet · 20 webhook-delivery · 21 realtime-chat · 22 high-throughput-notification · 23 realtime-analytics-ad-click |

## 3. Quy ước RIÊNG domain (khác FS — chi tiết `contents.md §3 deltas`, `coding.md`)
- **Lang:** phần lớn **agnostic** (`0-agnostic`) — SD dạy KIẾN TRÚC, không idiom 1 stack. Khi cần code minh hoạ → 4-lang portable nhưng ưu tiên agnostic.
- **E2E = docker-compose stack thật:** `cd <lesson>/.docker` → **1 lệnh** `docker compose up -d --build` (KHÔNG `nest start` như FS) → cleanup `docker compose down -v` plain. K8s/microservices = multi-step (`kubectl apply → wait → port-forward`).
- **Repo OFF-BY-ONE:** `system-design-mastery-module-<N+1>-<slug>` (slot 0 → `module-1`). Verify path trước khi đọc code.
- **§2.1.5:** 3–10 flow, SD điển hình **4–6**, **flow cuối = edge/failure mode** (blast-radius / timeout / stale / cert). Accordion như FS.
- **Docker app = build-only** (KHÔNG push cloud/DockerHub) trừ module microservices-docker (verify image pushed) + k8s (manifest có probe/resources).
- **§2.1.2 table** cột `Port` (+ `Image` cho microservices, `Workload type` cho k8s); mermaid TD.

## 4. Capstone (milestones)
20 milestone thiết kế + dựng 1 hệ thống phân tán quy mô lớn (mirror các "hệ thống thật" §2). Interview bank technical ground từ module (chưa author — pilot).

## 5. Cho gen/audit (điều 1 agent PHẢI biết)
- Gen module → bám bản đồ §2; module "building-block" (dạy 1 thứ) vs "hệ thống" (mổ xẻ 1 sản phẩm) → khác depth + số flow.
- Domain SD "sâu dọc" (một mạch kiến trúc) — khác FS "rộng ngang". E2E = compose stack, KHÔNG per-lang server.
- Interview technical bank ground `.mount` module SD; behavioral → global EQ (không thuộc khóa).
