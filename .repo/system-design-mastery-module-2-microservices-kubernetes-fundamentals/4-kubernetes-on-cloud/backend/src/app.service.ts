/**
 * Service lesson — methods documented Logic + Code (§4).
 * (EN: Lesson service — Logic + Code on methods (§4).)
 */
import {
    ConfigService,
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    Logger,
} from "@nestjs/common"
import Redis from "ioredis"
import {
    ConfigService,
} from "@nestjs/config"

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class AppService {
    private readonly logger = new Logger(AppService.name)

/**
 * Logic — Xử lý nghiệp vụ `parseCachedItems` cho lab.
 * Code — `parseCachedItems()` — logic trong service/controller.
 * (EN Logic: Business handler `parseCachedItems` for the lab.)
 * (EN Code: `parseCachedItems()` — in-class handler logic.)
 */
    private parseCachedItems(raw: string): ReadonlyArray<ItemRow> {
        const parsed = JSON.parse(raw)

        if (!Array.isArray(parsed)) {
            return []
        }

        return parsed.filter((item): item is ItemRow => {
            return (
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item) &&
                typeof (item as ItemRow).id === "number" &&
                typeof (item as ItemRow).name === "string"
            )
        })
    }

    /**
 * Logic — Khởi tạo client/hook khi module sẵn sàng (Redis/Kafka/DB pool).
 * Code — Hook `OnModuleInit`: đọc `ConfigService` và tạo connection/client.
 * (EN Logic: Initialize clients when the module becomes ready.)
 * (EN Code: `OnModuleInit` hook: read `ConfigService` and open connections.)
 */
    async onModuleInit(): Promise<void> {
        this.initRedis()
        this.initMySQL()
    }

    /**
 * Logic — Xử lý nghiệp vụ `initRedis` cho lab.
 * Code — `async initRedis()` — gọi dependency inject / client.
 * (EN Logic: Business handler `initRedis` for the lab.)
 * (EN Code: `async initRedis()` — uses injected deps / clients.)
 */
    private async initRedis(): Promise<void> {
        const url = `redis://${this.redisCfg.host}:${this.redisCfg.port}`

        while (true) {
            try {
                this.redisClient = createClient({
                    url,
                })
                this.redisClient.on(
                    "error",
                    (err) => this.logger.error("Redis Client Error", err),
                )
                await this.redisClient.connect()
                this.logger.log("Successfully connected to Redis")
                break
            } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error"
                this.logger.warn(`Redis not ready (${message}). Retrying in 5s...`)
                await new Promise((resolve) => setTimeout(resolve, 5000))
            }
        }
    }

    /**
 * Logic — Xử lý nghiệp vụ `initMySQL` cho lab.
 * Code — `async initMySQL()` — gọi dependency inject / client.
 * (EN Logic: Business handler `initMySQL` for the lab.)
 * (EN Code: `async initMySQL()` — uses injected deps / clients.)
 */
    private async initMySQL(): Promise<void> {
        const db = this.databaseCfg
        const mysqlOptions = {
            host: db.host,
            port: db.port,
            user: db.username,
            password: db.password,
            database: db.database,
        }

        while (true) {
            try {
                this.mysqlConn = await createConnection(mysqlOptions)

                await this.mysqlConn.execute(`
          CREATE TABLE IF NOT EXISTS items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL
          )
        `)

                this.logger.log("Successfully connected to MySQL and ensured table exists")
                break
            } catch (e) {
                const message = e instanceof Error ? e.message : "Unknown error"
                this.logger.warn(`MySQL not ready (${message}). Retrying in 5s...`)
                await new Promise((resolve) => setTimeout(resolve, 5000))
            }
        }
    }

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getHealth`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getHealth`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getHealth(): Promise<HealthResponse> {
        return {
            mysql: this.mysqlConn ? "connected" : "disconnected",
            redis: this.redisClient?.isReady ? "connected" : "disconnected",
            podName: this.podName,
        }
    }

    /**
 * Logic — Ghi/sự kiện mới qua `createItem`.
 * Code — Validate input → mutate state / emit message → return summary.
 * (EN Logic: Write/event via `createItem`.)
 * (EN Code: Validate → mutate state / emit → return summary.)
 */
    async createItem(name: string): Promise<CreateItemResponse> {
        if (!this.mysqlConn) {
            this.logger.error("Cannot create item: DB disconnected")
            return {
                error: "DB not connected",
            }
        }

        await this.mysqlConn.execute("INSERT INTO items (name) VALUES (?)", [name])

        if (this.redisClient?.isReady) {
            await this.redisClient.del("items_list")
            this.logger.log(`Item "${name}" created and cache invalidated`)
        } else {
            this.logger.log(`Item "${name}" created (Redis skipped)`)
        }

        return {
            success: true,
        }
    }

    /**
 * Logic — Đọc/truy vấn dữ liệu qua `getItems`.
 * Code — Truy vấn in-memory / DB / cache và map response DTO.
 * (EN Logic: Read/query via `getItems`.)
 * (EN Code: Query in-memory / DB / cache and map response.)
 */
    async getItems(): Promise<GetItemsResponse | { error: string }> {
        if (this.redisClient?.isReady) {
            const cached = (await this.redisClient.get("items_list")) as string | null
            if (cached) {
                this.logger.log("Cache hit for items_list")
                return {
                    data: this.parseCachedItems(cached),
                    source: "cache",
                    podName: this.podName,
                }
            }
        }

        if (!this.mysqlConn) {
            this.logger.error("Cannot get items: DB disconnected")
            return {
                error: "DB not connected",
            }
        }

        this.logger.log("Cache miss. Fetching from MySQL...")
        const [rows] = await this.mysqlConn.execute("SELECT * FROM items")
        const data: ReadonlyArray<ItemRow> = Array.isArray(rows)
            ? rows.filter(
                (row): row is ItemRow =>
                    typeof row === "object" &&
                    row !== null &&
                    !Array.isArray(row) &&
                    typeof (row as ItemRow).id === "number" &&
                    typeof (row as ItemRow).name === "string",
            )
            : []

        if (this.redisClient?.isReady) {
            await this.redisClient.setEx("items_list", 60, JSON.stringify(data))
            this.logger.log("Saved items_list to Cache")
        }

        return {
            data,
            source: "database",
            podName: this.podName,
        }
    }
}
