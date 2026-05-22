/**
 * Module 16 — KV Store: Redis Cluster (0), DynamoDB (1), Cassandra (2).
 * Brief: .briefs/system-design/16.md
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MODULE = path.join(
    __dirname,
    "..",
    ".repo",
    "system-design-mastery-module-16-highly-available-distributed-key-value-store",
)

const STALE_LESSONS = [
    "0-consistent-hashing-partitioning",
    "1-gossip-protocol-and-failure-detection",
    "2-quorum-consensus-and-conflict-resolution",
    "2-dynamodb-quorum-and-consistency",
    "3-cassandra-quorum-and-read-repair",
]

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

// ========== Lesson 0: Redis Cluster ==========
const L0 = "0-redis-cluster-hash-slots-and-gossip"
const S0 = `${L0}/redis-cluster-service`

scaffoldLesson(L0, "redis-cluster-service", { ioredis: "^5.3.2", crc: "^4.3.2" })

write(
    `${L0}/.docker/compose.yaml`,
    `name: ${L0}

services:
  redis-1:
    image: redis:7-alpine
    container_name: ${L0}-redis-1
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 3000 --bind 0.0.0.0 --protected-mode no
    ports:
      - "6379:6379"
    networks:
      - ${L0}-network

  redis-2:
    image: redis:7-alpine
    container_name: ${L0}-redis-2
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 3000 --bind 0.0.0.0 --protected-mode no
    ports:
      - "6380:6379"
    networks:
      - ${L0}-network

  redis-3:
    image: redis:7-alpine
    container_name: ${L0}-redis-3
    command: redis-server --port 6379 --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 3000 --bind 0.0.0.0 --protected-mode no
    ports:
      - "6381:6379"
    networks:
      - ${L0}-network

  cluster-init:
    image: redis:7-alpine
    container_name: ${L0}-cluster-init
    depends_on:
      - redis-1
      - redis-2
      - redis-3
    networks:
      - ${L0}-network
    entrypoint: >
      sh -c "sleep 4 &&
      redis-cli --cluster create redis-1:6379 redis-2:6379 redis-3:6379
      --cluster-replicas 0 --cluster-yes || true"

  api:
    container_name: ${L0}-api
    build:
      context: ../redis-cluster-service
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      cluster-init:
        condition: service_completed_successfully
    networks:
      - ${L0}-network

networks:
  ${L0}-network:
    name: ${L0}-network
`,
)

write(`${S0}/src/app.module.ts`, appModule("RedisClusterModule", "redis-cluster"))
write(`${S0}/.env`, `PORT=3000
REDIS_CLUSTER_NODES=redis-1:6379,redis-2:6379,redis-3:6379
`)

write(
    `${S0}/src/redis-cluster/dto/kill-node.dto.ts`,
    `import { IsNotEmpty, IsString } from "class-validator"

export class KillNodeDto {
    @IsString()
    @IsNotEmpty()
    node!: string
}
`,
)
write(`${S0}/src/redis-cluster/dto/index.ts`, `export * from "./kill-node.dto"\n`)

write(
    `${S0}/src/redis-cluster/redis-cluster.service.ts`,
    `import { Injectable, OnModuleDestroy } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { execSync } from "node:child_process"
import { crc16xmodem } from "crc"
import { Cluster } from "ioredis"

@Injectable()
export class RedisClusterService implements OnModuleDestroy {
    private client!: Cluster

    constructor(private readonly config: ConfigService) {
        const nodes = (this.config.get<string>("REDIS_CLUSTER_NODES")
            ?? "redis-1:6379,redis-2:6379,redis-3:6379")
            .split(",")
            .map((entry) => {
                const [host, port] = entry.trim().split(":")
                return { host, port: Number(port) || 6379 }
            })
        this.client = new Cluster(nodes, { enableReadyCheck: true })
    }

    async onModuleDestroy(): Promise<void> {
        await this.client.quit()
    }

    async mapKey(key: string) {
        const targetSlot = crc16xmodem(key) % 16384
        const slots = (await this.client.cluster("SLOTS")) as unknown as Array<
            [number, number, [string, number, string?, ...unknown[]], ...unknown[]]
        >
        let assignedNode = "Unknown"
        for (const row of slots) {
            const start = row[0]
            const end = row[1]
            const master = row[2]
            if (targetSlot >= start && targetSlot <= end && master?.[0]) {
                assignedNode = \`\${master[0]}:\${master[1]}\`
                break
            }
        }
        return {
            key,
            targetSlot,
            algorithm: "CRC16(key) % 16384",
            assignedNode,
            note: "Hash Slots = consistent hashing trong Redis Cluster.",
        }
    }

    async gossipNodes() {
        const raw = (await this.client.cluster("NODES")) as string
        return raw.trim().split("\\n").filter(Boolean).map((line) => {
            const parts = line.split(" ")
            const flags = parts[2] ?? ""
            let status = "ALIVE"
            if (flags.includes("fail")) status = "DEAD"
            else if (flags.includes("pfail")) status = "SUSPECT (Nghi ngờ)"
            return { nodeId: parts[0], address: parts[1], flags, status }
        })
    }

    killNode(containerName: string) {
        execSync(\`docker pause \${containerName}\`, { stdio: "pipe" })
        return {
            success: true,
            message: \`Đã rút phích cắm \${containerName} (docker pause).\`,
            hint: "Polling GET /api/redis-cluster/gossip-nodes — ALIVE → SUSPECT → DEAD.",
        }
    }
}
`,
)

write(
    `${S0}/src/redis-cluster/redis-cluster.controller.ts`,
    `import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { KillNodeDto } from "./dto"
import { RedisClusterService } from "./redis-cluster.service"

@Controller("api/redis-cluster")
export class RedisClusterController {
    constructor(private readonly service: RedisClusterService) {}

    @Get("map-key")
    mapKey(@Query("key") key?: string) {
        if (!key?.trim()) return { error: "Thiếu ?key=..." }
        return this.service.mapKey(key.trim())
    }

    @Get("gossip-nodes")
    gossipNodes() {
        return this.service.gossipNodes()
    }

    @Post("kill-node")
    killNode(@Body() body: KillNodeDto) {
        return this.service.killNode(body.node)
    }
}
`,
)

write(
    `${S0}/src/redis-cluster/redis-cluster.module.ts`,
    `import { Module } from "@nestjs/common"
import { RedisClusterController } from "./redis-cluster.controller"
import { RedisClusterService } from "./redis-cluster.service"

@Module({
    controllers: [RedisClusterController],
    providers: [RedisClusterService],
})
export class RedisClusterModule {}
`,
)
write(`${S0}/src/redis-cluster/index.ts`, `export * from "./redis-cluster.controller"
export * from "./redis-cluster.module"
export * from "./redis-cluster.service"
`)

// ========== Lesson 1: DynamoDB ==========
const L1 = "1-dynamodb-quorum-and-consistency"
const S1 = `${L1}/dynamodb-service`

scaffoldLesson(L1, "dynamodb-service", {
    "@aws-sdk/client-dynamodb": "^3.749.0",
    "@aws-sdk/lib-dynamodb": "^3.749.0",
})

write(
    `${L1}/.docker/compose.yaml`,
    `name: ${L1}

services:
  dynamodb:
    image: amazon/dynamodb-local:latest
    container_name: ${L1}-dynamodb
    command: "-jar DynamoDBLocal.jar -sharedDb -inMemory"
    ports:
      - "8000:8000"
    networks:
      - ${L1}-network

  api:
    container_name: ${L1}-api
    build:
      context: ../dynamodb-service
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - PORT=3000
      - DYNAMODB_ENDPOINT=http://dynamodb:8000
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=local
      - AWS_SECRET_ACCESS_KEY=local
      - DYNAMODB_TABLE=starci_wallets
    depends_on:
      - dynamodb
    networks:
      - ${L1}-network

networks:
  ${L1}-network:
    name: ${L1}-network
`,
)

write(`${S1}/src/app.module.ts`, appModule("DynamodbModule", "dynamodb"))
write(
    `${S1}/.env`,
    `PORT=3000
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=local
AWS_SECRET_ACCESS_KEY=local
DYNAMODB_TABLE=starci_wallets
`,
)

write(
    `${S1}/src/dynamodb/dto/dynamodb-write.dto.ts`,
    `import { IsInt, IsNotEmpty, IsString } from "class-validator"

export class DynamodbWriteDto {
    @IsString()
    @IsNotEmpty()
    userId!: string

    @IsInt()
    balance!: number

    /** ONE = W=1 nhanh; QUORUM = ghi đủ replica logic. */
    @IsString()
    level!: string
}
`,
)
write(`${S1}/src/dynamodb/dto/index.ts`, `export * from "./dynamodb-write.dto"\n`)

write(
    `${S1}/src/dynamodb/dynamodb.service.ts`,
    `import {
    CreateTableCommand,
    DynamoDBClient,
} from "@aws-sdk/client-dynamodb"
import {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
} from "@aws-sdk/lib-dynamodb"
import { Injectable, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class DynamodbService implements OnModuleInit {
    private doc!: DynamoDBDocumentClient
    private table!: string

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        this.table = this.config.get<string>("DYNAMODB_TABLE") ?? "starci_wallets"
        const client = new DynamoDBClient({
            region: this.config.get("AWS_REGION") ?? "us-east-1",
            endpoint: this.config.get("DYNAMODB_ENDPOINT") ?? "http://localhost:8000",
            credentials: {
                accessKeyId: this.config.get("AWS_ACCESS_KEY_ID") ?? "local",
                secretAccessKey: this.config.get("AWS_SECRET_ACCESS_KEY") ?? "local",
            },
        })
        this.doc = DynamoDBDocumentClient.from(client)
        await client.send(
            new CreateTableCommand({
                TableName: this.table,
                AttributeDefinitions: [{ AttributeName: "userId", AttributeType: "S" }],
                KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
                BillingMode: "PAY_PER_REQUEST",
            }),
        ).catch(() => undefined)
    }

    async write(userId: string, balance: number, level: string) {
        const fastPath = level.toUpperCase() === "ONE"
        await this.doc.send(
            new PutCommand({
                TableName: this.table,
                Item: {
                    userId,
                    balance,
                    lastUpdated: new Date().toISOString(),
                },
            }),
        )
        return {
            success: true,
            consistencyUsed: level,
            partitionKey: userId,
            model: "Master-Replica (DynamoDB partition leader)",
            note: fastPath
                ? "W=1: ghi nhanh — replica bất đồng bộ, có thể stale khi đọc ONE."
                : "QUORUM-style: đợi đủ replica (khái niệm) trước khi ack.",
            quorumHint: "W + R > N — thử ONE+ONE (2≤3) vs QUORUM+QUORUM (4>3).",
        }
    }

    async read(userId: string, level: string) {
        const strong = level.toUpperCase() === "QUORUM"
        const result = await this.doc.send(
            new GetCommand({
                TableName: this.table,
                Key: { userId },
                ConsistentRead: strong,
            }),
        )
        return {
            data: result.Item ?? null,
            consistencyUsed: level,
            consistentRead: strong,
            msg: strong
                ? "Đọc strongly consistent — overlap với write quorum, tránh stale."
                : "Đọc eventually consistent — nhanh nhưng có thể lỗi thời.",
        }
    }
}
`,
)

write(
    `${S1}/src/dynamodb/dynamodb.controller.ts`,
    `import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { DynamodbWriteDto } from "./dto"
import { DynamodbService } from "./dynamodb.service"

@Controller("api/dynamodb")
export class DynamodbController {
    constructor(private readonly service: DynamodbService) {}

    @Post("write")
    write(@Body() body: DynamodbWriteDto) {
        return this.service.write(body.userId, body.balance, body.level)
    }

    @Get("read")
    read(
        @Query("userId") userId = "usr_1",
        @Query("level") level = "QUORUM",
    ) {
        return this.service.read(userId, level)
    }
}
`,
)

write(
    `${S1}/src/dynamodb/dynamodb.module.ts`,
    `import { Module } from "@nestjs/common"
import { DynamodbController } from "./dynamodb.controller"
import { DynamodbService } from "./dynamodb.service"

@Module({ controllers: [DynamodbController], providers: [DynamodbService] })
export class DynamodbModule {}
`,
)
write(`${S1}/src/dynamodb/index.ts`, `export * from "./dynamodb.controller"
export * from "./dynamodb.module"
export * from "./dynamodb.service"
`)

// ========== Lesson 2: Cassandra ==========
const L2 = "2-cassandra-quorum-and-read-repair"
const S2 = `${L2}/cassandra-service`

scaffoldLesson(L2, "cassandra-service", { "cassandra-driver": "^4.7.2" })

write(
    `${L2}/.docker/compose.yaml`,
    `name: ${L2}

services:
  cassandra:
    image: cassandra:4.1
    container_name: ${L2}-cassandra
    ports:
      - "9042:9042"
    environment:
      - MAX_HEAP_SIZE=512M
      - HEAP_NEWSIZE=128M
    networks:
      - ${L2}-network
    healthcheck:
      test: ["CMD-SHELL", "cqlsh -e 'describe cluster' || exit 1"]
      interval: 15s
      timeout: 10s
      retries: 12
      start_period: 90s

  api:
    container_name: ${L2}-api
    build:
      context: ../cassandra-service
      dockerfile: Dockerfile
    ports:
      - "3002:3000"
    environment:
      - PORT=3000
      - CASSANDRA_CONTACT_POINTS=cassandra
      - CASSANDRA_LOCAL_DC=datacenter1
    depends_on:
      cassandra:
        condition: service_healthy
    networks:
      - ${L2}-network

networks:
  ${L2}-network:
    name: ${L2}-network
`,
)

write(`${S2}/src/app.module.ts`, appModule("CassandraModule", "cassandra"))
write(
    `${S2}/.env`,
    `PORT=3000
CASSANDRA_CONTACT_POINTS=localhost
CASSANDRA_LOCAL_DC=datacenter1
`,
)

write(
    `${S2}/src/cassandra/dto/cassandra-write.dto.ts`,
    `import { IsInt, IsNotEmpty, IsString } from "class-validator"

export class CassandraWriteDto {
    @IsString()
    @IsNotEmpty()
    userId!: string

    @IsInt()
    balance!: number

    /** ONE (W=1) hoặc QUORUM (W=2 khi N=3). */
    @IsString()
    level!: string
}
`,
)
write(`${S2}/src/cassandra/dto/index.ts`, `export * from "./cassandra-write.dto"\n`)

write(
    `${S2}/src/cassandra/cassandra.service.ts`,
    `import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { Client, types } from "cassandra-driver"

@Injectable()
export class CassandraService implements OnModuleInit, OnModuleDestroy {
    private client!: Client

    constructor(private readonly config: ConfigService) {}

    async onModuleInit(): Promise<void> {
        this.client = new Client({
            contactPoints: [
                this.config.get<string>("CASSANDRA_CONTACT_POINTS") ?? "cassandra",
            ],
            localDataCenter: this.config.get<string>("CASSANDRA_LOCAL_DC") ?? "datacenter1",
        })
        await this.client.connect()
        await this.client.execute(\`
            CREATE KEYSPACE IF NOT EXISTS starci_store
            WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3}
        \`)
        await this.client.execute(\`
            CREATE TABLE IF NOT EXISTS starci_store.wallets (
                user_id text PRIMARY KEY,
                balance int,
                last_updated timestamp
            )
        \`)
    }

    async onModuleDestroy(): Promise<void> {
        await this.client?.shutdown()
    }

    private consistency(level: string) {
        return level.toUpperCase() === "QUORUM"
            ? types.consistencies.quorum
            : types.consistencies.one
    }

    async write(userId: string, balance: number, level: string) {
        const query =
            "INSERT INTO starci_store.wallets (user_id, balance, last_updated) VALUES (?, ?, toTimestamp(now()))"
        await this.client.execute(query, [userId, balance], {
            consistency: this.consistency(level),
        })
        const fast = level.toUpperCase() === "ONE"
        return {
            success: true,
            consistencyUsed: level,
            replicationFactor: 3,
            note: fast
                ? "Ghi cực nhanh vào 1 Replica — các bản sao có thể stale."
                : "Ghi Quorum — đa số replica ack (W=2, N=3).",
            quorumRule: "W + R > N → QUORUM + QUORUM = 4 > 3.",
        }
    }

    async read(userId: string, level: string) {
        const query =
            "SELECT user_id, balance, last_updated FROM starci_store.wallets WHERE user_id = ?"
        const result = await this.client.execute(query, [userId], {
            consistency: this.consistency(level),
        })
        const quorum = level.toUpperCase() === "QUORUM"
        return {
            data: result.first(),
            consistencyUsed: level,
            replicasConsulted: result.info?.queriedHost ?? null,
            readRepairTriggered: quorum,
            msg: quorum
                ? "Đối chiếu replica — Cassandra Read Repair ngầm (LWW) nếu phát hiện stale."
                : "Chỉ đọc 1 node — nhanh, chấp nhận stale data.",
        }
    }
}
`,
)

write(
    `${S2}/src/cassandra/cassandra.controller.ts`,
    `import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { CassandraWriteDto } from "./dto"
import { CassandraService } from "./cassandra.service"

@Controller("api/cassandra")
export class CassandraController {
    constructor(private readonly service: CassandraService) {}

    @Post("write")
    write(@Body() body: CassandraWriteDto) {
        return this.service.write(body.userId, body.balance, body.level)
    }

    @Get("read")
    read(
        @Query("userId") userId = "usr_1",
        @Query("level") level = "QUORUM",
    ) {
        return this.service.read(userId, level)
    }
}
`,
)

write(
    `${S2}/src/cassandra/cassandra.module.ts`,
    `import { Module } from "@nestjs/common"
import { CassandraController } from "./cassandra.controller"
import { CassandraService } from "./cassandra.service"

@Module({ controllers: [CassandraController], providers: [CassandraService] })
export class CassandraModule {}
`,
)
write(`${S2}/src/cassandra/index.ts`, `export * from "./cassandra.controller"
export * from "./cassandra.module"
export * from "./cassandra.service"
`)

write(
    "README.md",
    `# Module 16 (course 15): Distributed Key-Value Store

| Lesson | Stack | Port API |
|--------|-------|----------|
| 0 | Redis Cluster 3 masters | 3000 |
| 1 | DynamoDB Local | 3001 |
| 2 | Cassandra 4.1 | 3002 |

\`\`\`bash
node scratch/apply_module_16_kv_rules.mjs
\`\`\`
`,
)

for (const stale of STALE_LESSONS) {
    removeDir(stale)
}

console.log("Module 16 KV applied (Redis L0, DynamoDB L1, Cassandra L2):", MODULE)
