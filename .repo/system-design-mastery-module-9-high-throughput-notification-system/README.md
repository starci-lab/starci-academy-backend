# System Design Mastery — system-design-mastery-module-9-high-throughput-notification-system

## Tổng quan (VI)
Hệ thống thông báo throughput cao: API nhanh, xử lý nặng qua BullMQ, thêm rate limit, priority, failover SMTP.

## Overview (EN)
High-throughput notifications: fast API, BullMQ workers, then rate limiting, priorities, and SMTP failover.

## Lessons
- `0-notification-system-architecture`
- `1-rate-limiting-and-priority-queues`
- `2-failover-and-delivery-guarantees`

## Comment & cấu trúc
- `compose.yaml`: header + comment từng service (song ngữ).
- `src/**`: JSDoc VI + `(EN:)` trên file/class/method chính.
- `.briefs/`: mục đích demo từng file (chạy `node scratch/apply_coding_rules_system_design.mjs`).
