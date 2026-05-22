/**
 * Module 13 — Flash Sale at Scale: coding-rules, Postgres seed, Redis, JSDoc.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-13-flash-sale-at-scale",
)

function write(rel, content) {
    const full = path.join(MODULE, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
}

const appConfig = `import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình app (cổng HTTP).
 * (EN: App config (HTTP port).)
 */
export interface AppConfig {
    port: number
}

export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3000,
    }),
)
`

const redisConfig = `/**
 * Config \`registerAs\` — chỉ đọc \`process.env\` tại factory.
 * (EN: Config \`registerAs\` — reads \`process.env\` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface RedisConfig {
    host: string
    port: number
}

/**
 * Cấu hình Redis — namespace \`redis\` cho ConfigService.
 * (EN: Redis connection config — \`redis\` namespace for ConfigService.)
 */
export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
`

const databaseConfig = (defaultDb) => `/**
 * Config \`registerAs\` — chỉ đọc \`process.env\` tại factory.
 * (EN: Config \`registerAs\` — reads \`process.env\` in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface DatabaseConfig {
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
export const databaseConfig = registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.POSTGRES_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? "${defaultDb}",
    }),
)
`

const configIndexPgRedis = `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./database.config"
export * from "./redis.config"
`

const configIndexRedisOnly = `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./redis.config"
`

const bootstrap = `/**
 * Bootstrap Nest HTTP — ValidationPipe + listen 0.0.0.0.
 * (EN: Nest HTTP bootstrap — ValidationPipe and listen on 0.0.0.0.)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
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
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    await app.listen(port, "0.0.0.0")
}
`

const mainTs = `/**
 * Entry Node (\`nest build\` → dist/main.js) — chỉ gọi bootstrap đã export.
 * (EN: Node entry (\`nest build\` → dist/main.js) — invokes exported bootstrap only.)
 */
import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
`

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

function appModulePgRedis(featureModule, featureFolder) {
    return `/**
 * Module gốc — Postgres biz demo + seed OnModuleInit + Redis.
 * (EN: Root module — Postgres demo data + OnModuleInit seed + Redis.)
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
    redisConfig,
    type DatabaseConfig,
} from "./config"
import {
    ${featureModule},
} from "./${featureFolder}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig],
        }),
${typeOrmRoot},
        ${featureModule},
    ],
})
export class AppModule {}
`
}

function appModuleRedisOnly(featureModule, featureFolder) {
    return `/**
 * Module gốc — Redis virtual waiting room (không Postgres).
 * (EN: Root module — Redis virtual waiting room (no Postgres).)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
    redisConfig,
} from "./config"
import {
    ${featureModule},
} from "./${featureFolder}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, redisConfig],
        }),
        ${featureModule},
    ],
})
export class AppModule {}
`
}

function scaffoldService({
    lessonSlug,
    lessonTitleVi,
    lessonTitleEn,
    serviceName,
    dbName,
    withPostgres,
    envVars,
}) {
    const prefix = `${lessonSlug}/${serviceName}`
    const alias = `@${lessonSlug}`

    write(
        `${lessonSlug}/.docker/compose.yaml`,
        `name: ${lessonSlug}
# Vi: Docker Compose stack cho bài học ${lessonTitleVi}.
# (EN: Docker Compose stack for lesson ${lessonTitleEn}.)

services:
  # NestJS API Service
  api:
    container_name: ${lessonSlug}-api
    build:
      context: ../${serviceName}
      dockerfile: Dockerfile
    ports:
      # Ánh xạ cổng host 3000 → container 3000 (HTTP API).
      # (EN: Map host port 3000 → container 3000 (HTTP API).)
      - "3000:3000"
    environment:
      - PORT=3000
${withPostgres ? `      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${dbName}
` : ""}      - REDIS_HOST=redis
      - REDIS_PORT=6379
    networks:
      - ${lessonSlug}-network
    depends_on:
${withPostgres ? "      - db\n" : ""}      - redis

${withPostgres ? `  # Postgres — ledger / orders (TypeORM).
  # (EN: Postgres — ledger / orders (TypeORM).)
  db:
    image: postgres:16-alpine
    container_name: ${lessonSlug}-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${dbName}
    ports:
      # Postgres host 5432 (lab local).
      # (EN: Postgres host port 5432 (local lab).)
      - "5432:5432"
    networks:
      - ${lessonSlug}-network

` : ""}  # Redis — counter / queue / idempotency registry.
  # (EN: Redis — counter / queue / idempotency registry.)
  redis:
    image: redis:7-alpine
    container_name: ${lessonSlug}-redis
    ports:
      # Redis host 6379.
      # (EN: Redis host port 6379.)
      - "6379:6379"
    networks:
      - ${lessonSlug}-network

networks:
  ${lessonSlug}-network:
    name: ${lessonSlug}-network
`,
    )

    write(`${lessonSlug}/.gitignore`, "node_modules/\ndist/\n.env\n")

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
`
    write(`${prefix}/Dockerfile`, dockerfile)

    const deps = {
        "@nestjs/common": "^10.0.0",
        "@nestjs/config": "^3.0.0",
        "@nestjs/core": "^10.0.0",
        "@nestjs/platform-express": "^10.0.0",
        "class-transformer": "^0.5.1",
        "class-validator": "^0.14.0",
        "ioredis": "^5.0.0",
        "reflect-metadata": "^0.1.13",
        "rxjs": "^7.8.0",
    }
    if (withPostgres) {
        deps["@nestjs/typeorm"] = "^10.0.0"
        deps.pg = "^8.11.0"
        deps.typeorm = "^0.3.15"
    }

    write(
        `${prefix}/package.json`,
        `${JSON.stringify(
            {
                name: serviceName,
                version: "1.0.0",
                scripts: {
                    build: "nest build && tsc-alias -p tsconfig.build.json",
                    start: "nest start",
                    "start:dev": "nest start --watch",
                },
                dependencies: deps,
                devDependencies: {
                    "@nestjs/cli": "^10.0.0",
                    "@nestjs/schematics": "^10.0.0",
                    "tsc-alias": "^1.8.0",
                    typescript: "^5.0.0",
                },
            },
            null,
            2,
        )}\n`,
    )

    write(
        `${prefix}/nest-cli.json`,
        `${JSON.stringify(
            {
                $schema: "https://json.schemastore.org/nest-cli",
                collection: "@nestjs/schematics",
                sourceRoot: "src",
                compilerOptions: { deleteOutDir: true, assets: [] },
            },
            null,
            2,
        )}\n`,
    )

    write(
        `${prefix}/tsconfig.json`,
        `${JSON.stringify(
            {
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
                    strict: true,
                    strictNullChecks: true,
                    noImplicitAny: true,
                    strictFunctionTypes: true,
                    strictBindCallApply: true,
                    forceConsistentCasingInFileNames: true,
                    noImplicitReturns: true,
                    noFallthroughCasesInSwitch: true,
                    noUncheckedIndexedAccess: true,
                    useUnknownInCatchVariables: false,
                    paths: {
                        [alias]: ["src/index.ts"],
                        [`${alias}/*`]: ["src/*"],
                    },
                },
            },
            null,
            2,
        )}\n`,
    )

    write(
        `${prefix}/tsconfig.build.json`,
        `${JSON.stringify(
            {
                extends: "./tsconfig",
                exclude: ["node_modules", "test", "dist", "**/*spec.ts"],
            },
            null,
            2,
        )}\n`,
    )

    const envLines = [
        "# --- Local / Docker (khớp compose.yaml và src/config/) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml and src/config/.)",
        ...Object.entries(envVars).map(([k, v]) => `${k}=${v}`),
        "",
    ]
    write(`${prefix}/.env`, envLines.join("\n"))
    write(`${prefix}/src/main.ts`, mainTs)
    write(`${prefix}/src/bootstrap.ts`, bootstrap)
    write(`${prefix}/src/config/app.config.ts`, appConfig)
    write(`${prefix}/src/config/redis.config.ts`, redisConfig)
    if (withPostgres) {
        write(`${prefix}/src/config/database.config.ts`, databaseConfig(dbName))
        write(`${prefix}/src/config/index.ts`, configIndexPgRedis)
    } else {
        write(`${prefix}/src/config/index.ts`, configIndexRedisOnly)
    }
}

// --- Lesson 0: inventory ---
const L0 = "0-high-concurrency-inventory-management"
const S0 = `${L0}/inventory-service`

scaffoldService({
    lessonSlug: L0,
    lessonTitleVi: "Quản lý tồn kho hiệu năng cao",
    lessonTitleEn: "High-Concurrency Inventory Management",
    serviceName: "inventory-service",
    dbName: "inventory_service",
    withPostgres: true,
    envVars: {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "inventory_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
})

write(`${S0}/src/app.module.ts`, appModulePgRedis("InventoryModule", "inventory"))

write(
    `${S0}/src/entities/postgresql/primary/inventory-item.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity tồn kho — ledger Postgres (nguồn sự thật bền vững).
 * (EN: Inventory item entity — durable Postgres ledger.)
 */
@Entity("inventory_items")
export class InventoryItemEntity {
    @PrimaryColumn()
    sku!: string

    @Column({ type: "int" })
    stock!: number
}
`,
)

write(
    `${S0}/src/entities/postgresql/primary/inventory-ledger.entity.ts`,
    `import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Ledger trừ kho — mỗi lần Redis decrement thành công ghi một dòng (đồng bộ).
 * (EN: Inventory ledger row — one sync INSERT per successful Redis decrement.)
 */
@Entity("inventory_ledgers")
export class InventoryLedgerEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    sku!: string

    @Column({ type: "int", name: "quantity_changed" })
    quantityChanged!: number

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
`,
)

write(
    `${S0}/src/entities/postgresql/primary/index.ts`,
    `export * from "./inventory-item.entity"
export * from "./inventory-ledger.entity"
`,
)
write(`${S0}/src/entities/postgresql/index.ts`, `export * from "./primary"\n`)
write(`${S0}/src/entities/index.ts`, `export * from "./postgresql"\n`)

write(
    `${S0}/src/inventory/dto/decrement-inventory.dto.ts`,
    `import {
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
} from "class-validator"

/**
 * DTO trừ kho — SKU + số lượng.
 * (EN: Decrement inventory DTO — SKU and quantity.)
 */
export class DecrementInventoryDto {
    @IsString()
    @IsNotEmpty()
    productSku!: string

    @IsInt()
    @Min(1)
    quantity!: number
}
`,
)

write(`${S0}/src/inventory/dto/index.ts`, `export * from "./decrement-inventory.dto"\n`)

write(
    `${S0}/src/inventory/inventory-seed.service.ts`,
    `/**
 * Seed SKU demo vào Postgres + đồng bộ counter Redis.
 * (EN: Seed demo SKU into Postgres + sync Redis counter.)
 */
import {
    Injectable,
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
    InventoryItemEntity,
} from "../entities"

@Injectable()
export class InventorySeedService implements OnModuleInit {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(InventoryItemEntity)
        private readonly items: Repository<InventoryItemEntity>,
    ) {}

    /**
     * Logic — khi DB trống, seed IPHONE15; đồng bộ Redis stock key.
     * Code — count() === 0 → save → SET stock:IPHONE15.
     * (EN Logic: Seed demo SKU when DB empty; sync Redis.)
     * (EN Code: count === 0 → save → SET redis key.)
     */
    async onModuleInit(): Promise<void> {
        const redisCfg = this.config.getOrThrow<RedisConfig>("redis")
        this.redis = new Redis({
            host: redisCfg.host,
            port: redisCfg.port,
            lazyConnect: true,
        })
        await this.redis.connect()

        if ((await this.items.count()) === 0) {
            await this.items.save({ sku: "IPHONE15", stock: 100 })
        }
        const row = await this.items.findOneOrFail({ where: { sku: "IPHONE15" } })
        await this.redis.set(this.stockKey("IPHONE15"), String(row.stock))
        await this.redis.quit()
    }

    private stockKey(sku: string): string {
        return \`stock:\${sku}\`
    }
}
`,
)

write(
    `${S0}/src/inventory/inventory.service.ts`,
    `/**
 * Service tồn kho — Redis Lua pre-decrement vs Postgres pessimistic lock.
 * (EN: Inventory service — Redis Lua pre-decrement vs Postgres pessimistic lock.)
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
    InventoryItemEntity,
    InventoryLedgerEntity,
} from "../entities"

const DECR_LUA = \`
local current = tonumber(redis.call('GET', KEYS[1]) or '0')
local qty = tonumber(ARGV[1])
if current < qty then
  return -1
end
redis.call('DECRBY', KEYS[1], qty)
return current - qty
\`

@Injectable()
export class InventoryService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(InventoryItemEntity)
        private readonly items: Repository<InventoryItemEntity>,
        @InjectRepository(InventoryLedgerEntity)
        private readonly ledgers: Repository<InventoryLedgerEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client.
     * Code — OnModuleInit → ioredis lazyConnect.
     * (EN Logic: Initialize Redis client.)
     * (EN Code: OnModuleInit → ioredis.)
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
     * Logic — Lua trừ Redis; thành công thì INSERT ledger Postgres (đồng bộ).
     * Code — EVAL DECR_LUA → remaining < 0 ? soldOut : ledgers.save(-quantity).
     * (EN Logic: Redis Lua then synchronous Postgres ledger INSERT.)
     * (EN Code: EVAL Lua → INSERT inventory_ledgers on success.)
     */
    async decrementRedis(sku: string, quantity: number) {
        await this.connectRedis()
        const key = this.stockKey(sku)
        const remaining = (await this.redis.eval(
            DECR_LUA,
            1,
            key,
            String(quantity),
        )) as number
        const soldOut = remaining < 0
        if (soldOut) {
            return {
                path: "redis-lua-pre-decrement",
                productSku: sku,
                quantity,
                remaining: 0,
                soldOut: true,
                redisKey: key,
                lockType: "none-in-memory-atomic",
                ledgerWritten: false,
                note: "Lua rejected decrement — Postgres spared from oversell traffic.",
            }
        }
        await this.ledgers.save({
            sku,
            quantityChanged: -quantity,
        })
        return {
            path: "redis-lua-pre-decrement",
            productSku: sku,
            quantity,
            remaining,
            soldOut: false,
            redisKey: key,
            lockType: "none-in-memory-atomic",
            ledgerWritten: true,
            durableWrite: "inventory_ledgers-sync-insert",
        }
    }

    /**
     * Logic — trừ kho Postgres pessimistic (chậm hơn — so sánh lab).
     * Code — findOne lock pessimistic_write → save.
     * (EN Logic: Pessimistic row lock decrement (slower lab path).)
     * (EN Code: FOR UPDATE style lock → save.)
     */
    async decrementDb(sku: string, quantity: number) {
        const item = await this.items.findOne({
            where: { sku },
            lock: { mode: "pessimistic_write" },
        })
        if (!item || item.stock < quantity) {
            return {
                path: "postgres-pessimistic-lock",
                productSku: sku,
                quantity,
                remaining: item?.stock ?? 0,
                soldOut: true,
                lockType: "pessimistic-row",
                note: "Row lock blocks concurrent transactions — pool pressure under burst.",
            }
        }
        item.stock -= quantity
        await this.items.save(item)
        await this.connectRedis()
        await this.redis.set(this.stockKey(sku), String(item.stock))
        return {
            path: "postgres-pessimistic-lock",
            productSku: sku,
            quantity,
            remaining: item.stock,
            soldOut: item.stock === 0,
            lockType: "pessimistic-row",
            dbStock: item.stock,
        }
    }

    /**
     * Logic — so sánh counter Redis vs ledger Postgres (baseline items không đổi trên path Redis).
     * Code — GET stock:sku + COUNT/SUM inventory_ledgers.
     * (EN Logic: Redis counter vs Postgres ledger rows.)
     * (EN Code: GET redis + aggregate ledgers.)
     */
    async getStock(sku: string) {
        await this.connectRedis()
        const redisRaw = await this.redis.get(this.stockKey(sku))
        const redisStock = redisRaw == null ? null : Number(redisRaw)
        const row = await this.items.findOne({ where: { sku } })
        const ledgerRowCount = await this.ledgers.count({ where: { sku } })
        const ledgerAgg = await this.ledgers
            .createQueryBuilder("l")
            .select("COALESCE(SUM(l.quantityChanged), 0)", "net")
            .where("l.sku = :sku", { sku })
            .getRawOne<{ net: string }>()
        const ledgerNetChange = Number(ledgerAgg?.net ?? 0)
        return {
            productSku: sku,
            redisStock,
            dbBaselineStock: row?.stock ?? null,
            ledgerRowCount,
            ledgerNetChange,
            redisKey: this.stockKey(sku),
            sourceOfTruth:
                "redis-fast-counter + postgres-inventory_ledgers-per-sale",
        }
    }

    private stockKey(sku: string): string {
        return \`stock:\${sku}\`
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status !== "ready") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${S0}/src/inventory/inventory.controller.ts`,
    `import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common"
import {
    DecrementInventoryDto,
} from "./dto"
import {
    InventoryService,
} from "./inventory.service"

/**
 * HTTP controller — trừ kho Redis vs Postgres (lesson 0).
 * (EN: HTTP controller — Redis vs Postgres decrement (lesson 0).)
 */
@Controller("api/inventory")
export class InventoryController {
    constructor(
        private readonly service: InventoryService,
    ) {}

    /**
     * Logic — trừ kho nhanh bằng Redis Lua.
     * Code — POST decrement/redis → decrementRedis.
     * (EN Logic: Fast decrement via Redis Lua.)
     * (EN Code: POST decrement/redis.)
     */
    @Post("decrement/redis")
    decrementRedis(
        @Body() body: DecrementInventoryDto,
    ): ReturnType<InventoryService["decrementRedis"]> {
        return this.service.decrementRedis(body.productSku, body.quantity)
    }

    /**
     * Logic — trừ kho Postgres pessimistic (so sánh).
     * Code — POST decrement/db → decrementDb.
     * (EN Logic: Pessimistic DB decrement for comparison.)
     * (EN Code: POST decrement/db.)
     */
    @Post("decrement/db")
    decrementDb(
        @Body() body: DecrementInventoryDto,
    ): ReturnType<InventoryService["decrementDb"]> {
        return this.service.decrementDb(body.productSku, body.quantity)
    }

    /**
     * Logic — xem tồn Redis vs DB.
     * Code — GET stock/:sku → getStock.
     * (EN Logic: Inspect Redis vs DB stock.)
     * (EN Code: GET stock/:sku.)
     */
    @Get("stock/:sku")
    getStock(
        @Param("sku") sku: string,
    ): ReturnType<InventoryService["getStock"]> {
        return this.service.getStock(sku)
    }
}
`,
)

write(
    `${S0}/src/inventory/inventory.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    InventoryItemEntity,
    InventoryLedgerEntity,
} from "../entities"
import {
    InventoryController,
} from "./inventory.controller"
import {
    InventorySeedService,
} from "./inventory-seed.service"
import {
    InventoryService,
} from "./inventory.service"

/**
 * Feature module — inventory Postgres + Redis Lua.
 * (EN: Feature module — inventory Postgres + Redis Lua.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([InventoryItemEntity, InventoryLedgerEntity])],
    controllers: [InventoryController],
    providers: [InventoryService, InventorySeedService],
})
export class InventoryModule {}
`,
)

write(
    `${S0}/src/inventory/index.ts`,
    `export * from "./inventory.controller"
export * from "./inventory.module"
export * from "./inventory.service"
`,
)

// --- Lesson 1: waiting room ---
const L1 = "1-virtual-waiting-room-and-queuing"
const S1 = `${L1}/waiting-room`

scaffoldService({
    lessonSlug: L1,
    lessonTitleVi: "Phòng chờ ảo và Hàng đợi",
    lessonTitleEn: "Virtual Waiting Room and Queuing",
    serviceName: "waiting-room",
    dbName: "",
    withPostgres: false,
    envVars: {
        PORT: "3000",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
})

write(`${S1}/src/app.module.ts`, appModuleRedisOnly("WaitingroomModule", "waitingroom"))

write(
    `${S1}/src/constants/waiting-room.ts`,
    `/**
 * Hằng số phòng chờ — key Redis và ngưỡng admit.
 * (EN: Waiting room constants — Redis keys and admit threshold.)
 */
export const WAITING_ROOM_QUEUE_KEY = "waitingroom:queue"

/** SET user đã được duyệt vào checkout (TTL 5 phút). */
export const WAITING_ROOM_ADMITTED_KEY = "waitingroom:admitted"

/** TTL danh sách admitted (giây) — demo 5 phút. */
export const WAITING_ROOM_ADMITTED_TTL_SEC = 300

/** Số user mặc định khi POST admit không truyền count. */
export const WAITING_ROOM_DEFAULT_ADMIT_COUNT = 50
`,
)

write(`${S1}/src/constants/index.ts`, `export * from "./waiting-room"\n`)

write(
    `${S1}/src/waitingroom/dto/admit-waiting-room.dto.ts`,
    `import {
    IsInt,
    Min,
} from "class-validator"

/**
 * DTO admit phòng chờ — số user lấy từ đầu hàng.
 * (EN: Admit waiting room DTO — batch size from queue head.)
 */
export class AdmitWaitingRoomDto {
    @IsInt()
    @Min(1)
    count!: number
}
`,
)

write(`${S1}/src/waitingroom/dto/index.ts`, `export * from "./admit-waiting-room.dto"\n`)

write(
    `${S1}/src/waitingroom/waitingroom.service.ts`,
    `/**
 * Service phòng chờ ảo — Redis ZSET queue.
 * (EN: Virtual waiting room service — Redis ZSET queue.)
 */
import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import Redis from "ioredis"
import type {
    RedisConfig,
} from "../config"
import {
    WAITING_ROOM_ADMITTED_KEY,
    WAITING_ROOM_ADMITTED_TTL_SEC,
    WAITING_ROOM_DEFAULT_ADMIT_COUNT,
    WAITING_ROOM_QUEUE_KEY,
} from "../constants"

@Injectable()
export class WaitingroomService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic — khởi tạo Redis.
     * Code — OnModuleInit → ioredis.
     * (EN Logic: Initialize Redis.)
     * (EN Code: OnModuleInit → ioredis.)
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
     * Logic — đóng Redis.
     * Code — OnModuleDestroy → quit().
     * (EN Logic: Close Redis.)
     * (EN Code: OnModuleDestroy → quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — user vào hàng đợi, nhận token + vị trí.
     * Code — ZADD queue score=now nếu chưa có member.
     * (EN Logic: Enqueue user and return token + position.)
     * (EN Code: ZADD with timestamp score.)
     */
    async issueToken(userId: string) {
        await this.connectRedis()
        const score = Date.now()
        const added = await this.redis.zadd(WAITING_ROOM_QUEUE_KEY, "NX", score, userId)
        const rank = await this.redis.zrank(WAITING_ROOM_QUEUE_KEY, userId)
        const position = rank == null ? null : rank + 1
        const queueSize = await this.redis.zcard(WAITING_ROOM_QUEUE_KEY)
        return {
            userId,
            queueToken: \`wr_\${userId}\`,
            position,
            queueSize,
            newlyEnqueued: added > 0,
            redisStructure: "sorted-set",
            redisKey: WAITING_ROOM_QUEUE_KEY,
            scoreField: "enqueue-timestamp-ms",
            admitEndpoint: "POST /api/waitingroom/admit",
        }
    }

    /**
     * Logic — đọc vị trí hiện tại trong queue.
     * Code — ZRANK → position = rank + 1.
     * (EN Logic: Current queue position.)
     * (EN Code: ZRANK + 1.)
     */
    async getPosition(userId: string) {
        await this.connectRedis()
        const rank = await this.redis.zrank(WAITING_ROOM_QUEUE_KEY, userId)
        return {
            userId,
            position: rank == null ? null : rank + 1,
            inQueue: rank != null,
            redisCommand: "ZRANK",
        }
    }

    /**
     * Logic — admit thủ công: ZRANGE top N → SADD admitted → ZREM khỏi queue.
     * Code — POST admit body count.
     * (EN Logic: Manual batch admit from queue head.)
     * (EN Code: ZRANGE + SADD + ZREM.)
     */
    async admitUsers(count: number) {
        await this.connectRedis()
        const batch = Math.max(1, Math.floor(count))
        const topUsers = await this.redis.zrange(
            WAITING_ROOM_QUEUE_KEY,
            0,
            batch - 1,
        )
        if (topUsers.length > 0) {
            const pipeline = this.redis.pipeline()
            for (const user of topUsers) {
                pipeline.sadd(WAITING_ROOM_ADMITTED_KEY, user)
                pipeline.zrem(WAITING_ROOM_QUEUE_KEY, user)
            }
            pipeline.expire(WAITING_ROOM_ADMITTED_KEY, WAITING_ROOM_ADMITTED_TTL_SEC)
            await pipeline.exec()
        }
        const queueRemaining = await this.redis.zcard(WAITING_ROOM_QUEUE_KEY)
        return {
            admittedCount: topUsers.length,
            admittedUserIds: topUsers,
            queueRemaining,
            redisCommands: ["ZRANGE", "SADD", "ZREM", "EXPIRE"],
            admittedKey: WAITING_ROOM_ADMITTED_KEY,
            admittedTtlSeconds: WAITING_ROOM_ADMITTED_TTL_SEC,
            defaultAdmitCount: WAITING_ROOM_DEFAULT_ADMIT_COUNT,
        }
    }

    /**
     * Logic — admitted nếu có trong SET; còn trong queue thì waiting.
     * Code — SISMEMBER admitted; else ZRANK queue.
     * (EN Logic: Admitted SET membership or waiting in ZSET.)
     * (EN Code: SISMEMBER + ZRANK.)
     */
    async getStatus(userId: string) {
        await this.connectRedis()
        const isAdmitted = (await this.redis.sismember(
            WAITING_ROOM_ADMITTED_KEY,
            userId,
        )) === 1
        if (isAdmitted) {
            return {
                userId,
                status: "admitted",
                admitted: true,
                position: null,
                checkoutToken: \`checkout_\${userId}\`,
                admittedKey: WAITING_ROOM_ADMITTED_KEY,
            }
        }
        const rank = await this.redis.zrank(WAITING_ROOM_QUEUE_KEY, userId)
        if (rank == null) {
            return {
                userId,
                status: "not-in-queue",
                admitted: false,
                checkoutToken: null,
            }
        }
        return {
            userId,
            status: "waiting",
            admitted: false,
            position: rank + 1,
            checkoutToken: null,
            admitHint: "POST /api/waitingroom/admit with { count: N }",
        }
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status !== "ready") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${S1}/src/waitingroom/waitingroom.controller.ts`,
    `import {
    Body,
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    AdmitWaitingRoomDto,
} from "./dto"
import {
    WaitingroomService,
} from "./waitingroom.service"

/**
 * HTTP controller — virtual waiting room (lesson 1).
 * (EN: HTTP controller — virtual waiting room (lesson 1).)
 */
@Controller("api/waitingroom")
export class WaitingroomController {
    constructor(
        private readonly service: WaitingroomService,
    ) {}

    /**
     * Logic — cấp token / vào queue.
     * Code — GET token → issueToken.
     * (EN Logic: Issue queue token.)
     * (EN Code: GET token.)
     */
    @Get("token")
    token(
        @Query("userId") userId = "usr_123",
    ): ReturnType<WaitingroomService["issueToken"]> {
        return this.service.issueToken(userId)
    }

    /**
     * Logic — vị trí trong hàng.
     * Code — GET position → getPosition.
     * (EN Logic: Queue position.)
     * (EN Code: GET position.)
     */
    @Get("position")
    position(
        @Query("userId") userId = "usr_123",
    ): ReturnType<WaitingroomService["getPosition"]> {
        return this.service.getPosition(userId)
    }

    /**
     * Logic — trạng thái admit.
     * Code — GET status → getStatus.
     * (EN Logic: Admission status.)
     * (EN Code: GET status.)
     */
    @Get("status")
    status(
        @Query("userId") userId = "usr_123",
    ): ReturnType<WaitingroomService["getStatus"]> {
        return this.service.getStatus(userId)
    }

    /**
     * Logic — xả hàng đợi (admit batch từ đầu ZSET).
     * Code — POST admit → admitUsers.
     * (EN Logic: Batch admit from queue head.)
     * (EN Code: POST admit → admitUsers.)
     */
    @Post("admit")
    admit(
        @Body() body: AdmitWaitingRoomDto,
    ): ReturnType<WaitingroomService["admitUsers"]> {
        return this.service.admitUsers(body.count)
    }
}
`,
)

write(
    `${S1}/src/waitingroom/waitingroom.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    WaitingroomController,
} from "./waitingroom.controller"
import {
    WaitingroomService,
} from "./waitingroom.service"

/**
 * Feature module — Redis ZSET waiting room.
 * (EN: Feature module — Redis ZSET waiting room.)
 */
@Module({
    controllers: [WaitingroomController],
    providers: [WaitingroomService],
})
export class WaitingroomModule {}
`,
)

write(
    `${S1}/src/waitingroom/index.ts`,
    `export * from "./waitingroom.controller"
export * from "./waitingroom.module"
export * from "./waitingroom.service"
`,
)

// --- Lesson 2: checkout ---
const L2 = "2-idempotency-and-concurrency-control"
const S2 = `${L2}/checkout-service`

scaffoldService({
    lessonSlug: L2,
    lessonTitleVi: "Idempotency và Kiểm soát đồng thời",
    lessonTitleEn: "Idempotency and Concurrency Control",
    serviceName: "checkout-service",
    dbName: "checkout_service",
    withPostgres: true,
    envVars: {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "checkout_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
})

write(`${S2}/src/app.module.ts`, appModulePgRedis("CheckoutModule", "checkout"))

write(
    `${S2}/src/entities/postgresql/primary/order.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity đơn hàng — Postgres ACID + idempotency key unique.
 * (EN: Order entity — Postgres ACID + unique idempotency key.)
 */
@Entity("orders")
export class OrderEntity {
    @PrimaryColumn()
    orderId!: string

    @Column()
    userId!: string

    @Column()
    productSku!: string

    @Column({ type: "int" })
    quantity!: number

    @Column({ unique: true })
    idempotencyKey!: string

    @Column()
    status!: string
}
`,
)

write(`${S2}/src/entities/postgresql/primary/index.ts`, `export * from "./order.entity"\n`)
write(`${S2}/src/entities/postgresql/index.ts`, `export * from "./primary"\n`)
write(`${S2}/src/entities/index.ts`, `export * from "./postgresql"\n`)

write(
    `${S2}/src/checkout/dto/create-order.dto.ts`,
    `import {
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
} from "class-validator"

/**
 * DTO đặt hàng checkout.
 * (EN: Checkout create order DTO.)
 */
export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    userId!: string

    @IsString()
    @IsNotEmpty()
    productSku!: string

    @IsInt()
    @Min(1)
    quantity!: number
}
`,
)

write(`${S2}/src/checkout/dto/index.ts`, `export * from "./create-order.dto"\n`)

write(
    `${S2}/src/checkout/checkout-seed.service.ts`,
    `/**
 * Seed đơn mẫu (tuỳ chọn) — DB trống không bắt buộc order có sẵn.
 * (EN: Optional seed — empty DB is fine for checkout lab.)
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
    OrderEntity,
} from "../entities"

@Injectable()
export class CheckoutSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(OrderEntity)
        private readonly orders: Repository<OrderEntity>,
    ) {}

    /**
     * Logic — không seed order mặc định; lab tạo qua POST.
     * Code — onModuleInit no-op khi count >= 0.
     * (EN Logic: No default orders; created via POST.)
     * (EN Code: onModuleInit noop.)
     */
    async onModuleInit(): Promise<void> {
        await this.orders.count()
    }
}
`,
)

write(
    `${S2}/src/checkout/checkout.service.ts`,
    `/**
 * Service checkout — idempotency key + Postgres order.
 * (EN: Checkout service — idempotency key + Postgres order.)
 */
import {
    ConflictException,
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
    OrderEntity,
} from "../entities"

const IDEMPOTENCY_TTL_SEC = 86_400
const IDEMPOTENCY_PENDING_TTL_SEC = 30
const IDEMPOTENCY_PENDING_VALUE = "PENDING"
/** Delay mô phỏng xử lý đơn — demo double-click trên lớp. */
const CHECKOUT_PROCESSING_DELAY_MS = 1500

@Injectable()
export class CheckoutService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(OrderEntity)
        private readonly orders: Repository<OrderEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis registry idempotency.
     * Code — OnModuleInit → ioredis.
     * (EN Logic: Initialize Redis idempotency registry.)
     * (EN Code: OnModuleInit → ioredis.)
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
     * Logic — đóng Redis.
     * Code — OnModuleDestroy → quit().
     * (EN Logic: Close Redis.)
     * (EN Code: OnModuleDestroy → quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — SET NX PENDING chặn double-click; xong ghi JSON kết quả.
     * Code — set PENDING → delay → save Order → setex payload.
     * (EN Logic: PENDING lock then persist order and cache result.)
     * (EN Code: SET NX PENDING → process → SET JSON result.)
     */
    async placeOrder(
        idempotencyKey: string,
        userId: string,
        productSku: string,
        quantity: number,
    ) {
        await this.connectRedis()
        const cacheKey = this.idempotencyKey(idempotencyKey)
        const lockAcquired = await this.redis.set(
            cacheKey,
            IDEMPOTENCY_PENDING_VALUE,
            "EX",
            IDEMPOTENCY_PENDING_TTL_SEC,
            "NX",
        )
        if (!lockAcquired) {
            const current = await this.redis.get(cacheKey)
            if (current === IDEMPOTENCY_PENDING_VALUE) {
                throw new ConflictException(
                    "Đơn hàng của bạn đang được xử lý, vui lòng không nhấn lại!",
                )
            }
            if (current) {
                const parsed = JSON.parse(current) as {
                    orderId: string
                    userId: string
                    productSku: string
                    quantity: number
                    status: string
                }
                return {
                    duplicate: true,
                    idempotencyKey,
                    order: parsed,
                    registry: "redis-idempotency-cache",
                    lockingStrategy: "redis-pending-then-result",
                }
            }
            throw new ConflictException(
                "Đơn hàng của bạn đang được xử lý, vui lòng không nhấn lại!",
            )
        }

        try {
            await this.delay(CHECKOUT_PROCESSING_DELAY_MS)

            const existing = await this.orders.findOne({
                where: { idempotencyKey },
            })
            if (existing) {
                const payload = this.toPayload(existing)
                await this.redis.setex(
                    cacheKey,
                    IDEMPOTENCY_TTL_SEC,
                    JSON.stringify(payload),
                )
                return {
                    duplicate: true,
                    idempotencyKey,
                    order: payload,
                    registry: "postgres-unique-idempotency-key",
                    lockingStrategy: "postgres-unique-constraint",
                }
            }

            const orderId = \`ord_\${Date.now()}\`
            const row = await this.orders.save({
                orderId,
                userId,
                productSku,
                quantity,
                idempotencyKey,
                status: "confirmed",
            })
            const payload = this.toPayload(row)
            await this.redis.setex(
                cacheKey,
                IDEMPOTENCY_TTL_SEC,
                JSON.stringify(payload),
            )

            return {
                duplicate: false,
                idempotencyKey,
                order: payload,
                registry: "redis+postgres",
                lockingStrategy: "redis-pending-lock-then-result",
                note: "Parallel duplicate key while PENDING → 409; after completion → same order.",
            }
        } catch (err) {
            if (err instanceof ConflictException) {
                throw err
            }
            await this.redis.del(cacheKey)
            throw err
        }
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, ms)
        })
    }

    private idempotencyKey(key: string): string {
        return \`idempotency:\${key}\`
    }

    private toPayload(row: OrderEntity) {
        return {
            orderId: row.orderId,
            userId: row.userId,
            productSku: row.productSku,
            quantity: row.quantity,
            status: row.status,
        }
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status !== "ready") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${S2}/src/checkout/checkout.controller.ts`,
    `import {
    Body,
    Controller,
    Headers,
    Post,
} from "@nestjs/common"
import {
    CreateOrderDto,
} from "./dto"
import {
    CheckoutService,
} from "./checkout.service"

/**
 * HTTP controller — idempotent checkout (lesson 2).
 * (EN: HTTP controller — idempotent checkout (lesson 2).)
 */
@Controller("api/checkout")
export class CheckoutController {
    constructor(
        private readonly service: CheckoutService,
    ) {}

    /**
     * Logic — đặt hàng với Idempotency-Key (chống double-submit).
     * Code — POST order + header → placeOrder.
     * (EN Logic: Place order with Idempotency-Key header.)
     * (EN Code: POST order → placeOrder.)
     */
    @Post("order")
    placeOrder(
        @Headers("idempotency-key") idempotencyKey: string | undefined,
        @Body() body: CreateOrderDto,
    ): ReturnType<CheckoutService["placeOrder"]> {
        const key = idempotencyKey?.trim() || "missing-idempotency-key"
        return this.service.placeOrder(
            key,
            body.userId,
            body.productSku,
            body.quantity,
        )
    }
}
`,
)

write(
    `${S2}/src/checkout/checkout.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    OrderEntity,
} from "../entities"
import {
    CheckoutController,
} from "./checkout.controller"
import {
    CheckoutSeedService,
} from "./checkout-seed.service"
import {
    CheckoutService,
} from "./checkout.service"

/**
 * Feature module — checkout Postgres + Redis idempotency.
 * (EN: Feature module — checkout Postgres + Redis idempotency.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([OrderEntity])],
    controllers: [CheckoutController],
    providers: [CheckoutService, CheckoutSeedService],
})
export class CheckoutModule {}
`,
)

write(
    `${S2}/src/checkout/index.ts`,
    `export * from "./checkout.controller"
export * from "./checkout.module"
export * from "./checkout.service"
`,
)

write(
    "README.md",
    `# System Design Mastery — Module 13: Flash Sale at Scale

## Tổng quan (VI)
**Trừ kho Redis Lua** → **phòng chờ ZSET** → **checkout idempotent**. Tuân \`coding-rules.md\`.

## Overview (EN)
**Redis pre-decrement**, **virtual waiting room**, **idempotent checkout**. Follows \`coding-rules.md\`.

## Lessons
- \`0-high-concurrency-inventory-management\` — \`inventory-service\`
- \`1-virtual-waiting-room-and-queuing\` — \`waiting-room\`
- \`2-idempotency-and-concurrency-control\` — \`checkout-service\`

## Regenerate
\`\`\`bash
node scratch/apply_module_13_flash_sale_rules.mjs
\`\`\`
`,
)

const stalePaths = [
    `${S0}/src/inventory/dto/create.dto.ts`,
    `${S0}/src/inventory/entities/inventory.entity.ts`,
    `${S1}/src/waitingroom/dto/create.dto.ts`,
    `${S1}/src/waitingroom/entities/waitingroom.entity.ts`,
    `${S2}/src/checkout/dto/create.dto.ts`,
    `${S2}/src/checkout/entities/checkout.entity.ts`,
]
for (const rel of stalePaths) {
    const full = path.join(MODULE, rel)
    if (fs.existsSync(full)) {
        fs.unlinkSync(full)
    }
}
for (const dir of [
    `${S0}/src/inventory/entities`,
    `${S1}/src/waitingroom/entities`,
    `${S2}/src/checkout/entities`,
]) {
    const full = path.join(MODULE, dir)
    if (fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true })
    }
}

console.log("Module 13 flash sale rules applied")
