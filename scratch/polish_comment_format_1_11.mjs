// Sửa format comment: JSDoc dính method, Logger import thiếu, brace thừa đầu file.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/

function polish(text, filePath) {
    let t = text
    t = t.replace(/\*\/[ \t]+(?=[a-zA-Z@])/g, "*/\n    ")
    if (t.trimStart().startsWith("}")) {
        t = t.replace(/^\s*\}\s*\n/, "")
    }
    const opens = (t.match(/\{/g) || []).length
    const closes = (t.match(/\}/g) || []).length
    if (closes > opens && t.trimEnd().endsWith("}\n}")) {
        t = t.replace(/\n\}\s*$/, "\n")
    }
    if (/\bLogger\b/.test(t) && !t.includes("Logger,") && !t.includes("Logger }")) {
        t = t.replace(
            /from "@nestjs\/common"/,
            'from "@nestjs/common"\nimport {\n    Logger,\n} from "@nestjs/common"',
        )
        t = t.replace(
            /import \{\s*\n\s*Injectable,\s*\n\} from "@nestjs\/common"/,
            'import {\n    Injectable,\n    Logger,\n} from "@nestjs/common"',
        )
    }
    if (filePath.endsWith("consumer.service.ts") && !t.includes("export class")) {
        return null
    }
    return t
}

function restoreConsumer(serviceDir, clientId) {
    const p = path.join(serviceDir, "src/consumer/consumer.service.ts")
    const content = `/**
 * Service lesson — Kafka consumer xử lý message từ topic.
 * (EN: Lesson service — Kafka consumer processes topic messages.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import type {
    KafkaConfig,
} from "../config"

/**
 * Class \`ConsumerService\` — consumer group member.
 * (EN: Class \`ConsumerService\` — consumer group member.)
 */
@Injectable()
export class ConsumerService {
    private readonly logger = new Logger(ConsumerService.name)
    private processed = 0

    constructor(private readonly config: ConfigService) {}

    /**
     * Logic — log message đã nhận; delay tùy chọn để demo lag.
     * Code — \`getOrThrow('kafka')\` → optional sleep → \`processed++\` → \`logger.log\`.
     * (EN Logic: Log consumed message; optional delay for lag demo.)
     * (EN Code: \`getOrThrow('kafka')\` → optional sleep → increment → log.)
     */
    async process(data: Record<string, string | number | boolean>): Promise<void> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        // Logic — consumer chậm: delay cố định từ env CONSUMER_DELAY_MS.
        // Code — setTimeout promise khi consumerDelayMs > 0.
        // (EN Logic: Slow consumer uses CONSUMER_DELAY_MS sleep.)
        // (EN Code: await setTimeout when consumerDelayMs > 0.)
        if (kafka.consumerDelayMs > 0) {
            await new Promise((r) => setTimeout(r, kafka.consumerDelayMs))
        }
        this.processed += 1
        this.logger.log(
            \`[\${kafka.clientId ?? "${clientId}"}] #\${this.processed} partitionKey=\${String(data.partitionKey ?? "?")} type=\${String(data.type ?? "?")}\`,
        )
    }
}
`
    fs.writeFileSync(p, content, "utf8")
    return true
}

const restores = {
    "system-design-mastery-module-1-fundamentals-of-system-design/0-core-concepts-and-metrics/status-service/src/status/status.service.ts": `/**
 * Service lesson — health + hostname cho demo LB.
 * (EN: Lesson service — health + hostname for LB demo.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import * as os from "os"

@Injectable()
export class StatusService {
    private readonly logger = new Logger(StatusService.name)

    /**
     * Logic — trả health và hostname container/pod.
     * Code — \`os.hostname()\` + object JSON response.
     * (EN Logic: Return health and container/pod hostname.)
     * (EN Code: \`os.hostname()\` + JSON body.)
     */
    getStatus(): { status: string; servedBy: string; timestamp: string } {
        const hostname = os.hostname()
        this.logger.log(\`Request handled by: \${hostname}\`)
        return { status: "ok", servedBy: hostname, timestamp: new Date().toISOString() }
    }
}
`,
    "system-design-mastery-module-1-fundamentals-of-system-design/1-scaling-strategies/scaling-service/src/task/task.service.ts": `/**
 * Service lesson — CPU stress + status cho scaling demo.
 * (EN: Lesson service — CPU stress + status for scaling demo.)
 */
import {
    Injectable,
    Logger,
} from "@nestjs/common"
import * as os from "os"

@Injectable()
export class TaskService {
    private readonly logger = new Logger(TaskService.name)

    /**
     * Logic — stress CPU để so sánh scale vertical/horizontal.
     * Code — vòng sqrt/atan + đo duration ms.
     * (EN Logic: CPU stress for vertical vs horizontal scaling.)
     * (EN Code: sqrt/atan loop + duration timing.)
     */
    runHeavyCalculation(iterations: number): {
        servedBy: string
        duration: string
        iterations: number
        result: string
    } {
        const start = Date.now()
        let result = 0
        for (let i = 0; i < iterations; i++) {
            result += Math.sqrt(i) * Math.atan(i)
        }
        const duration = Date.now() - start
        const hostname = os.hostname()
        this.logger.log(\`[\${hostname}] Heavy task completed in \${duration}ms\`)
        return { servedBy: hostname, duration: \`\${duration}ms\`, iterations, result: "completed" }
    }

    /**
     * Logic — health check node đang xử lý request.
     * Code — \`os.hostname()\` trong response.
     * (EN Logic: Health of node serving requests.)
     * (EN Code: \`os.hostname()\` in response.)
     */
    getStatus(): { status: string; servedBy: string; timestamp: string } {
        return { status: "ok", servedBy: os.hostname(), timestamp: new Date().toISOString() }
    }
}
`,
    "system-design-mastery-module-10-kafka-streaming-and-reliability/2-reliability-replay-and-deduplication/ingest-api/src/events/events.service.ts": `/**
 * Service lesson — Kafka producer reliability-events.
 * (EN: Lesson service — Kafka producer for reliability-events.)
 */
import {
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import {
    ConfigService,
} from "@nestjs/config"
import type {
    KafkaConfig,
} from "../config"
import {
    PublishEventDto,
} from "./dto"

@Injectable()
export class EventsService {
    private readonly logger = new Logger(EventsService.name)

    constructor(
        @Inject("KAFKA_PRODUCER") private readonly kafka: ClientKafka,
        private readonly config: ConfigService,
    ) {}

    /**
     * Logic — produce reliability-events; key = clientMessageId.
     * Code — build envelope → kafka.connect → emit(topic, {key, value}).
     * (EN Logic: Produce reliability-events keyed by clientMessageId.)
     * (EN Code: envelope → connect → emit with key/value.)
     */
    async publish(dto: PublishEventDto): Promise<{ status: string; topic: string; key: string }> {
        const kafka = this.config.getOrThrow<KafkaConfig>("kafka")
        const envelope = {
            clientMessageId: dto.clientMessageId,
            type: dto.type,
            payload: dto.payload ?? {},
            simulateFailure: dto.simulateFailure ?? false,
            timestamp: new Date().toISOString(),
        }
        await this.kafka.connect()
        this.kafka.emit(kafka.topic, { key: dto.clientMessageId, value: envelope })
        this.logger.log(\`Produced to \${kafka.topic} key=\${dto.clientMessageId}\`)
        return { status: "queued", topic: kafka.topic, key: dto.clientMessageId }
    }
}
`,
    "system-design-mastery-module-4-data-and-consistency-in-microservices/2-saga-pattern/order-service/src/orders/orders.service.ts": `/**
 * Service lesson — saga choreography order aggregate.
 * (EN: Lesson service — saga choreography order aggregate.)
 */
import {
    Inject,
    Injectable,
    Logger,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import {
    InjectRepository,
} from "@nestjs/typeorm"
import {
    Repository,
} from "typeorm"
import {
    firstValueFrom,
} from "rxjs"
import {
    OrderEntity,
} from "./order.entity"
import type {
    SagaEvent,
} from "../saga"
import {
    TOPIC,
} from "../saga"

@Injectable()
export class OrdersService {
    private readonly log = new Logger(OrdersService.name)

    constructor(
        @InjectRepository(OrderEntity) private readonly repo: Repository<OrderEntity>,
        @Inject("SAGA_EVENTS") private readonly producer: ClientKafka,
    ) {}

    /**
     * Logic — tạo order PENDING rồi emit ORDER_CREATED (choreography saga).
     * Code — repo.create/save → firstValueFrom(producer.emit).
     * (EN Logic: Create PENDING order then emit ORDER_CREATED.)
     * (EN Code: TypeORM save → Kafka emit.)
     */
    async create(productId: number, quantity: number): Promise<OrderEntity> {
        const row = this.repo.create({ productId, quantity, status: "PENDING" })
        await this.repo.save(row)
        await firstValueFrom(
            this.producer.emit({
                event: "ORDER_CREATED",
                orderId: row.id,
                productId,
                quantity,
            }),
        )
        return row
    }

    /**
     * Logic — cập nhật trạng thái order theo event saga (OK / cancel).
     * Code — nhánh INVENTORY_OK → COMPLETED; OUT_OF_STOCK/REFUND → CANCELLED.
     * (EN Logic: Transition order state from saga events.)
     * (EN Code: branch updates on event type.)
     */
    async handleSagaEvent(event: SagaEvent): Promise<void> {
        if (event.event === "INVENTORY_OK") {
            await this.repo.update({ id: event.orderId }, { status: "COMPLETED" })
            this.log.log(\`Order "\${event.orderId}" completed\`)
            return
        }
        if (event.event === "INVENTORY_OUT_OF_STOCK" || event.event === "PAYMENT_REFUNDED") {
            await this.repo.update({ id: event.orderId }, { status: "CANCELLED" })
            this.log.log(\`Order "\${event.orderId}" cancelled\`)
        }
    }
}
`,
    "system-design-mastery-module-4-data-and-consistency-in-microservices/2-saga-pattern/order-service/src/saga/kafka-producer.service.ts": `/**
 * Service lesson — Kafka producer OnModuleInit cho saga topic.
 * (EN: Lesson service — Kafka producer OnModuleInit for saga topic.)
 */
import {
    Inject,
    Injectable,
    Logger,
    OnModuleInit,
} from "@nestjs/common"
import {
    ClientKafka,
} from "@nestjs/microservices"
import {
    TOPIC,
} from "./saga.constants"
import type {
    SagaEvent,
} from "./saga.events"

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    private readonly logger = new Logger(KafkaProducerService.name)

    constructor(@Inject("SAGA_EVENTS") private readonly client: ClientKafka) {}

    /**
     * Logic — kết nối Kafka producer khi module sẵn sàng.
     * Code — OnModuleInit → client.connect().
     * (EN Logic: Connect Kafka producer on module init.)
     * (EN Code: OnModuleInit → connect().)
     */
    async onModuleInit(): Promise<void> {
        await this.client.connect()
    }

    /**
     * Logic — publish saga event lên topic choreography.
     * Code — client.emit(TOPIC, event).
     * (EN Logic: Publish saga event to choreography topic.)
     * (EN Code: emit to TOPIC.)
     */
    emit(event: SagaEvent) {
        this.logger.log(\`Publishing event "\${event.event}" for order "\${event.orderId}"\`)
        return this.client.emit(TOPIC, event)
    }
}
`,
    "system-design-mastery-module-4-data-and-consistency-in-microservices/2-saga-pattern/order-service/src/saga/saga-events.controller.ts": `/**
 * Kafka controller — consume saga.demo.events.
 * (EN: Kafka controller — consumes saga.demo.events.)
 */
import {
    Controller,
    Logger,
} from "@nestjs/common"
import {
    EventPattern,
    Payload,
} from "@nestjs/microservices"
import {
    OrdersService,
} from "../orders"
import type {
    SagaEvent,
} from "./saga.events"
import {
    TOPIC,
} from "./saga.constants"

@Controller()
export class SagaEventsController {
    private readonly logger = new Logger(SagaEventsController.name)

    constructor(private readonly orders: OrdersService) {}

    /**
     * Logic — consumer group route event → OrdersService.handleSagaEvent.
     * Code — @EventPattern(TOPIC) + @Payload → handleSagaEvent.
     * (EN Logic: Route consumed saga events to order handler.)
     * (EN Code: EventPattern → handleSagaEvent.)
     */
    @EventPattern(TOPIC)
    async handle(@Payload() event: SagaEvent): Promise<void> {
        if (!event?.event) return
        this.logger.log(\`Consumed event "\${event.event}" for order "\${event.orderId}"\`)
        await this.orders.handleSagaEvent(event)
    }
}
`,
    "system-design-mastery-module-6-reliability-and-resilience-patterns/3-health-checks-and-graceful-degradation/ecommerce-app/src/app.controller.ts": `/**
 * HTTP controller — health, stress memory, products (graceful degradation).
 * (EN: HTTP controller — health, stress, products endpoints.)
 */
import {
    Controller,
    Get,
    Post,
} from "@nestjs/common"
import {
    ConfigService,
} from "@nestjs/config"
import {
    HealthCheck,
    HealthCheckService,
    MemoryHealthIndicator,
    HealthCheckError,
} from "@nestjs/terminus"
import {
    AppService,
} from "./app.service"
import type {
    HealthConfig,
} from "./config"

@Controller()
export class AppController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly memory: MemoryHealthIndicator,
        private readonly appService: AppService,
        private readonly configService: ConfigService,
    ) {}

    private get healthConfig(): HealthConfig {
        return this.configService.getOrThrow<HealthConfig>("health")
    }

    /**
     * Logic — kiểm tra DB up/down theo env (graceful degradation demo).
     * Code — nếu databaseStatus === 'down' → throw HealthCheckError.
     * (EN Logic: DB check from env for degradation demo.)
     * (EN Code: throw HealthCheckError when down.)
     */
    private checkDatabase() {
        if (this.healthConfig.databaseStatus === "down") {
            throw new HealthCheckError("database check failed", {
                database: { status: "down" as const },
            })
        }
        return { database: { status: "up" as const } }
    }

    /**
     * Logic — Terminus health: heap + simulated DB.
     * Code — @HealthCheck() → health.check([memory, checkDatabase]).
     * (EN Logic: Liveness/readiness via Terminus.)
     * (EN Code: HealthCheck indicator array.)
     */
    @Get("health")
    @HealthCheck()
    healthCheck() {
        return this.health.check([
            () => this.memory.checkHeap("memory_heap", this.healthConfig.healthHeapThresholdBytes),
            () => this.checkDatabase(),
        ])
    }

    /**
     * Logic — stress heap để demo health fail.
     * Code — delegate AppService.stressMemory().
     * (EN Logic: Stress heap for failing health demo.)
     * (EN Code: AppService.stressMemory().)
     */
    @Post("stress-memory")
    stressMemory() {
        return this.appService.stressMemory()
    }

    /**
     * Logic — products endpoint với graceful degradation.
     * Code — delegate AppService.products().
     * (EN Logic: Products with degradation path.)
     * (EN Code: AppService.products().)
     */
    @Get("products")
    products() {
        return this.appService.products()
    }
}
`,
}

let n = 0
for (const [rel, body] of Object.entries(restores)) {
    const p = path.join(REPO, rel)
    if (fs.existsSync(p)) {
        fs.writeFileSync(p, body, "utf8")
        n++
    }
}

const m10 = "system-design-mastery-module-10-kafka-streaming-and-reliability"
const consumers = [
    [`${m10}/0-log-based-messaging-fundamentals/consumer-a`, "consumer-a-lesson0"],
    [`${m10}/0-log-based-messaging-fundamentals/consumer-b`, "consumer-b-lesson0"],
    [`${m10}/1-ordering-partitions-and-operations/consumer-fast`, "consumer-fast"],
    [`${m10}/1-ordering-partitions-and-operations/consumer-slow`, "consumer-slow"],
]
for (const [dir, id] of consumers) {
    const full = path.join(REPO, dir)
    if (fs.existsSync(full)) restoreConsumer(full, id)
}

for (const e of fs.readdirSync(REPO, { withFileTypes: true })) {
    if (!e.isDirectory() || !MODULE_RE.test(e.name)) continue
    const num = Number(e.name.match(MODULE_RE)[1])
    if (num < 1 || num > 11) continue
    const stack = [path.join(REPO, e.name)]
    while (stack.length) {
        const dir = stack.pop()
        for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, ent.name)
            if (ent.isDirectory()) {
                if (!["node_modules", "dist", ".briefs"].includes(ent.name)) stack.push(full)
            } else if (ent.isFile() && full.endsWith(".ts") && full.includes(`${path.sep}src${path.sep}`)) {
                const orig = fs.readFileSync(full, "utf8")
                const next = polish(orig, full)
                if (next && next !== orig) {
                    fs.writeFileSync(full, next, "utf8")
                    n++
                }
            }
        }
    }
}

console.log({ polishedOrRestored: n })
