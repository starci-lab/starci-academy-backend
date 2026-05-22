/**
 * Module 11 — Postgres biz demo + OnModuleInit seed + Redis cache paths.
 */
function writeEntityBarrels(write, servicePrefix) {
    write(
        `${servicePrefix}/src/entities/postgresql/index.ts`,
        `export * from "./primary"\n`,
    )
    write(
        `${servicePrefix}/src/entities/index.ts`,
        `export * from "./postgresql"\n`,
    )
}

export function applyModule11Postgres(write) {
    const typeOrmRoot = `        TypeOrmModule.forRootAsync({
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
        })`

    const appModuleDb = (featureImport, featureModule, withRedis) => `/**
 * Module gốc — Postgres biz demo + seed OnModuleInit${withRedis ? " + Redis" : ""}.
 * (EN: Root module — Postgres demo data + OnModuleInit seed${withRedis ? " + Redis" : ""}.)
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
    appConfig,
    databaseConfig,
    type DatabaseConfig,${withRedis ? `
    redisConfig,` : ""}
} from "./config"
import {
    ${featureImport},
} from "./${featureModule}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig${withRedis ? ", redisConfig" : ""}],
        }),
${typeOrmRoot},
        ${featureImport},
    ],
})
export class AppModule {}
`

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/config/index.ts",
        `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./database.config"
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/app.module.ts",
        appModuleDb("FeedModule", "feed", false),
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/entities/postgresql/primary/follow.entity.ts",
        `import {
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity follow — user theo dõi author (graph demo trong Postgres).
 * (EN: Follow entity — user follows author (demo graph in Postgres).)
 */
@Entity("follows")
export class FollowEntity {
    @PrimaryColumn()
    userId!: string

    @PrimaryColumn()
    authorId!: string
}
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/entities/postgresql/primary/post.entity.ts",
        `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity post — nội dung feed demo lưu Postgres.
 * (EN: Post entity — feed content demo persisted in Postgres.)
 */
@Entity("posts")
export class PostEntity {
    @PrimaryColumn()
    id!: string

    @Column()
    authorId!: string

    @Column()
    content!: string

    @Column()
    createdAt!: string
}
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/entities/postgresql/primary/pushed-timeline.entity.ts",
        `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity timeline push — post id đã materialize cho từng user.
 * (EN: Pushed timeline entry — materialized post id per user.)
 */
@Entity("pushed_timeline")
export class PushedTimelineEntity {
    @PrimaryColumn()
    userId!: string

    @PrimaryColumn()
    postId!: string

    @Column({ default: 0 })
    sortOrder!: number
}
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/entities/postgresql/primary/index.ts",
        `export * from "./follow.entity"
export * from "./post.entity"
export * from "./pushed-timeline.entity"
`,
    )
    writeEntityBarrels(write, "0-push-vs-pull-models-fanout/feed-service")

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/feed/feed-seed.service.ts",
        `/**
 * Seed graph demo fanout vào Postgres khi DB trống.
 * (EN: Seed fanout demo graph into Postgres when DB is empty.)
 */
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    FollowEntity,
    PostEntity,
    PushedTimelineEntity,
} from "../entities"

@Injectable()
export class FeedSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(FollowEntity)
        private readonly follows: Repository<FollowEntity>,
        @InjectRepository(PostEntity)
        private readonly posts: Repository<PostEntity>,
        @InjectRepository(PushedTimelineEntity)
        private readonly pushed: Repository<PushedTimelineEntity>,
    ) {}

    /**
     * Logic — khi DB trống, tạo follow/post/timeline push mẫu cho lab.
     * Code — OnModuleInit → posts.count() === 0 → save() cố định.
     * (EN Logic: Seed demo graph when DB has no posts.)
     * (EN Code: OnModuleInit → count === 0 → save fixed rows.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.posts.count()) > 0) {
            return
        }
        await this.follows.save([
            { userId: "usr_1", authorId: "author_1" },
            { userId: "usr_1", authorId: "kol_1" },
            { userId: "usr_2", authorId: "author_1" },
        ])
        await this.posts.save([
            {
                id: "post_1",
                authorId: "author_1",
                content: "Designing feeds starts with fanout trade-offs.",
                createdAt: "2026-05-20T08:00:00.000Z",
            },
            {
                id: "post_2",
                authorId: "kol_1",
                content: "KOL posts are usually pulled at read time.",
                createdAt: "2026-05-20T09:00:00.000Z",
            },
        ])
        await this.pushed.save([
            { userId: "usr_1", postId: "post_1", sortOrder: 0 },
            { userId: "usr_2", postId: "post_1", sortOrder: 0 },
        ])
    }
}
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/feed/feed.service.ts",
        `/**
 * Service so sánh fanout-on-read (pull) và fanout-on-write (push) — Postgres.
 * (EN: Service comparing fanout-on-read (pull) vs fanout-on-write (push) — Postgres.)
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    In,
    Repository,
} from "typeorm"
import {
    FollowEntity,
    PostEntity,
    PushedTimelineEntity,
} from "../entities"

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(FollowEntity)
        private readonly follows: Repository<FollowEntity>,
        @InjectRepository(PostEntity)
        private readonly posts: Repository<PostEntity>,
        @InjectRepository(PushedTimelineEntity)
        private readonly pushed: Repository<PushedTimelineEntity>,
    ) {}

    /**
     * Logic — fanout-on-read: lọc post của author đang follow khi user mở feed.
     * Code — follows.find → posts.find In(authorIds) → sort createdAt.
     * (EN Logic: Fanout-on-read — filter followed authors' posts at read time.)
     * (EN Code: follows.find → posts In(authorIds) → sort createdAt.)
     */
    async getPullFeed(userId: string) {
        const followed = await this.follows.find({ where: { userId } })
        const followedAuthors = followed.map((row) => row.authorId)
        const timeline =
            followedAuthors.length === 0
                ? []
                : await this.posts.find({
                      where: { authorId: In(followedAuthors) },
                      order: { createdAt: "DESC" },
                  })
        return {
            model: "fanout-on-read",
            userId,
            followedAuthors,
            readCost: "Reads join/filter recent posts from followed authors when the user opens feed.",
            writeCost: "Post creation is cheap because no follower timelines are pre-written.",
            timeline,
        }
    }

    /**
     * Logic — fanout-on-write: đọc timeline đã materialize sẵn (post ids).
     * Code — pushed.find → posts.find In(ids) giữ thứ tự sortOrder.
     * (EN Logic: Fanout-on-write — read pre-materialized timeline post ids.)
     * (EN Code: pushed.find → posts In(ids) preserve sortOrder.)
     */
    async getPushFeed(userId: string) {
        const entries = await this.pushed.find({
            where: { userId },
            order: { sortOrder: "ASC" },
        })
        const postIds = entries.map((row) => row.postId)
        const posts =
            postIds.length === 0
                ? []
                : await this.posts.find({ where: { id: In(postIds) } })
        const byId = new Map(posts.map((post) => [post.id, post]))
        const timeline = postIds
            .map((postId) => byId.get(postId))
            .filter((post): post is PostEntity => post !== undefined)
        return {
            model: "fanout-on-write",
            userId,
            materializedPostIds: postIds,
            readCost: "Reads are fast because the user timeline is already materialized.",
            writeCost: "Posting is expensive for authors with many followers.",
            timeline,
        }
    }

    /**
     * Logic — tạo post và fanout-on-write: thêm pushed_timeline cho từng follower.
     * Code — posts.save + follows.find followers → pushed.save sortOrder tăng.
     * (EN Logic: Create post and fanout-on-write into each follower timeline.)
     * (EN Code: posts.save + pushed.save per follower with sortOrder.)
     */
    async createPost(authorId: string, content: string) {
        const count = await this.posts.count()
        const post = {
            id: \`post_\${count + 1}\`,
            authorId,
            content,
            createdAt: new Date().toISOString(),
        }
        await this.posts.save(post)
        const followers = await this.follows.find({ where: { authorId } })
        const followerIds = followers.map((row) => row.userId)
        let sortOrder = Date.now()
        for (const followerId of followerIds) {
            await this.pushed.save({ userId: followerId, postId: post.id, sortOrder })
            sortOrder += 1
        }
        return {
            model: "fanout-on-write",
            post,
            followerIds,
            fanoutWrites: followerIds.length,
        }
    }
}
`,
    )

    write(
        "0-push-vs-pull-models-fanout/feed-service/src/feed/feed.module.ts",
        `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    FeedController,
} from "./feed.controller"
import {
    FeedSeedService,
} from "./feed-seed.service"
import {
    FeedService,
} from "./feed.service"
import {
    FollowEntity,
    PostEntity,
    PushedTimelineEntity,
} from "../entities"

/**
 * Feature module — fanout push vs pull (Postgres + seed OnModuleInit).
 * (EN: Feature module — fanout push vs pull (Postgres + OnModuleInit seed).)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([FollowEntity, PostEntity, PushedTimelineEntity]),
    ],
    controllers: [FeedController],
    providers: [FeedService, FeedSeedService],
    exports: [FeedService],
})
export class FeedModule {}
`,
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/config/index.ts",
        `export * from "./app.config"
export * from "./database.config"
export * from "./redis.config"
`,
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/app.module.ts",
        appModuleDb("FeedcacheModule", "feedcache", true),
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/entities/postgresql/primary/post.entity.ts",
        `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity post — nguồn demo trước khi ZADD vào Redis ZSET.
 * (EN: Post entity — source rows before ZADD into Redis ZSET.)
 */
@Entity("posts")
export class CachedPostEntity {
    @PrimaryColumn()
    id!: string

    @Column()
    authorId!: string

    @Column()
    content!: string

    @Column({ type: "bigint" })
    scoreMs!: string
}
`,
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/entities/postgresql/primary/index.ts",
        `export * from "./post.entity"
`,
    )
    writeEntityBarrels(write, "1-feed-caching-with-redis/feed-cache-service")

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/feedcache/feedcache-seed.service.ts",
        `/**
 * Seed posts demo vào Postgres (lesson 1 — nguồn trước Redis cache).
 * (EN: Seed demo posts into Postgres before Redis timeline cache.)
 */
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    CachedPostEntity,
} from "../entities"

@Injectable()
export class FeedcacheSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(CachedPostEntity)
        private readonly posts: Repository<CachedPostEntity>,
    ) {}

    /**
     * Logic — khi DB trống, tạo post mẫu có scoreMs cho ZSET.
     * Code — OnModuleInit → count() === 0 → save post_101..103.
     * (EN Logic: Seed posts with scoreMs when DB is empty.)
     * (EN Code: OnModuleInit → count === 0 → save demo posts.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.posts.count()) > 0) {
            return
        }
        const now = Date.now()
        await this.posts.save([
            {
                id: "post_101",
                authorId: "author_1",
                content: "Cached post 101 — older timeline item.",
                scoreMs: String(now - 30_000),
            },
            {
                id: "post_102",
                authorId: "author_1",
                content: "Cached post 102 — mid timeline item.",
                scoreMs: String(now - 10_000),
            },
            {
                id: "post_103",
                authorId: "author_1",
                content: "Cached post 103 — newest timeline item.",
                scoreMs: String(now),
            },
        ])
    }
}
`,
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/feedcache/feedcache.service.ts",
        `/**
 * Service cache timeline: Postgres (source) + Redis ZSET (lesson 1).
 * (EN: Timeline cache service — Postgres source + Redis ZSET.)
 */
import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import Redis from "ioredis"
import {
    Repository,
} from "typeorm"
import type {
    RedisConfig,
} from "../config"
import {
    CachedPostEntity,
} from "../entities"

@Injectable()
export class FeedcacheService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(CachedPostEntity)
        private readonly posts: Repository<CachedPostEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client từ config (lazyConnect).
     * Code — OnModuleInit → ConfigService redis → new Redis().
     * (EN Logic: Initialize Redis client from config.)
     * (EN Code: OnModuleInit → ioredis with lazyConnect.)
     */
    onModuleInit(): void {
        const redis = this.config.getOrThrow<RedisConfig>("redis")
        this.redis = new Redis({
            host: redis.host,
            port: redis.port,
            lazyConnect: true,
        })
    }

    /**
     * Logic — đóng Redis khi shutdown.
     * Code — OnModuleDestroy → redis.quit().
     * (EN Logic: Close Redis on shutdown.)
     * (EN Code: OnModuleDestroy → quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — đọc post từ Postgres, materialize vào ZSET, trim 500 phần tử.
     * Code — find posts → ZADD scoreMs → ZREMRANGEBYRANK cap 500.
     * (EN Logic: Load posts from Postgres into ZSET with trim.)
     * (EN Code: find → ZADD → ZREMRANGEBYRANK 500.)
     */
    async seedTimeline(userId: string) {
        await this.connectRedis()
        const key = this.getFeedKey(userId)
        const rows = await this.posts.find({ order: { scoreMs: "ASC" } })
        for (const row of rows) {
            await this.redis.zadd(key, row.scoreMs, row.id)
        }
        await this.redis.zremrangebyrank(key, 0, -501)
        return {
            userId,
            cacheKey: key,
            source: "postgres",
            cachedPosts: rows.length,
            maxCachedItems: 500,
        }
    }

    /**
     * Logic — đọc feed mới nhất từ ZSET (ZREVRANGE).
     * Code — ZREVRANGE 0..19 WITHSCORES → parse timeline.
     * (EN Logic: Read newest feed items via ZREVRANGE.)
     * (EN Code: ZREVRANGE WITHSCORES parse pairs.)
     */
    async getCachedFeed(userId: string) {
        await this.connectRedis()
        const key = this.getFeedKey(userId)
        const postIds = await this.redis.zrevrange(key, 0, 19, "WITHSCORES")
        const timeline = []
        for (let index = 0; index < postIds.length; index += 2) {
            timeline.push({
                postId: postIds[index],
                score: Number(postIds[index + 1]),
            })
        }
        return {
            model: "redis-zset-feed-cache",
            userId,
            cacheKey: key,
            readPattern: "ZREVRANGE returns the newest cached feed items first.",
            timeline,
        }
    }

    /**
     * Logic — key timeline per user trong Redis.
     * Code — template feed:{userId}.
     * (EN Logic: Per-user timeline Redis key.)
     * (EN Code: template feed:{userId}.)
     */
    private getFeedKey(userId: string): string {
        return \`feed:\${userId}\`
    }

    /**
     * Logic — lazy connect Redis lần đầu dùng.
     * Code — if status wait → connect().
     * (EN Logic: Lazy Redis connect on first use.)
     * (EN Code: ioredis lazy connect.)
     */
    private async connectRedis(): Promise<void> {
        if (this.redis.status === "wait") {
            await this.redis.connect()
        }
    }
}
`,
    )

    write(
        "1-feed-caching-with-redis/feed-cache-service/src/feedcache/feedcache.module.ts",
        `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    FeedcacheController,
} from "./feedcache.controller"
import {
    FeedcacheSeedService,
} from "./feedcache-seed.service"
import {
    FeedcacheService,
} from "./feedcache.service"
import {
    CachedPostEntity,
} from "../entities"

/**
 * Feature module — Postgres source + Redis ZSET feed cache.
 * (EN: Feature module — Postgres source + Redis ZSET feed cache.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([CachedPostEntity])],
    controllers: [FeedcacheController],
    providers: [FeedcacheService, FeedcacheSeedService],
    exports: [FeedcacheService],
})
export class FeedcacheModule {}
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/config/index.ts",
        `export * from "./app.config"
export * from "./database.config"
export * from "./redis.config"
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/app.module.ts",
        appModuleDb("HybridfeedModule", "hybridfeed", true),
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/entities/postgresql/primary/author.entity.ts",
        `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity author — phân biệt user thường vs KOL (hybrid routing).
 * (EN: Author entity — regular user vs celebrity for hybrid routing.)
 */
@Entity("authors")
export class AuthorEntity {
    @PrimaryColumn()
    id!: string

    @Column({ default: false })
    isCelebrity!: boolean
}
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/entities/postgresql/primary/post.entity.ts",
        `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity post — timeline hybrid (push regular + pull KOL).
 * (EN: Post entity — hybrid timeline rows in Postgres.)
 */
@Entity("posts")
export class HybridPostEntity {
    @PrimaryColumn()
    id!: string

    @Column()
    authorId!: string

    @Column()
    content!: string

    @Column()
    createdAt!: string
}
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/entities/postgresql/primary/index.ts",
        `export * from "./author.entity"
export * from "./post.entity"
`,
    )
    writeEntityBarrels(write, "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service")

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/hybridfeed/hybridfeed-seed.service.ts",
        `/**
 * Seed authors/posts hybrid vào Postgres khi DB trống.
 * (EN: Seed hybrid authors/posts into Postgres when DB is empty.)
 */
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    AuthorEntity,
    HybridPostEntity,
} from "../entities"

@Injectable()
export class HybridfeedSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(AuthorEntity)
        private readonly authors: Repository<AuthorEntity>,
        @InjectRepository(HybridPostEntity)
        private readonly posts: Repository<HybridPostEntity>,
    ) {}

    /**
     * Logic — khi DB trống, tạo author thường + KOL và post mẫu.
     * Code — OnModuleInit → posts.count() === 0 → save authors + posts.
     * (EN Logic: Seed regular author, KOL, and demo posts when empty.)
     * (EN Code: OnModuleInit → count === 0 → save rows.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.posts.count()) > 0) {
            return
        }
        await this.authors.save([
            { id: "author_1", isCelebrity: false },
            { id: "kol_1", isCelebrity: true },
        ])
        await this.posts.save([
            {
                id: "post_201",
                authorId: "author_1",
                content: "Regular author post was pushed into the user feed.",
                createdAt: "2026-05-20T08:30:00.000Z",
            },
            {
                id: "post_301",
                authorId: "kol_1",
                content: "KOL post is pulled and merged at read time.",
                createdAt: "2026-05-20T09:30:00.000Z",
            },
        ])
    }
}
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/hybridfeed/hybridfeed.service.ts",
        `/**
 * Service hybrid fanout + hotkey salting — Postgres + Redis (lesson 2).
 * (EN: Hybrid fanout and hotkey salting — Postgres + Redis.)
 */
import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import Redis from "ioredis"
import {
    In,
    Repository,
} from "typeorm"
import type {
    RedisConfig,
} from "../config"
import {
    AuthorEntity,
    HybridPostEntity,
} from "../entities"

@Injectable()
export class HybridfeedService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(AuthorEntity)
        private readonly authors: Repository<AuthorEntity>,
        @InjectRepository(HybridPostEntity)
        private readonly posts: Repository<HybridPostEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client từ config.
     * Code — OnModuleInit → ConfigService → new Redis(lazyConnect).
     * (EN Logic: Initialize Redis from config.)
     * (EN Code: OnModuleInit → ioredis lazyConnect.)
     */
    onModuleInit(): void {
        const redis = this.config.getOrThrow<RedisConfig>("redis")
        this.redis = new Redis({
            host: redis.host,
            port: redis.port,
            lazyConnect: true,
        })
    }

    /**
     * Logic — đóng Redis khi shutdown.
     * Code — OnModuleDestroy → quit().
     * (EN Logic: Close Redis on shutdown.)
     * (EN Code: OnModuleDestroy → quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — hybrid feed: merge push (regular) + KOL pull; cache KOL bằng key salting.
     * Code — query Postgres + SET salted key + sort createdAt.
     * (EN Logic: Hybrid feed merges push + KOL pull; salted KOL cache.)
     * (EN Code: Postgres query + SET + sort by createdAt.)
     */
    async getHybridFeed(userId: string) {
        await this.connectRedis()
        const authorRows = await this.authors.find()
        const celebrityIds = authorRows
            .filter((author) => author.isCelebrity)
            .map((author) => author.id)
        const celebritySet = new Set(celebrityIds)
        const allPosts = await this.posts.find()
        const pushedTimeline = allPosts.filter((post) => !celebritySet.has(post.authorId))
        const celebrityPosts =
            celebrityIds.length === 0
                ? []
                : await this.posts.find({ where: { authorId: In(celebrityIds) } })
        const localCacheKey = this.getSaltedKolKey("kol_1", userId)
        await this.redis.set(
            localCacheKey,
            JSON.stringify(celebrityPosts),
            "EX",
            60,
        )
        const timeline = [...pushedTimeline, ...celebrityPosts].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
        )
        return {
            model: "hybrid-fanout",
            userId,
            strategy: {
                regularUsers: "fanout-on-write",
                celebrityUsers: "fanout-on-read",
            },
            hotkeyMitigation: {
                technique: "key-salting",
                saltedKey: localCacheKey,
                reason: "KOL post cache is duplicated across salted keys so one Redis key does not absorb all reads.",
            },
            celebrityAuthors: celebrityIds,
            timeline,
        }
    }

    /**
     * Logic — route post: KOL dùng pull-at-read, user thường push-to-followers.
     * Code — authors.findOne → isCelebrity branch metadata.
     * (EN Logic: Route post — celebrities pull-at-read, regular users push-to-followers.)
     * (EN Code: findOne → isCelebrity branch.)
     */
    async routePost(authorId: string) {
        const author = await this.authors.findOne({ where: { id: authorId } })
        const isCelebrity = author?.isCelebrity ?? false
        return {
            authorId,
            isCelebrity,
            route: isCelebrity ? "pull-at-read-time" : "push-to-followers",
            expectedWrites: isCelebrity ? 1 : "number_of_followers",
        }
    }

    /**
     * Logic — key salting tránh hotkey KOL trên Redis.
     * Code — charCodeAt(userId) % 4 → feed:kol:{author}:salt:N.
     * (EN Logic: Salt KOL keys to spread hotkey load.)
     * (EN Code: modulo salt on userId char code.)
     */
    private getSaltedKolKey(authorId: string, userId: string): string {
        const salt = userId.charCodeAt(userId.length - 1) % 4
        return \`feed:kol:\${authorId}:salt:\${salt}\`
    }

    /**
     * Logic — lazy connect Redis.
     * Code — status wait → connect().
     * (EN Logic: Lazy Redis connect.)
     * (EN Code: ioredis connect if wait.)
     */
    private async connectRedis(): Promise<void> {
        if (this.redis.status === "wait") {
            await this.redis.connect()
        }
    }
}
`,
    )

    write(
        "2-hybrid-fanout-and-hotkey-mitigation/hybrid-feed-service/src/hybridfeed/hybridfeed.module.ts",
        `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    HybridfeedController,
} from "./hybridfeed.controller"
import {
    HybridfeedSeedService,
} from "./hybridfeed-seed.service"
import {
    HybridfeedService,
} from "./hybridfeed.service"
import {
    AuthorEntity,
    HybridPostEntity,
} from "../entities"

/**
 * Feature module — hybrid fanout + Postgres + Redis key salting.
 * (EN: Feature module — hybrid fanout + Postgres + Redis key salting.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([AuthorEntity, HybridPostEntity])],
    controllers: [HybridfeedController],
    providers: [HybridfeedService, HybridfeedSeedService],
    exports: [HybridfeedService],
})
export class HybridfeedModule {}
`,
    )
}
