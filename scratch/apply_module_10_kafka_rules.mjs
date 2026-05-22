/**
 * Áp coding-rules cho module 10 (kafka-streaming-and-reliability):
 * - .env đầy đủ khớp compose
 * - ConfigService thay process.env trong app.module / bootstrap
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-10-kafka-streaming-and-reliability",
)

const ENV_BY_SERVICE = {
    "0-log-based-messaging-fundamentals/ingest-api": {
        PORT: "3000",
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "platform-events",
        KAFKA_CLIENT_ID: "ingest-api",
        KAFKA_GROUP_ID: "broker-lesson0-group",
        KAFKA_DLQ_TOPIC: "platform-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "0-log-based-messaging-fundamentals/consumer-a": {
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "platform-events",
        KAFKA_CLIENT_ID: "consumer-a",
        KAFKA_GROUP_ID: "broker-lesson0-group",
        KAFKA_DLQ_TOPIC: "platform-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "0-log-based-messaging-fundamentals/consumer-b": {
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "platform-events",
        KAFKA_CLIENT_ID: "consumer-b",
        KAFKA_GROUP_ID: "broker-lesson0-group",
        KAFKA_DLQ_TOPIC: "platform-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "1-ordering-partitions-and-operations/ordering-producer": {
        PORT: "3000",
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "ordering-events",
        KAFKA_CLIENT_ID: "ordering-producer",
        KAFKA_GROUP_ID: "broker-lesson1-group",
        KAFKA_DLQ_TOPIC: "ordering-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "1-ordering-partitions-and-operations/consumer-fast": {
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "ordering-events",
        KAFKA_CLIENT_ID: "consumer-fast",
        KAFKA_GROUP_ID: "broker-lesson1-group",
        KAFKA_DLQ_TOPIC: "ordering-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "1-ordering-partitions-and-operations/consumer-slow": {
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "ordering-events",
        KAFKA_CLIENT_ID: "consumer-slow",
        KAFKA_GROUP_ID: "broker-lesson1-group",
        KAFKA_DLQ_TOPIC: "ordering-events-dlq",
        CONSUMER_DELAY_MS: "3000",
    },
    "2-reliability-replay-and-deduplication/ingest-api": {
        PORT: "3000",
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "reliability-events",
        KAFKA_CLIENT_ID: "ingest-api",
        KAFKA_GROUP_ID: "broker-lesson2-group",
        KAFKA_DLQ_TOPIC: "reliability-events-dlq",
        CONSUMER_DELAY_MS: "0",
    },
    "2-reliability-replay-and-deduplication/reliability-consumer": {
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "reliability-events",
        KAFKA_CLIENT_ID: "reliability-consumer",
        KAFKA_GROUP_ID: "broker-lesson2-group",
        KAFKA_DLQ_TOPIC: "reliability-events-dlq",
        CONSUMER_DELAY_MS: "0",
        POSTGRES_HOST: "postgres",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "reliability_lab",
        REDIS_HOST: "redis",
        REDIS_PORT: "6379",
    },
}

const PRODUCER_APP_MODULE = `/**
 * Module gốc — ConfigModule + Kafka producer qua ConfigService.
 * (EN: Root module — ConfigModule + Kafka producer via ConfigService.)
 */
import {
    Module,
} from "@nestjs/common"
import {
    ConfigModule,
    ConfigService,
} from "@nestjs/config"
import {
    ClientsModule,
    Transport,
} from "@nestjs/microservices"
import {
    appConfig,
    kafkaConfig,
    type KafkaConfig,
} from "./config"
import {
    EventsController,
} from "./events"
import {
    EventsService,
} from "./events"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, kafkaConfig],
        }),
        ClientsModule.registerAsync({
            clients: [
                {
                    name: "KAFKA_PRODUCER",
                    imports: [ConfigModule],
                    inject: [ConfigService],
                    useFactory: (config: ConfigService) => {
                        const kafka = config.getOrThrow<KafkaConfig>("kafka")
                        return {
                            transport: Transport.KAFKA,
                            options: {
                                client: {
                                    clientId: kafka.clientId,
                                    brokers: kafka.brokers,
                                },
                                producer: {
                                    allowAutoTopicCreation: true,
                                },
                            },
                        }
                    },
                },
            ],
        }),
    ],
    controllers: [EventsController],
    providers: [EventsService],
})
export class AppModule {}
`

const RELIABILITY_APP_MODULE = `/**
 * Module gốc — Kafka consumer + Postgres + Redis dedup (ConfigService).
 * (EN: Root module — Kafka consumer + Postgres + Redis dedup (ConfigService).)
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
    kafkaConfig,
    redisConfig,
    type DatabaseConfig,
} from "./config"
import {
    ReliabilityController,
} from "./reliability"
import {
    ReliabilityService,
} from "./reliability"
import {
    ProcessedEventEntity,
} from "./reliability"

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [appConfig, kafkaConfig, databaseConfig, redisConfig],
        }),
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
        }),
        TypeOrmModule.forFeature([ProcessedEventEntity]),
    ],
    controllers: [ReliabilityController],
    providers: [ReliabilityService],
})
export class AppModule {}
`

const CONSUMER_BOOTSTRAP = `/**
 * Khởi tạo Nest microservice Kafka — consumer group từ ConfigService.
 * (EN: Bootstrap Nest Kafka microservice — consumer group from ConfigService.)
 */
import {
    NestFactory,
} from "@nestjs/core"
import {
    ConfigService,
} from "@nestjs/config"
import {
    MicroserviceOptions,
    Transport,
} from "@nestjs/microservices"
import {
    AppModule,
} from "./app.module"
import type {
    KafkaConfig,
} from "./config"

export async function bootstrap(): Promise<void> {
    const ctx = await NestFactory.createApplicationContext(AppModule)
    const kafka = ctx.get(ConfigService).getOrThrow<KafkaConfig>("kafka")
    await ctx.close()

    const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
        transport: Transport.KAFKA,
        options: {
            client: {
                clientId: kafka.clientId,
                brokers: kafka.brokers,
            },
            consumer: {
                groupId: kafka.groupId,
            },
        },
    })
    await app.listen()
}
`

function writeEnv(relPath, vars) {
    const lines = [
        "# --- Local / Docker (khớp compose.yaml và src/config/) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml and src/config/.)",
        ...Object.entries(vars).map(([k, v]) => `${k}=${v}`),
        "",
    ]
    fs.writeFileSync(path.join(MODULE, relPath, ".env"), lines.join("\n"), "utf8")
}

function findServices() {
    const out = []
    for (const lesson of fs.readdirSync(MODULE, { withFileTypes: true })) {
        if (!lesson.isDirectory() || lesson.name === "node_modules") continue
        const lessonPath = path.join(MODULE, lesson.name)
        for (const svc of fs.readdirSync(lessonPath, { withFileTypes: true })) {
            if (!svc.isDirectory()) continue
            const svcPath = path.join(lessonPath, svc.name)
            if (fs.existsSync(path.join(svcPath, "src", "main.ts"))) {
                out.push(path.join(lesson.name, svc.name).replace(/\\/g, "/"))
            }
        }
    }
    return out
}

let envCount = 0
for (const rel of findServices()) {
    const vars = ENV_BY_SERVICE[rel]
    if (vars) {
        writeEnv(rel, vars)
        envCount++
    }
}

const producers = [
    "0-log-based-messaging-fundamentals/ingest-api",
    "1-ordering-partitions-and-operations/ordering-producer",
    "2-reliability-replay-and-deduplication/ingest-api",
]
for (const rel of producers) {
    fs.writeFileSync(
        path.join(MODULE, rel, "src", "app.module.ts"),
        PRODUCER_APP_MODULE,
        "utf8",
    )
}

fs.writeFileSync(
    path.join(MODULE, "2-reliability-replay-and-deduplication/reliability-consumer/src/app.module.ts"),
    RELIABILITY_APP_MODULE,
    "utf8",
)

const consumers = [
    "0-log-based-messaging-fundamentals/consumer-a",
    "0-log-based-messaging-fundamentals/consumer-b",
    "1-ordering-partitions-and-operations/consumer-fast",
    "1-ordering-partitions-and-operations/consumer-slow",
    "2-reliability-replay-and-deduplication/reliability-consumer",
]
for (const rel of consumers) {
    fs.writeFileSync(path.join(MODULE, rel, "src", "bootstrap.ts"), CONSUMER_BOOTSTRAP, "utf8")
}

// Xóa .env legacy ở cấp lesson (chat/presence cũ)
for (const lesson of ["0-log-based-messaging-fundamentals", "1-ordering-partitions-and-operations"]) {
    const stale = path.join(MODULE, lesson, ".env")
    if (fs.existsSync(stale)) fs.unlinkSync(stale)
}

console.log({ envWritten: envCount, producers: producers.length, consumers: consumers.length })
