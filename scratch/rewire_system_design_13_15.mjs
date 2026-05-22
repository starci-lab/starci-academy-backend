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
        title: "Geospatial Indexing Fundamentals",
        route: "api/geo",
        serviceBody: `
    private readonly drivers = [
        { driverId: "drv_11", lat: 10.7628, lng: 106.6604, status: "available" },
        { driverId: "drv_27", lat: 10.7589, lng: 106.6617, status: "available" },
        { driverId: "drv_41", lat: 10.7712, lng: 106.6711, status: "busy" },
    ]

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
        controllerMethods: `
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
        title: "Realtime Location Updates at Scale",
        route: "api/location",
        serviceBody: `
    private readonly locations = new Map<string, { lat: number; lng: number; updatedAt: string }>()

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
        controllerMethods: `
    @Post("update")
    update(@Body() body: { driverId?: string; lat?: number; lng?: number }) {
        return this.service.update(
            body.driverId ?? "drv_88",
            Number(body.lat ?? 10.762),
            Number(body.lng ?? 106.66),
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
        title: "Matching and Dynamic Pricing",
        route: "api/match",
        serviceBody: `
    private readonly availableDrivers = [
        { driverId: "drv_88", etaMinutes: 3, distanceMeters: 420 },
        { driverId: "drv_23", etaMinutes: 5, distanceMeters: 810 },
        { driverId: "drv_51", etaMinutes: 8, distanceMeters: 1400 },
    ]

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
        controllerMethods: `
    @Post("request")
    request(@Body() body: { clientId?: string; lat?: number; lng?: number }) {
        return this.service.request(
            body.clientId ?? "usr_7",
            Number(body.lat ?? 10.762),
            Number(body.lng ?? 106.66),
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
        title: "Trie Data Structure for Autocomplete",
        route: "api/autocomplete",
        serviceBody: `
    private readonly frequencies = new Map<string, number>([
        ["application", 15],
        ["apple", 10],
        ["app", 8],
        ["app store", 5],
        ["apply", 4],
    ])

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
        controllerMethods: `
    @Get("suggest")
    suggest(@Query("prefix") prefix = "app") {
        return this.service.suggest(prefix)
    }

    @Post("search")
    search(@Body() body: { query?: string }) {
        return this.service.search(body.query ?? "apple")
    }
`,
    },
    {
        repo: "system-design-mastery-module-15-distributed-search-and-autocomplete",
        lesson: "1-change-data-capture-cdc-with-debezium",
        serviceDir: "search-consumer",
        feature: "cdc",
        classBase: "Cdc",
        title: "Change Data Capture with Debezium",
        route: "api/cdc",
        serviceBody: `
    private readonly events = [
        { offset: 101, table: "products", op: "c", key: "sku_100", indexed: true },
        { offset: 102, table: "products", op: "u", key: "sku_101", indexed: true },
    ]

    eventsSnapshot() {
        return {
            connector: "debezium-postgres-demo",
            consumerGroup: "search-indexer",
            lag: 0,
            events: this.events,
        }
    }
`,
        controllerMethods: `
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
        title: "Distributed Search Sharding and Relevance",
        route: "api/search",
        serviceBody: `
    private readonly documents = [
        { id: "p1", shard: "products-0", title: "Laptop Pro 14", score: 12.4 },
        { id: "p2", shard: "products-1", title: "Laptop Air 13", score: 10.8 },
        { id: "p3", shard: "products-2", title: "Laptop Dock", score: 7.2 },
    ]

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
        controllerMethods: `
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
        title: "Consistent Hashing and Partitioning",
        route: "api/ring",
        serviceBody: `
    private readonly nodes = ["node-a", "node-b", "node-c", "node-d"]

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
        controllerMethods: `
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
        title: "Gossip Protocol and Failure Detection",
        route: "api/gossip",
        serviceBody: `
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
        controllerMethods: `
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
        title: "Quorum Consensus and Conflict Resolution",
        route: "api/quorum",
        serviceBody: `
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
        controllerMethods: `
    @Post("write")
    write(@Body() body: { key?: string; value?: string; w?: number; r?: number }) {
        return this.service.write(
            body.key ?? "balance",
            body.value ?? "200",
            Number(body.w ?? 2),
            Number(body.r ?? 2),
        )
    }
`,
    },
]

function write(file, content) {
    fs.mkdirSync(path.dirname(file),
        {
            recursive: true 
        })
    fs.writeFileSync(file,
        content.trimStart(),
        "utf8")
}

function className(base, suffix) {
    return `${base}${suffix}`
}

for (const item of lessons) {
    const lessonRoot = path.join(root,
        item.repo,
        item.lesson)
    const serviceRoot = path.join(lessonRoot,
        item.serviceDir)
    const srcRoot = path.join(serviceRoot,
        "src")
    const featureRoot = path.join(srcRoot,
        item.feature)
    const packageJsonPath = path.join(serviceRoot,
        "package.json")
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath,
        "utf8"))
    packageJson.dependencies = {
        ...packageJson.dependencies,
        "@nestjs/platform-express": packageJson.dependencies["@nestjs/platform-express"] ?? "^10.0.0",
    }
    fs.writeFileSync(packageJsonPath,
        `${JSON.stringify(packageJson,
            null,
            2)}\n`,
        "utf8")

    write(path.join(srcRoot,
        "app.module.ts"),
    `
/**
 * Root module wiring ConfigModule and the lesson feature module.
 * (EN: Root module wiring ConfigModule and the lesson feature module.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
} from "@nestjs/config"
import {
    ${className(item.classBase,
        "Module")},
} from "./${item.feature}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        ${className(item.classBase,
        "Module")},
    ],
})
export class AppModule {}
`)

    write(path.join(featureRoot,
        `${item.feature}.module.ts`),
    `
import {
    Module,
} from "@nestjs/common"
import {
    ${className(item.classBase,
        "Service")},
} from "./${item.feature}.service"
import {
    ${className(item.classBase,
        "Controller")},
} from "./${item.feature}.controller"

/**
 * Feature module for ${item.title}.
 * (EN: Feature module for ${item.title}.)
 */
@Module({
    controllers: [${className(item.classBase,
        "Controller")}],
    providers: [${className(item.classBase,
        "Service")}],
    exports: [${className(item.classBase,
        "Service")}],
})
export class ${className(item.classBase,
        "Module")} {}
`)

    write(path.join(featureRoot,
        `${item.feature}.service.ts`),
    `
import {
    Injectable,
} from "@nestjs/common"

/**
 * Domain service for ${item.title}.
 * (EN: Domain service for ${item.title}.)
 */
@Injectable()
export class ${className(item.classBase,
        "Service")} {
${item.serviceBody}
}
`)

    write(path.join(featureRoot,
        `${item.feature}.controller.ts`),
    `
import {
    Body,
    Controller,
    Get,
    Post,
    Query,
} from "@nestjs/common"
import {
    ${className(item.classBase,
        "Service")},
} from "./${item.feature}.service"

/**
 * REST controller exposing the lesson verification flow endpoints.
 * (EN: REST controller exposing the lesson verification flow endpoints.)
 */
@Controller("${item.route}")
export class ${className(item.classBase,
        "Controller")} {
    constructor(
        private readonly service: ${className(item.classBase,
        "Service")},
    ) {}
${item.controllerMethods}
}
`)

    write(path.join(lessonRoot,
        ".docker",
        "compose.yaml"),
    `
# Docker Compose stack for lesson ${item.lesson}.
# (EN: Docker Compose stack for lesson ${item.lesson}.)
#
# Working directory: ${item.lesson}/.docker
# (EN: Working directory: ${item.lesson}/.docker)
#
# Start:
# (EN: Start:)
# docker compose up -d --build
#
# Logs:
# (EN: Logs:)
# docker compose logs -f api
#
# Cleanup:
# (EN: Cleanup:)
# docker compose down -v

name: ${item.lesson}

services:
  # Lesson API service.
  # (EN: Lesson API service.)
  api:
    image: starciacademy/${item.lesson}-${item.serviceDir}:latest
    container_name: ${item.lesson}-api
    build:
      context: ../${item.serviceDir}
      dockerfile: Dockerfile
    ports:
      # Map host port 3000 to container port 3000.
      # (EN: Map host port 3000 to container port 3000.)
      - "3000:3000"
    environment:
      - PORT=3000
    networks:
      - ${item.lesson}-network

  # Redis infrastructure for the lesson architecture.
  # (EN: Redis infrastructure for the lesson architecture.)
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

console.log(`Rewired ${lessons.length} lesson services.`)
