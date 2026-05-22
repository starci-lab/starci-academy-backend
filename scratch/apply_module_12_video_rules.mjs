/**
 * Module 12 — video streaming: coding-rules, Postgres seed, Redis, JSDoc, TS fixes.
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

const ENV = {
    "0-video-ingestion-and-transcoding/transcode-service": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "transcode_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
    "1-adaptive-bitrate-streaming-hls-dash/streaming-service": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "streaming_service",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
    "2-cdn-caching-and-edge-delivery/cdn-origin": {
        PORT: "3000",
        POSTGRES_HOST: "db",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "cdn_origin",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
}

function write(rel, content) {
    const full = path.join(MODULE, rel)
    fs.mkdirSync(path.dirname(full), { recursive: true })
    fs.writeFileSync(full, content, "utf8")
}

function writeEnv(rel, vars) {
    const lines = [
        "# --- Local / Docker (khớp compose.yaml và src/config/) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml and src/config/.)",
        ...Object.entries(vars).map(([k, v]) => `${k}=${v}`),
        "",
    ]
    write(`${rel}/.env`, lines.join("\n"))
}

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

function appModule(featureImport, featureFolder) {
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
    ${featureImport},
} from "./${featureFolder}"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, databaseConfig, redisConfig],
        }),
${typeOrmRoot},
        ${featureImport},
    ],
})
export class AppModule {}
`
}

const configIndex = `/**
 * Barrel re-export thư mục \`config/\`.
 * (EN: Barrel re-export for \`config/\` folder.)
 */
export * from "./app.config"
export * from "./database.config"
export * from "./redis.config"
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

for (const [rel, vars] of Object.entries(ENV)) {
    writeEnv(rel, vars)
}

// --- Lesson 0: transcode ---
const L0 = "0-video-ingestion-and-transcoding/transcode-service"
write(`${L0}/src/config/redis.config.ts`, redisConfig)
write(`${L0}/src/config/database.config.ts`, databaseConfig("transcode_service"))
write(`${L0}/src/config/index.ts`, configIndex)
write(`${L0}/src/app.module.ts`, appModule("TranscodeModule", "transcode"))
write(`${L0}/src/bootstrap.ts`, bootstrap)

write(
    `${L0}/src/entities/postgresql/primary/transcode-job.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

export type RenditionRow = {
    height: number
    bitrateKbps: number
    outputKey: string
}

/**
 * Entity job transcoding — nguồn sự thật demo trong Postgres.
 * (EN: Transcoding job entity — demo source of truth in Postgres.)
 */
@Entity("transcode_jobs")
export class TranscodeJobEntity {
    @PrimaryColumn()
    jobId!: string

    @Column()
    videoKey!: string

    @Column()
    status!: string

    @Column({ type: "simple-json" })
    pipeline!: Array<string>

    @Column({ type: "simple-json" })
    renditions!: Array<RenditionRow>
}
`,
)

write(`${L0}/src/entities/postgresql/primary/index.ts`, `export * from "./transcode-job.entity"\n`)
write(`${L0}/src/entities/postgresql/index.ts`, `export * from "./primary"\n`)
write(`${L0}/src/entities/index.ts`, `export * from "./postgresql"\n`)

write(
    `${L0}/src/transcode/dto/create-transcode.dto.ts`,
    `import {
    IsOptional,
    IsString,
} from "class-validator"

/**
 * DTO tạo job transcoding — videoKey tùy chọn.
 * (EN: Create transcode job DTO — optional videoKey.)
 */
export class CreateTranscodeDto {
    @IsOptional()
    @IsString()
    videoKey?: string
}
`,
)

write(`${L0}/src/transcode/dto/index.ts`, `export * from "./create-transcode.dto"\n`)

write(
    `${L0}/src/transcode/transcode-seed.service.ts`,
    `/**
 * Seed job transcoding demo vào Postgres khi DB trống.
 * (EN: Seed demo transcode jobs into Postgres when DB is empty.)
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
    TranscodeJobEntity,
} from "../entities"

@Injectable()
export class TranscodeSeedService implements OnModuleInit {
    constructor(
        @InjectRepository(TranscodeJobEntity)
        private readonly jobs: Repository<TranscodeJobEntity>,
    ) {}

    /**
     * Logic — khi DB trống, có sẵn job demo để GET /transcode/:jobId.
     * Code — OnModuleInit → count() === 0 → save job_demo_movie.
     * (EN Logic: Seed a demo job when DB has no rows.)
     * (EN Code: OnModuleInit → count === 0 → save demo job.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.jobs.count()) > 0) {
            return
        }
        const videoKey = "movie.mp4"
        await this.jobs.save({
            jobId: "job_demo_movie",
            videoKey,
            status: "completed",
            pipeline: [
                "ingest raw object",
                "probe metadata",
                "transcode renditions",
                "package HLS segments",
                "store outputs",
            ],
            renditions: [
                { height: 1080, bitrateKbps: 5800, outputKey: \`\${videoKey}/1080p/index.m3u8\` },
                { height: 720, bitrateKbps: 2800, outputKey: \`\${videoKey}/720p/index.m3u8\` },
                { height: 480, bitrateKbps: 1200, outputKey: \`\${videoKey}/480p/index.m3u8\` },
            ],
        })
    }
}
`,
)

write(
    `${L0}/src/transcode/transcode.service.ts`,
    `/**
 * Service pipeline ingestion + transcoding — Postgres + Redis queue.
 * (EN: Video ingestion and transcoding — Postgres + Redis queue.)
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

@Injectable()
export class TranscodeService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(TranscodeJobEntity)
        private readonly jobs: Repository<TranscodeJobEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client từ config.
     * Code — OnModuleInit → ConfigService redis → new Redis(lazyConnect).
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
     * Logic — tạo job đa bitrate, lưu Postgres, đẩy id vào Redis queue.
     * Code — save TranscodeJobEntity + LPUSH transcode:queue.
     * (EN Logic: Create multi-bitrate job, persist, enqueue in Redis.)
     * (EN Code: save entity + LPUSH queue.)
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
                "ingest raw object",
                "probe metadata",
                "transcode renditions",
                "package HLS segments",
                "store outputs",
            ],
            renditions,
        }
        await this.jobs.save(job)
        await this.connectRedis()
        await this.redis.lpush("transcode:queue", jobId)
        return {
            ...job,
            queue: "transcode:queue",
            queueDepth: await this.redis.llen("transcode:queue"),
        }
    }

    /**
     * Logic — đọc trạng thái job từ Postgres (không in-memory).
     * Code — findOne({ jobId }).
     * (EN Logic: Read job status from Postgres.)
     * (EN Code: findOne by jobId.)
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

    /**
     * Logic — lazy connect Redis lần đầu dùng.
     * Code — status wait → connect().
     * (EN Logic: Lazy Redis connect on first use.)
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
    `${L0}/src/transcode/transcode.controller.ts`,
    `import {
    Body,
    Controller,
    Get,
    Param,
    Post,
} from "@nestjs/common"
import {
    CreateTranscodeDto,
} from "./dto"
import {
    TranscodeService,
} from "./transcode.service"

/**
 * HTTP controller — pipeline transcoding (lesson 0).
 * (EN: HTTP controller — transcoding pipeline (lesson 0).)
 */
@Controller("api/videos")
export class TranscodeController {
    constructor(
        private readonly service: TranscodeService,
    ) {}

    /**
     * Logic — tạo job transcoding đa bitrate cho videoKey.
     * Code — POST /api/videos/transcode → createJob.
     * (EN Logic: Create multi-bitrate transcode job.)
     * (EN Code: POST transcode → createJob.)
     */
    @Post("transcode")
    createJob(
        @Body() body: CreateTranscodeDto,
    ): ReturnType<TranscodeService["createJob"]> {
        return this.service.createJob(body.videoKey ?? "movie.mp4")
    }

    /**
     * Logic — tra cứu job đã lưu trong Postgres.
     * Code — GET /api/videos/transcode/:jobId → getJob.
     * (EN Logic: Look up persisted transcode job.)
     * (EN Code: GET transcode/:jobId → getJob.)
     */
    @Get("transcode/:jobId")
    getJob(
        @Param("jobId") jobId: string,
    ): ReturnType<TranscodeService["getJob"]> {
        return this.service.getJob(jobId)
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
    TranscodeController,
} from "./transcode.controller"
import {
    TranscodeSeedService,
} from "./transcode-seed.service"
import {
    TranscodeService,
} from "./transcode.service"
import {
    TranscodeJobEntity,
} from "../entities"

/**
 * Feature module — transcoding Postgres + Redis queue.
 * (EN: Feature module — transcoding Postgres + Redis queue.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([TranscodeJobEntity])],
    controllers: [TranscodeController],
    providers: [TranscodeService, TranscodeSeedService],
    exports: [TranscodeService],
})
export class TranscodeModule {}
`,
)

// --- Lesson 1: streaming ---
const L1 = "1-adaptive-bitrate-streaming-hls-dash/streaming-service"
write(`${L1}/src/config/redis.config.ts`, redisConfig)
write(`${L1}/src/config/database.config.ts`, databaseConfig("streaming_service"))
write(`${L1}/src/config/index.ts`, configIndex)
write(`${L1}/src/app.module.ts`, appModule("StreamingModule", "streaming"))
write(`${L1}/src/bootstrap.ts`, bootstrap)

write(
    `${L1}/src/entities/postgresql/primary/video-rendition.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from "typeorm"

/**
 * Entity rendition HLS — bitrate/độ phân giải per video.
 * (EN: HLS rendition row per video.)
 */
@Entity("video_renditions")
export class VideoRenditionEntity {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    videoId!: string

    @Column()
    height!: number

    @Column()
    bitrateKbps!: number

    @Column()
    resolution!: string

    @Column()
    playlistPath!: string
}
`,
)

write(
    `${L1}/src/entities/postgresql/primary/video-segment.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity segment — metadata phân đoạn .ts demo.
 * (EN: Segment metadata for demo .ts chunks.)
 */
@Entity("video_segments")
export class VideoSegmentEntity {
    @PrimaryColumn()
    videoId!: string

    @PrimaryColumn()
    segmentName!: string

    @Column({ default: "video/mp2t" })
    contentType!: string

    @Column({ default: "public, max-age=31536000, immutable" })
    cacheControl!: string

    @Column({ default: 1048576 })
    bytesServed!: number
}
`,
)

write(
    `${L1}/src/entities/postgresql/primary/index.ts`,
    `export * from "./video-rendition.entity"
export * from "./video-segment.entity"
`,
)
write(
    `${L1}/src/entities/postgresql/index.ts`,
    `export * from "./primary"\n`,
)
write(
    `${L1}/src/entities/index.ts`,
    `export * from "./postgresql"\n`,
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
     * Logic — khi DB trống, seed movie + renditions + segment mẫu.
     * Code — OnModuleInit → renditions.count() === 0 → save rows.
     * (EN Logic: Seed movie renditions and sample segment when empty.)
     * (EN Code: OnModuleInit → count === 0 → save.)
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
            contentType: "video/mp2t",
            cacheControl: "public, max-age=31536000, immutable",
            bytesServed: 1_048_576,
        })
    }
}
`,
)

write(
    `${L1}/src/streaming/streaming.service.ts`,
    `/**
 * Service HLS adaptive bitrate — manifest từ Postgres + cache Redis.
 * (EN: HLS ABR service — manifest from Postgres + Redis cache.)
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

@Injectable()
export class StreamingService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(VideoRenditionEntity)
        private readonly renditions: Repository<VideoRenditionEntity>,
        @InjectRepository(VideoSegmentEntity)
        private readonly segments: Repository<VideoSegmentEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client từ config.
     * Code — OnModuleInit → new Redis(lazyConnect).
     * (EN Logic: Initialize Redis from config.)
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
     * Logic — build master .m3u8 từ renditions DB; cache manifest trên Redis.
     * Code — find renditions → join EXT-X lines → SET manifest key.
     * (EN Logic: Build master manifest from DB; cache in Redis.)
     * (EN Code: find → m3u8 text → SET.)
     */
    async getManifest(videoId: string): Promise<string> {
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
     * Logic — metadata segment từ Postgres (demo, chưa stream bytes).
     * Code — segments.findOne({ videoId, segmentName }).
     * (EN Logic: Segment metadata from Postgres demo.)
     * (EN Code: findOne segment row.)
     */
    async getSegment(videoId: string, segmentName: string) {
        const segment = await this.segments.findOne({
            where: { videoId, segmentName },
        })
        if (!segment) {
            return {
                videoId,
                segmentName,
                status: "not_found",
                hint: "Seed includes movie/seg_001.ts — try that segment name.",
            }
        }
        return {
            videoId: segment.videoId,
            segmentName: segment.segmentName,
            contentType: segment.contentType,
            cacheControl: segment.cacheControl,
            bytesServed: segment.bytesServed,
            readPattern: "Production serves binary .ts; lab returns metadata JSON.",
        }
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
    `${L1}/src/streaming/streaming.controller.ts`,
    `import {
    Controller,
    Get,
    Header,
    Param,
} from "@nestjs/common"
import {
    StreamingService,
} from "./streaming.service"

/**
 * HTTP controller — HLS adaptive streaming (lesson 1).
 * (EN: HTTP controller — HLS adaptive streaming (lesson 1).)
 */
@Controller("api/videos")
export class StreamingController {
    constructor(
        private readonly service: StreamingService,
    ) {}

    /**
     * Logic — trả master playlist HLS cho videoId.
     * Code — GET stream/:videoId/index.m3u8 → getManifest.
     * (EN Logic: Return HLS master playlist for videoId.)
     * (EN Code: GET index.m3u8 → getManifest.)
     */
    @Get("stream/:videoId/index.m3u8")
    @Header("Content-Type", "application/vnd.apple.mpegurl")
    getManifest(
        @Param("videoId") videoId: string,
    ): ReturnType<StreamingService["getManifest"]> {
        return this.service.getManifest(videoId)
    }

    /**
     * Logic — metadata phân đoạn .ts (lab không trả binary).
     * Code — GET stream/:videoId/:segmentName → getSegment.
     * (EN Logic: Segment metadata for demo verification.)
     * (EN Code: GET segment path → getSegment.)
     */
    @Get("stream/:videoId/:segmentName")
    getSegment(
        @Param("videoId") videoId: string,
        @Param("segmentName") segmentName: string,
    ): ReturnType<StreamingService["getSegment"]> {
        return this.service.getSegment(videoId, segmentName)
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
    StreamingController,
} from "./streaming.controller"
import {
    StreamingSeedService,
} from "./streaming-seed.service"
import {
    StreamingService,
} from "./streaming.service"
import {
    VideoRenditionEntity,
    VideoSegmentEntity,
} from "../entities"

/**
 * Feature module — HLS streaming Postgres + Redis manifest cache.
 * (EN: Feature module — HLS Postgres + Redis manifest cache.)
 */
@Module({
    imports: [
        TypeOrmModule.forFeature([VideoRenditionEntity, VideoSegmentEntity]),
    ],
    controllers: [StreamingController],
    providers: [StreamingService, StreamingSeedService],
    exports: [StreamingService],
})
export class StreamingModule {}
`,
)

// --- Lesson 2: cdn ---
const L2 = "2-cdn-caching-and-edge-delivery/cdn-origin"
write(`${L2}/src/config/redis.config.ts`, redisConfig)
write(`${L2}/src/config/database.config.ts`, databaseConfig("cdn_origin"))
write(`${L2}/src/config/index.ts`, configIndex)
write(`${L2}/src/app.module.ts`, appModule("CdnModule", "cdn"))
write(`${L2}/src/bootstrap.ts`, bootstrap)

write(
    `${L2}/src/entities/postgresql/primary/cdn-chunk.entity.ts`,
    `import {
    Column,
    Entity,
    PrimaryColumn,
} from "typeorm"

/**
 * Entity chunk origin — catalog chunk hợp lệ trên origin.
 * (EN: Origin chunk catalog entity.)
 */
@Entity("cdn_chunks")
export class CdnChunkEntity {
    @PrimaryColumn()
    videoId!: string

    @PrimaryColumn()
    chunkName!: string

    @Column()
    originPath!: string
}
`,
)

write(`${L2}/src/entities/postgresql/primary/index.ts`, `export * from "./cdn-chunk.entity"\n`)
write(`${L2}/src/entities/postgresql/index.ts`, `export * from "./primary"\n`)
write(`${L2}/src/entities/index.ts`, `export * from "./postgresql"\n`)

write(
    `${L2}/src/cdn/cdn-seed.service.ts`,
    `/**
 * Seed catalog chunk CDN vào Postgres khi DB trống.
 * (EN: Seed CDN chunk catalog into Postgres when empty.)
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
     * Logic — khi DB trống, có chunk movie/chunk_1.ts để demo HIT/MISS.
     * Code — OnModuleInit → count() === 0 → save chunks.
     * (EN Logic: Seed origin chunks for CDN HIT/MISS demo.)
     * (EN Code: OnModuleInit → count === 0 → save.)
     */
    async onModuleInit(): Promise<void> {
        if ((await this.chunks.count()) > 0) {
            return
        }
        await this.chunks.save([
            {
                videoId: "movie",
                chunkName: "chunk_1.ts",
                originPath: "/origin/movie/chunk_1.ts",
            },
            {
                videoId: "movie",
                chunkName: "chunk_2.ts",
                originPath: "/origin/movie/chunk_2.ts",
            },
        ])
    }
}
`,
)

write(
    `${L2}/src/cdn/cdn.service.ts`,
    `/**
 * Service CDN edge — catalog Postgres + cache Redis (HIT/MISS).
 * (EN: CDN edge service — Postgres catalog + Redis cache.)
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
    CdnChunkEntity,
} from "../entities"

const CACHED_SET_KEY = "cdn:cached:keys"

@Injectable()
export class CdnService implements OnModuleInit, OnModuleDestroy {
    private redis!: Redis

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(CdnChunkEntity)
        private readonly chunks: Repository<CdnChunkEntity>,
    ) {}

    /**
     * Logic — khởi tạo Redis client từ config.
     * Code — OnModuleInit → new Redis(lazyConnect).
     * (EN Logic: Initialize Redis from config.)
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
     * Logic — phục vụ chunk: MISS lần đầu (origin shield), HIT lần sau từ Redis.
     * Code — EXISTS cacheKey → SET + SADD hoặc trả HIT.
     * (EN Logic: Serve chunk with edge HIT/MISS and origin shielding.)
     * (EN Code: EXISTS → SET/SADD or HIT response.)
     */
    async serveChunk(videoId: string, chunkName: string) {
        const chunk = await this.chunks.findOne({
            where: { videoId, chunkName },
        })
        if (!chunk) {
            return {
                videoId,
                chunkName,
                status: "not_found",
                hint: "Try movie/chunk_1.ts after seed.",
            }
        }
        await this.connectRedis()
        const cacheKey = \`cdn:\${videoId}:\${chunkName}\`
        const exists = await this.redis.exists(cacheKey)
        const cacheStatus = exists ? "HIT" : "MISS"
        if (!exists) {
            await this.redis.set(cacheKey, "1", "EX", 3600)
            await this.redis.sadd(CACHED_SET_KEY, cacheKey)
        }
        return {
            videoId,
            chunkName,
            cacheKey,
            cacheStatus,
            edgeTtlSeconds: 3600,
            originShield: cacheStatus === "MISS" ? "single-origin-fetch" : "not-needed",
            originPath: chunk.originPath,
            headers: {
                "Cache-Control": "public, max-age=3600",
                "X-Cache": cacheStatus,
            },
        }
    }

    /**
     * Logic — liệt kê key đang cache trên edge (Redis SET).
     * Code — SMEMBERS cdn:cached:keys.
     * (EN Logic: List edge-cached object keys.)
     * (EN Code: SMEMBERS cached set.)
     */
    async getCacheStatus() {
        await this.connectRedis()
        const cachedObjects = await this.redis.smembers(CACHED_SET_KEY)
        return {
            cachedObjects,
            cachedObjectCount: cachedObjects.length,
        }
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
    `${L2}/src/cdn/cdn.controller.ts`,
    `import {
    Controller,
    Get,
    Param,
} from "@nestjs/common"
import {
    CdnService,
} from "./cdn.service"

/**
 * HTTP controller — CDN edge cache demo (lesson 2).
 * (EN: HTTP controller — CDN edge cache demo (lesson 2).)
 */
@Controller("api/cdn")
export class CdnController {
    constructor(
        private readonly service: CdnService,
    ) {}

    /**
     * Logic — phục vụ chunk qua lớp CDN (HIT/MISS).
     * Code — GET /api/cdn/video/:videoId/:chunkName → serveChunk.
     * (EN Logic: Serve video chunk through CDN layer.)
     * (EN Code: GET video path → serveChunk.)
     */
    @Get("video/:videoId/:chunkName")
    serveChunk(
        @Param("videoId") videoId: string,
        @Param("chunkName") chunkName: string,
    ): ReturnType<CdnService["serveChunk"]> {
        return this.service.serveChunk(videoId, chunkName)
    }

    /**
     * Logic — xem danh sách object đang cache trên edge.
     * Code — GET /api/cdn/cache-status → getCacheStatus.
     * (EN Logic: Inspect edge cache keys.)
     * (EN Code: GET cache-status → getCacheStatus.)
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
    CdnController,
} from "./cdn.controller"
import {
    CdnSeedService,
} from "./cdn-seed.service"
import {
    CdnService,
} from "./cdn.service"
import {
    CdnChunkEntity,
} from "../entities"

/**
 * Feature module — CDN Postgres catalog + Redis edge cache.
 * (EN: Feature module — CDN Postgres catalog + Redis edge cache.)
 */
@Module({
    imports: [TypeOrmModule.forFeature([CdnChunkEntity])],
    controllers: [CdnController],
    providers: [CdnService, CdnSeedService],
    exports: [CdnService],
})
export class CdnModule {}
`,
)

// Remove stale scaffold files if present
for (const stale of [
    `${L0}/src/entities/postgresql/primary/transcode.entity.ts`,
    `${L0}/src/transcode/dto/create.dto.ts`,
    `${L1}/src/entities/postgresql/primary/streaming.entity.ts`,
    `${L1}/src/streaming/dto/create.dto.ts`,
    `${L1}/src/streaming/dto/index.ts`,
    `${L2}/src/entities/postgresql/primary/cdn.entity.ts`,
    `${L2}/src/cdn/dto/create.dto.ts`,
    `${L2}/src/cdn/dto/index.ts`,
]) {
    const full = path.join(MODULE, stale)
    if (fs.existsSync(full)) {
        fs.unlinkSync(full)
    }
}

write(
    "README.md",
    `# System Design Mastery — Module 12: Large-Scale Video Streaming

## Tổng quan (VI)
Pipeline **transcoding** → **HLS/ABR** → **CDN edge cache**. Tuân \`coding-rules.md\` (§6.4 Postgres seed, Redis runtime).

## Overview (EN)
**Transcoding**, **HLS adaptive streaming**, and **CDN edge caching** labs. Follows \`coding-rules.md\`.

## Lessons
- \`0-video-ingestion-and-transcoding\` — \`transcode-service\` (Postgres jobs + Redis queue)
- \`1-adaptive-bitrate-streaming-hls-dash\` — \`streaming-service\` (Postgres renditions + Redis manifest cache)
- \`2-cdn-caching-and-edge-delivery\` — \`cdn-origin\` (Postgres chunk catalog + Redis HIT/MISS)

## Regenerate
\`\`\`bash
node scratch/apply_module_12_video_rules.mjs
\`\`\`
`,
)

console.log("Module 12 video rules applied")
