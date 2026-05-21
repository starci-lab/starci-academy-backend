/**
 * Gốc ứng dụng NestJS — gom TypeORM replication (Postgres read/write split) và CacheModule (Keyv + Redis).
 * EN: Root Nest module — wires TypeORM replication and CacheModule (Keyv + Redis) per Nest caching docs.
 *
 * Tham chiếu: https://docs.nestjs.com/techniques/caching (mục “Using alternative Cache stores”, Keyv / @keyv/redis).
 */
import { CacheModule } from "@nestjs/cache-manager"
import { Module } from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import KeyvRedis from "@keyv/redis"
import { TerminusModule } from "@nestjs/terminus"
import { TypeOrmModule } from "@nestjs/typeorm"
import { AppController } from "./app.controller"
import { HealthModule } from "./health"
import { ReplicationModule } from "./replication"
import { UserEntity } from "./users"
import { UsersModule } from "./users"

/**
 * TTL mặc định (ms) cho mục cache khi `set()` không truyền TTL riêng.
 * EN: Default TTL (ms) for cache entries when `set()` omits a per-key TTL.
 *
 * Ghi chú VI: Trong cache-manager v6+, `ttl: 0` nghĩa là không hết hạn; ta đặt >0 cho lab.
 * Note EN: In cache-manager v6+, `ttl: 0` means no expiry; we use a positive TTL for the lesson.
 */
const USER_CACHE_TTL_MS = 60_000

@Module({
    imports: [
        /**
         * VI: Biến môi trường toàn cục (`.env` / Docker `environment:`).
         * EN: Global env binding (`.env` or Docker `environment:`).
         */
    ConfigModule.forRoot({
            isGlobal: true,
        }),

        /**
         * VI: `CacheModule` (Nest) bọc `cache-manager`; từ bản v6 trở lên, lưu trữ đi qua **Keyv**.
         * EN: Nest `CacheModule` wraps `cache-manager`; from v6 onward, storage is backed by **Keyv**.
         *
         * VI: Store Redis = `@keyv/redis` — đúng ví dụ “alternative stores” trong tài liệu Nest (URI `redis://host:port`).
         * EN: Redis store = `@keyv/redis` — matches Nest docs “alternative stores” (`redis://host:port` URI).
         *
         * VI: Mảng `stores`: phần tử **đầu tiên** là store mặc định; các phần tử sau là fallback (Nest mô tả trong docs).
         * EN: `stores` array: the **first** entry is the primary store; additional entries are fallbacks (as in Nest docs).
         *
         * VI: Có thể thêm tầng L1 RAM (`Keyv` + `KeyvCacheableMemory` từ gói `cacheable`) trước Redis — ở lab này chỉ Redis để dễ quan sát miss/hit.
         * EN: You may prepend an L1 RAM tier (`Keyv` + `cacheable`’s `KeyvCacheableMemory`) before Redis; this lesson uses Redis only for clearer miss/hit demos.
         */
    CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const host = config.get<string>("REDIS_HOST", "127.0.0.1")
                const port = config.get<number>("REDIS_PORT", 6379)
                /**
                 * VI: Bitnami Redis lab thường không bật mật khẩu — URI tối giản.
                 * EN: Bitnami lab Redis often has no password — minimal URI.
                 *
                 * VI: Production: dùng `redis://:password@host:port` hoặc TLS (`rediss://`) tùy vận hành.
                 * EN: Production: use `redis://:password@host:port` or TLS (`rediss://`) per your ops standard.
                 */
    const redisUri = `redis://${host}:${port}`

                return {
                    stores: [
                        new KeyvRedis(redisUri),
                    ],
                    ttl: USER_CACHE_TTL_MS,
                }
            },
        }),

        /**
         * VI: Một `DataSource` TypeORM với `replication`: ghi → `master`, đọc SELECT mặc định → pool `slaves`.
         * EN: Single TypeORM `DataSource` with `replication`: writes → `master`, default SELECTs → `slaves` pool.
         */
    TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres",
                replication: {
                    master: {
                        host: config.getOrThrow<string>("POSTGRES_MASTER_HOST"),
                        port: config.get<number>("POSTGRES_MASTER_PORT", 5432),
                        username: config.getOrThrow<string>("POSTGRES_USER"),
                        password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
                        database: config.getOrThrow<string>("POSTGRES_DATABASE"),
                    },
                    slaves: [
                        {
                            host: config.getOrThrow<string>("POSTGRES_READ_HOST_1"),
                            port: config.get<number>("POSTGRES_READ_PORT", 5432),
                            username: config.getOrThrow<string>("POSTGRES_USER"),
                            password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
                            database: config.getOrThrow<string>("POSTGRES_DATABASE"),
                        },
                        {
                            host: config.getOrThrow<string>("POSTGRES_READ_HOST_2"),
                            port: config.get<number>("POSTGRES_READ_PORT", 5432),
                            username: config.getOrThrow<string>("POSTGRES_USER"),
                            password: config.getOrThrow<string>("POSTGRES_PASSWORD"),
                            database: config.getOrThrow<string>("POSTGRES_DATABASE"),
                        },
                    ],
                },
                entities: [UserEntity],
                synchronize: true,
                logging: ["query", "error", "warn"],
            }),
        }),

        TerminusModule,
        HealthModule,
        ReplicationModule,
        UsersModule,
    ],
    controllers: [AppController],
})
/**
 * Class `AppModule` — thành phần lab (controller/service/module).
 * (EN: Class `AppModule` — lesson lab component.)
 */
export class AppModule {}
