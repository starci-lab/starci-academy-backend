/**
 * Refactor module 10: real-time-chat → advanced-message-broker (Kafka labs).
 * Run: node scratch/refactor_module_10_message_broker.mjs
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(__dirname, "..", ".repo")

const OLD_MODULE = "system-design-mastery-module-10-real-time-chat-instant-messaging-system"
const NEW_MODULE = "system-design-mastery-module-10-advanced-message-broker"

const LESSONS = [
    {
        oldLesson: "0-websocket-gateway-and-connection-management",
        newLesson: "0-log-based-messaging-fundamentals",
        composeName: "0-log-based-messaging-fundamentals",
        topic: "platform-events",
        dlqTopic: null,
        services: [
            { name: "ingest-api", kind: "producer", port: 3000, groupId: null },
            { name: "consumer-a", kind: "consumer", port: null, groupId: "broker-lesson0-group", label: "consumer-a" },
            { name: "consumer-b", kind: "consumer", port: null, groupId: "broker-lesson0-group", label: "consumer-b" },
        ],
        oldServices: ["chat-gateway"],
    },
    {
        oldLesson: "1-redis-pubsub-and-presence-servers",
        newLesson: "1-ordering-partitions-and-operations",
        composeName: "1-ordering-partitions-and-operations",
        topic: "ordering-events",
        dlqTopic: null,
        services: [
            { name: "ordering-producer", kind: "producer", port: 3000, groupId: null, requirePartitionKey: true },
            { name: "consumer-fast", kind: "consumer", port: null, groupId: "broker-lesson1-group", label: "consumer-fast", delayMs: 0 },
            { name: "consumer-slow", kind: "consumer", port: null, groupId: "broker-lesson1-group", label: "consumer-slow", delayMs: 3000 },
        ],
        oldServices: ["presence-service"],
    },
    {
        oldLesson: "2-message-synchronization-and-deduplication",
        newLesson: "2-reliability-replay-and-deduplication",
        composeName: "2-reliability-replay-and-deduplication",
        topic: "reliability-events",
        dlqTopic: "reliability-events-dlq",
        services: [
            { name: "ingest-api", kind: "producer-reliability", port: 3000, groupId: null },
            { name: "reliability-consumer", kind: "consumer-reliability", port: null, groupId: "broker-lesson2-group", label: "reliability-consumer" },
        ],
        oldServices: ["sync-service"],
    },
]

const KAFKA_BLOCK = `  kafka:
    image: apache/kafka:3.8.0
    container_name: kafka
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: 1
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: 1
      KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS: 0
      CLUSTER_ID: MkU3OEVBNTcwNTJENDM2Qk
    ports:
      - "9092:9092"
    restart: unless-stopped

  kafka-ui:
    image: provectuslabs/kafka-ui:latest
    container_name: kafka-ui
    ports:
      - "8080:8080"
    environment:
      KAFKA_CLUSTERS_0_NAME: local
      KAFKA_CLUSTERS_0_BOOTSTRAPSERVERS: kafka:9092
    depends_on:
      - kafka
    restart: unless-stopped
`

function rmrf(p) {
    if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true })
}

function mkdirp(p) {
    fs.mkdirSync(p, { recursive: true })
}

function write(filePath, content) {
    mkdirp(path.dirname(filePath))
    fs.writeFileSync(filePath, content, "utf8")
}

function nestBaseFiles({ lessonSlug, serviceName, pathAlias }) {
    return {
        "nest-cli.json": `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": { "deleteOutDir": true }
}
`,
        "tsconfig.json": JSON.stringify(
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
                    strictBindCallApply: true,
                    forceConsistentCasingInFileNames: true,
                    noFallthroughCasesInSwitch: true,
                    noImplicitReturns: true,
                    noUncheckedIndexedAccess: true,
                    useUnknownInCatchVariables: false,
                    paths: {
                        [`@${pathAlias}`]: ["src/*"],
                    },
                },
            },
            null,
            2,
        ) + "\n",
        "tsconfig.build.json": `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "dist", "test", "**/*spec.ts"]
}
`,
        Dockerfile: `FROM node:20-alpine AS builder
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
`,
    }
}

function packageJson(name, extraDeps = {}) {
    const deps = {
        "@nestjs/common": "^10.0.0",
        "@nestjs/config": "^3.0.0",
        "@nestjs/core": "^10.0.0",
        "@nestjs/microservices": "^10.0.0",
        "@nestjs/platform-express": "^10.0.0",
        "class-transformer": "^0.5.1",
        "class-validator": "^0.14.0",
        "kafkajs": "^2.2.4",
        "reflect-metadata": "^0.1.13",
        "rxjs": "^7.8.0",
        ...extraDeps,
    }
    return (
        JSON.stringify(
            {
                name,
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
        ) + "\n"
    )
}

function configFiles() {
    return {
        "src/config/app.config.ts": `import {
    registerAs,
} from "@nestjs/config"

export interface AppConfig {
    port: number
}

export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3000,
    }),
)
`,
        "src/config/kafka.config.ts": `import {
    registerAs,
} from "@nestjs/config"

export interface KafkaConfig {
    brokers: Array<string>
    topic: string
    dlqTopic: string
    groupId: string
    clientId: string
    consumerDelayMs: number
}

export const kafkaConfig = registerAs(
    "kafka",
    (): KafkaConfig => ({
        brokers: (process.env.KAFKA_BROKERS ?? "kafka:9092").split(","),
        topic: process.env.KAFKA_TOPIC ?? "platform-events",
        dlqTopic: process.env.KAFKA_DLQ_TOPIC ?? "platform-events-dlq",
        groupId: process.env.KAFKA_GROUP_ID ?? "broker-demo-group",
        clientId: process.env.KAFKA_CLIENT_ID ?? "broker-client",
        consumerDelayMs: Number(process.env.CONSUMER_DELAY_MS) || 0,
    }),
)
`,
        "src/config/index.ts": `export * from "./app.config"
export * from "./kafka.config"
`,
    }
}

function envFile({ port, topic, dlqTopic, groupId, clientId, delayMs, postgres, redis }) {
    const lines = [
        "# --- Local / Docker (khớp compose.yaml) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml.)",
        `PORT=${port ?? 3000}`,
        "KAFKA_BROKERS=kafka:9092",
        `KAFKA_TOPIC=${topic}`,
        `KAFKA_CLIENT_ID=${clientId}`,
    ]
    if (groupId) lines.push(`KAFKA_GROUP_ID=${groupId}`)
    if (dlqTopic) lines.push(`KAFKA_DLQ_TOPIC=${dlqTopic}`)
    if (delayMs) lines.push(`CONSUMER_DELAY_MS=${delayMs}`)
    if (postgres) {
        lines.push(
            "POSTGRES_HOST=postgres",
            "POSTGRES_PORT=5432",
            "POSTGRES_USER=postgres",
            "POSTGRES_PASSWORD=postgres",
            "POSTGRES_DB=reliability_lab",
        )
    }
    if (redis) {
        lines.push("REDIS_HOST=redis", "REDIS_PORT=6379")
    }
    lines.push("")
    return lines.join("\n")
}

function writeProducerService(root, lesson, svc, topic, requirePartitionKey, reliabilityMode = false) {
    const slug = lesson.newLesson
    const imageSlug = `advanced-message-broker-${slug.split("-").slice(0, 2).join("-")}-${svc.name}`
    write(path.join(root, "package.json"), packageJson(svc.name))
    const base = nestBaseFiles({ lessonSlug: slug, serviceName: svc.name, pathAlias: slug })
    for (const [f, c] of Object.entries(base)) write(path.join(root, f), c)

    Object.entries(configFiles()).forEach(([f, c]) => write(path.join(root, f), c))

    write(
        path.join(root, ".env"),
        envFile({
            port: svc.port,
            topic,
            clientId: `${svc.name}-producer`,
        }),
    )

    write(
        path.join(root, "src/main.ts"),
        `import { bootstrap } from "./bootstrap"
void bootstrap()
`,
    )
    write(
        path.join(root, "src/bootstrap.ts"),
        `import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

export async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidUnknownValues: false }))
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    await app.listen(port, "0.0.0.0")
}
`,
    )

    const dtoFields = reliabilityMode
        ? `    @IsString()
    clientMessageId: string

    @IsString()
    type: string

    @IsOptional()
    simulateFailure?: boolean

    payload?: Record<string, string | number | boolean>`
        : requirePartitionKey
          ? `    @IsString()
    partitionKey: string

    @IsString()
    type: string

    payload: Record<string, string | number | boolean>`
          : `    @IsOptional()
    @IsString()
    partitionKey?: string

    @IsString()
    type: string

    payload: Record<string, string | number | boolean>`

    write(
        path.join(root, "src/events/dto/publish-event.dto.ts"),
        `import { IsOptional, IsString } from "class-validator"

export class PublishEventDto {
${dtoFields}
}
`,
    )

    write(
        path.join(root, "src/events/events.controller.ts"),
        `import { Body, Controller, Post } from "@nestjs/common"
import { EventsService } from "./events.service"
import { PublishEventDto } from "./dto/publish-event.dto"

@Controller("events")
export class EventsController {
    constructor(private readonly events: EventsService) {}

    @Post()
    async publish(@Body() body: PublishEventDto) {
        return this.events.publish(body)
    }
}
`,
    )

    write(
        path.join(root, "src/events/events.service.ts"),
        `import { Inject, Injectable, Logger } from "@nestjs/common"
import { ClientKafka } from "@nestjs/microservices"
import { ConfigService } from "@nestjs/config"
import type { KafkaConfig } from "../config"
import { PublishEventDto } from "./dto/publish-event.dto"

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(
        @Inject("KAFKA_PRODUCER") private readonly kafka: ClientKafka,
        private readonly config: ConfigService,
    ) {}

    async publish(dto: PublishEventDto) {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const envelope = reliabilityMode
            ? {
                clientMessageId: dto.clientMessageId,
                type: dto.type,
                payload: dto.payload ?? {},
                simulateFailure: dto.simulateFailure ?? false,
                timestamp: new Date().toISOString(),
            }
            : {
                type: dto.type,
                payload: dto.payload,
                partitionKey: dto.partitionKey ?? "default",
                timestamp: new Date().toISOString(),
            }
        const messageKey = reliabilityMode
            ? dto.clientMessageId
            : envelope.partitionKey
        await this.kafka.connect()
        this.kafka.emit(kafka.topic, {
            key: messageKey,
            value: envelope,
        })
        this.logger.log(\`Produced to \${kafka.topic} key=\${messageKey}\`)
        return { status: "queued", topic: kafka.topic, key: messageKey }
    }
}
`,
    )

    write(
        path.join(root, "src/events/index.ts"),
        `export * from "./events.controller"
export * from "./events.service"
`,
    )

    write(
        path.join(root, "src/app.module.ts"),
        `import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { ClientsModule, Transport } from "@nestjs/microservices"
import { appConfig, kafkaConfig } from "./config"
import { EventsController } from "./events/events.controller"
import { EventsService } from "./events/events.service"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, kafkaConfig] }),
        ClientsModule.register([
            {
                name: "KAFKA_PRODUCER",
                transport: Transport.KAFKA,
                options: {
                    client: {
                        clientId: process.env.KAFKA_CLIENT_ID ?? "ingest-producer",
                        brokers: (process.env.KAFKA_BROKERS ?? "kafka:9092").split(","),
                    },
                    producer: { allowAutoTopicCreation: true },
                },
            },
        ]),
    ],
    controllers: [EventsController],
    providers: [EventsService],
})
export class AppModule {}
`,
    )
}

function writeConsumerService(root, lesson, svc, topic) {
    write(path.join(root, "package.json"), packageJson(svc.name))
    const slug = lesson.newLesson
    const base = nestBaseFiles({ lessonSlug: slug, serviceName: svc.name, pathAlias: slug })
    for (const [f, c] of Object.entries(base)) write(path.join(root, f), c)
    Object.entries(configFiles()).forEach(([f, c]) => write(path.join(root, f), c))
    write(
        path.join(root, ".env"),
        envFile({
            topic,
            groupId: svc.groupId,
            clientId: svc.label ?? svc.name,
            delayMs: svc.delayMs ?? 0,
        }),
    )

    write(path.join(root, "src/main.ts"), `import { bootstrap } from "./bootstrap"
void bootstrap()
`)
    write(
        path.join(root, "src/bootstrap.ts"),
        `import { NestFactory } from "@nestjs/core"
import { MicroserviceOptions, Transport } from "@nestjs/microservices"
import { AppModule } from "./app.module"

export async function bootstrap(): Promise<void> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: process.env.KAFKA_CLIENT_ID ?? "consumer",
                brokers: (process.env.KAFKA_BROKERS ?? "kafka:9092").split(","),
            },
            consumer: {
                groupId: process.env.KAFKA_GROUP_ID ?? "broker-demo-group",
            },
        },
    })
    await app.listen()
}
`,
    )
    write(
        path.join(root, "src/consumer/consumer.controller.ts"),
        `import { Controller, Logger } from "@nestjs/common"
import { EventPattern, Payload } from "@nestjs/microservices"
import { ConsumerService } from "./consumer.service"

@Controller()
export class ConsumerController {
    private readonly logger = new Logger(ConsumerController.name)

    constructor(private readonly consumer: ConsumerService) {}

    @EventPattern("${topic}")
    async handle(@Payload() data: Record<string, string | number | boolean>) {
        return this.consumer.process(data)
    }
}
`,
    )
    write(
        path.join(root, "src/consumer/consumer.service.ts"),
        `import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import type { KafkaConfig } from "../config"

@Injectable()
export class ConsumerService {
    private readonly logger = new Logger(ConsumerService.name)
    private processed = 0

    constructor(private readonly config: ConfigService) {}

    async process(data: Record<string, string | number | boolean>): Promise<void> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        if (kafka.consumerDelayMs > 0) {
            await new Promise((r) => setTimeout(r, kafka.consumerDelayMs))
        }
        this.processed += 1
        this.logger.log(
            \`[\${kafka.clientId}] #\${this.processed} partitionKey=\${String(data.partitionKey ?? "?")} type=\${String(data.type ?? "?")}\`,
        )
    }
}
`,
    )
    write(
        path.join(root, "src/app.module.ts"),
        `import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { appConfig, kafkaConfig } from "./config"
import { ConsumerController } from "./consumer/consumer.controller"
import { ConsumerService } from "./consumer/consumer.service"

@Module({
    imports: [ConfigModule.forRoot({ isGlobal: true, load: [appConfig, kafkaConfig] })],
    controllers: [ConsumerController],
    providers: [ConsumerService],
})
export class AppModule {}
`,
    )
}

function writeReliabilityLesson(root, lesson, topic, dlqTopic) {
    const consumerRoot = path.join(root, "reliability-consumer")
    write(path.join(consumerRoot, "package.json"), packageJson("reliability-consumer", {
        "@nestjs/typeorm": "^10.0.0",
        "ioredis": "^5.0.0",
        "pg": "^8.11.0",
        "typeorm": "^0.3.15",
    }))
    const slug = lesson.newLesson
    const base = nestBaseFiles({ lessonSlug: slug, serviceName: "reliability-consumer", pathAlias: slug })
    for (const [f, c] of Object.entries(base)) write(path.join(consumerRoot, f), c)
    Object.entries(configFiles()).forEach(([f, c]) => write(path.join(consumerRoot, f), c))
    write(
        path.join(consumerRoot, ".env"),
        envFile({
            topic,
            dlqTopic,
            groupId: "broker-lesson2-group",
            clientId: "reliability-consumer",
            postgres: true,
            redis: true,
        }),
    )

    write(path.join(consumerRoot, "src/main.ts"), `import { bootstrap } from "./bootstrap"
void bootstrap()
`)
    write(
        path.join(consumerRoot, "src/bootstrap.ts"),
        `import { NestFactory } from "@nestjs/core"
import { MicroserviceOptions, Transport } from "@nestjs/microservices"
import { AppModule } from "./app.module"

export async function bootstrap(): Promise<void> {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: process.env.KAFKA_CLIENT_ID ?? "reliability-consumer",
                brokers: (process.env.KAFKA_BROKERS ?? "kafka:9092").split(","),
            },
            consumer: { groupId: process.env.KAFKA_GROUP_ID ?? "broker-lesson2-group" },
        },
    })
    await app.listen()
}
`,
    )

    write(
        path.join(consumerRoot, "src/reliability/entities/processed-event.entity.ts"),
        `import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity("processed_events")
export class ProcessedEventEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ unique: true })
    clientMessageId: string

    @Column()
    eventType: string

    @Column({ type: "bigint" })
    sequence: number

    @CreateDateColumn()
    createdAt: Date
}
`,
    )

    write(
        path.join(consumerRoot, "src/reliability/dto/process-event.dto.ts"),
        `export interface ProcessEventPayload {
    clientMessageId: string
    type: string
    payload?: Record<string, string | number | boolean>
    simulateFailure?: boolean
}
`,
    )

    write(
        path.join(consumerRoot, "src/reliability/reliability.service.ts"),
        `import { ConflictException, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import Redis from "ioredis"
import { ProcessedEventEntity } from "./entities/processed-event.entity"
import type { KafkaConfig } from "../config"
import type { ProcessEventPayload } from "./dto/process-event.dto"

@Injectable()
export class ReliabilityService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(ReliabilityService.name)
    private redis: Redis

    constructor(
        @InjectRepository(ProcessedEventEntity) private readonly repo: Repository<ProcessedEventEntity>,
        private readonly config: ConfigService,
    ) {}

    onModuleInit(): void {
        this.redis = new Redis({
            host: process.env.REDIS_HOST ?? "redis",
            port: Number(process.env.REDIS_PORT) || 6379,
        })
    }

    async onModuleDestroy(): Promise<void> {
        await this.redis?.quit()
    }

    async processEvent(data: ProcessEventPayload): Promise<ProcessedEventEntity> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const { clientMessageId, type, simulateFailure } = data

        const dedupKey = \`dedup:event:\${clientMessageId}\`
        const lock = await this.redis.set(dedupKey, "1", "EX", 3600, "NX")
        if (lock !== "OK") {
            throw new ConflictException(\`Duplicate clientMessageId: \${clientMessageId}\`)
        }

        if (simulateFailure) {
            throw new Error("Simulated processing failure for DLQ demo")
        }

        const seq = await this.redis.incr("reliability:sequence")
        const row = this.repo.create({ clientMessageId, eventType: type, sequence: seq })
        const saved = await this.repo.save(row)
        this.logger.log(\`Processed \${clientMessageId} seq=\${seq} topic=\${kafka.topic}\`)
        return saved
    }
}
`,
    )

    write(
        path.join(consumerRoot, "src/reliability/reliability.controller.ts"),
        `import { Controller, Logger } from "@nestjs/common"
import { EventPattern, Payload } from "@nestjs/microservices"
import { ReliabilityService } from "./reliability.service"
import type { ProcessEventPayload } from "./dto/process-event.dto"

@Controller()
export class ReliabilityController {
    private readonly logger = new Logger(ReliabilityController.name)

    constructor(private readonly reliability: ReliabilityService) {}

    @EventPattern("${topic}")
    async handle(@Payload() data: ProcessEventPayload) {
        try {
            await this.reliability.processEvent(data)
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unknown error"
            this.logger.error(\`Failed: \${message} — will retry / DLQ via Kafka\`)
            throw error
        }
    }
}
`,
    )

    write(
        path.join(consumerRoot, "src/app.module.ts"),
        `import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { appConfig, kafkaConfig } from "./config"
import { ReliabilityController } from "./reliability/reliability.controller"
import { ReliabilityService } from "./reliability/reliability.service"
import { ProcessedEventEntity } from "./reliability/entities/processed-event.entity"

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [appConfig, kafkaConfig] }),
        TypeOrmModule.forRoot({
            type: "postgres",
            host: process.env.POSTGRES_HOST ?? "postgres",
            port: Number(process.env.POSTGRES_PORT) || 5432,
            username: process.env.POSTGRES_USER ?? "postgres",
            password: process.env.POSTGRES_PASSWORD ?? "postgres",
            database: process.env.POSTGRES_DB ?? "reliability_lab",
            autoLoadEntities: true,
            synchronize: true,
        }),
        TypeOrmModule.forFeature([ProcessedEventEntity]),
    ],
    controllers: [ReliabilityController],
    providers: [ReliabilityService],
})
export class AppModule {}
`,
    )
}

function writeCompose(lessonDir, lesson, networkName) {
    const lines = [
        `# ${lesson.composeName} — Kafka advanced message broker lab`,
        `# (EN: ${lesson.composeName} — Kafka advanced message broker lab.)`,
        "",
        `name: ${lesson.composeName}`,
        "",
        "services:",
        KAFKA_BLOCK,
    ]

    for (const svc of lesson.services) {
        const imageName = `starciacademy/advanced-message-broker-${svc.name}:latest`
        const env = [
            "      KAFKA_BROKERS: kafka:9092",
            `      KAFKA_TOPIC: ${lesson.topic}`,
            `      KAFKA_CLIENT_ID: ${svc.label ?? svc.name}`,
        ]
        if (svc.groupId) env.push(`      KAFKA_GROUP_ID: ${svc.groupId}`)
        if (svc.delayMs) env.push(`      CONSUMER_DELAY_MS: "${svc.delayMs}"`)
        if (lesson.dlqTopic) env.push(`      KAFKA_DLQ_TOPIC: ${lesson.dlqTopic}`)

        lines.push(`  ${svc.name}:`)
        lines.push(`    image: ${imageName}`)
        lines.push(`    container_name: ${lesson.composeName}-${svc.name}`)
        if (svc.port) {
            lines.push("    ports:")
            lines.push(`      - "${svc.port}:3000"`)
        }
        lines.push("    environment:")
        lines.push(...env)
        if (svc.kind.startsWith("producer")) {
            lines.push("      PORT: 3000")
        }
        lines.push("    depends_on:")
        lines.push("      - kafka")
        lines.push("    networks:")
        lines.push(`      - ${networkName}`)
        lines.push("    restart: unless-stopped")
        lines.push("")
    }

    if (lesson.dlqTopic) {
        lines.push("  postgres:")
        lines.push("    image: postgres:16-alpine")
        lines.push("    environment:")
        lines.push("      POSTGRES_USER: postgres")
        lines.push("      POSTGRES_PASSWORD: postgres")
        lines.push("      POSTGRES_DB: reliability_lab")
        lines.push("    networks:")
        lines.push(`      - ${networkName}`)
        lines.push("  redis:")
        lines.push("    image: redis:7-alpine")
        lines.push("    networks:")
        lines.push(`      - ${networkName}`)
        lines.push("")
    }

    lines.push("networks:")
    lines.push(`  ${networkName}:`)
    lines.push(`    name: ${networkName}`)

    write(path.join(lessonDir, ".docker", "compose.yaml"), lines.join("\n") + "\n")
}

// --- main ---
const oldPath = path.join(REPO, OLD_MODULE)
const newPath = path.join(REPO, NEW_MODULE)

if (!fs.existsSync(oldPath)) {
    console.error("Old module not found:", oldPath)
    process.exit(1)
}

if (fs.existsSync(newPath)) {
    rmrf(newPath)
}

fs.renameSync(oldPath, newPath)
console.log("Renamed module:", NEW_MODULE)

for (const lesson of LESSONS) {
    const lessonDir = path.join(newPath, lesson.oldLesson)
    const newLessonDir = path.join(newPath, lesson.newLesson)
    if (fs.existsSync(lessonDir) && lessonDir !== newLessonDir) {
        fs.renameSync(lessonDir, newLessonDir)
    }
    const dir = newLessonDir
    for (const oldSvc of lesson.oldServices) {
        rmrf(path.join(dir, oldSvc))
    }
    rmrf(path.join(dir, ".docker"))
    mkdirp(path.join(dir, ".docker"))

    if (lesson.newLesson.includes("reliability")) {
        const ingestRoot = path.join(dir, "ingest-api")
        rmrf(ingestRoot)
        writeProducerService(ingestRoot, lesson, { name: "ingest-api", port: 3000 }, lesson.topic, false, true)
        rmrf(path.join(dir, "reliability-consumer"))
        writeReliabilityLesson(dir, lesson, lesson.topic, lesson.dlqTopic)
    } else {
        for (const svc of lesson.services) {
            const svcRoot = path.join(dir, svc.name)
            rmrf(svcRoot)
            if (svc.kind === "producer" || svc.kind === "producer-reliability") {
                writeProducerService(svcRoot, lesson, svc, lesson.topic, !!svc.requirePartitionKey)
            } else {
                writeConsumerService(svcRoot, lesson, svc, lesson.topic)
            }
        }
    }

    writeCompose(dir, lesson, lesson.composeName)
    console.log("Lesson OK:", lesson.newLesson)
}

console.log("Done. Update generate_all.js and course mounts separately.")
