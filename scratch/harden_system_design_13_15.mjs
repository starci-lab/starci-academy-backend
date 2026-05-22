import fs from "node:fs"
import path from "node:path"

const root = path.resolve(".")

const lessons = [
  {
    repo: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
    lesson: "0-geospatial-indexing-fundamentals",
    serviceDir: "geo-index-service",
    feature: "geoindex",
    classBase: "Geoindex",
    titleVi: "Nền tảng lập chỉ mục địa lý",
    titleEn: "Geospatial Indexing Fundamentals",
    route: "api/geo",
    serviceBody: `
    private readonly drivers = [
        { driverId: "drv_11", lat: 10.7628, lng: 106.6604, status: "available" },
        { driverId: "drv_27", lat: 10.7589, lng: 106.6617, status: "available" },
        { driverId: "drv_41", lat: 10.7712, lng: 106.6711, status: "busy" },
    ]

    /**
     * Tìm tài xế gần điểm đón bằng cell địa lý đơn giản.
     * (EN: Finds nearby drivers with a simple geospatial cell index.)
     */
    search(lat: number, lng: number, radius: number) {
        const drivers = this.drivers
            .map((driver) => ({
                ...driver,
                distanceMeters: this.distanceMeters(lat, lng, driver.lat, driver.lng),
                cell: this.cellFor(driver.lat, driver.lng),
            }))
            .filter((driver) => driver.distanceMeters <= radius)
            .sort((a, b) => a.distanceMeters - b.distanceMeters)

        return {
            query: {
                lat,
                lng,
                radius,
                cell: this.cellFor(lat, lng),
            },
            index: "grid-cell-demo",
            drivers,
        }
    }

    private cellFor(lat: number, lng: number): string {
        return \`\${lat.toFixed(2)}:\${lng.toFixed(2)}\`
    }

    private distanceMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
        const dx = (aLat - bLat) * 111_000
        const dy = (aLng - bLng) * 111_000
        return Math.round(Math.sqrt(dx * dx + dy * dy))
    }
`,
    controllerBody: `
    /**
     * Trả về danh sách tài xế gần điểm truy vấn.
     * (EN: Returns drivers near the query point.)
     */
    @Get("search")
    search(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
        @Query("radius") radius = "1000",
    ) {
        return this.service.search(Number(lat), Number(lng), Number(radius))
    }
`,
  },
  {
    repo: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
    lesson: "1-realtime-location-updates-at-scale",
    serviceDir: "location-tracker",
    feature: "location",
    classBase: "Location",
    titleVi: "Cập nhật vị trí thời gian thực ở quy mô lớn",
    titleEn: "Realtime Location Updates at Scale",
    route: "api/location",
    dtoName: "UpdateLocationDto",
    dtoFile: "update-location.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
} from "class-validator"

/**
 * Payload cập nhật vị trí tài xế.
 * (EN: Driver location update payload.)
 */
export class UpdateLocationDto {
    @IsString()
    @IsNotEmpty()
    driverId!: string

    @IsNumber()
    lat!: number

    @IsNumber()
    lng!: number
}
`,
    serviceBody: `
    private readonly locations = new Map<string, { lat: number; lng: number; updatedAt: string }>()

    /**
     * Ghi nhận vị trí mới và trả về shard/cell mô phỏng.
     * (EN: Records the new location and returns the simulated shard/cell.)
     */
    update(driverId: string, lat: number, lng: number) {
        const updatedAt = new Date().toISOString()
        this.locations.set(driverId, {
            lat,
            lng,
            updatedAt,
        })

        return {
            driverId,
            status: "indexed",
            geoCommand: "GEOADD drivers",
            shardKey: this.shardKey(lat, lng),
            location: {
                lat,
                lng,
                updatedAt,
            },
            activeDrivers: this.locations.size,
        }
    }

    private shardKey(lat: number, lng: number): string {
        return \`drivers:\${lat.toFixed(2)}:\${lng.toFixed(2)}\`
    }
`,
    controllerBody: `
    /**
     * Nhận heartbeat vị trí từ tài xế.
     * (EN: Accepts a driver location heartbeat.)
     */
    @Post("update")
    update(@Body() body: UpdateLocationDto) {
        return this.service.update(
            body.driverId,
            body.lat,
            body.lng,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
    lesson: "2-matching-and-dynamic-pricing",
    serviceDir: "matching-service",
    feature: "matching",
    classBase: "Matching",
    titleVi: "Ghép chuyến và định giá động",
    titleEn: "Matching and Dynamic Pricing",
    route: "api/match",
    dtoName: "MatchRequestDto",
    dtoFile: "match-request.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
} from "class-validator"

/**
 * Payload yêu cầu ghép tài xế.
 * (EN: Driver matching request payload.)
 */
export class MatchRequestDto {
    @IsString()
    @IsNotEmpty()
    clientId!: string

    @IsNumber()
    lat!: number

    @IsNumber()
    lng!: number
}
`,
    serviceBody: `
    private readonly availableDrivers = [
        { driverId: "drv_88", etaMinutes: 3, distanceMeters: 420 },
        { driverId: "drv_23", etaMinutes: 5, distanceMeters: 810 },
        { driverId: "drv_51", etaMinutes: 8, distanceMeters: 1400 },
    ]

    /**
     * Ghép khách với tài xế gần nhất và tính hệ số surge mô phỏng.
     * (EN: Matches a rider with the nearest driver and computes a simulated surge factor.)
     */
    request(clientId: string, lat: number, lng: number) {
        const supply = this.availableDrivers.length
        const demand = 7
        const surgeMultiplier = Number(Math.max(1, demand / Math.max(supply, 1)).toFixed(2))
        const driver = this.availableDrivers[0]

        return {
            clientId,
            pickup: {
                lat,
                lng,
            },
            matchedDriver: driver,
            strategy: "expanding-radius",
            pricing: {
                baseFare: 22000,
                surgeMultiplier,
                estimatedFare: Math.round(22000 * surgeMultiplier),
            },
        }
    }
`,
    controllerBody: `
    /**
     * Tạo yêu cầu ghép chuyến mới.
     * (EN: Creates a new matching request.)
     */
    @Post("request")
    request(@Body() body: MatchRequestDto) {
        return this.service.request(
            body.clientId,
            body.lat,
            body.lng,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-15-distributed-search-and-autocomplete",
    lesson: "0-trie-data-structure-for-autocomplete",
    serviceDir: "autocomplete-service",
    feature: "autocomplete",
    classBase: "Autocomplete",
    titleVi: "Cấu trúc Trie cho autocomplete",
    titleEn: "Trie Data Structure for Autocomplete",
    route: "api/autocomplete",
    dtoName: "TrackSearchDto",
    dtoFile: "track-search.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsString,
} from "class-validator"

/**
 * Payload ghi nhận truy vấn tìm kiếm.
 * (EN: Search tracking payload.)
 */
export class TrackSearchDto {
    @IsString()
    @IsNotEmpty()
    query!: string
}
`,
    serviceBody: `
    private readonly frequencies = new Map<string, number>([
        ["application", 15],
        ["apple", 10],
        ["app", 8],
        ["app store", 5],
        ["apply", 4],
    ])

    /**
     * Gợi ý từ khóa theo prefix và tần suất.
     * (EN: Suggests terms by prefix and frequency.)
     */
    suggest(prefix: string) {
        return {
            prefix,
            suggestions: [...this.frequencies.entries()]
                .filter(([word]) => word.startsWith(prefix.toLowerCase()))
                .map(([word, frequency]) => ({
                    word,
                    frequency,
                }))
                .sort((a, b) => b.frequency - a.frequency || a.word.localeCompare(b.word))
                .slice(0, 5),
        }
    }

    /**
     * Cập nhật tần suất truy vấn để phản ánh tín hiệu ranking.
     * (EN: Updates query frequency as a ranking signal.)
     */
    search(query: string) {
        const normalized = query.trim().toLowerCase()
        const nextFrequency = (this.frequencies.get(normalized) ?? 0) + 1
        this.frequencies.set(normalized, nextFrequency)

        return {
            query: normalized,
            indexed: true,
            frequency: nextFrequency,
        }
    }
`,
    controllerBody: `
    /**
     * Trả về gợi ý autocomplete theo prefix.
     * (EN: Returns autocomplete suggestions for a prefix.)
     */
    @Get("suggest")
    suggest(@Query("prefix") prefix = "app") {
        return this.service.suggest(prefix)
    }

    /**
     * Ghi nhận truy vấn để cập nhật tần suất.
     * (EN: Tracks a query to update frequency.)
     */
    @Post("search")
    search(@Body() body: TrackSearchDto) {
        return this.service.search(body.query)
    }
`,
  },
  {
    repo: "system-design-mastery-module-15-distributed-search-and-autocomplete",
    lesson: "1-change-data-capture-cdc-with-debezium",
    serviceDir: "search-consumer",
    feature: "cdc",
    classBase: "Cdc",
    titleVi: "Change Data Capture với Debezium",
    titleEn: "Change Data Capture with Debezium",
    route: "api/cdc",
    serviceBody: `
    private readonly events = [
        { offset: 101, table: "products", op: "c", key: "sku_100", indexed: true },
        { offset: 102, table: "products", op: "u", key: "sku_101", indexed: true },
    ]

    /**
     * Trả về snapshot consumer để kiểm tra luồng CDC sang search index.
     * (EN: Returns a consumer snapshot to verify the CDC-to-search-index flow.)
     */
    eventsSnapshot() {
        return {
            connector: "debezium-postgres-demo",
            consumerGroup: "search-indexer",
            lag: 0,
            events: this.events,
        }
    }
`,
    controllerBody: `
    /**
     * Trả về các sự kiện CDC đã được index.
     * (EN: Returns indexed CDC events.)
     */
    @Get("events")
    events() {
        return this.service.eventsSnapshot()
    }
`,
  },
  {
    repo: "system-design-mastery-module-15-distributed-search-and-autocomplete",
    lesson: "2-distributed-search-sharding-relevance",
    serviceDir: "search-api",
    feature: "search",
    classBase: "Search",
    titleVi: "Search phân tán, sharding và relevance",
    titleEn: "Distributed Search Sharding and Relevance",
    route: "api/search",
    serviceBody: `
    private readonly documents = [
        { id: "p1", shard: "products-0", title: "Laptop Pro 14", score: 12.4 },
        { id: "p2", shard: "products-1", title: "Laptop Air 13", score: 10.8 },
        { id: "p3", shard: "products-2", title: "Laptop Dock", score: 7.2 },
    ]

    /**
     * Truy vấn nhiều shard rồi sắp xếp kết quả theo relevance score.
     * (EN: Queries multiple shards and sorts hits by relevance score.)
     */
    query(q: string) {
        return {
            query: q,
            tookMs: 7,
            shards: {
                total: 3,
                successful: 3,
            },
            hits: this.documents
                .filter((doc) => doc.title.toLowerCase().includes(q.toLowerCase()))
                .sort((a, b) => b.score - a.score),
        }
    }
`,
    controllerBody: `
    /**
     * Thực thi truy vấn search phân tán.
     * (EN: Executes a distributed search query.)
     */
    @Get()
    query(@Query("q") q = "laptop") {
        return this.service.query(q)
    }
`,
  },
  {
    repo: "system-design-mastery-module-16-highly-available-distributed-key-value-store",
    lesson: "0-consistent-hashing-partitioning",
    serviceDir: "consistent-hash",
    feature: "ring",
    classBase: "Ring",
    titleVi: "Consistent hashing và phân vùng",
    titleEn: "Consistent Hashing and Partitioning",
    route: "api/ring",
    serviceBody: `
    private readonly nodes = ["node-a", "node-b", "node-c", "node-d"]

    /**
     * Ánh xạ key vào node trên hash ring mô phỏng.
     * (EN: Maps a key to a node on the simulated hash ring.)
     */
    map(key: string) {
        const hash = this.hash(key)
        const node = this.nodes[hash % this.nodes.length]

        return {
            key,
            hash,
            assignedNode: node,
            virtualReplicas: 128,
            ringSize: this.nodes.length,
        }
    }

    private hash(value: string): number {
        return [...value].reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) >>> 0, 7)
    }
`,
    controllerBody: `
    /**
     * Trả về node chịu trách nhiệm cho key.
     * (EN: Returns the node responsible for a key.)
     */
    @Get("map")
    map(@Query("key") key = "user_session_45") {
        return this.service.map(key)
    }
`,
  },
  {
    repo: "system-design-mastery-module-16-highly-available-distributed-key-value-store",
    lesson: "1-gossip-protocol-and-failure-detection",
    serviceDir: "cluster-node",
    feature: "gossip",
    classBase: "Gossip",
    titleVi: "Gossip protocol và phát hiện lỗi",
    titleEn: "Gossip Protocol and Failure Detection",
    route: "api/gossip",
    serviceBody: `
    /**
     * Trả về trạng thái node từ failure detector mô phỏng.
     * (EN: Returns node state from the simulated failure detector.)
     */
    nodes() {
        return {
            protocol: "gossip",
            fanout: 3,
            nodes: [
                { nodeId: "node-a", status: "alive", heartbeat: 42 },
                { nodeId: "node-b", status: "alive", heartbeat: 41 },
                { nodeId: "node-c", status: "suspect", heartbeat: 35 },
            ],
            failureDetector: "phi-accrual-demo",
        }
    }
`,
    controllerBody: `
    /**
     * Trả về membership view hiện tại.
     * (EN: Returns the current membership view.)
     */
    @Get("nodes")
    nodes() {
        return this.service.nodes()
    }
`,
  },
  {
    repo: "system-design-mastery-module-16-highly-available-distributed-key-value-store",
    lesson: "2-quorum-consensus-and-conflict-resolution",
    serviceDir: "quorum-store",
    feature: "quorum",
    classBase: "Quorum",
    titleVi: "Quorum consensus và xử lý xung đột",
    titleEn: "Quorum Consensus and Conflict Resolution",
    route: "api/quorum",
    dtoName: "QuorumWriteDto",
    dtoFile: "quorum-write.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload ghi dữ liệu theo quorum.
 * (EN: Quorum write payload.)
 */
export class QuorumWriteDto {
    @IsString()
    @IsNotEmpty()
    key!: string

    @IsString()
    @IsNotEmpty()
    value!: string

    @IsNumber()
    @Min(1)
    w!: number

    @IsNumber()
    @Min(1)
    r!: number
}
`,
    serviceBody: `
    /**
     * Ghi dữ liệu vào replica và kiểm tra điều kiện quorum.
     * (EN: Writes data to replicas and checks quorum satisfaction.)
     */
    write(key: string, value: string, w: number, r: number) {
        const replicas = [
            { nodeId: "node-a", version: 8, accepted: true },
            { nodeId: "node-b", version: 8, accepted: true },
            { nodeId: "node-c", version: 7, accepted: false },
        ]
        const acknowledgements = replicas.filter((replica) => replica.accepted).length

        return {
            key,
            value,
            quorum: {
                n: replicas.length,
                w,
                r,
                satisfied: acknowledgements >= w,
            },
            acknowledgements,
            replicas,
            conflictResolution: "last-write-wins-demo",
        }
    }
`,
    controllerBody: `
    /**
     * Thực hiện ghi dữ liệu với tham số W/R.
     * (EN: Performs a write with W/R parameters.)
     */
    @Post("write")
    write(@Body() body: QuorumWriteDto) {
        return this.service.write(
            body.key,
            body.value,
            body.w,
            body.r,
        )
    }
`,
  },
]

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${content.trimStart().trimEnd()}\n`, "utf8")
}

function removeIfExists(target) {
  fs.rmSync(target, { force: true, recursive: true })
}

function className(base, suffix) {
  return `${base}${suffix}`
}

function slugForImage(lesson) {
  return lesson
}

function controllerImports(item) {
  const imports = ["Controller"]
  if (item.controllerBody.includes("@Body")) imports.push("Body")
  if (item.controllerBody.includes("@Get")) imports.push("Get")
  if (item.controllerBody.includes("@Post")) imports.push("Post")
  if (item.controllerBody.includes("@Query")) imports.push("Query")
  return imports.sort((a, b) => a.localeCompare(b)).join(",\n    ")
}

function packageJson(name) {
  return {
    scripts: {
      build: "nest build && tsc-alias -p tsconfig.build.json",
      start: "node dist/main.js",
      "start:dev": "nest start --watch",
    },
    dependencies: {
      "@nestjs/common": "^10.0.0",
      "@nestjs/config": "^3.2.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.1",
      "reflect-metadata": "^0.1.13",
      rxjs: "^7.8.1",
    },
    devDependencies: {
      "@nestjs/cli": "^10.0.0",
      "@nestjs/schematics": "^10.0.0",
      "tsc-alias": "^1.8.10",
      typescript: "^5.1.3",
    },
    name,
    version: "0.0.1",
    private: true,
  }
}

for (const item of lessons) {
  const lessonRoot = path.join(root, item.repo, item.lesson)
  const serviceRoot = path.join(lessonRoot, item.serviceDir)
  const srcRoot = path.join(serviceRoot, "src")
  const featureRoot = path.join(srcRoot, item.feature)
  const dtoRoot = path.join(featureRoot, "dto")

  removeIfExists(path.join(featureRoot, "entities"))
  removeIfExists(dtoRoot)
  removeIfExists(path.join(srcRoot, "config", "database.config.ts"))
  removeIfExists(path.join(lessonRoot, ".env"))

  write(path.join(serviceRoot, "package.json"), JSON.stringify(packageJson(item.serviceDir), null, 2))

  write(path.join(lessonRoot, ".gitignore"), `
node_modules/
dist/
`)

  write(path.join(serviceRoot, ".env"), `
PORT=3000
`)

  write(path.join(srcRoot, "config", "app.config.ts"), `
import {
    registerAs,
} from "@nestjs/config"

export interface AppConfig {
    port: number
}

/**
 * Cấu hình runtime tối thiểu cho service demo.
 * (EN: Minimal runtime configuration for the demo service.)
 */
export const appConfig = registerAs("app", (): AppConfig => ({
    port: Number(process.env.PORT ?? 3000),
}))
`)

  write(path.join(srcRoot, "config", "index.ts"), `
export * from "./app.config"
`)

  write(path.join(srcRoot, "main.ts"), `
/**
 * Entry Node (\`nest build\` -> dist/main.js) - chỉ gọi bootstrap đã export.
 * (EN: Node entry (\`nest build\` -> dist/main.js) - invokes exported bootstrap only.)
 */
import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
`)

  write(path.join(srcRoot, "bootstrap.ts"), `
import {
    ValidationPipe,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    NestFactory,
} from "@nestjs/core"
import {
    AppModule,
} from "./app.module"
import type {
    AppConfig,
} from "./config"

/**
 * Khởi tạo Nest app với ValidationPipe toàn cục và cổng từ ConfigModule.
 * (EN: Bootstraps the Nest app with a global ValidationPipe and ConfigModule port.)
 */
export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidUnknownValues: false,
    }))

    const config = app.get(ConfigService)
    const port = config.get<AppConfig>("app")?.port ?? 3000
    // Cổng lắng nghe: lấy từ ConfigModule để chạy giống nhau trong Docker và local.
    // (EN: Listen port comes from ConfigModule for consistent Docker and local runs.)
    await app.listen(port, "0.0.0.0")
}
`)

  write(path.join(srcRoot, "app.module.ts"), `
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    appConfig,
} from "./config"
import {
    ${className(item.classBase, "Module")},
} from "./${item.feature}"

/**
 * Module gốc nạp ConfigModule và feature module của bài học.
 * (EN: Root module loading ConfigModule and the lesson feature module.)
 */
@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: ".env",
            isGlobal: true,
            load: [
                appConfig,
            ],
        }),
        ${className(item.classBase, "Module")},
    ],
})
export class AppModule {}
`)

  write(path.join(featureRoot, "index.ts"), `
export * from "./${item.feature}.controller"
export * from "./${item.feature}.module"
export * from "./${item.feature}.service"
${item.dtoName ? `export * from "./dto"` : ""}
`)

  write(path.join(featureRoot, `${item.feature}.module.ts`), `
import {
    Module,
} from "@nestjs/common"
import {
    ${className(item.classBase, "Controller")},
} from "./${item.feature}.controller"
import {
    ${className(item.classBase, "Service")},
} from "./${item.feature}.service"

/**
 * Feature module cho bài học ${item.titleVi}.
 * (EN: Feature module for ${item.titleEn}.)
 */
@Module({
    controllers: [
        ${className(item.classBase, "Controller")},
    ],
    providers: [
        ${className(item.classBase, "Service")},
    ],
    exports: [
        ${className(item.classBase, "Service")},
    ],
})
export class ${className(item.classBase, "Module")} {}
`)

  write(path.join(featureRoot, `${item.feature}.service.ts`), `
import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service cho bài học ${item.titleVi}.
 * (EN: Domain service for ${item.titleEn}.)
 */
@Injectable()
export class ${className(item.classBase, "Service")} {
${item.serviceBody}
}
`)

  const dtoImport = item.dtoName
    ? `import {\n    ${item.dtoName},\n} from "./dto"\n`
    : ""

  write(path.join(featureRoot, `${item.feature}.controller.ts`), `
import {
    ${controllerImports(item)},
} from "@nestjs/common"
import {
    ${className(item.classBase, "Service")},
} from "./${item.feature}.service"
${dtoImport}
/**
 * REST controller phơi bày các endpoint kiểm thử luồng của bài học.
 * (EN: REST controller exposing lesson verification endpoints.)
 */
@Controller("${item.route}")
export class ${className(item.classBase, "Controller")} {
    constructor(
        private readonly service: ${className(item.classBase, "Service")},
    ) {}
${item.controllerBody}
}
`)

  if (item.dtoName) {
    write(path.join(dtoRoot, item.dtoFile), item.dtoBody)
    write(path.join(dtoRoot, "index.ts"), `
export * from "./${item.dtoFile.replace(".ts", "")}"
`)
  }

  write(path.join(lessonRoot, ".docker", "compose.yaml"), `
# Docker Compose stack cho bài học ${item.lesson}.
# (EN: Docker Compose stack for lesson ${item.lesson}.)
#
# Thư mục làm việc: ${item.lesson}/.docker
# (EN: Working directory: ${item.lesson}/.docker)
#
# Khởi động: docker compose up -d --build
# (EN: Start: docker compose up -d --build)
#
# Xem log: docker compose logs -f api
# (EN: Logs: docker compose logs -f api)
#
# Dọn tài nguyên: docker compose down -v
# (EN: Cleanup: docker compose down -v)

# Tiền tố project Compose, dùng làm tên stack/container.
# (EN: Compose project prefix used as stack/container name.)
name: ${item.lesson}

services:
  # API NestJS của bài học.
  # (EN: Lesson NestJS API.)
  api:
    image: starciacademy/${slugForImage(item.lesson)}-${item.serviceDir}:latest
    container_name: ${item.lesson}-api
    build:
      context: ../${item.serviceDir}
      dockerfile: Dockerfile
    ports:
      # Ánh xạ cổng host 3000 sang container 3000 cho HTTP API.
      # (EN: Map host port 3000 to container port 3000 for the HTTP API.)
      - "3000:3000"
    env_file:
      - ../${item.serviceDir}/.env
    networks:
      - ${item.lesson}-network

  # Redis mô phỏng hạ tầng cache/pub-sub thường gặp trong bài học.
  # (EN: Redis simulates common cache/pub-sub infrastructure for the lesson.)
  redis:
    image: redis:7-alpine
    container_name: ${item.lesson}-redis
    networks:
      - ${item.lesson}-network

networks:
  ${item.lesson}-network:
    name: ${item.lesson}-network
`)
}

console.log(`Hardened ${lessons.length} lesson services from .mount coding rules.`)
