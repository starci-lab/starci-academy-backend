# System Design Mastery — Module 11: News Feed Fanout & Caching

## Tổng quan (VI)
Fanout push/pull, Redis ZSET timeline, hybrid fanout + key salting. **Biz demo** lưu **PostgreSQL**, seed `OnModuleInit` khi DB trống (§6.4 `coding-rules.md`).

## Overview (EN)
News feed fanout patterns, Redis caching, hybrid + hotkey mitigation. **Demo business data** in **PostgreSQL**, seeded on `OnModuleInit` when empty.

## Lessons
- `0-push-vs-pull-models-fanout` — `feed-service` (Postgres: follows, posts, pushed timeline)
- `1-feed-caching-with-redis` — `feed-cache-service` (Postgres source → Redis ZSET)
- `2-hybrid-fanout-and-hotkey-mitigation` — `hybrid-feed-service` (Postgres authors/posts + Redis salting)

## Regenerate code (sau khi sửa)
```bash
node scratch/apply_module_11_feed_rules.mjs
```
Không chạy lại `comment_system_design_modules_1_11.mjs` lên module 11 (dễ làm hỏng controller).
