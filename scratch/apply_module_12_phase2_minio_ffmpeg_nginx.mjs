/**
 * Module 12 phase 2 — MinIO (Docker), fluent-ffmpeg + ffmpeg-static, NGINX edge.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-12-large-scale-video-streaming-platform",
)

const MINIO_ENV = {
    MINIO_ENDPOINT: "minio",
    MINIO_PORT: "9000",
    MINIO_ACCESS_KEY: "minioadmin",
    MINIO_SECRET_KEY: "minioadmin123",
    MINIO_BUCKET_RAW: "video-raw",
    MINIO_BUCKET_HLS: "video-hls",
    MINIO_USE_SSL: "false",
}

function write(rel, content) {
    const full = path.join(MODULE, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
}

function patchEnv(serviceRel, extra) {
    const envPath = path.join(MODULE, serviceRel, ".env")
    const lines = fs.existsSync(envPath)
        ? fs.readFileSync(envPath, "utf8").split("\n")
        : []
    const keys = new Set(lines.map((l) => l.split("=")[0]))
    for (const [k, v] of Object.entries(extra)) {
        if (!keys.has(k)) {
            lines.push(`${k}=${v}`)
        }
    }
    write(`${serviceRel}/.env`, `${lines.filter(Boolean).join("\n")}\n`)
}

function patchPackage(serviceRel, addDeps, addDevDeps = {}) {
    const pkgPath = path.join(MODULE, serviceRel, "package.json")
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"))
    pkg.dependencies = { ...pkg.dependencies, ...addDeps }
    pkg.devDependencies = { ...pkg.devDependencies, ...addDevDeps }
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
}

function dockerfileWithFfmpeg() {
    return `FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache ffmpeg
COPY package.json ./
RUN npm install
COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache ffmpeg
ENV NODE_ENV=production
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
`
}

const minioConfig = `/**
 * Config MinIO (S3-compatible) — chỉ đọc process.env tại factory.
 * (EN: MinIO (S3-compatible) config — reads process.env in factory only.)
 */
import {
    registerAs,
} from "@nestjs/config"

export interface MinioConfig {
    endpoint: string
    port: number
    accessKey: string
    secretKey: string
    bucketRaw: string
    bucketHls: string
    useSsl: boolean
}

/**
 * Cấu hình MinIO — namespace \`minio\` cho ConfigService.
 * (EN: MinIO config — \`minio\` namespace for ConfigService.)
 */
export const minioConfig = registerAs(
    "minio",
    (): MinioConfig => ({
        endpoint: process.env.MINIO_ENDPOINT ?? "localhost",
        port: Number(process.env.MINIO_PORT) || 9000,
        accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
        secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin123",
        bucketRaw: process.env.MINIO_BUCKET_RAW ?? "video-raw",
        bucketHls: process.env.MINIO_BUCKET_HLS ?? "video-hls",
        useSsl: process.env.MINIO_USE_SSL === "true",
    }),
)
`

const minioStorageService = `/**
 * MinIO object storage — GetObject / PutObject qua AWS SDK v3.
 * (EN: MinIO storage — GetObject / PutObject via AWS SDK v3.)
 */
import {
    Injectable,
    OnModuleInit,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3"
import type {
    MinioConfig,
} from "../config"

@Injectable()
export class MinioStorageService implements OnModuleInit {
    private client!: S3Client
    private cfg!: MinioConfig

    constructor(
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic — khởi tạo S3 client trỏ MinIO.
     * Code — OnModuleInit → endpoint URL từ config.
     * (EN Logic: Initialize S3 client for MinIO.)
     * (EN Code: OnModuleInit → endpoint URL.)
     */
    onModuleInit(): void {
        this.cfg = this.config.getOrThrow<MinioConfig>("minio")
        const protocol = this.cfg.useSsl ? "https" : "http"
        this.client = new S3Client({
            region: "us-east-1",
            endpoint: \`\${protocol}://\${this.cfg.endpoint}:\${this.cfg.port}\`,
            forcePathStyle: true,
            credentials: {
                accessKeyId: this.cfg.accessKey,
                secretAccessKey: this.cfg.secretKey,
            },
        })
    }

    /**
     * Logic — đọc object bytes từ bucket HLS.
     * Code — GetObjectCommand → streamToBuffer.
     * (EN Logic: Read object bytes from HLS bucket.)
     * (EN Code: GetObject → buffer.)
     */
    async getHlsObject(objectKey: string): Promise<Buffer> {
        const res = await this.client.send(
            new GetObjectCommand({
                Bucket: this.cfg.bucketHls,
                Key: objectKey,
            }),
        )
        return this.streamToBuffer(res.Body)
    }

    /**
     * Logic — ghi object vào bucket HLS.
     * Code — PutObjectCommand.
     * (EN Logic: Write object to HLS bucket.)
     * (EN Code: PutObject.)
     */
    async putHlsObject(
        objectKey: string,
        body: Buffer,
        contentType: string,
    ): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.cfg.bucketHls,
                Key: objectKey,
                Body: body,
                ContentType: contentType,
            }),
        )
    }

    /**
     * Logic — kiểm tra object tồn tại trên HLS bucket.
     * Code — HeadObjectCommand.
     * (EN Logic: Check HLS object exists.)
     * (EN Code: HeadObject.)
     */
    async hlsObjectExists(objectKey: string): Promise<boolean> {
        try {
            await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.cfg.bucketHls,
                    Key: objectKey,
                }),
            )
            return true
        } catch {
            return false
        }
    }

    /**
     * Logic — đọc object từ bucket raw.
     * Code — GetObjectCommand bucketRaw.
     * (EN Logic: Read from raw bucket.)
     * (EN Code: GetObject raw.)
     */
    async getRawObject(objectKey: string): Promise<Buffer | null> {
        try {
            const res = await this.client.send(
                new GetObjectCommand({
                    Bucket: this.cfg.bucketRaw,
                    Key: objectKey,
                }),
            )
            return this.streamToBuffer(res.Body)
        } catch {
            return null
        }
    }

    /**
     * Logic — ghi file raw upload.
     * Code — PutObjectCommand bucketRaw.
     * (EN Logic: Write raw upload.)
     * (EN Code: PutObject raw.)
     */
    async putRawObject(
        objectKey: string,
        body: Buffer,
        contentType: string,
    ): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.cfg.bucketRaw,
                Key: objectKey,
                Body: body,
                ContentType: contentType,
            }),
        )
    }

    /**
     * Logic — chuyển stream SDK sang Buffer.
     * Code — async iterator bytes.
     * (EN Logic: Convert SDK stream to Buffer.)
     * (EN Code: async iterator.)
     */
    private async streamToBuffer(
        body: unknown,
    ): Promise<Buffer> {
        if (!body || typeof body !== "object") {
            return Buffer.alloc(0)
        }
        const chunks: Buffer[] = []
        for await (const chunk of body as AsyncIterable<Uint8Array>) {
            chunks.push(Buffer.from(chunk))
        }
        return Buffer.concat(chunks)
    }
}
`

const configIndexWithMinio = `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./database.config"
export * from "./redis.config"
export * from "./minio.config"
`

const configIndexRedisMinio = `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./redis.config"
export * from "./minio.config"
`

function patchAppModule(serviceRel, featureFolder, featureModule, withDb) {
    const load = withDb
        ? "[appConfig, databaseConfig, redisConfig, minioConfig]"
        : "[appConfig, redisConfig, minioConfig]"
    const imports = withDb
        ? `import {
    appConfig,
    databaseConfig,
    redisConfig,
    minioConfig,
    type DatabaseConfig,
} from "./config"`
        : `import {
    appConfig,
    redisConfig,
    minioConfig,
} from "./config"`
    const typeOrm = withDb
        ? `
        TypeOrmModule.forRootAsync({
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
        }),`
        : ""
    write(
        `${serviceRel}/src/app.module.ts`,
        `/**
 * Module gốc — Postgres (nếu có) + Redis + MinIO + feature.
 * (EN: Root module — Postgres (optional) + Redis + MinIO + feature.)
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
${imports}
import {
    ${featureModule},
} from "./${featureFolder}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: ${load},
        }),${typeOrm}
        ${featureModule},
    ],
})
export class AppModule {}
`,
    )
}

const minioComposeBlock = `  # MinIO — object storage (S3-compatible), giống fullstack module 7.
  # (EN: MinIO — S3-compatible object storage, like fullstack module 7.)
  minio:
    image: quay.io/minio/minio:latest
    container_name: \${LESSON_SLUG}-minio
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    ports:
      # S3 API — host 9000.
      # (EN: S3 API — host port 9000.)
      - "9000:9000"
      # MinIO Console — host 9001.
      # (EN: MinIO Console — host port 9001.)
      - "9001:9001"
    networks:
      - \${LESSON_SLUG}-network
    volumes:
      - minio_data:/data

  # Khởi tạo bucket + object demo HLS/segment.
  # (EN: Initialize buckets and demo HLS/segment objects.)
  minio-init:
    image: minio/mc:latest
    container_name: \${LESSON_SLUG}-minio-init
    depends_on:
      - minio
    networks:
      - \${LESSON_SLUG}-network
    entrypoint: >
      /bin/sh -c "
      sleep 3;
      mc alias set local http://minio:9000 minioadmin minioadmin123;
      mc mb local/video-raw --ignore-existing;
      mc mb local/video-hls --ignore-existing;
      echo 'lab raw placeholder' | mc pipe local/video-raw/movie.mp4;
      printf '#EXTM3U\\n#EXT-X-VERSION:3\\n#EXT-X-STREAM-INF:BANDWIDTH=5800000,RESOLUTION=1920x1080\\n/movie/480p/index.m3u8\\n' | mc pipe local/video-hls/movie/index.m3u8;
      echo 'fake-ts-segment' | mc pipe local/video-hls/movie/seg_001.ts;
      echo 'fake-ts-chunk-1' | mc pipe local/video-hls/movie/chunk_1.ts;
      echo 'fake-ts-chunk-2' | mc pipe local/video-hls/movie/chunk_2.ts;
      echo MinIO init done;
      "
`

function writeCompose(lessonSlug, serviceName, opts) {
    const { withPostgres, withNginx, apiDependsMinioInit } = opts
    const net = `${lessonSlug}-network`
    let deps = "      - redis\n"
    if (withPostgres) deps += "      - db\n"
    if (apiDependsMinioInit) deps += "      - minio-init\n"
    deps += "      - minio\n"

    let env = `      - PORT=3000
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - MINIO_ENDPOINT=minio
      - MINIO_PORT=9000
      - MINIO_ACCESS_KEY=minioadmin
      - MINIO_SECRET_KEY=minioadmin123
      - MINIO_BUCKET_RAW=video-raw
      - MINIO_BUCKET_HLS=video-hls
      - MINIO_USE_SSL=false
`
    if (withPostgres) {
        env += `      - POSTGRES_HOST=db
      - POSTGRES_PORT=5432
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${serviceName.replace(/-/g, "_")}
`
    }

    const nginxBlock = withNginx
        ? `
  # NGINX edge CDN — proxy_cache trước origin (lesson 2).
  # (EN: NGINX edge CDN — proxy_cache in front of origin.)
  nginx-cdn:
    image: nginx:1.27-alpine
    container_name: ${lessonSlug}-nginx
    ports:
      # Edge HTTP — host 8080 (curl HIT/MISS demo).
      # (EN: Edge HTTP — host 8080 for HIT/MISS demo.)
      - "8080:8080"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - nginx_cache:/var/cache/nginx
    networks:
      - ${net}
    depends_on:
      - api
`
        : ""

    const vols = withNginx
        ? `
volumes:
  minio_data:
  nginx_cache:`
        : `
volumes:
  minio_data:`

    const yaml = `name: ${lessonSlug}
# Vi: Docker Compose — ${lessonSlug} (MinIO + NestJS${withNginx ? " + NGINX edge" : ""}${opts.withFfmpeg ? " + FFmpeg" : ""}).
# (EN: Docker Compose stack with MinIO${withNginx ? ", NGINX edge" : ""}${opts.withFfmpeg ? ", FFmpeg" : ""}.)

services:
  api:
    container_name: ${lessonSlug}-api
    build:
      context: ../${serviceName}
      dockerfile: Dockerfile
    ports:
      # HTTP API — host 3000.
      # (EN: HTTP API — host port 3000.)
      - "3000:3000"
    environment:
${env}    networks:
      - ${net}
    depends_on:
${deps}
${withPostgres ? `  db:
    image: postgres:16-alpine
    container_name: ${lessonSlug}-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${serviceName.replace(/-/g, "_")}
    ports:
      - "5432:5432"
    networks:
      - ${net}

` : ""}  redis:
    image: redis:7-alpine
    container_name: ${lessonSlug}-redis
    ports:
      - "6379:6379"
    networks:
      - ${net}

${minioComposeBlock.replace(/\$\{LESSON_SLUG\}/g, lessonSlug)}
${nginxBlock}
networks:
  ${net}:
    name: ${net}
${vols}
`
    write(`${lessonSlug}/.docker/compose.yaml`, yaml)
}

// --- NGINX ---
write(
    "2-cdn-caching-and-edge-delivery/.docker/nginx/nginx.conf",
    `worker_processes 1;

events {
    worker_connections 1024;
}

http {
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cdn_cache:10m max_size=100m inactive=60m;

    server {
        listen 8080;

        # Edge CDN — cache segment requests, origin shield via proxy_cache_lock.
        # (EN: Edge CDN — cache segments; origin shield via proxy_cache_lock.)
        location /cdn/ {
            proxy_cache cdn_cache;
            proxy_cache_valid 200 1h;
            proxy_cache_lock on;
            proxy_cache_use_stale updating;
            add_header X-Cache $upstream_cache_status always;
            proxy_pass http://api:3000/api/cdn/;
        }
    }
}
`,
)

// --- Lesson 0 ---
const L0 = "0-video-ingestion-and-transcoding/transcode-service"
const L0_LESSON = "0-video-ingestion-and-transcoding"

writeCompose(L0_LESSON, "transcode-service", {
    withPostgres: true,
    withNginx: false,
    apiDependsMinioInit: true,
    withFfmpeg: true,
})
patchEnv(L0, MINIO_ENV)
patchPackage(
    L0,
    {
        "@aws-sdk/client-s3": "^3.700.0",
        "fluent-ffmpeg": "^2.1.3",
        "ffmpeg-static": "^5.2.0",
    },
    { "@types/fluent-ffmpeg": "^2.1.28" },
)
write(`${L0}/Dockerfile`, dockerfileWithFfmpeg())
write(`${L0}/src/config/minio.config.ts`, minioConfig)
write(`${L0}/src/config/index.ts`, configIndexWithMinio)
write(`${L0}/src/storage/index.ts`, `export * from "./minio-storage.service"\n`)
write(`${L0}/src/storage/minio-storage.service.ts`, minioStorageService)
patchAppModule(L0, "transcode", "TranscodeModule", true)

write(
    `${L0}/src/transcode/ffmpeg-lab.service.ts`,
    `/**
 * FFmpeg lab — fluent-ffmpeg + ffmpeg-static, tạo HLS segment demo.
 * (EN: FFmpeg lab — fluent-ffmpeg + ffmpeg-static for demo HLS output.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import {
    mkdir,
    readdir,
    readFile,
    rm,
} from "node:fs/promises"
import {
    join,
} from "node:path"
import {
    MinioStorageService,
} from "../storage"

if (typeof ffmpegStatic === "string") {
    ffmpeg.setFfmpegPath(ffmpegStatic)
}

@Injectable()
export class FfmpegLabService {
    private readonly logger = new Logger(FfmpegLabService.name)

    constructor(
        private readonly minio: MinioStorageService,
    ) {}

    /**
     * Logic — transcode videoKey thành HLS segment, upload MinIO video-hls.
     * Code — fluent-ffmpeg lavfi → .m3u8 + .ts → PutObject từng file.
     * (EN Logic: Transcode to HLS segments and upload to MinIO.)
     * (EN Code: fluent-ffmpeg → HLS files → PutObject.)
     */
    async transcodeToHls(videoKey: string): Promise<{
        outputPrefix: string
        uploadedKeys: Array<string>
    }> {
        const baseName = videoKey.replace(/\\.mp4$/i, "") || "movie"
        const workDir = join("/tmp", \`transcode-\${baseName}-\${Date.now()}\`)
        const outDir = join(workDir, "out")
        await mkdir(outDir, { recursive: true })
        const inputPath = join(workDir, "input.mp4")

        await this.ensureInputMp4(videoKey, inputPath)

        const manifestPath = join(outDir, "stream.m3u8")
        await this.runHls(inputPath, manifestPath)

        const uploadedKeys: Array<string> = []
        const files = await readdir(outDir)
        for (const file of files) {
            const body = await readFile(join(outDir, file))
            const key = \`\${baseName}/\${file}\`
            const contentType = file.endsWith(".m3u8")
                ? "application/vnd.apple.mpegurl"
                : "video/mp2t"
            await this.minio.putHlsObject(key, body, contentType)
            uploadedKeys.push(key)
        }

        await rm(workDir, { recursive: true, force: true })
        const outputPrefix = \`\${baseName}/\`
        this.logger.log(\`Uploaded \${uploadedKeys.length} objects to video-hls/\${outputPrefix}\`)
        return { outputPrefix, uploadedKeys }
    }

    /**
     * Logic — có raw trên MinIO thì tải; không thì sinh test pattern 3s.
     * Code — getRawObject hoặc ffmpeg lavfi testsrc.
     * (EN Logic: Use raw from MinIO or generate test pattern.)
     * (EN Code: getRawObject or lavfi testsrc.)
     */
    private async ensureInputMp4(videoKey: string, inputPath: string): Promise<void> {
        const raw = await this.minio.getRawObject(videoKey)
        if (raw && raw.length > 0) {
            const { writeFile } = await import("node:fs/promises")
            await writeFile(inputPath, raw)
            return
        }
        await new Promise<void>((resolve, reject) => {
            ffmpeg()
                .input("testsrc=duration=3:size=640x360:rate=30")
                .inputFormat("lavfi")
                .outputOptions(["-c:v libx264", "-pix_fmt yuv420p", "-an"])
                .output(inputPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run()
        })
    }

    /**
     * Logic — xuất HLS 1s/segment cho lab nhanh.
     * Code — -f hls -hls_time 1.
     * (EN Logic: Short HLS segments for fast lab.)
     * (EN Code: -f hls -hls_time 1.)
     */
    private runHls(inputPath: string, manifestPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .outputOptions([
                    "-f hls",
                    "-hls_time 1",
                    "-hls_list_size 0",
                    "-hls_segment_filename",
                    manifestPath.replace(".m3u8", "_%03d.ts"),
                ])
                .output(manifestPath)
                .on("end", () => resolve())
                .on("error", (err) => reject(err))
                .run()
        })
    }
}
`,
)

write(
    `${L0}/src/transcode/transcode-worker.service.ts`,
    `/**
 * Worker — xử lý job trong Redis queue, gọi FFmpeg + cập nhật Postgres.
 * (EN: Worker — process Redis queue jobs, FFmpeg + Postgres update.)
 */
import {
    Injectable,
    Logger,
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
    TranscodeJobEntity,
} from "../entities"
import {
    FfmpegLabService,
} from "./ffmpeg-lab.service"

const QUEUE_KEY = "transcode:queue"

@Injectable()
export class TranscodeWorkerService implements OnModuleInit {
    private readonly logger = new Logger(TranscodeWorkerService.name)
    private redis!: Redis
    private draining = false

    constructor(
        private readonly config: ConfigService,
        private readonly ffmpegLab: FfmpegLabService,
        @InjectRepository(TranscodeJobEntity)
        private readonly jobs: Repository<TranscodeJobEntity>,
    ) {}

    /**
     * Logic — poll Redis queue và xử lý job nền.
     * Code — OnModuleInit → setInterval BRPOP.
     * (EN Logic: Poll queue and process jobs in background.)
     * (EN Code: OnModuleInit → interval BRPOP.)
     */
    onModuleInit(): void {
        const redis = this.config.getOrThrow<RedisConfig>("redis")
        this.redis = new Redis({
            host: redis.host,
            port: redis.port,
            lazyConnect: true,
        })
        void this.connectAndDrain()
    }

    /**
     * Logic — đẩy jobId vào queue (sau khi tạo job).
     * Code — LPUSH transcode:queue.
     * (EN Logic: Enqueue job id.)
     * (EN Code: LPUSH.)
     */
    async enqueue(jobId: string): Promise<void> {
        await this.connectRedis()
        await this.redis.lpush(QUEUE_KEY, jobId)
    }

    /**
     * Logic — xử lý một job: FFmpeg → MinIO → completed.
     * Code — update status processing → transcodeToHls → save completed.
     * (EN Logic: Process one transcode job end-to-end.)
     * (EN Code: status updates + transcodeToHls.)
     */
    async processJob(jobId: string): Promise<void> {
        const job = await this.jobs.findOne({ where: { jobId } })
        if (!job) {
            return
        }
        job.status = "processing"
        await this.jobs.save(job)
        try {
            const result = await this.ffmpegLab.transcodeToHls(job.videoKey)
            job.status = "completed"
            job.pipeline = [
                ...job.pipeline,
                \`uploaded \${result.uploadedKeys.length} objects to video-hls\`,
            ]
            await this.jobs.save(job)
        } catch (caught) {
            job.status = "failed"
            await this.jobs.save(job)
            const msg = caught instanceof Error ? caught.message : String(caught)
            this.logger.error(\`Job \${jobId} failed: \${msg}\`)
        }
    }

    private async connectAndDrain(): Promise<void> {
        if (this.draining) {
            return
        }
        this.draining = true
        await this.connectRedis()
        setInterval(() => {
            void this.drainOnce()
        }, 2000)
    }

    private async drainOnce(): Promise<void> {
        await this.connectRedis()
        const jobId = await this.redis.rpop(QUEUE_KEY)
        if (jobId) {
            await this.processJob(jobId)
        }
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status === "wait") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${L0}/src/transcode/transcode.service.ts`,
    `/**
 * Service transcoding — Postgres job + Redis queue + worker FFmpeg/MinIO.
 * (EN: Transcoding — Postgres jobs + Redis queue + FFmpeg/MinIO worker.)
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
    TranscodeJobEntity,
    type RenditionRow,
} from "../entities"
import {
    TranscodeWorkerService,
} from "./transcode-worker.service"

@Injectable()
export class TranscodeService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(TranscodeJobEntity)
        private readonly jobs: Repository<TranscodeJobEntity>,
        private readonly worker: TranscodeWorkerService,
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
     * (EN Code: quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — tạo job, enqueue worker FFmpeg → MinIO.
     * Code — save queued → worker.enqueue.
     * (EN Logic: Create job and enqueue FFmpeg worker.)
     * (EN Code: save + enqueue.)
     */
    async createJob(videoKey: string) {
        const jobId = \`job_\${Date.now()}\`
        const renditions: Array<RenditionRow> = [
            { height: 1080, bitrateKbps: 5800, outputKey: \`\${videoKey}/1080p/index.m3u8\` },
            { height: 720, bitrateKbps: 2800, outputKey: \`\${videoKey}/720p/index.m3u8\` },
            { height: 480, bitrateKbps: 1200, outputKey: \`\${videoKey}/480p/index.m3u8\` },
        ]
        const job = {
            jobId,
            videoKey,
            status: "queued",
            pipeline: [
                "ingest raw object (MinIO video-raw)",
                "fluent-ffmpeg HLS packaging",
                "upload segments to MinIO video-hls",
            ],
            renditions,
        }
        await this.jobs.save(job)
        await this.worker.enqueue(jobId)
        await this.connectRedis()
        return {
            ...job,
            queue: "transcode:queue",
            queueDepth: await this.redis.llen("transcode:queue"),
            note: "Worker drains queue every 2s — poll GET job until status completed.",
        }
    }

    /**
     * Logic — đọc job từ Postgres.
     * Code — findOne jobId.
     * (EN Logic: Read job from Postgres.)
     * (EN Code: findOne.)
     */
    async getJob(jobId: string) {
        const job = await this.jobs.findOne({ where: { jobId } })
        if (!job) {
            return {
                jobId,
                status: "not_found",
                hint: "Create a job first with POST /api/videos/transcode.",
            }
        }
        return job
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status === "wait") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${L0}/src/transcode/transcode.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    MinioStorageService,
} from "../storage"
import {
    TranscodeJobEntity,
} from "../entities"
import {
    FfmpegLabService,
} from "./ffmpeg-lab.service"
import {
    TranscodeController,
} from "./transcode.controller"
import {
    TranscodeSeedService,
} from "./transcode-seed.service"
import {
    TranscodeService,
} from "./transcode.service"
import {
    TranscodeWorkerService,
} from "./transcode-worker.service"

/**
 * Feature module — transcoding + FFmpeg + MinIO.
 * (EN: Feature module — transcoding + FFmpeg + MinIO.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([TranscodeJobEntity])],
    controllers: [TranscodeController],
    providers: [
        MinioStorageService,
        FfmpegLabService,
        TranscodeWorkerService,
        TranscodeService,
        TranscodeSeedService,
    ],
    exports: [TranscodeService],
})
export class TranscodeModule {}
`,
)

// --- Lesson 1 ---
const L1 = "1-adaptive-bitrate-streaming-hls-dash/streaming-service"
const L1_LESSON = "1-adaptive-bitrate-streaming-hls-dash"

writeCompose(L1_LESSON, "streaming-service", {
    withPostgres: true,
    withNginx: false,
    apiDependsMinioInit: true,
    withFfmpeg: false,
})
patchEnv(L1, MINIO_ENV)
patchPackage(L1, { "@aws-sdk/client-s3": "^3.700.0" })
write(`${L1}/src/config/minio.config.ts`, minioConfig)
write(`${L1}/src/config/index.ts`, configIndexWithMinio)
write(`${L1}/src/storage/index.ts`, `export * from "./minio-storage.service"\n`)
write(`${L1}/src/storage/minio-storage.service.ts`, minioStorageService)
patchAppModule(L1, "streaming", "StreamingModule", true)

write(
    `${L1}/src/entities/postgresql/primary/video-segment.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity segment — metadata + MinIO object key.
 * (EN: Segment metadata + MinIO object key.)
 */
@Entity("video_segments")
export class VideoSegmentEntity {
    @PrimaryColumn()
    videoId!: string

    @PrimaryColumn()
    segmentName!: string

    @Column()
    objectKey!: string

    @Column({ default: "video/mp2t" })
    contentType!: string

    @Column({ default: "public, max-age=31536000, immutable" })
    cacheControl!: string
}
`,
)

write(
    `${L1}/src/streaming/streaming-seed.service.ts`,
    `/**
 * Seed catalog video + segment demo vào Postgres.
 * (EN: Seed video catalog and segments into Postgres.)
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
    VideoRenditionEntity,
    VideoSegmentEntity,
} from "../entities"

@Injectable()
export class StreamingSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(VideoRenditionEntity)
        private readonly renditions: Repository<VideoRenditionEntity>,
        @InjectRepository(VideoSegmentEntity)
        private readonly segments: Repository<VideoSegmentEntity>,
    ) {}

    /**
     * Logic — seed movie renditions + segment trỏ MinIO objectKey.
     * Code — save rows với objectKey movie/seg_001.ts.
     * (EN Logic: Seed rows pointing at MinIO keys.)
     * (EN Code: save with objectKey.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.renditions.count()) > 0) {
            return
        }
        const videoId = "movie"
        await this.renditions.save([
            {
                videoId,
                height: 1080,
                bitrateKbps: 5800,
                resolution: "1920x1080",
                playlistPath: \`/\${videoId}/1080p/index.m3u8\`,
            },
            {
                videoId,
                height: 720,
                bitrateKbps: 2800,
                resolution: "1280x720",
                playlistPath: \`/\${videoId}/720p/index.m3u8\`,
            },
            {
                videoId,
                height: 480,
                bitrateKbps: 1200,
                resolution: "854x480",
                playlistPath: \`/\${videoId}/480p/index.m3u8\`,
            },
        ])
        await this.segments.save({
            videoId,
            segmentName: "seg_001.ts",
            objectKey: "movie/seg_001.ts",
            contentType: "video/mp2t",
            cacheControl: "public, max-age=31536000, immutable",
        })
    }
}
`,
)

write(
    `${L1}/src/streaming/streaming.service.ts`,
    `/**
 * Service HLS — manifest Postgres/Redis; segment bytes từ MinIO.
 * (EN: HLS service — manifest from DB/Redis; segment bytes from MinIO.)
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
    VideoRenditionEntity,
    VideoSegmentEntity,
} from "../entities"
import {
    MinioStorageService,
} from "../storage"

@Injectable()
export class StreamingService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        private readonly minio: MinioStorageService,
        @InjectRepository(VideoRenditionEntity)
        private readonly renditions: Repository<VideoRenditionEntity>,
        @InjectRepository(VideoSegmentEntity)
        private readonly segments: Repository<VideoSegmentEntity>,
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
     * (EN Code: quit().)
     */
    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    /**
     * Logic — master m3u8 từ DB; ưu tiên manifest trên MinIO nếu có.
     * Code — getHlsObject movie/index.m3u8 hoặc build từ renditions.
     * (EN Logic: Master manifest from MinIO or DB-built.)
     * (EN Code: GetObject or build lines.)
     */
    async getManifest(videoId: string): Promise<string> {
        const minioKey = \`\${videoId}/index.m3u8\`
        if (await this.minio.hlsObjectExists(minioKey)) {
            const body = await this.minio.getHlsObject(minioKey)
            const manifest = body.toString("utf8")
            await this.connectRedis()
            await this.redis.set(\`hls:manifest:\${videoId}\`, manifest, "EX", 300)
            return manifest
        }
        const rows = await this.renditions.find({
            where: { videoId },
            order: { height: "DESC" },
        })
        const lines = [
            "#EXTM3U",
            "#EXT-X-VERSION:3",
            ...rows.flatMap((row) => [
                \`#EXT-X-STREAM-INF:BANDWIDTH=\${row.bitrateKbps * 1000},RESOLUTION=\${row.resolution}\`,
                row.playlistPath,
            ]),
        ]
        const manifest = lines.join("\\n")
        await this.connectRedis()
        await this.redis.set(\`hls:manifest:\${videoId}\`, manifest, "EX", 300)
        return manifest
    }

    /**
     * Logic — stream segment .ts từ MinIO object storage.
     * Code — getHlsObject(segment.objectKey).
     * (EN Logic: Stream .ts segment from MinIO.)
     * (EN Code: getHlsObject.)
     */
    async getSegmentBytes(videoId: string, segmentName: string) {
        const segment = await this.segments.findOne({
            where: { videoId, segmentName },
        })
        if (!segment) {
            return null
        }
        const body = await this.minio.getHlsObject(segment.objectKey)
        return {
            body,
            contentType: segment.contentType,
            cacheControl: segment.cacheControl,
            objectKey: segment.objectKey,
            storage: "minio:video-hls",
        }
    }

    private async connectRedis(): Promise<void> {
        if (this.redis.status === "wait") {
            await this.redis.connect()
        }
    }
}
`,
)

write(
    `${L1}/src/streaming/streaming.controller.ts`,
    `import {
    Controller,
    Get,
    Header,
    NotFoundException,
    Param,
    StreamableFile,
} from "@nestjs/common"
import {
    StreamingService,
} from "./streaming.service"

/**
 * HTTP controller — HLS từ MinIO (lesson 1).
 * (EN: HTTP controller — HLS from MinIO (lesson 1).)
 */
@Controller("api/videos")
export class StreamingController {
    constructor(
        private readonly service: StreamingService,
    ) {}

    /**
     * Logic — master playlist HLS.
     * Code — GET index.m3u8 → getManifest.
     * (EN Logic: HLS master playlist.)
     * (EN Code: GET index.m3u8.)
     */
    @Get("stream/:videoId/index.m3u8")
    @Header("Content-Type", "application/vnd.apple.mpegurl")
    getManifest(
        @Param("videoId") videoId: string,
    ): ReturnType<StreamingService["getManifest"]> {
        return this.service.getManifest(videoId)
    }

    /**
     * Logic — trả binary segment từ MinIO.
     * Code — GET segment → StreamableFile buffer.
     * (EN Logic: Return segment bytes from MinIO.)
     * (EN Code: GET → StreamableFile.)
     */
    @Get("stream/:videoId/:segmentName")
    async getSegment(
        @Param("videoId") videoId: string,
        @Param("segmentName") segmentName: string,
    ): Promise<StreamableFile> {
        const result = await this.service.getSegmentBytes(videoId, segmentName)
        if (!result) {
            throw new NotFoundException({
                videoId,
                segmentName,
                hint: "Try seg_001.ts after minio-init.",
            })
        }
        return new StreamableFile(result.body, {
            type: result.contentType,
            disposition: \`inline; filename="\${segmentName}"\`,
        })
    }
}
`,
)

write(
    `${L1}/src/streaming/streaming.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    MinioStorageService,
} from "../storage"
import {
    VideoRenditionEntity,
    VideoSegmentEntity,
} from "../entities"
import {
    StreamingController,
} from "./streaming.controller"
import {
    StreamingSeedService,
} from "./streaming-seed.service"
import {
    StreamingService,
} from "./streaming.service"

/**
 * Feature module — HLS streaming + MinIO.
 * (EN: Feature module — HLS streaming + MinIO.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([VideoRenditionEntity, VideoSegmentEntity])],
    controllers: [StreamingController],
    providers: [MinioStorageService, StreamingService, StreamingSeedService],
    exports: [StreamingService],
})
export class StreamingModule {}
`,
)

// --- Lesson 2 ---
const L2 = "2-cdn-caching-and-edge-delivery/cdn-origin"
const L2_LESSON = "2-cdn-caching-and-edge-delivery"

writeCompose(L2_LESSON, "cdn-origin", {
    withPostgres: true,
    withNginx: true,
    apiDependsMinioInit: true,
    withFfmpeg: false,
})
patchEnv(L2, MINIO_ENV)
patchPackage(L2, { "@aws-sdk/client-s3": "^3.700.0" })
write(`${L2}/src/config/minio.config.ts`, minioConfig)
write(`${L2}/src/config/index.ts`, configIndexWithMinio)
write(`${L2}/src/storage/index.ts`, `export * from "./minio-storage.service"\n`)
write(`${L2}/src/storage/minio-storage.service.ts`, minioStorageService)
patchAppModule(L2, "cdn", "CdnModule", true)

write(
    `${L2}/src/entities/postgresql/primary/cdn-chunk.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity chunk — catalog + MinIO object key (origin).
 * (EN: Chunk catalog + MinIO object key at origin.)
 */
@Entity("cdn_chunks")
export class CdnChunkEntity {
    @PrimaryColumn()
    videoId!: string

    @PrimaryColumn()
    chunkName!: string

    @Column()
    objectKey!: string

    @Column()
    contentType!: string
}
`,
)

write(
    `${L2}/src/cdn/cdn-seed.service.ts`,
    `/**
 * Seed catalog chunk CDN — Postgres + MinIO keys.
 * (EN: Seed CDN chunk catalog — Postgres + MinIO keys.)
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
    CdnChunkEntity,
} from "../entities"

@Injectable()
export class CdnSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(CdnChunkEntity)
        private readonly chunks: Repository<CdnChunkEntity>,
    ) {}

    /**
     * Logic — seed chunk catalog trỏ MinIO video-hls.
     * Code — save movie/chunk_*.ts objectKeys.
     * (EN Logic: Seed chunks pointing at MinIO.)
     * (EN Code: save catalog rows.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.chunks.count()) > 0) {
            return
        }
        await this.chunks.save([
            {
                videoId: "movie",
                chunkName: "chunk_1.ts",
                objectKey: "movie/chunk_1.ts",
                contentType: "video/mp2t",
            },
            {
                videoId: "movie",
                chunkName: "chunk_2.ts",
                objectKey: "movie/chunk_2.ts",
                contentType: "video/mp2t",
            },
        ])
    }
}
`,
)

write(
    `${L2}/src/cdn/cdn.service.ts`,
    `/**
 * Service origin CDN — đọc segment bytes từ MinIO (edge = NGINX).
 * (EN: CDN origin — serve segment bytes from MinIO (edge = NGINX).)
 */
import {
    Injectable,
} from "@nestjs/common"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    CdnChunkEntity,
} from "../entities"
import {
    MinioStorageService,
} from "../storage"

@Injectable()
export class CdnService {
    constructor(
        private readonly minio: MinioStorageService,
        @InjectRepository(CdnChunkEntity)
        private readonly chunks: Repository<CdnChunkEntity>,
    ) {}

    /**
     * Logic — origin fetch segment từ MinIO (NGINX cache phía trước).
     * Code — find catalog → getHlsObject(objectKey).
     * (EN Logic: Origin serves segment from MinIO; NGINX caches HTTP.)
     * (EN Code: findOne → getHlsObject.)
     */
    async serveChunk(videoId: string, chunkName: string) {
        const chunk = await this.chunks.findOne({
            where: { videoId, chunkName },
        })
        if (!chunk) {
            return null
        }
        const body = await this.minio.getHlsObject(chunk.objectKey)
        return {
            body,
            contentType: chunk.contentType,
            videoId,
            chunkName,
            objectKey: chunk.objectKey,
            origin: "minio:video-hls",
            cacheHint: "Use http://localhost:8080/cdn/... twice — X-Cache MISS then HIT",
        }
    }

    /**
     * Logic — hướng dẫn kiểm tra edge cache (NGINX).
     * Code — static hint (không Redis edge giả lập).
     * (EN Logic: How to verify edge cache via NGINX.)
     * (EN Code: static instructions.)
     */
    getCacheStatus() {
        return {
            edge: "nginx-cdn:8080",
            checkCommand:
                "curl -i http://localhost:8080/cdn/video/movie/chunk_1.ts (run twice)",
            expect: "X-Cache: MISS then HIT",
            originDirect: "http://localhost:3000/api/cdn/video/movie/chunk_1.ts",
        }
    }
}
`,
)

write(
    `${L2}/src/cdn/cdn.controller.ts`,
    `import {
    Controller,
    Get,
    Header,
    NotFoundException,
    Param,
    StreamableFile,
} from "@nestjs/common"
import {
    CdnService,
} from "./cdn.service"

/**
 * HTTP controller — CDN origin serves MinIO bytes (lesson 2).
 * (EN: HTTP controller — CDN origin from MinIO (lesson 2).)
 */
@Controller("api/cdn")
export class CdnController {
    constructor(
        private readonly service: CdnService,
    ) {}

    /**
     * Logic — origin trả segment (NGINX edge cache HTTP phía trước).
     * Code — GET → StreamableFile từ MinIO.
     * (EN Logic: Origin segment; NGINX caches at edge.)
     * (EN Code: GET → StreamableFile.)
     */
    @Get("video/:videoId/:chunkName")
    @Header("Cache-Control", "public, max-age=3600")
    async serveChunk(
        @Param("videoId") videoId: string,
        @Param("chunkName") chunkName: string,
    ): Promise<StreamableFile> {
        const result = await this.service.serveChunk(videoId, chunkName)
        if (!result) {
            throw new NotFoundException({ videoId, chunkName })
        }
        return new StreamableFile(result.body, {
            type: result.contentType,
            disposition: \`inline; filename="\${chunkName}"\`,
        })
    }

    /**
     * Logic — hướng dẫn test HIT/MISS trên NGINX :8080.
     * Code — GET cache-status.
     * (EN Logic: Instructions for NGINX HIT/MISS test.)
     * (EN Code: GET cache-status.)
     */
    @Get("cache-status")
    getCacheStatus(): ReturnType<CdnService["getCacheStatus"]> {
        return this.service.getCacheStatus()
    }
}
`,
)

write(
    `${L2}/src/cdn/cdn.module.ts`,
    `import {
    Module,
} from "@nestjs/common"
import {
    TypeOrmModule,
} from "@nestjs/typeorm"
import {
    MinioStorageService,
} from "../storage"
import {
    CdnChunkEntity,
} from "../entities"
import {
    CdnController,
} from "./cdn.controller"
import {
    CdnSeedService,
} from "./cdn-seed.service"
import {
    CdnService,
} from "./cdn.service"

/**
 * Feature module — CDN origin + MinIO.
 * (EN: Feature module — CDN origin + MinIO.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([CdnChunkEntity])],
    controllers: [CdnController],
    providers: [MinioStorageService, CdnService, CdnSeedService],
    exports: [CdnService],
})
export class CdnModule {}
`,
)

console.log("Module 12 phase 2 (MinIO + FFmpeg + NGINX) applied")
