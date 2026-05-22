/**
 * Module 11 — fanout/caching: .env, Postgres biz demo + seed OnModuleInit, Redis cache.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
    applyModule11Postgres,
} from "./apply_module_11_postgres_body.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-11-news-feed-fanout-and-caching",
)

const ENV = {
    "0-push-vs-pull-models-fanout/feed-service": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "feed_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
    "1-feed-caching-with-redis/feed-cache-service": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "feed_cache_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
    "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "hybrid_feed_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
}

function write(rel, content) {
    fs.writeFileSync(path.join(MODULE, rel), content, "utf8")
}

function writeEnv(rel, vars) {
    const lines = [
        "# --- Local / Docker (khớp compose.yaml và src/config/) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml and src/config/.)",
        ...Object.entries(vars).map(([k, v]) => `${k}=${v}`),
        "",
    ]
    write(`${rel}/.env`, lines.join("\n"))
}

for (const [rel, vars] of Object.entries(ENV)) {
    writeEnv(rel, vars)
}

applyModule11Postgres(write)

write(
    "0-push-vs-pull-models-fanout/feed-service/src/feed/feed.controller.ts",
    `import {
    Body,
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    FeedService,
} from "./feed.service"
import {
    CreateFeedDto,
} from "./dto"

/**
 * HTTP controller — so sánh fanout pull vs push.
 * (EN: HTTP controller — compare fanout pull vs push.)
 */
@Controller("api/feed")
export class FeedController {
    constructor(
        private readonly service: FeedService,
    ) {}

    /**
     * Logic — demo fanout-on-read (pull) cho userId.
     * Code — GET /api/feed/pull → FeedService.getPullFeed.
     * (EN Logic: Demo fanout-on-read (pull) for userId.)
     * (EN Code: GET /api/feed/pull → getPullFeed.)
     */
    @Get("pull")
    getPullFeed(@Query("userId") userId = "usr_1"): ReturnType<FeedService["getPullFeed"]> {
        return this.service.getPullFeed(userId)
    }

    /**
     * Logic — demo fanout-on-write (push) timeline đã materialize.
     * Code — GET /api/feed/push → FeedService.getPushFeed.
     * (EN Logic: Demo fanout-on-write (push) materialized timeline.)
     * (EN Code: GET /api/feed/push → getPushFeed.)
     */
    @Get("push")
    getPushFeed(@Query("userId") userId = "usr_1"): ReturnType<FeedService["getPushFeed"]> {
        return this.service.getPushFeed(userId)
    }

    /**
     * Logic — tạo post và fanout-on-write vào follower timelines.
     * Code — POST /api/feed/post + CreateFeedDto → createPost.
     * (EN Logic: Create post and fanout-on-write to followers.)
     * (EN Code: POST body → createPost.)
     */
    @Post("post")
    createPost(@Body() body: CreateFeedDto): ReturnType<FeedService["createPost"]> {
        return this.service.createPost(
            body.authorId ?? "author_1",
            body.content ?? "New post from feed-service",
        )
    }
}
`,
)

write(
    "1-feed-caching-with-redis/feed-cache-service/src/feedcache/feedcache.controller.ts",
    `import {
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    FeedcacheService,
} from "./feedcache.service"

/**
 * HTTP controller — Redis ZSET feed cache (seed / read).
 * (EN: HTTP controller — Redis ZSET feed cache (seed / read).)
 */
@Controller("api/feed")
export class FeedcacheController {
    constructor(
        private readonly service: FeedcacheService,
    ) {}

    /**
     * Logic — seed timeline Redis ZSET cho user (lab).
     * Code — POST /api/feed/cache/seed?userId → seedTimeline.
     * (EN Logic: Seed Redis ZSET timeline for user.)
     * (EN Code: POST cache/seed → seedTimeline.)
     */
    @Post("cache/seed")
    seedTimeline(@Query("userId") userId = "usr_1"): ReturnType<FeedcacheService["seedTimeline"]> {
        return this.service.seedTimeline(userId)
    }

    /**
     * Logic — đọc feed đã cache (ZREVRANGE).
     * Code — GET /api/feed/cache?userId → getCachedFeed.
     * (EN Logic: Read cached feed via ZREVRANGE.)
     * (EN Code: GET cache → getCachedFeed.)
     */
    @Get("cache")
    getCachedFeed(@Query("userId") userId = "usr_1"): ReturnType<FeedcacheService["getCachedFeed"]> {
        return this.service.getCachedFeed(userId)
    }
}
`,
)

write(
    "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/hybridfeed/hybridfeed.controller.ts",
    `import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import {
    HybridfeedService,
} from "./hybridfeed.service"

/**
 * HTTP controller — hybrid fanout + hotkey routing.
 * (EN: HTTP controller — hybrid fanout + hotkey routing.)
 */
@Controller("api/feed")
export class HybridfeedController {
    constructor(
        private readonly service: HybridfeedService,
    ) {}

    /**
     * Logic — merge push timeline + KOL pull; demo key salting.
     * Code — GET /api/feed/hybrid → getHybridFeed.
     * (EN Logic: Hybrid feed merge + salted KOL cache.)
     * (EN Code: GET hybrid → getHybridFeed.)
     */
    @Get("hybrid")
    getHybridFeed(@Query("userId") userId = "usr_1"): ReturnType<HybridfeedService["getHybridFeed"]> {
        return this.service.getHybridFeed(userId)
    }

    /**
     * Logic — xem route post KOL (pull) vs user thường (push).
     * Code — GET /api/feed/hybrid/route?authorId → routePost.
     * (EN Logic: Show routing for KOL vs regular author.)
     * (EN Code: GET hybrid/route → routePost.)
     */
    @Get("hybrid/route")
    routePost(@Query("authorId") authorId = "kol_1"): ReturnType<HybridfeedService["routePost"]> {
        return this.service.routePost(authorId)
    }
}
`,
)

write(
    "README.md",
    `# System Design Mastery — Module 11: News Feed Fanout & Caching

## Tổng quan (VI)
Fanout push/pull, Redis ZSET timeline, hybrid fanout + key salting. **Biz demo** lưu **PostgreSQL**, seed \`OnModuleInit\` khi DB trống (§6.4 \`coding-rules.md\`).

## Overview (EN)
News feed fanout patterns, Redis caching, hybrid + hotkey mitigation. **Demo business data** in **PostgreSQL**, seeded on \`OnModuleInit\` when empty.

## Lessons
- \`0-push-vs-pull-models-fanout\` — \`feed-service\` (Postgres: follows, posts, pushed timeline)
- \`1-feed-caching-with-redis\` — \`feed-cache-service\` (Postgres source → Redis ZSET)
- \`2-hybrid-fanout-and-hotkey-mitigation\` — \`hybrid-feed-service\` (Postgres authors/posts + Redis salting)

## Regenerate code (sau khi sửa)
\`\`\`bash
node scratch/apply_module_11_feed_rules.mjs
\`\`\`
Không chạy lại \`comment_system_design_modules_1_11.mjs\` lên module 11 (dễ làm hỏng controller).
`,
)

console.log("Module 11 feed rules applied")
