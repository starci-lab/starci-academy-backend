/**
 * Module 14 — Ride-hailing geospatial labs:
 * L0 Uber H3 (h3-js), L1 Redis GEOADD/GEORADIUS, L2 H3 surge + Redis match.
 * Brief: .briefs/system-design/14.md
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-14-geospatial-indexing-realtime-matching-and-surge-pricing",
)
const OLD_MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-14-ride-hailing-system",
)

const STALE_LESSONS = []

function write(rel, content) {
    const full = path.join(MODULE, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
}

function removeDir(rel) {
    const full = path.join(MODULE, rel)
    if (fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true })
    }
}

const appConfig = `import { registerAs } from "@nestjs/config"

export interface AppConfig {
    port: number
}

export const appConfig = registerAs("app", (): AppConfig => ({
    port: Number(process.env.PORT) || 3000,
}))
`

const configIndex = `export * from "./app.config"\n`

const bootstrap = `import { NestFactory } from "@nestjs/core"
import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { AppModule } from "./app.module"

export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
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

function scaffoldLesson(lessonSlug, serviceName, extraDeps = {}) {
    const prefix = `${lessonSlug}/${serviceName}`
    write(`${lessonSlug}/.gitignore`, "node_modules/\ndist/\n")
    write(`${prefix}/Dockerfile`, dockerfile)
    write(`${prefix}/package.json`, `${JSON.stringify(nestPackage(serviceName, extraDeps), null, 2)}\n`)
    write(
        `${prefix}/nest-cli.json`,
        `${JSON.stringify({ $schema: "https://json.schemastore.org/nest-cli", collection: "@nestjs/schematics", sourceRoot: "src", compilerOptions: { deleteOutDir: true } }, null, 2)}\n`,
    )
    write(
        `${prefix}/tsconfig.json`,
        `${JSON.stringify({ compilerOptions: { module: "commonjs", declaration: true, emitDecoratorMetadata: true, experimentalDecorators: true, target: "ES2021", outDir: "./dist", baseUrl: "./", strict: true } }, null, 2)}\n`,
    )
    write(
        `${prefix}/tsconfig.build.json`,
        `${JSON.stringify({ extends: "./tsconfig", exclude: ["node_modules", "dist", "**/*spec.ts"] }, null, 2)}\n`,
    )
    write(`${prefix}/.env`, "PORT=3000\n")
    write(`${prefix}/src/main.ts`, mainTs)
    write(`${prefix}/src/bootstrap.ts`, bootstrap)
    write(`${prefix}/src/config/app.config.ts`, appConfig)
    write(`${prefix}/src/config/index.ts`, configIndex)
}

function appModule(featureModule, featureFolder) {
    return `import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { appConfig } from "./config"
import { ${featureModule} } from "./${featureFolder}"

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }), ${featureModule}],
})
export class AppModule {}
`
}

// ========== Lesson 0: Uber H3 ==========
const L0 = "0-geospatial-indexing-fundamentals"
const S0 = `${L0}/h3-geo-service`

scaffoldLesson(L0, "h3-geo-service", { "h3-js": "^4.1.0" })

write(
    `${L0}/.docker/compose.yaml`,
    `name: ${L0}

services:
  api:
    container_name: ${L0}-api
    build:
      context: ../h3-geo-service
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - H3_RESOLUTION=9
    networks:
      - ${L0}-network

networks:
  ${L0}-network:
    name: ${L0}-network
`,
)

write(`${S0}/src/app.module.ts`, appModule("H3Module", "h3"))

write(
    `${S0}/src/h3/h3.service.ts`,
    `import { Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import {
    cellArea,
    cellToBoundary,
    cellToLatLng,
    gridDisk,
    latLngToCell,
} from "h3-js"

@Injectable()
export class H3Service {
    private readonly resolution: number

    constructor(private readonly config: ConfigService) {
        this.resolution = Number(this.config.get("H3_RESOLUTION") ?? 9)
    }

    /** Băm tọa độ → ô lục giác H3 (offline, không Google API). */
    cell(lat: number, lng: number, resolution?: number) {
        const res = resolution ?? this.resolution
        const h3Index = latLngToCell(lat, lng, res)
        const [centerLat, centerLng] = cellToLatLng(h3Index)
        const boundary = cellToBoundary(h3Index).map(([bLat, bLng]) => ({
            lat: bLat,
            lng: bLng,
        }))
        return {
            lat,
            lng,
            resolution: res,
            h3Index,
            center: { lat: centerLat, lng: centerLng },
            boundary,
            areaKm2: Number((cellArea(h3Index, "km2")).toFixed(4)),
            engine: "h3-js (Uber H3, CPU on server)",
            googleApiUsed: false,
        }
    }

    /** Lưới lân cận — dùng gom Cung/Cầu theo vùng. */
    neighbors(lat: number, lng: number, k = 1) {
        const origin = this.cell(lat, lng)
        const ring = gridDisk(origin.h3Index, k)
        return {
            origin: origin.h3Index,
            ringSize: ring.length,
            cells: ring.map((h3Index) => ({
                h3Index,
                center: (() => {
                    const [cLat, cLng] = cellToLatLng(h3Index)
                    return { lat: cLat, lng: cLng }
                })(),
            })),
        }
    }

    /** Demo surge theo ô (in-memory, không Redis). */
    demoSurgeByCell(lat: number, lng: number) {
        const { h3Index } = this.cell(lat, lng)
        const demand = 12 + (h3Index.charCodeAt(h3Index.length - 1) % 8)
        const supply = 3 + (h3Index.charCodeAt(0) % 4)
        const surgeMultiplier = Number(Math.max(1, demand / Math.max(supply, 1)).toFixed(2))
        return {
            h3Index,
            demand,
            supply,
            surgeMultiplier,
            note: "Surge thật ở L2 lưu demand/supply trên Redis theo h3Index.",
        }
    }
}
`,
)

write(
    `${S0}/src/h3/h3.controller.ts`,
    `import { Controller, Get, Query } from "@nestjs/common"
import { H3Service } from "./h3.service"

@Controller("api/h3")
export class H3Controller {
    constructor(private readonly service: H3Service) {}

    @Get("cell")
    cell(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
        @Query("resolution") resolution?: string,
    ) {
        return this.service.cell(
            Number(lat),
            Number(lng),
            resolution ? Number(resolution) : undefined,
        )
    }

    @Get("neighbors")
    neighbors(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
        @Query("k") k = "1",
    ) {
        return this.service.neighbors(Number(lat), Number(lng), Number(k))
    }

    @Get("surge-demo")
    surgeDemo(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
    ) {
        return this.service.demoSurgeByCell(Number(lat), Number(lng))
    }
}
`,
)

write(
    `${S0}/src/h3/h3.module.ts`,
    `import { Module } from "@nestjs/common"
import { H3Controller } from "./h3.controller"
import { H3Service } from "./h3.service"

@Module({
    controllers: [H3Controller],
    providers: [H3Service],
})
export class H3Module {}
`,
)
write(`${S0}/src/h3/index.ts`, `export * from "./h3.controller"
export * from "./h3.module"
export * from "./h3.service"
`)

// ========== Lesson 1: Redis Geospatial ==========
const L1 = "1-realtime-location-updates-at-scale"
const S1 = `${L1}/location-tracker`

scaffoldLesson(L1, "location-tracker", { ioredis: "^5.3.2" })

write(
    `${L1}/.docker/compose.yaml`,
    `name: ${L1}

services:
  redis:
    image: redis:7-alpine
    container_name: ${L1}-redis
    ports:
      - "6379:6379"
    networks:
      - ${L1}-network

  api:
    container_name: ${L1}-api
    build:
      context: ../location-tracker
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - GEO_KEY=drivers:live
    depends_on:
      - redis
    networks:
      - ${L1}-network

networks:
  ${L1}-network:
    name: ${L1}-network
`,
)

write(`${S1}/src/app.module.ts`, appModule("LocationModule", "location"))
write(
    `${S1}/.env`,
    `PORT=3000
REDIS_URL=redis://localhost:6379
GEO_KEY=drivers:live
`,
)

write(
    `${S1}/src/location/dto/update-location.dto.ts`,
    `import { IsNotEmpty, IsNumber, IsString } from "class-validator"

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
)
write(`${S1}/src/location/dto/index.ts`, `export * from "./update-location.dto"\n`)

write(
    `${S1}/src/location/location.service.ts`,
    `import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"

const SEED_DRIVERS = [
    { driverId: "drv_11", lat: 10.7628, lng: 106.6604 },
    { driverId: "drv_27", lat: 10.7589, lng: 106.6617 },
    { driverId: "drv_41", lat: 10.7712, lng: 106.6711 },
]

@Injectable()
export class LocationService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis
    private geoKey!: string

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        this.geoKey = this.config.get<string>("GEO_KEY") ?? "drivers:live"
        const redisUrl = this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379"
        this.redis = new Redis(redisUrl)
        await this.redis.del(this.geoKey)
        for (const d of SEED_DRIVERS) {
            await this.redis.geoadd(this.geoKey, d.lng, d.lat, d.driverId)
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /** GEOADD — ping GPS tài xế (lng, lat theo chuẩn Redis). */
    async update(driverId: string, lat: number, lng: number) {
        const added = await this.redis.geoadd(this.geoKey, lng, lat, driverId)
        return {
            driverId,
            status: added === 1 ? "indexed" : "updated",
            geoCommand: \`GEOADD \${this.geoKey} \${lng} \${lat} \${driverId}\`,
            engine: "Redis Geohash + Sorted Set (RAM)",
            googleApiUsed: false,
            latencyTargetMs: "< 5ms on LAN",
        }
    }

    /** GEORADIUS — quét xe trong bán kính mét. */
    async nearby(lat: number, lng: number, radiusMeters: number) {
        const raw = await this.redis.georadius(
            this.geoKey,
            lng,
            lat,
            radiusMeters,
            "m",
            "WITHDIST",
            "ASC",
            "COUNT",
            20,
        )
        const drivers = (raw as [string, string][]).map(([driverId, dist]) => ({
            driverId,
            distanceMeters: Math.round(Number(dist)),
        }))
        return {
            query: { lat, lng, radiusMeters },
            geoCommand: \`GEORADIUS \${this.geoKey} \${lng} \${lat} \${radiusMeters} m WITHDIST ASC\`,
            drivers,
            note: "Mỗi ping/ quét KHÔNG gọi Google — toán học nội bộ Redis.",
        }
    }
}
`,
)

write(
    `${S1}/src/location/location.controller.ts`,
    `import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { UpdateLocationDto } from "./dto"
import { LocationService } from "./location.service"

@Controller("api/location")
export class LocationController {
    constructor(private readonly service: LocationService) {}

    @Post("update")
    update(@Body() body: UpdateLocationDto) {
        return this.service.update(body.driverId, body.lat, body.lng)
    }

    @Get("nearby")
    nearby(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
        @Query("radiusMeters") radiusMeters = "1500",
    ) {
        return this.service.nearby(
            Number(lat),
            Number(lng),
            Number(radiusMeters),
        )
    }
}
`,
)

write(
    `${S1}/src/location/location.module.ts`,
    `import { Module } from "@nestjs/common"
import { LocationController } from "./location.controller"
import { LocationService } from "./location.service"

@Module({
    controllers: [LocationController],
    providers: [LocationService],
})
export class LocationModule {}
`,
)
write(`${S1}/src/location/index.ts`, `export * from "./location.controller"
export * from "./location.module"
export * from "./location.service"
`)

// ========== Lesson 2: Matching + Surge ==========
const L2 = "2-matching-and-dynamic-pricing"
const S2 = `${L2}/matching-service`

scaffoldLesson(L2, "matching-service", { "h3-js": "^4.1.0", ioredis: "^5.3.2" })

write(
    `${L2}/.docker/compose.yaml`,
    `name: ${L2}

services:
  redis:
    image: redis:7-alpine
    container_name: ${L2}-redis
    ports:
      - "6380:6379"
    networks:
      - ${L2}-network

  api:
    container_name: ${L2}-api
    build:
      context: ../matching-service
      dockerfile: Dockerfile
    ports:
      - "3002:3000"
    environment:
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - GEO_KEY=drivers:live
      - H3_RESOLUTION=9
    depends_on:
      - redis
    networks:
      - ${L2}-network

networks:
  ${L2}-network:
    name: ${L2}-network
`,
)

write(`${S2}/src/app.module.ts`, appModule("MatchingModule", "matching"))
write(
    `${S2}/.env`,
    `PORT=3000
REDIS_URL=redis://localhost:6380
GEO_KEY=drivers:live
H3_RESOLUTION=9
`,
)

write(
    `${S2}/src/matching/dto/match-request.dto.ts`,
    `import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"

export class MatchRequestDto {
    @IsString()
    @IsNotEmpty()
    clientId!: string

    @IsNumber()
    lat!: number

    @IsNumber()
    lng!: number

    @IsOptional()
    @IsNumber()
    distanceKm?: number
}
`,
)
write(`${S2}/src/matching/dto/index.ts`, `export * from "./match-request.dto"\n`)

write(
    `${S2}/src/matching/matching.service.ts`,
    `import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { latLngToCell } from "h3-js"
import Redis from "ioredis"

const SEED_DRIVERS = [
    { driverId: "drv_88", lat: 10.7621, lng: 106.6598 },
    { driverId: "drv_23", lat: 10.764, lng: 106.662 },
    { driverId: "drv_51", lat: 10.768, lng: 106.665 },
]

const RING_RADIUS_METERS = [500, 1000, 2000, 5000]

@Injectable()
export class MatchingService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis
    private geoKey!: string
    private h3Resolution!: number

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        this.geoKey = this.config.get<string>("GEO_KEY") ?? "drivers:live"
        this.h3Resolution = Number(this.config.get("H3_RESOLUTION") ?? 9)
        const redisUrl = this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379"
        this.redis = new Redis(redisUrl)
        await this.redis.del(this.geoKey)
        for (const d of SEED_DRIVERS) {
            await this.redis.geoadd(this.geoKey, d.lng, d.lat, d.driverId)
            await this.redis.set(\`supply:\${d.driverId}\`, "1")
        }
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    private h3Index(lat: number, lng: number): string {
        return latLngToCell(lat, lng, this.h3Resolution)
    }

    /** Báo giá surge theo ô H3 + demand counter trên Redis. */
    async quote(lat: number, lng: number) {
        const cell = this.h3Index(lat, lng)
        const demand = await this.redis.incr(\`demand:\${cell}\`)
        const supply = Number(await this.redis.get(\`supply:\${cell}\`) ?? SEED_DRIVERS.length)
        const surgeMultiplier = Number(Math.max(1, demand / Math.max(supply, 1)).toFixed(2))
        return {
            pickup: { lat, lng },
            h3Index: cell,
            demand,
            supply,
            surgeMultiplier,
            pricingModel: "baseFare * surge (H3 cell, no Google API)",
            googleDirectionsUsed: false,
        }
    }

    /** Expanding ring: GEORADIUS 500m → 5km cho đến khi có tài xế. */
    async request(clientId: string, lat: number, lng: number, distanceKm = 5.2) {
        const cell = this.h3Index(lat, lng)
        await this.redis.incr(\`demand:\${cell}\`)

        let matched: { driverId: string; distanceMeters: number; ringMeters: number } | null = null
        for (const ringMeters of RING_RADIUS_METERS) {
            const raw = await this.redis.georadius(
                this.geoKey,
                lng,
                lat,
                ringMeters,
                "m",
                "WITHDIST",
                "ASC",
                "COUNT",
                1,
            )
            const hit = (raw as [string, string][])[0]
            if (hit) {
                matched = {
                    driverId: hit[0],
                    distanceMeters: Math.round(Number(hit[1])),
                    ringMeters,
                }
                break
            }
        }

        const quote = await this.quote(lat, lng)
        const baseFare = 22000
        const distanceFare = Math.round(distanceKm * 8500)
        const estimatedFare = Math.round(
            (baseFare + distanceFare) * quote.surgeMultiplier,
        )

        return {
            clientId,
            pickup: { lat, lng, h3Index: cell },
            strategy: "expanding-radius (GEORADIUS rings)",
            matchedDriver: matched,
            routeEstimate: {
                distanceKm,
                source: "mock-haversine-or-directions-once-in-prod",
                googleApiOnHotPath: false,
            },
            pricing: {
                baseFare,
                distanceFare,
                surgeMultiplier: quote.surgeMultiplier,
                estimatedFare,
            },
        }
    }
}
`,
)

write(
    `${S2}/src/matching/matching.controller.ts`,
    `import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { MatchRequestDto } from "./dto"
import { MatchingService } from "./matching.service"

@Controller("api/match")
export class MatchingController {
    constructor(private readonly service: MatchingService) {}

    @Get("quote")
    quote(
        @Query("lat") lat = "10.762622",
        @Query("lng") lng = "106.660172",
    ) {
        return this.service.quote(Number(lat), Number(lng))
    }

    @Post("request")
    request(@Body() body: MatchRequestDto) {
        return this.service.request(
            body.clientId,
            body.lat,
            body.lng,
            body.distanceKm,
        )
    }
}
`,
)

write(
    `${S2}/src/matching/matching.module.ts`,
    `import { Module } from "@nestjs/common"
import { MatchingController } from "./matching.controller"
import { MatchingService } from "./matching.service"

@Module({
    controllers: [MatchingController],
    providers: [MatchingService],
})
export class MatchingModule {}
`,
)
write(`${S2}/src/matching/index.ts`, `export * from "./matching.controller"
export * from "./matching.module"
export * from "./matching.service"
`)

// ========== Cleanup ==========
if (fs.existsSync(OLD_MODULE)) {
    fs.rmSync(OLD_MODULE, { recursive: true, force: true })
}
for (const stale of STALE_LESSONS) {
    removeDir(stale)
}

write(
    "README.md",
    `# Module 14 — Geospatial Indexing, Realtime Matching & Surge Pricing

| Lesson | Stack | API port |
|--------|-------|----------|
| 0 | Uber **h3-js** (hex grid, offline) | **3000** |
| 1 | **Redis** GEOADD / GEORADIUS | **3001** |
| 2 | **H3** + Redis surge + ring match | **3002** |

**Không dùng Google Maps API** trên hot path — chỉ toán học server + Redis RAM.

\`\`\`bash
node scratch/apply_module_14_ride_hailing_rules.mjs
\`\`\`
`,
)

console.log(`Module 14 ride-hailing applied: ${MODULE}`)
