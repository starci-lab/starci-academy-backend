import fs from "node:fs"
import path from "node:path"

const root = path.resolve(".")

const lessons = [
  {
    repo: "system-design-mastery-module-17-distributed-file-storage-content-delivery-network",
    lesson: "0-file-chunking-and-metadata-storage",
    serviceDir: "metadata-service",
    feature: "metadata",
    classBase: "Metadata",
    titleVi: "Phan doan file va luu tru metadata",
    titleEn: "File Chunking and Metadata Storage",
    route: "api/metadata",
    dtoName: "ChunkFileDto",
    dtoFile: "chunk-file.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload mo phong yeu cau chia file thanh chunk.
 * (EN: Payload that simulates a file chunking request.)
 */
export class ChunkFileDto {
    @IsString()
    @IsNotEmpty()
    fileId!: string

    @IsString()
    @IsNotEmpty()
    fileName!: string

    @IsNumber()
    @Min(1)
    sizeBytes!: number

    @IsNumber()
    @Min(1)
    chunkSizeBytes!: number
}
`,
    serviceBody: `
    /**
     * Chia file thanh cac chunk va tra ve metadata du de tai lap object.
     * (EN: Splits a file into chunks and returns metadata sufficient to rebuild the object.)
     */
    chunkFile(fileId: string, fileName: string, sizeBytes: number, chunkSizeBytes: number) {
        const chunkCount = Math.ceil(sizeBytes / chunkSizeBytes)
        const chunks = Array.from({ length: chunkCount }, (_, index) => {
            const startByte = index * chunkSizeBytes
            const endByte = Math.min(startByte + chunkSizeBytes - 1, sizeBytes - 1)

            return {
                chunkId: \`\${fileId}-part-\${index.toString().padStart(3, "0")}\`,
                index,
                startByte,
                endByte,
                sizeBytes: endByte - startByte + 1,
                storageKey: \`objects/\${fileId}/chunks/\${index}\`,
            }
        })

        return {
            fileId,
            fileName,
            sizeBytes,
            chunkSizeBytes,
            chunkCount,
            manifestVersion: 1,
            chunks,
        }
    }
`,
    controllerBody: `
    /**
     * Tao manifest chunk cho file can upload.
     * (EN: Creates a chunk manifest for a file upload.)
     */
    @Post("chunk")
    chunk(@Body() body: ChunkFileDto) {
        return this.service.chunkFile(
            body.fileId,
            body.fileName,
            body.sizeBytes,
            body.chunkSizeBytes,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-17-distributed-file-storage-content-delivery-network",
    lesson: "1-data-deduplication-and-resumable-uploads",
    serviceDir: "upload-service",
    feature: "upload",
    classBase: "Upload",
    titleVi: "Deduplication va resumable upload",
    titleEn: "Data Deduplication and Resumable Uploads",
    route: "api/upload",
    dtoName: "UploadChunkDto",
    dtoFile: "upload-chunk.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload ghi nhan mot chunk upload.
 * (EN: Payload that records one uploaded chunk.)
 */
export class UploadChunkDto {
    @IsString()
    @IsNotEmpty()
    uploadId!: string

    @IsString()
    @IsNotEmpty()
    checksum!: string

    @IsNumber()
    @Min(0)
    offsetBytes!: number

    @IsNumber()
    @Min(1)
    sizeBytes!: number
}
`,
    serviceBody: `
    private readonly knownChecksums = new Set<string>([
        "sha256:hero-image-part-000",
        "sha256:catalog-export-part-004",
    ])

    /**
     * Ghi nhan chunk va phan biet chunk moi voi chunk da ton tai.
     * (EN: Records a chunk and distinguishes new data from already stored data.)
     */
    acceptChunk(uploadId: string, checksum: string, offsetBytes: number, sizeBytes: number) {
        const deduplicated = this.knownChecksums.has(checksum)
        this.knownChecksums.add(checksum)

        return {
            uploadId,
            checksum,
            offsetBytes,
            sizeBytes,
            deduplicated,
            nextOffsetBytes: offsetBytes + sizeBytes,
            resumeToken: \`\${uploadId}:\${offsetBytes + sizeBytes}\`,
            storageAction: deduplicated ? "link-existing-blob" : "store-new-blob",
        }
    }
`,
    controllerBody: `
    /**
     * Nhan mot chunk va tra ve trang thai resume/dedup.
     * (EN: Accepts one chunk and returns resume/dedup state.)
     */
    @Post("chunk")
    chunk(@Body() body: UploadChunkDto) {
        return this.service.acceptChunk(
            body.uploadId,
            body.checksum,
            body.offsetBytes,
            body.sizeBytes,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-17-distributed-file-storage-content-delivery-network",
    lesson: "2-global-cdn-distribution",
    serviceDir: "cdn-api",
    feature: "cdn",
    classBase: "Cdn",
    titleVi: "Phan phoi noi dung qua CDN toan cau",
    titleEn: "Global CDN Distribution",
    route: "api/cdn",
    serviceBody: `
    private readonly edges = [
        { region: "sin", city: "Singapore", latencyMs: 18, cacheHitRatio: 0.94 },
        { region: "hkg", city: "Hong Kong", latencyMs: 32, cacheHitRatio: 0.9 },
        { region: "nrt", city: "Tokyo", latencyMs: 54, cacheHitRatio: 0.88 },
    ]

    /**
     * Chon edge gan nhat va tra ve policy cache cho object.
     * (EN: Selects the nearest edge and returns cache policy for an object.)
     */
    routeObject(objectKey: string, region: string) {
        const preferred = this.edges.find((edge) => edge.region === region) ?? this.edges[0]

        return {
            objectKey,
            selectedEdge: preferred,
            cacheKey: \`cdn:\${preferred.region}:\${objectKey}\`,
            originShield: "sin",
            ttlSeconds: 3600,
            staleWhileRevalidateSeconds: 60,
        }
    }
`,
    controllerBody: `
    /**
     * Tra ve edge CDN phu hop cho object.
     * (EN: Returns the CDN edge selected for an object.)
     */
    @Get("route")
    route(
        @Query("objectKey") objectKey = "videos/intro.mp4",
        @Query("region") region = "sin",
    ) {
        return this.service.routeObject(objectKey, region)
    }
`,
  },
  {
    repo: "system-design-mastery-module-18-high-performance-web-crawler-search-engine",
    lesson: "0-crawling-architecture-and-politeness",
    serviceDir: "crawler-service",
    feature: "crawler",
    classBase: "Crawler",
    titleVi: "Kien truc crawler va politeness",
    titleEn: "Crawling Architecture and Politeness",
    route: "api/crawl",
    dtoName: "ScheduleCrawlDto",
    dtoFile: "schedule-crawl.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload len lich crawl mot URL.
 * (EN: Payload that schedules a URL crawl.)
 */
export class ScheduleCrawlDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsNotEmpty()
    userAgent!: string
}
`,
    serviceBody: `
    /**
     * Lap lich crawl theo host va ap dung delay politeness mo phong.
     * (EN: Schedules crawling by host and applies simulated politeness delay.)
     */
    schedule(url: string, userAgent: string) {
        const parsedUrl = new URL(url)
        const hostHash = [...parsedUrl.hostname].reduce((sum, char) => sum + char.charCodeAt(0), 0)
        const delaySeconds = 2 + (hostHash % 4)

        return {
            url,
            host: parsedUrl.hostname,
            userAgent,
            robotsPolicy: "allowed-demo",
            crawlAfterSeconds: delaySeconds,
            queue: \`host:\${parsedUrl.hostname}\`,
        }
    }
`,
    controllerBody: `
    /**
     * Dua URL vao hang doi crawl voi politeness theo host.
     * (EN: Enqueues a URL for host-level polite crawling.)
     */
    @Post("schedule")
    schedule(@Body() body: ScheduleCrawlDto) {
        return this.service.schedule(body.url, body.userAgent)
    }
`,
  },
  {
    repo: "system-design-mastery-module-18-high-performance-web-crawler-search-engine",
    lesson: "1-url-frontier-and-bloom-filters",
    serviceDir: "frontier-service",
    feature: "frontier",
    classBase: "Frontier",
    titleVi: "URL frontier va Bloom filter",
    titleEn: "URL Frontier and Bloom Filters",
    route: "api/frontier",
    dtoName: "EnqueueUrlDto",
    dtoFile: "enqueue-url.dto.ts",
    dtoBody: `
import {
    IsIn,
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload dua URL vao frontier.
 * (EN: Payload that enqueues a URL into the frontier.)
 */
export class EnqueueUrlDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsIn(["low", "normal", "high"])
    priority!: "low" | "normal" | "high"
}
`,
    serviceBody: `
    private readonly seen = new Set<string>([
        "https://example.com/",
    ])

    /**
     * Ap dung Bloom-filter-like check truoc khi dua URL vao frontier.
     * (EN: Applies a Bloom-filter-like check before enqueuing a URL.)
     */
    enqueue(url: string, priority: "low" | "normal" | "high") {
        const normalizedUrl = new URL(url).toString()
        const probablySeen = this.seen.has(normalizedUrl)
        this.seen.add(normalizedUrl)

        return {
            url: normalizedUrl,
            priority,
            probablySeen,
            action: probablySeen ? "skip-duplicate" : "enqueue",
            frontierShard: this.shardFor(normalizedUrl),
            seenEstimate: this.seen.size,
        }
    }

    private shardFor(url: string): string {
        const host = new URL(url).hostname
        const shard = [...host].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 8
        return \`frontier-\${shard}\`
    }
`,
    controllerBody: `
    /**
     * Dua URL vao frontier neu chua bi danh dau trung lap.
     * (EN: Enqueues a URL when it has not been marked as duplicate.)
     */
    @Post("enqueue")
    enqueue(@Body() body: EnqueueUrlDto) {
        return this.service.enqueue(body.url, body.priority)
    }
`,
  },
  {
    repo: "system-design-mastery-module-18-high-performance-web-crawler-search-engine",
    lesson: "2-html-parsing-indexing-pagerank",
    serviceDir: "indexer-service",
    feature: "indexer",
    classBase: "Indexer",
    titleVi: "Parse HTML, indexing va PageRank",
    titleEn: "HTML Parsing, Indexing, and PageRank",
    route: "api/indexer",
    dtoName: "IndexDocumentDto",
    dtoFile: "index-document.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsString,
    IsUrl,
} from "class-validator"

/**
 * Payload index mot tai lieu da crawl.
 * (EN: Payload that indexes a crawled document.)
 */
export class IndexDocumentDto {
    @IsUrl()
    @IsNotEmpty()
    url!: string

    @IsString()
    @IsNotEmpty()
    title!: string

    @IsString()
    @IsNotEmpty()
    html!: string
}
`,
    serviceBody: `
    /**
     * Trich xuat term don gian va tinh PageRank demo cho tai lieu.
     * (EN: Extracts simple terms and computes a demo PageRank for the document.)
     */
    index(url: string, title: string, html: string) {
        const text = html.replace(/<[^>]*>/g, " ").toLowerCase()
        const terms = text
            .split(/[^a-z0-9]+/)
            .filter((term) => term.length > 3)
        const uniqueTerms = [...new Set(terms)]
        const links = [...html.matchAll(/href=["']([^"']+)["']/g)].map((match) => match[1])

        return {
            url,
            title,
            termCount: terms.length,
            uniqueTerms: uniqueTerms.slice(0, 10),
            outboundLinks: links,
            pageRankScore: Number((1 + links.length * 0.15).toFixed(2)),
            indexShard: this.shardFor(url),
        }
    }

    private shardFor(url: string): string {
        const hostname = new URL(url).hostname
        const shard = [...hostname].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 4
        return \`index-\${shard}\`
    }
`,
    controllerBody: `
    /**
     * Index tai lieu HTML da crawl.
     * (EN: Indexes a crawled HTML document.)
     */
    @Post("document")
    document(@Body() body: IndexDocumentDto) {
        return this.service.index(body.url, body.title, body.html)
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

function controllerImports(item) {
  const imports = ["Controller"]
  if (item.controllerBody.includes("@Body")) imports.push("Body")
  if (item.controllerBody.includes("@Get")) imports.push("Get")
  if (item.controllerBody.includes("@Post")) imports.push("Post")
  if (item.controllerBody.includes("@Query")) imports.push("Query")
  return imports.sort((a, b) => a.localeCompare(b)).join(",\n    ")
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
 * Cau hinh runtime toi thieu cho service demo.
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
 * Entry Node (\`nest build\` -> dist/main.js) - chi goi bootstrap da export.
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
 * Khoi tao Nest app voi ValidationPipe toan cuc va cong tu ConfigModule.
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
    // Cong lang nghe lay tu ConfigModule de chay giong nhau trong Docker va local.
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
 * Module goc nap ConfigModule va feature module cua bai hoc.
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
 * Feature module cho bai hoc ${item.titleVi}.
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
 * Domain service cho bai hoc ${item.titleVi}.
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
 * REST controller phoi bay cac endpoint kiem thu luong cua bai hoc.
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
# Docker Compose stack cho bai hoc ${item.lesson}.
# (EN: Docker Compose stack for lesson ${item.lesson}.)
#
# Thu muc lam viec: ${item.lesson}/.docker
# (EN: Working directory: ${item.lesson}/.docker)
#
# Khoi dong: docker compose up -d --build
# (EN: Start: docker compose up -d --build)
#
# Xem log: docker compose logs -f api
# (EN: Logs: docker compose logs -f api)
#
# Don tai nguyen: docker compose down -v
# (EN: Cleanup: docker compose down -v)

# Tien to project Compose, dung lam ten stack/container.
# (EN: Compose project prefix used as stack/container name.)
name: ${item.lesson}

services:
  # API NestJS cua bai hoc.
  # (EN: Lesson NestJS API.)
  api:
    image: starciacademy/${item.lesson}-${item.serviceDir}:latest
    container_name: ${item.lesson}-api
    build:
      context: ../${item.serviceDir}
      dockerfile: Dockerfile
    ports:
      # Anh xa cong host 3000 sang container 3000 cho HTTP API.
      # (EN: Map host port 3000 to container port 3000 for the HTTP API.)
      - "3000:3000"
    env_file:
      - ../${item.serviceDir}/.env
    networks:
      - ${item.lesson}-network

  # Redis mo phong ha tang cache/queue phu tro cho bai hoc.
  # (EN: Redis simulates supporting cache/queue infrastructure for the lesson.)
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

console.log(`Rewired ${lessons.length} lesson services for modules 16 and 17.`)
