import fs from "node:fs"
import path from "node:path"

const root = path.resolve(".")

const lessons = [
  {
    repo: "system-design-mastery-module-19-distributed-rate-limiter-api-gateway",
    lesson: "0-rate-limiting-algorithms",
    serviceDir: "limiter-service",
    feature: "limiter",
    classBase: "Limiter",
    titleVi: "Thuat toan rate limiting",
    titleEn: "Rate Limiting Algorithms",
    route: "api/limit",
    dtoName: "CheckLimitDto",
    dtoFile: "check-limit.dto.ts",
    dtoBody: `
import {
    IsIn,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload kiem tra quota theo thuat toan rate limiting.
 * (EN: Payload for checking quota with a rate limiting algorithm.)
 */
export class CheckLimitDto {
    @IsString()
    @IsNotEmpty()
    clientId!: string

    @IsString()
    @IsIn(["fixed-window", "sliding-window", "token-bucket"])
    algorithm!: "fixed-window" | "sliding-window" | "token-bucket"

    @IsNumber()
    @Min(1)
    limit!: number

    @IsNumber()
    @Min(1)
    windowSeconds!: number
}
`,
    serviceBody: `
    /**
     * Kiem tra request bang counters mo phong cho tung thuat toan.
     * (EN: Checks a request with simulated counters for each algorithm.)
     */
    check(clientId: string, algorithm: string, limit: number, windowSeconds: number) {
        const used = Math.min(limit, (clientId.length * 3) % (limit + 2))
        const allowed = used < limit
        const remaining = Math.max(limit - used - (allowed ? 1 : 0), 0)

        return {
            clientId,
            algorithm,
            allowed,
            limit,
            used: allowed ? used + 1 : used,
            remaining,
            resetInSeconds: windowSeconds,
            decisionSource: "in-memory-demo",
        }
    }
`,
    controllerBody: `
    /**
     * Kiem tra mot request co vuot quota hay khong.
     * (EN: Checks whether one request exceeds quota.)
     */
    @Post("check")
    check(@Body() body: CheckLimitDto) {
        return this.service.check(
            body.clientId,
            body.algorithm,
            body.limit,
            body.windowSeconds,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-19-distributed-rate-limiter-api-gateway",
    lesson: "1-distributed-rate-limiting-with-redis-lua",
    serviceDir: "distributed-limiter",
    feature: "distlimit",
    classBase: "Distlimit",
    titleVi: "Rate limiting phan tan voi Redis Lua",
    titleEn: "Distributed Rate Limiting with Redis Lua",
    route: "api/distlimit",
    dtoName: "AtomicLimitDto",
    dtoFile: "atomic-limit.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload kiem tra quota bang lenh atomic mo phong.
 * (EN: Payload for checking quota with a simulated atomic command.)
 */
export class AtomicLimitDto {
    @IsString()
    @IsNotEmpty()
    key!: string

    @IsNumber()
    @Min(1)
    limit!: number

    @IsNumber()
    @Min(1)
    windowSeconds!: number
}
`,
    serviceBody: `
    /**
     * Mo phong Lua script INCR/EXPIRE chay atomic tren Redis.
     * (EN: Simulates an atomic Redis Lua script using INCR/EXPIRE.)
     */
    check(key: string, limit: number, windowSeconds: number) {
        const current = (key.length % limit) + 1
        const allowed = current <= limit

        return {
            key,
            script: "INCR_AND_EXPIRE_ATOMIC",
            allowed,
            current,
            limit,
            ttlSeconds: windowSeconds,
            redisSlot: this.slotFor(key),
        }
    }

    private slotFor(key: string): number {
        return [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 16_384
    }
`,
    controllerBody: `
    /**
     * Kiem tra quota phan tan bang thao tac atomic mo phong.
     * (EN: Checks distributed quota with a simulated atomic operation.)
     */
    @Post("check")
    check(@Body() body: AtomicLimitDto) {
        return this.service.check(body.key, body.limit, body.windowSeconds)
    }
`,
  },
  {
    repo: "system-design-mastery-module-19-distributed-rate-limiter-api-gateway",
    lesson: "2-api-gateway-routing-and-resilience",
    serviceDir: "gateway-service",
    feature: "gateway",
    classBase: "Gateway",
    titleVi: "API gateway routing va resilience",
    titleEn: "API Gateway Routing and Resilience",
    route: "api/gateway",
    dtoName: "RouteRequestDto",
    dtoFile: "route-request.dto.ts",
    dtoBody: `
import {
    IsIn,
    IsNotEmpty,
    IsString,
} from "class-validator"

/**
 * Payload mo phong request di qua API gateway.
 * (EN: Payload that simulates a request passing through an API gateway.)
 */
export class RouteRequestDto {
    @IsString()
    @IsNotEmpty()
    path!: string

    @IsString()
    @IsIn(["GET", "POST", "PUT", "DELETE"])
    method!: "GET" | "POST" | "PUT" | "DELETE"

    @IsString()
    @IsNotEmpty()
    clientId!: string
}
`,
    serviceBody: `
    /**
     * Chon upstream va tra ve policy resilience cho request.
     * (EN: Selects an upstream and returns resilience policy for the request.)
     */
    route(path: string, method: string, clientId: string) {
        const service = path.startsWith("/payments") ? "payment-api" : "core-api"

        return {
            clientId,
            method,
            path,
            upstream: {
                service,
                url: \`http://\${service}:3000\`,
            },
            resilience: {
                circuitBreaker: "closed",
                timeoutMs: 1500,
                retries: method === "GET" ? 2 : 0,
            },
            rateLimitKey: \`\${clientId}:\${service}\`,
        }
    }
`,
    controllerBody: `
    /**
     * Dinh tuyen request qua gateway va gan resilience policy.
     * (EN: Routes a request through the gateway and attaches resilience policy.)
     */
    @Post("route")
    route(@Body() body: RouteRequestDto) {
        return this.service.route(body.path, body.method, body.clientId)
    }
`,
  },
  {
    repo: "system-design-mastery-module-20-financial-transaction-digital-wallet-system",
    lesson: "0-double-entry-bookkeeping-and-acid",
    serviceDir: "wallet-service",
    feature: "wallet",
    classBase: "Wallet",
    titleVi: "Double-entry bookkeeping va ACID",
    titleEn: "Double-Entry Bookkeeping and ACID",
    route: "api/wallet",
    dtoName: "TransferDto",
    dtoFile: "transfer.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload chuyen tien giua hai tai khoan vi.
 * (EN: Payload for transferring money between two wallet accounts.)
 */
export class TransferDto {
    @IsString()
    @IsNotEmpty()
    fromAccount!: string

    @IsString()
    @IsNotEmpty()
    toAccount!: string

    @IsNumber()
    @Min(1)
    amount!: number

    @IsString()
    @IsNotEmpty()
    currency!: string
}
`,
    serviceBody: `
    /**
     * Tao cap but toan debit/credit can bang trong mot giao dich ACID mo phong.
     * (EN: Creates balanced debit/credit entries in a simulated ACID transaction.)
     */
    transfer(fromAccount: string, toAccount: string, amount: number, currency: string) {
        const transactionId = \`txn_\${fromAccount}_\${toAccount}_\${amount}\`
        const entries = [
            { account: fromAccount, direction: "debit", amount, currency },
            { account: toAccount, direction: "credit", amount, currency },
        ]

        return {
            transactionId,
            status: "committed",
            acidBoundary: "single-ledger-transaction-demo",
            balanced: entries[0].amount === entries[1].amount,
            entries,
        }
    }
`,
    controllerBody: `
    /**
     * Thuc hien chuyen tien va tao ledger entries can bang.
     * (EN: Performs a transfer and creates balanced ledger entries.)
     */
    @Post("transfer")
    transfer(@Body() body: TransferDto) {
        return this.service.transfer(
            body.fromAccount,
            body.toAccount,
            body.amount,
            body.currency,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-20-financial-transaction-digital-wallet-system",
    lesson: "1-idempotency-guarantees-in-financial-apis",
    serviceDir: "transaction-api",
    feature: "transaction",
    classBase: "Transaction",
    titleVi: "Idempotency trong API tai chinh",
    titleEn: "Idempotency Guarantees in Financial APIs",
    route: "api/transactions",
    dtoName: "ChargeDto",
    dtoFile: "charge.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from "class-validator"

/**
 * Payload tao charge voi idempotency key.
 * (EN: Payload for creating a charge with an idempotency key.)
 */
export class ChargeDto {
    @IsString()
    @IsNotEmpty()
    idempotencyKey!: string

    @IsString()
    @IsNotEmpty()
    accountId!: string

    @IsNumber()
    @Min(1)
    amount!: number

    @IsString()
    @IsNotEmpty()
    currency!: string
}
`,
    serviceBody: `
    private readonly responses = new Map<string, Record<string, unknown>>()

    /**
     * Tra lai cung response khi client retry voi cung idempotency key.
     * (EN: Returns the same response when a client retries with the same idempotency key.)
     */
    charge(idempotencyKey: string, accountId: string, amount: number, currency: string) {
        const existing = this.responses.get(idempotencyKey)
        if (existing) {
            return {
                ...existing,
                replayed: true,
            }
        }

        const response = {
            transactionId: \`charge_\${idempotencyKey}\`,
            accountId,
            amount,
            currency,
            status: "authorized",
            replayed: false,
        }
        this.responses.set(idempotencyKey, response)
        return response
    }
`,
    controllerBody: `
    /**
     * Tao charge idempotent cho request tai chinh.
     * (EN: Creates an idempotent charge for a financial request.)
     */
    @Post("charge")
    charge(@Body() body: ChargeDto) {
        return this.service.charge(
            body.idempotencyKey,
            body.accountId,
            body.amount,
            body.currency,
        )
    }
`,
  },
  {
    repo: "system-design-mastery-module-20-financial-transaction-digital-wallet-system",
    lesson: "2-reconciliation-and-compensating-transactions",
    serviceDir: "wallet-reconciliation",
    feature: "recon",
    classBase: "Recon",
    titleVi: "Reconciliation va compensating transactions",
    titleEn: "Reconciliation and Compensating Transactions",
    route: "api/recon",
    dtoName: "ReconcileDto",
    dtoFile: "reconcile.dto.ts",
    dtoBody: `
import {
    IsNotEmpty,
    IsNumber,
    IsString,
} from "class-validator"

/**
 * Payload doi soat ledger noi bo voi settlement ben ngoai.
 * (EN: Payload for reconciling internal ledger and external settlement.)
 */
export class ReconcileDto {
    @IsString()
    @IsNotEmpty()
    provider!: string

    @IsNumber()
    ledgerTotal!: number

    @IsNumber()
    settlementTotal!: number
}
`,
    serviceBody: `
    /**
     * Doi soat so tong va tao compensating transaction khi co sai lech.
     * (EN: Reconciles totals and creates a compensating transaction when there is drift.)
     */
    run(provider: string, ledgerTotal: number, settlementTotal: number) {
        const difference = Number((ledgerTotal - settlementTotal).toFixed(2))
        const matched = difference === 0

        return {
            provider,
            ledgerTotal,
            settlementTotal,
            difference,
            matched,
            action: matched ? "close-batch" : "create-compensating-transaction",
            compensation: matched ? null : {
                amount: Math.abs(difference),
                direction: difference > 0 ? "credit-provider" : "debit-provider",
            },
        }
    }
`,
    controllerBody: `
    /**
     * Chay doi soat va de xuat bu tru neu can.
     * (EN: Runs reconciliation and proposes compensation when needed.)
     */
    @Post("run")
    run(@Body() body: ReconcileDto) {
        return this.service.run(body.provider, body.ledgerTotal, body.settlementTotal)
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
  const imports = ["Body", "Controller", "Post"]
  return [...new Set(imports)].sort((a, b) => a.localeCompare(b)).join(",\n    ")
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
  write(path.join(lessonRoot, ".gitignore"), "node_modules/\ndist/\n")
  write(path.join(serviceRoot, ".env"), "PORT=3000\n")

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

  write(path.join(srcRoot, "config", "index.ts"), `export * from "./app.config"`)

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
export * from "./dto"
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

  write(path.join(featureRoot, `${item.feature}.controller.ts`), `
import {
    ${controllerImports(item)},
} from "@nestjs/common"
import {
    ${item.dtoName},
} from "./dto"
import {
    ${className(item.classBase, "Service")},
} from "./${item.feature}.service"

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

  write(path.join(dtoRoot, item.dtoFile), item.dtoBody)
  write(path.join(dtoRoot, "index.ts"), `export * from "./${item.dtoFile.replace(".ts", "")}"`)

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

console.log(`Rewired ${lessons.length} lesson services for modules 18 and 19.`)
