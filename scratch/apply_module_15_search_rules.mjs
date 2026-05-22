/**
 * Module 15 repo — Distributed Search & Autocomplete (brief .briefs/system-design/15.md).
 * Lesson 0: Trie + Redis snapshot. Lesson 1: CDC mock. Lesson 2: sharded search mock.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-15-distributed-search-and-autocomplete",
)

function write(rel, content) {
    const full = path.join(MODULE, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
}

const appConfig = `import { registerAs } from "@nestjs/config"

/**
 * Cấu hình app (cổng HTTP).
 * (EN: App config (HTTP port).)
 */
export interface AppConfig {
    port: number
}

export const appConfig = registerAs("app", (): AppConfig => ({
    port: Number(process.env.PORT) || 3000,
}))
`

const redisConfig = `import { registerAs } from "@nestjs/config"

/**
 * Cấu hình Redis.
 * (EN: Redis connection config.)
 */
export interface RedisConfig {
    host: string
    port: number
}

export const redisConfig = registerAs("redis", (): RedisConfig => ({
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
}))
`

const configIndexApp = `export * from "./app.config"\n`
const configIndexAppRedis = `export * from "./app.config"
export * from "./redis.config"
`

const bootstrap = `import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppModule } from "./app.module"

/**
 * Bootstrap Nest HTTP.
 * (EN: Nest HTTP bootstrap.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        forbidUnknownValues: false,
    }))
    const port = app.get(ConfigService).get<number>("app.port") ?? 3000
    await app.listen(port, "0.0.0.0")
}
`

const mainTs = `import { bootstrap } from "./bootstrap"
void bootstrap()
`

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

function nestPackage(name, extraDeps = {}) {
    return {
        name,
        version: "1.0.0",
        scripts: {
            build: "nest build && tsc-alias -p tsconfig.build.json",
            start: "nest start",
            "start:dev": "nest start --watch",
            "start:prod": "node dist/main.js",
        },
        dependencies: {
            "@nestjs/common": "^10.0.0",
            "@nestjs/config": "^3.0.0",
            "@nestjs/core": "^10.0.0",
            "@nestjs/platform-express": "^10.0.0",
            "class-transformer": "^0.5.1",
            "class-validator": "^0.14.0",
            "reflect-metadata": "^0.1.13",
            rxjs: "^7.8.1",
            ...extraDeps,
        },
        devDependencies: {
            "@nestjs/cli": "^10.0.0",
            "@nestjs/schematics": "^10.0.0",
            "tsc-alias": "^1.8.8",
            typescript: "^5.1.3",
        },
    }
}

function tsconfig(alias) {
    return {
        compilerOptions: {
            module: "commonjs",
            declaration: true,
            emitDecoratorMetadata: true,
            experimentalDecorators: true,
            target: "ES2021",
            outDir: "./dist",
            baseUrl: "./",
            strict: true,
            paths: { [alias]: ["src/index.ts"], [`${alias}/*`]: ["src/*"] },
        },
    }
}

function scaffoldCompose(lessonSlug, serviceName, { withRedis = false, withPostgres = false, dbName = "" } = {}) {
    return `name: ${lessonSlug}
# Vi: Docker Compose — ${lessonSlug}.
# (EN: Docker Compose stack for ${lessonSlug}.)

services:
  api:
    container_name: ${lessonSlug}-api
    build:
      context: ../${serviceName}
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
${withRedis ? `      - REDIS_HOST=redis
      - REDIS_PORT=6379
` : ""}${withPostgres ? `      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${dbName}
` : ""}    networks:
      - ${lessonSlug}-network
    depends_on:
${withPostgres ? "      - db\n" : ""}${withRedis ? "      - redis\n" : ""}
${withPostgres ? `  db:
    image: postgres:16-alpine
    container_name: ${lessonSlug}-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ${dbName}
    ports:
      - "5432:5432"
    networks:
      - ${lessonSlug}-network

` : ""}${withRedis ? `  redis:
    image: redis:7-alpine
    container_name: ${lessonSlug}-redis
    ports:
      - "6379:6379"
    networks:
      - ${lessonSlug}-network

` : ""}networks:
  ${lessonSlug}-network:
    name: ${lessonSlug}-network
`
}

function scaffoldBase(lessonSlug, serviceName, { withRedis = false } = {}) {
    const prefix = `${lessonSlug}/${serviceName}`
    const alias = `@${lessonSlug.replace(/-/g, "_")}`

    write(`${lessonSlug}/.gitignore`, "node_modules/\ndist/\n")
    write(`${prefix}/Dockerfile`, dockerfile)
    write(
        `${prefix}/package.json`,
        `${JSON.stringify(nestPackage(serviceName, withRedis ? { ioredis: "^5.3.2" } : {}), null, 2)}\n`,
    )
    write(
        `${prefix}/nest-cli.json`,
        `${JSON.stringify({ $schema: "https://json.schemastore.org/nest-cli", collection: "@nestjs/schematics", sourceRoot: "src", compilerOptions: { deleteOutDir: true } }, null, 2)}\n`,
    )
    write(
        `${prefix}/tsconfig.json`,
        `${JSON.stringify(tsconfig(alias), null, 2)}\n`,
    )
    write(
        `${prefix}/tsconfig.build.json`,
        `${JSON.stringify({ extends: "./tsconfig", exclude: ["node_modules", "dist", "**/*spec.ts"] }, null, 2)}\n`,
    )
    write(`${prefix}/.env`, "PORT=3000\n")
    write(`${prefix}/src/main.ts`, mainTs)
    write(`${prefix}/src/bootstrap.ts`, bootstrap)
    write(`${prefix}/src/config/app.config.ts`, appConfig)
    if (withRedis) {
        write(`${prefix}/src/config/redis.config.ts`, redisConfig)
        write(`${prefix}/src/config/index.ts`, configIndexAppRedis)
    } else {
        write(`${prefix}/src/config/index.ts`, configIndexApp)
    }
}

function appModuleSimple(featureModule, featureFolder, withRedis = false) {
    const loads = withRedis ? "[appConfig, redisConfig]" : "[appConfig]"
    const imports = withRedis
        ? `import { appConfig, redisConfig } from "./config"`
        : `import { appConfig } from "./config"`
    return `import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
${imports}
import { ${featureModule} } from "./${featureFolder}"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: ${loads} }),
        ${featureModule},
    ],
})
export class AppModule {}
`
}

// --- Lesson 0: Trie ---
const L0 = "0-trie-data-structure-for-autocomplete"
const S0 = `${L0}/autocomplete-service`

scaffoldBase(L0, "autocomplete-service", { withRedis: true })
write(`${L0}/.docker/compose.yaml`, scaffoldCompose(L0, "autocomplete-service", { withRedis: true }))
write(`${S0}/src/app.module.ts`, appModuleSimple("AutocompleteModule", "autocomplete", true))

write(
    `${S0}/src/autocomplete/trie.ts`,
    `/**
 * Trie — prefix autocomplete + frequency ranking.
 * (EN: Trie for prefix autocomplete with frequency ranking.)
 */
export class TrieNode {
    children: Map<string, TrieNode> = new Map()
    isWord = false
    frequency = 0
    word?: string
}

export class Trie {
    root: TrieNode = new TrieNode()

    insert(word: string, frequency = 1): void {
        if (!word) return
        let current = this.root
        for (const char of word.toLowerCase()) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode())
            }
            current = current.children.get(char)!
        }
        current.isWord = true
        current.frequency += frequency
        current.word = word
    }

    suggest(prefix: string, limit = 5): Array<{ word: string; frequency: number }> {
        if (!prefix) return []
        let current = this.root
        for (const char of prefix.toLowerCase()) {
            if (!current.children.has(char)) return []
            current = current.children.get(char)!
        }
        const results: Array<{ word: string; frequency: number }> = []
        this.dfs(current, results)
        return results
            .sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word))
            .slice(0, limit)
    }

    private dfs(node: TrieNode, results: Array<{ word: string; frequency: number }>): void {
        if (node.isWord && node.word) {
            results.push({ word: node.word, frequency: node.frequency })
        }
        for (const child of node.children.values()) {
            this.dfs(child, results)
        }
    }

    serialize(): string {
        const serializeNode = (node: TrieNode): Record<string, unknown> => {
            const childrenObj: Record<string, unknown> = {}
            for (const [char, childNode] of node.children.entries()) {
                childrenObj[char] = serializeNode(childNode)
            }
            return { c: childrenObj, w: node.word, f: node.frequency, i: node.isWord }
        }
        return JSON.stringify(serializeNode(this.root))
    }

    deserialize(jsonStr: string): void {
        if (!jsonStr) return
        try {
            const parsed = JSON.parse(jsonStr) as {
                c?: Record<string, unknown>
                w?: string
                f?: number
                i?: boolean
            }
            const deserializeNode = (node: TrieNode, state: typeof parsed): void => {
                node.word = state.w
                node.frequency = state.f ?? 0
                node.isWord = !!state.i
                node.children = new Map()
                if (state.c) {
                    for (const char of Object.keys(state.c)) {
                        const childNode = new TrieNode()
                        deserializeNode(childNode, state.c[char] as typeof parsed)
                        node.children.set(char, childNode)
                    }
                }
            }
            this.root = new TrieNode()
            deserializeNode(this.root, parsed)
        } catch {
            this.root = new TrieNode()
        }
    }
}
`,
)

write(
    `${S0}/src/autocomplete/dto/track-search.dto.ts`,
    `import { IsNotEmpty, IsString } from "class-validator"

/**
 * DTO ghi nhận truy vấn tìm kiếm.
 * (EN: Search tracking payload.)
 */
export class TrackSearchDto {
    @IsString()
    @IsNotEmpty()
    query!: string
}
`,
)
write(`${S0}/src/autocomplete/dto/index.ts`, `export * from "./track-search.dto"\n`)

write(
    `${S0}/src/autocomplete/autocomplete.service.ts`,
    `import { Injectable, Logger, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"
import type { RedisConfig } from "../config"
import { Trie } from "./trie"

const STATE_KEY = "autocomplete:trie:state"

/**
 * Service Trie + Redis snapshot (lesson 0).
 * (EN: Trie autocomplete service with Redis state snapshot.)
 */
@Injectable()
export class AutocompleteService implements OnModuleInit {
    private readonly logger = new Logger(AutocompleteService.name)
    private readonly trie = new Trie()
    private redis: Redis | null = null

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        const redisCfg = this.config.get<RedisConfig>("redis")
        if (!redisCfg) {
            this.seedDefaults()
            return
        }
        try {
            this.redis = new Redis({
                host: redisCfg.host,
                port: redisCfg.port,
                maxRetriesPerRequest: 1,
                lazyConnect: true,
            })
            await this.redis.connect()
            await this.loadState()
        } catch (err) {
            this.logger.warn("Redis unavailable — in-memory Trie only", err)
            this.seedDefaults()
        }
    }

    private seedDefaults(): void {
        this.trie.insert("apple", 10)
        this.trie.insert("application", 15)
        this.trie.insert("app store", 5)
        this.trie.insert("app", 8)
        this.trie.insert("banana", 4)
        this.trie.insert("bandwidth", 2)
    }

    private async loadState(): Promise<void> {
        if (!this.redis) {
            this.seedDefaults()
            return
        }
        const saved = await this.redis.get(STATE_KEY)
        if (saved) {
            this.trie.deserialize(saved)
            this.logger.log("Trie restored from Redis")
        } else {
            this.seedDefaults()
            await this.persistState()
        }
    }

    private async persistState(): Promise<void> {
        if (!this.redis) return
        await this.redis.set(STATE_KEY, this.trie.serialize())
    }

    /**
     * Logic — ghi query vào Trie và persist Redis.
     * Code — insert + SET autocomplete:trie:state.
     * (EN Logic: Record query and persist Trie to Redis.)
     */
    async recordSearch(query: string): Promise<void> {
        const trimmed = query.trim()
        if (!trimmed) return
        this.trie.insert(trimmed, 1)
        await this.persistState()
    }

    /**
     * Logic — gợi ý theo prefix, sort frequency.
     * Code — trie.suggest(prefix, limit).
     * (EN Logic: Prefix suggestions sorted by frequency.)
     */
    getSuggestions(prefix: string, limit: number): Array<{ word: string; frequency: number }> {
        return this.trie.suggest(prefix.trim(), limit)
    }
}
`,
)

write(
    `${S0}/src/autocomplete/autocomplete.controller.ts`,
    `import { Body, Controller, DefaultValuePipe, Get, ParseIntPipe, Post, Query } from "@nestjs/common"
import { AutocompleteService } from "./autocomplete.service"
import { TrackSearchDto } from "./dto"

/**
 * HTTP autocomplete — suggest + record search.
 * (EN: Autocomplete HTTP API.)
 */
@Controller("api/autocomplete")
export class AutocompleteController {
    constructor(private readonly service: AutocompleteService) {}

    /**
     * Logic — gợi ý prefix.
     * Code — GET suggest?prefix=&limit=.
     * (EN Logic: Prefix suggestions.)
     */
    @Get("suggest")
    suggest(
        @Query("prefix") prefix = "",
        @Query("limit", new DefaultValuePipe(5), ParseIntPipe) limit = 5,
    ) {
        const suggestions = this.service.getSuggestions(prefix, limit)
        return { prefix, suggestions }
    }

    /**
     * Logic — ghi nhận lượt search (ranking signal).
     * Code — POST search body query.
     * (EN Logic: Track search for ranking.)
     */
    @Post("search")
    async search(@Body() body: TrackSearchDto) {
        await this.service.recordSearch(body.query)
        return { success: true, message: \`Recorded search for "\${body.query}"\` }
    }
}
`,
)

write(
    `${S0}/src/autocomplete/autocomplete.module.ts`,
    `import { Module } from "@nestjs/common"
import { AutocompleteController } from "./autocomplete.controller"
import { AutocompleteService } from "./autocomplete.service"

@Module({
    controllers: [AutocompleteController],
    providers: [AutocompleteService],
})
export class AutocompleteModule {}
`,
)
write(
    `${S0}/src/autocomplete/index.ts`,
    `export * from "./autocomplete.controller"
export * from "./autocomplete.module"
export * from "./autocomplete.service"
`,
)

// --- Lesson 1: CDC ---
const L1 = "1-change-data-capture-cdc-with-debezium"
const S1 = `${L1}/search-consumer`

scaffoldBase(L1, "search-consumer")
write(`${L1}/.docker/compose.yaml`, scaffoldCompose(L1, "search-consumer", {
    withPostgres: true,
    dbName: "search_cdc_demo",
}))
write(`${S1}/src/app.module.ts`, appModuleSimple("CdcModule", "cdc"))

write(
    `${S1}/src/cdc/cdc.service.ts`,
    `import { Injectable } from "@nestjs/common"

/**
 * CDC consumer demo — snapshot events indexed to search.
 * (EN: CDC consumer demo showing indexed change events.)
 */
@Injectable()
export class CdcService {
    private readonly events = [
        { offset: 101, table: "products", op: "c", key: "sku_100", indexed: true },
        { offset: 102, table: "products", op: "u", key: "sku_101", indexed: true },
        { offset: 103, table: "products", op: "d", key: "sku_099", indexed: true },
    ]

    /**
     * Logic — mô phỏng consumer đã đọc Debezium/Kafka.
     * Code — trả connector, lag, events[].
     * (EN Logic: Simulated Debezium/Kafka consumer snapshot.)
     */
    eventsSnapshot() {
        return {
            connector: "debezium-postgres-demo",
            consumerGroup: "search-indexer",
            lag: 0,
            pipeline: "postgres-wal -> debezium -> kafka -> search-consumer -> search-index",
            note: "Lab API shows event shape; production runs Debezium + Kafka beside Postgres.",
            events: this.events,
        }
    }
}
`,
)

write(
    `${S1}/src/cdc/cdc.controller.ts`,
    `import { Controller, Get } from "@nestjs/common"
import { CdcService } from "./cdc.service"

@Controller("api/cdc")
export class CdcController {
    constructor(private readonly service: CdcService) {}

    /**
     * Logic — xem events CDC đã index.
     * Code — GET events.
     * (EN Logic: List indexed CDC events.)
     */
    @Get("events")
    events() {
        return this.service.eventsSnapshot()
    }
}
`,
)

write(
    `${S1}/src/cdc/cdc.module.ts`,
    `import { Module } from "@nestjs/common"
import { CdcController } from "./cdc.controller"
import { CdcService } from "./cdc.service"

@Module({ controllers: [CdcController], providers: [CdcService] })
export class CdcModule {}
`,
)
write(`${S1}/src/cdc/index.ts`, `export * from "./cdc.controller"
export * from "./cdc.module"
export * from "./cdc.service"
`)

// --- Lesson 2: Search ---
const L2 = "2-distributed-search-sharding-relevance"
const S2 = `${L2}/search-api`

scaffoldBase(L2, "search-api")
write(`${L2}/.docker/compose.yaml`, `${scaffoldCompose(L2, "search-api")}
# Vi: Elasticsearch trong production; lab dùng mock shard hits trong API.
# (EN: Production uses Elasticsearch; lab mocks shard hits in the API.)
`)

write(`${S2}/src/app.module.ts`, appModuleSimple("SearchModule", "search"))

write(
    `${S2}/src/search/search.service.ts`,
    `import { Injectable } from "@nestjs/common"

/**
 * Distributed search demo — multi-shard merge + relevance score.
 * (EN: Distributed search demo with shard merge and relevance.)
 */
@Injectable()
export class SearchService {
    private readonly documents = [
        { id: "p1", shard: "products-0", title: "Laptop Pro 14", score: 12.4 },
        { id: "p2", shard: "products-1", title: "Laptop Air 13", score: 10.8 },
        { id: "p3", shard: "products-2", title: "Laptop Dock", score: 7.2 },
        { id: "p4", shard: "products-0", title: "USB-C Hub", score: 5.1 },
    ]

    /**
     * Logic — broadcast query tới shard mock, merge sort score.
     * Code — filter includes(q) + sort score desc.
     * (EN Logic: Mock scatter-gather across shards, merge by score.)
     */
    query(q: string) {
        const normalized = q.trim().toLowerCase()
        const hits = this.documents
            .filter((doc) => doc.title.toLowerCase().includes(normalized))
            .sort((a, b) => b.score - a.score)

        return {
            query: q,
            tookMs: 7,
            shards: { total: 3, successful: 3, failed: 0 },
            relevance: "bm25-demo",
            hits,
        }
    }
}
`,
)

write(
    `${S2}/src/search/search.controller.ts`,
    `import { Controller, Get, Query } from "@nestjs/common"
import { SearchService } from "./search.service"

@Controller("api/search")
export class SearchController {
    constructor(private readonly service: SearchService) {}

    /**
     * Logic — full-text search phân tán (mock).
     * Code — GET ?q=.
     * (EN Logic: Distributed full-text search (mock).)
     */
    @Get()
    query(@Query("q") q = "laptop") {
        return this.service.query(q)
    }
}
`,
)

write(
    `${S2}/src/search/search.module.ts`,
    `import { Module } from "@nestjs/common"
import { SearchController } from "./search.controller"
import { SearchService } from "./search.service"

@Module({ controllers: [SearchController], providers: [SearchService] })
export class SearchModule {}
`,
)
write(`${S2}/src/search/index.ts`, `export * from "./search.controller"
export * from "./search.module"
export * from "./search.service"
`)

write(
    "README.md",
    `# System Design Mastery — Module 15 (course 14): Distributed Search & Autocomplete

## Tổng quan (VI)
**Trie autocomplete** → **CDC catalog sync** → **sharded search + relevance**.

## Lessons
- \`0-trie-data-structure-for-autocomplete\` — \`autocomplete-service\`
- \`1-change-data-capture-cdc-with-debezium\` — \`search-consumer\`
- \`2-distributed-search-sharding-relevance\` — \`search-api\`

## Regenerate
\`\`\`bash
node scratch/apply_module_15_search_rules.mjs
\`\`\`
`,
)

console.log("Module 15 search autocomplete applied:", MODULE)
