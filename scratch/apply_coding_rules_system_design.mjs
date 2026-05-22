/**
 * Applies coding-rules.md to system-design-mastery-module-1..20 under .repo/
 * - strict tsconfig
 * - main.ts / bootstrap.ts split
 * - remove explicit `: unknown` / `: any`
 * - explicit return types on common Nest patterns
 * - scaffold types/ (+ optional enums, constants)
 * - generate .briefs per src file
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, "..", ".repo")

const STRICT_COMPILER = {
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    strictFunctionTypes: true,
    strictBindCallApply: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    noUncheckedIndexedAccess: true,
    forceConsistentCasingInFileNames: true,
    useUnknownInCatchVariables: false,
}

const MODULE_RE = /^system-design-mastery-module-(\d+)-/

/** Chỉ chạy module N (ví dụ: node apply_coding_rules_system_design.mjs 1) */
const ONLY_MODULE = process.argv[2] ? Number(process.argv[2]) : null

function listSystemDesignModules() {
    return fs
        .readdirSync(REPO_ROOT, { withFileTypes: true })
        .filter(
            (e) =>
                e.isDirectory() &&
                MODULE_RE.test(e.name) &&
                Number(e.name.match(MODULE_RE)[1]) <= 20,
        )
        .map((e) => path.join(REPO_ROOT, e.name))
        .sort((a, b) => {
            const na = Number(path.basename(a).match(MODULE_RE)?.[1] ?? 0)
            const nb = Number(path.basename(b).match(MODULE_RE)?.[1] ?? 0)
            return na - nb
        })
}

function walkFiles(dir, out, filter) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (e.name === "node_modules" || e.name === "dist" || e.name === ".briefs") {
                continue
            }
            walkFiles(full, out, filter)
        } else if (e.isFile() && filter(full)) {
            out.push(full)
        }
    }
}

function findNestServices(moduleDir) {
    const services = []
    walkFiles(moduleDir, services, (f) => {
        return (
            f.endsWith(`${path.sep}src${path.sep}main.ts`) ||
            f.endsWith(`${path.sep}src${path.sep}bootstrap.ts`)
        )
    })
    const roots = new Set(
        services.map((f) => {
            const idx = f.indexOf(`${path.sep}src${path.sep}`)
            return f.slice(0, idx)
        }),
    )
    return [...roots]
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"))
}

function writeJson(filePath, data) {
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8")
}

function fixTsconfig(serviceRoot) {
    for (const name of ["tsconfig.json", "tsconfig.build.json"]) {
        const filePath = path.join(serviceRoot, name)
        if (!fs.existsSync(filePath)) continue
        const json = readJson(filePath)
        json.compilerOptions = {
            ...json.compilerOptions,
            ...STRICT_COMPILER,
        }
        if (name === "tsconfig.build.json" && json.extends === "./tsconfig.json") {
            // keep extends
        }
        writeJson(filePath, json)
    }
}

function fixMainBootstrap(serviceRoot) {
    const mainPath = path.join(serviceRoot, "src", "main.ts")
    const bootstrapPath = path.join(serviceRoot, "src", "bootstrap.ts")
    if (!fs.existsSync(mainPath)) return

    let main = fs.readFileSync(mainPath, "utf8")
    if (
        main.includes("NestFactory.create") &&
        !fs.existsSync(bootstrapPath)
    ) {
        const bootstrap = `import {
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
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidUnknownValues: false,
        }),
    )
    const configService = app.get(ConfigService)
    const port = configService.get<number>("app.port") ?? 3000
    // Cổng: ConfigService namespace app.port (từ app.config.ts).
    // (EN: Port from ConfigService app.port (via app.config.ts).)
    await app.listen(port, "0.0.0.0")
}
`
        fs.writeFileSync(bootstrapPath, bootstrap, "utf8")
        main = `/**
 * Entry Node (\`nest build\` → dist/main.js) — chỉ gọi bootstrap đã export.
 * (EN: Node entry (\`nest build\` → dist/main.js) — invokes exported bootstrap only.)
 */
import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
`
        fs.writeFileSync(mainPath, main, "utf8")
        return
    }

    if (!main.includes('void bootstrap()')) {
        if (!main.includes('from "./bootstrap"')) {
            main = `/**
 * Entry Node (\`nest build\` → dist/main.js) — chỉ gọi bootstrap đã export.
 * (EN: Node entry (\`nest build\` → dist/main.js) — invokes exported bootstrap only.)
 */
import {
    bootstrap,
} from "./bootstrap"

void bootstrap()
`
        } else {
            main = main.replace(
                /bootstrap\(\)/g,
                "void bootstrap()",
            )
        }
        fs.writeFileSync(mainPath, main, "utf8")
    }

    if (fs.existsSync(bootstrapPath)) {
        let boot = fs.readFileSync(bootstrapPath, "utf8")
        if (!boot.includes('listen(port, "0.0.0.0")') && boot.includes("app.listen(port)")) {
            boot = boot.replace(
                /await app\.listen\(port\)/g,
                'await app.listen(port, "0.0.0.0")',
            )
            fs.writeFileSync(bootstrapPath, boot, "utf8")
        }
        if (!/export async function bootstrap\(\): Promise<void>/.test(boot)) {
            boot = boot.replace(
                /export async function bootstrap\(\)/g,
                "export async function bootstrap(): Promise<void>",
            )
        }
        patchBootstrapConfigService(boot, bootstrapPath)
    }
}

const APP_CONFIG_FILE = `import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình app (cổng HTTP).
 * (EN: App config (HTTP port).)
 */
export interface AppConfig {
    port: number
}

export const appConfig = registerAs(
    "app",
    (): AppConfig => ({
        port: Number(process.env.PORT) || 3000,
    }),
)
`

function listConfigModules(serviceRoot) {
    const configDir = path.join(serviceRoot, "src", "config")
    if (!fs.existsSync(configDir)) return []
    return fs
        .readdirSync(configDir)
        .filter((f) => f.endsWith(".config.ts"))
        .map((f) => {
            const base = f.replace(".config.ts", "")
            const camel =
                base.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + "Config"
            return {
                file: f,
                base,
                exportName: `${base.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Config`,
            }
        })
}

function writeConfigIndex(serviceRoot) {
    const configDir = path.join(serviceRoot, "src", "config")
    const modules = listConfigModules(serviceRoot)
    const lines = modules.map((m) => `export * from "./${m.base}.config"`)
    fs.writeFileSync(
        path.join(configDir, "index.ts"),
        `${lines.join("\n")}\n`,
        "utf8",
    )
}

function migrateNamedConfigExports(serviceRoot) {
    const configDir = path.join(serviceRoot, "src", "config")
    if (!fs.existsSync(configDir)) return
    for (const file of fs.readdirSync(configDir)) {
        if (!file.endsWith(".config.ts")) continue
        const filePath = path.join(configDir, file)
        let content = fs.readFileSync(filePath, "utf8")
        let changed = false
        if (content.includes("export default registerAs")) {
            const base = file.replace(".config.ts", "")
            const exportConst = `${base.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Config`
            content = content.replace(
                /export default registerAs/,
                `export const ${exportConst} = registerAs`,
            )
            changed = true
        }
        if (content.includes("export type ") && !content.includes("export interface")) {
            const iface = content.replace(
                /export type (\w+) = \{/,
                "export interface $1 {",
            )
            if (iface !== content) {
                content = iface
                changed = true
            }
        }
        if (changed) fs.writeFileSync(filePath, content, "utf8")
    }
    const indexPath = path.join(configDir, "index.ts")
    if (fs.existsSync(indexPath)) {
        let idx = fs.readFileSync(indexPath, "utf8")
        if (idx.includes("default as")) {
            writeConfigIndex(serviceRoot)
        }
    }
}

function ensureAppConfig(serviceRoot) {
    const configDir = path.join(serviceRoot, "src", "config")
    fs.mkdirSync(configDir, { recursive: true })
    const appPath = path.join(configDir, "app.config.ts")
    if (!fs.existsSync(appPath)) {
        fs.writeFileSync(appPath, APP_CONFIG_FILE, "utf8")
    }
    writeConfigIndex(serviceRoot)
}

function detectEnvGroups(serviceRoot) {
    const src = path.join(serviceRoot, "src")
    const files = []
    walkFiles(src, files, (f) => f.endsWith(".ts") && !f.includes(`${path.sep}config${path.sep}`))
    const env = new Set()
    for (const f of files) {
        const content = fs.readFileSync(f, "utf8")
        for (const m of content.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
            env.add(m[1])
        }
    }
    return [...env]
}

function detectEnvFromConfig(serviceRoot) {
    const configDir = path.join(serviceRoot, "src", "config")
    const env = new Set()
    if (!fs.existsSync(configDir)) return []
    for (const file of fs.readdirSync(configDir)) {
        if (!file.endsWith(".config.ts")) continue
        const content = fs.readFileSync(path.join(configDir, file), "utf8")
        for (const m of content.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
            env.add(m[1])
        }
    }
    return [...env].sort()
}

/** Biến cloud/API — placeholder <nhập_key> (không áp dụng MYSQL_/POSTGRES_/REDIS_ lab) */
function isCloudEnvVar(varName) {
    if (/^(MYSQL_|POSTGRES_|REDIS_|PORT|HOSTNAME|NODE_|MODE|PEERS|NATS_)/.test(varName)) {
        return false
    }
    return /(?:API_KEY|AWS_|OPENAI_|GITHUB_|STRIPE_|SENDGRID_)|(?:SECRET|TOKEN|CREDENTIAL)/i.test(
        varName,
    )
}

function defaultEnvValue(varName, serviceRoot) {
    if (isCloudEnvVar(varName)) return "<nhập_key>"
    const defaults = {
        PORT: "3000",
        POSTGRES_HOST: "postgres",
        POSTGRES_PORT: "5432",
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DB: "demo",
        MYSQL_HOST: "mysql-service",
        MYSQL_PORT: "3306",
        MYSQL_USER: "root",
        MYSQL_PASSWORD: "password",
        MYSQL_DATABASE: "test",
        HOSTNAME: "local-machine",
        REDIS_HOST: "redis-service",
        REDIS_PORT: "6379",
        MODE: "CP",
        NODE_NAME: "Node US",
        PEERS: "http://node-sg:3000",
        NATS_URL: "nats://nats:4222",
        KAFKA_BROKERS: "kafka:9092",
        KAFKA_TOPIC: "platform-events",
        KAFKA_CLIENT_ID: "broker-client",
        KAFKA_GROUP_ID: "broker-demo-group",
        KAFKA_DLQ_TOPIC: "platform-events-dlq",
        CONSUMER_DELAY_MS: "0",
    }
    if (defaults[varName]) return defaults[varName]
    const lesson = path.basename(path.dirname(serviceRoot))
    if (varName === "POSTGRES_DB") return lesson.replace(/-/g, "_")
    return ""
}

function writeEnvFile(serviceRoot) {
    const envPath = path.join(serviceRoot, ".env")
    const vars = detectEnvFromConfig(serviceRoot)
    if (!vars.length) return false

    const local = vars.filter((v) => !isCloudEnvVar(v))
    const cloud = vars.filter((v) => isCloudEnvVar(v))

    const lines = [
        "# --- Local / Docker (khớp compose.yaml và src/config/) ---",
        "# (EN: Local / Docker defaults aligned with compose.yaml and src/config/.)",
        ...local.map((v) => `${v}=${defaultEnvValue(v, serviceRoot)}`),
    ]
    if (cloud.length) {
        lines.push(
            "",
            "# --- Cloud / API (thay <nhập_key> trước khi gọi API cloud) ---",
            "# (EN: Cloud / API — replace <nhập_key> before calling cloud APIs.)",
            ...cloud.map((v) => `${v}=<nhập_key>`),
        )
    }
    lines.push("")
    fs.writeFileSync(envPath, lines.join("\n"), "utf8")
    return true
}

function writeDatabaseConfig(serviceRoot) {
    const configPath = path.join(serviceRoot, "src", "config", "database.config.ts")
    if (fs.existsSync(configPath)) return
    const content = `import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình Postgres/MySQL.
 * (EN: Postgres/MySQL connection config.)
 */
export interface DatabaseConfig {
    host: string
    port: number
    username: string
    password: string
    database: string
}

export const databaseConfig = registerAs(
    "database",
    (): DatabaseConfig => ({
        host: process.env.POSTGRES_HOST ?? process.env.MYSQL_HOST ?? "localhost",
        port: Number(process.env.POSTGRES_PORT ?? process.env.MYSQL_PORT) || 5432,
        username: process.env.POSTGRES_USER ?? process.env.MYSQL_USER ?? "postgres",
        password: process.env.POSTGRES_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "postgres",
        database: process.env.POSTGRES_DB ?? process.env.MYSQL_DATABASE ?? "demo",
    }),
)
`
    fs.writeFileSync(configPath, content, "utf8")
}

function writeRedisConfig(serviceRoot) {
    const configPath = path.join(serviceRoot, "src", "config", "redis.config.ts")
    if (fs.existsSync(configPath)) return
    const content = `import {
    registerAs,
} from "@nestjs/config"

/**
 * Cấu hình Redis.
 * (EN: Redis connection config.)
 */
export interface RedisConfig {
    host: string
    port: number
}

export const redisConfig = registerAs(
    "redis",
    (): RedisConfig => ({
        host: process.env.REDIS_HOST ?? "localhost",
        port: Number(process.env.REDIS_PORT) || 6379,
    }),
)
`
    fs.writeFileSync(configPath, content, "utf8")
}

function writeNodeConfig(serviceRoot) {
    const configPath = path.join(serviceRoot, "src", "config", "node.config.ts")
    if (fs.existsSync(configPath)) return
    const content = `import {
    registerAs,
} from "@nestjs/config"
import * as os from "os"

/**
 * Cấu hình node CAP (mode, tên, peers).
 * (EN: CAP node config (mode, name, peers).)
 */
export interface NodeConfig {
    mode: string
    nodeName: string
    peers: Array<string>
}

export const nodeConfig = registerAs(
    "node",
    (): NodeConfig => ({
        mode: process.env.MODE ?? "CP",
        nodeName: process.env.NODE_NAME ?? os.hostname(),
        peers: process.env.PEERS ? process.env.PEERS.split(",") : [],
    }),
)
`
    fs.writeFileSync(configPath, content, "utf8")
}

function ensureDomainConfigs(serviceRoot) {
    const env = detectEnvGroups(serviceRoot)
    if (env.some((e) => e.startsWith("POSTGRES_") || e.startsWith("MYSQL_"))) {
        writeDatabaseConfig(serviceRoot)
    }
    if (env.some((e) => e.startsWith("REDIS_"))) {
        writeRedisConfig(serviceRoot)
    }
    if (env.includes("MODE") || env.includes("NODE_NAME") || env.includes("PEERS")) {
        writeNodeConfig(serviceRoot)
    }
    writeConfigIndex(serviceRoot)
}

function getConfigLoadNames(serviceRoot) {
    return listConfigModules(serviceRoot).map((m) => {
        const base = m.base.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return `${base}Config`
    })
}

function patchAppModuleConfig(serviceRoot) {
    const appModulePath = path.join(serviceRoot, "src", "app.module.ts")
    if (!fs.existsSync(appModulePath)) return
    let content = fs.readFileSync(appModulePath, "utf8")
    if (content.includes("ConfigModule.forRoot")) return

    const loadNames = getConfigLoadNames(serviceRoot)
    if (!loadNames.length) return

    if (!content.includes("@nestjs/config")) {
        content = content.replace(
            /from "@nestjs\/common"/,
            `from "@nestjs/common"\nimport {\n    ConfigModule,\n} from "@nestjs/config"`,
        )
    }
    const configImport = `import {\n    ${loadNames.join(",\n    ")},\n} from "./config"\n`
    if (!content.includes('from "./config"')) {
        content = configImport + content
    } else if (!loadNames.every((n) => content.includes(n))) {
        content = content.replace(
            /import \{([^}]+)\} from "\.\/config"/,
            (m, inner) => {
                const existing = inner.split(",").map((s) => s.trim()).filter(Boolean)
                const merged = [...new Set([...existing, ...loadNames])]
                return `import {\n    ${merged.join(",\n    ")},\n} from "./config"`
            },
        )
    }

    content = content.replace(
        /@Module\(\{\s*imports:\s*\[/,
        `@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            load: [${loadNames.join(", ")}],
        }),`,
    )
    fs.writeFileSync(appModulePath, content, "utf8")
}

function patchBootstrapConfigService(content, bootstrapPath) {
    let boot = content
    if (!fs.existsSync(bootstrapPath)) return
    boot = fs.readFileSync(bootstrapPath, "utf8")
    if (boot.includes("ConfigService")) {
        fs.writeFileSync(bootstrapPath, boot, "utf8")
        return
    }
    if (!boot.includes("process.env.PORT")) {
        fs.writeFileSync(bootstrapPath, boot, "utf8")
        return
    }
    if (!boot.includes("@nestjs/config")) {
        boot = boot.replace(
            /from "@nestjs\/common"/,
            `from "@nestjs/common"\nimport {\n    ConfigService,\n} from "@nestjs/config"`,
        )
    }
    boot = boot.replace(
        /const port = Number\(process\.env\.PORT\)[^\n]*/,
        `const configService = app.get(ConfigService)\n    const port = configService.get<number>("app.port") ?? 3000`,
    )
    boot = boot.replace(
        /\/\/ Cổng: biến môi trường PORT[^\n]*/,
        "// Cổng: ConfigService namespace app.port (từ app.config.ts).",
    )
    boot = boot.replace(
        /\/\/ \(EN: Port from env PORT[^\n]*/,
        "// (EN: Port from ConfigService app.port (via app.config.ts).)",
    )
    fs.writeFileSync(bootstrapPath, boot, "utf8")
}

function patchNodeServiceConfig(serviceRoot) {
    const nodeService = path.join(serviceRoot, "src", "node", "node.service.ts")
    if (!fs.existsSync(nodeService)) return
    let content = fs.readFileSync(nodeService, "utf8")
    if (content.includes("ConfigService")) return
    content = content.replace(
        /import \* as os from "os"/,
        `import {\n    ConfigService,\n} from "@nestjs/config"\nimport type {\n    NodeConfig,\n} from "../config"`,
    )
    content = content.replace(
        /constructor\(\s*private readonly httpService: HttpService,\s*\)/,
        `constructor(\n        private readonly httpService: HttpService,\n        private readonly config: ConfigService,\n    )`,
    )
    const ctorBlock = content.match(
        /this\.mode = process\.env\.MODE[\s\S]*?this\.peers = process\.env\.PEERS[^\n]*\n/,
    )
    if (ctorBlock) {
        content = content.replace(
            ctorBlock[0],
            `const node = this.config.getOrThrow<NodeConfig>("node")
        this.mode = node.mode
        this.nodeName = node.nodeName
        this.peers = node.peers`,
        )
    }
    fs.writeFileSync(nodeService, content, "utf8")
}

function stripUnknownAndAny(content) {
    let out = content
    out = out.replace(/:\s*unknown\b/g, "")
    out = out.replace(/:\s*any\b/g, "")
    out = out.replace(/\bas any\b/g, "")
    out = out.replace(/\s+as\s+Record<string,\s*unknown>/g, "")
    out = out.replace(/Record<string,\s*unknown>/g, "object")
    return out
}

function fixControllerReturnTypesSimple(content) {
    const ctor = content.match(
        /constructor\([^)]*private readonly \w+:\s*(\w+)/,
    )
    if (!ctor) return content
    const serviceClass = ctor[1]
    let out = content
    out = out.replace(
        /: Promise<Record<string, string \| number>>/g,
        "",
    )
    out = out.replace(
        /: Record<string, string \| number>/g,
        "",
    )
    const lines = out.split("\n")
    const result = []
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i]
        const next = lines[i + 1] ?? ""
        const call = next.match(
            /return\s+(?:await\s+)?this\.(\w+)\.(\w+)\(/,
        )
        if (
            call &&
            line.match(/\)\s*\{\s*$/) &&
            !line.includes("): ")
        ) {
            const isAsync = line.includes("async ")
            const ret = isAsync
                ? `: Promise<ReturnType<${serviceClass}["${call[2]}"]>>`
                : `: ReturnType<${serviceClass}["${call[2]}"]>`
            line = line.replace(/\)\s*\{/, `${ret} {`)
        }
        result.push(line)
    }
    return result.join("\n")
}

function ensureScaffold(serviceRoot) {
    const src = path.join(serviceRoot, "src")
    const typesDir = path.join(src, "types")
    const enumsDir = path.join(src, "enums")
    const constantsDir = path.join(src, "constants")

    if (!fs.existsSync(typesDir)) {
        fs.mkdirSync(typesDir, { recursive: true })
        fs.writeFileSync(
            path.join(typesDir, "common.ts"),
            `/**
 * Kiểu dùng chung trong lesson (response, params).
 * (EN: Shared lesson types (responses, params).)
 */
export interface ApiMessageResponse {
    /**
     * Trạng thái xử lý.
     * (EN: Processing status.)
     */
    status: string
    /**
     * Thông báo mô tả kết quả.
     * (EN: Human-readable result message.)
     */
    message?: string
}
`,
            "utf8",
        )
        fs.writeFileSync(
            path.join(typesDir, "index.ts"),
            `export * from "./common"\n`,
            "utf8",
        )
    }

    if (!fs.existsSync(enumsDir)) {
        fs.mkdirSync(enumsDir, { recursive: true })
        fs.writeFileSync(
            path.join(enumsDir, "index.ts"),
            `/**
 * Barrel enum domain — thêm file enum khi lesson cần giá trị cố định.
 * (EN: Enum barrel — add enum files when the lesson needs fixed domain values.)
 */
`,
            "utf8",
        )
    }

    if (!fs.existsSync(constantsDir)) {
        fs.mkdirSync(constantsDir, { recursive: true })
        fs.writeFileSync(
            path.join(constantsDir, "index.ts"),
            `/**
 * Barrel hằng số — thêm token DI / prefix tại đây.
 * (EN: Constants barrel — add DI tokens / prefixes here.)
 */
`,
            "utf8",
        )
    }

    const rootIndex = path.join(src, "index.ts")
    if (fs.existsSync(rootIndex)) {
        fs.unlinkSync(rootIndex)
    }
}

function inferBrief(filePath, content, serviceRoot) {
    const rel = path.relative(path.join(serviceRoot, "src"), filePath).replace(/\\/g, "/")
    const base = path.basename(filePath)
    const jsdoc = content.match(/\/\*\*([\s\S]*?)\*\//)?.[1] ?? ""
    const viLine = jsdoc
        .split("\n")
        .map((l) => l.replace(/^\s*\*\s?/, "").trim())
        .find((l) => l && !l.startsWith("(EN") && !l.startsWith("@"))
    const enLine = jsdoc
        .split("\n")
        .map((l) => l.replace(/^\s*\*\s?/, "").trim())
        .find((l) => l.startsWith("(EN"))

    const role = (() => {
        if (base === "main.ts") {
            return {
                vi: "Điểm vào Node — chỉ gọi `bootstrap()`.",
                en: "Node entry — delegates to `bootstrap()` only.",
            }
        }
        if (base === "bootstrap.ts") {
            return {
                vi: "Khởi tạo NestJS, ValidationPipe, lắng nghe `0.0.0.0`.",
                en: "Creates NestJS app, global ValidationPipe, listens on `0.0.0.0`.",
            }
        }
        if (base === "app.module.ts") {
            return {
                vi: "Module gốc — gom import feature/config.",
                en: "Root module wiring features and config.",
            }
        }
        if (base.endsWith(".module.ts")) {
            return {
                vi: `Đăng ký DI cho feature \`${base.replace(".module.ts", "")}\`.`,
                en: `Registers DI graph for \`${base.replace(".module.ts", "")}\` feature.`,
            }
        }
        if (base.endsWith(".controller.ts")) {
            return {
                vi: "HTTP routes demo — map request tới service.",
                en: "HTTP routes demo — maps requests to service.",
            }
        }
        if (base.endsWith(".service.ts")) {
            return {
                vi: "Logic demo chính của bài (domain + side-effects).",
                en: "Core demo logic (domain rules and side effects).",
            }
        }
        if (rel.startsWith("config/")) {
            return {
                vi: "Cấu hình `ConfigModule` / biến môi trường.",
                en: "ConfigModule / environment configuration.",
            }
        }
        if (rel.startsWith("types/")) {
            return {
                vi: "Kiểu TypeScript thuần (type-safe contracts).",
                en: "Pure TypeScript types (type-safe contracts).",
            }
        }
        if (rel.startsWith("enums/")) {
            return {
                vi: "Enum giá trị domain cố định.",
                en: "Fixed domain enum values.",
            }
        }
        if (rel.startsWith("constants/")) {
            return {
                vi: "Hằng số / token DI dùng chung.",
                en: "Shared constants / DI tokens.",
            }
        }
        if (base === "index.ts") {
            return {
                vi: "Barrel re-export cho thư mục cha.",
                en: "Barrel re-export for parent folder.",
            }
        }
        return {
            vi: viLine || `File hỗ trợ demo trong luồng \`${rel}\`.`,
            en: enLine?.replace(/^\(EN:\s*/i, "").replace(/\)\.?$/, ".") ||
                `Supporting demo file in flow \`${rel}\`.`,
        }
    })()

    return `# ${base}

## Đường dẫn
\`${rel}\`

## Mục đích demo (VI)
${role.vi}

## Demo purpose (EN)
${role.en}
`
}

function writeBriefsReadme(serviceRoot) {
    const readmePath = path.join(serviceRoot, ".briefs", "README.md")
    fs.mkdirSync(path.dirname(readmePath), { recursive: true })
    const lessonName = path.basename(path.dirname(serviceRoot))
    const serviceName = path.basename(serviceRoot)
    fs.writeFileSync(
        readmePath,
        `# .briefs — ${serviceName}

## Mục đích (VI)
Mỗi file \`.md\` tương ứng một file \`src/**\` — ghi **mục đích demo** (không thay JSDoc trong code). Cấu trúc mirror \`src/\`.

## Purpose (EN)
Each \`.md\` maps to one \`src/**\` file and documents **why it exists in the demo**. Paths mirror \`src/\`.

## Lesson
\`${lessonName}\`
`,
        "utf8",
    )
}

function writeBriefs(serviceRoot) {
    const src = path.join(serviceRoot, "src")
    const briefsRoot = path.join(serviceRoot, ".briefs")
    const files = []
    walkFiles(src, files, (f) => f.endsWith(".ts"))
    for (const filePath of files) {
        const rel = path.relative(src, filePath).replace(/\\/g, "/")
        const outPath = path.join(briefsRoot, rel.replace(/\.ts$/, ".md"))
        fs.mkdirSync(path.dirname(outPath), { recursive: true })
        const content = fs.readFileSync(filePath, "utf8")
        fs.writeFileSync(outPath, inferBrief(filePath, content, serviceRoot), "utf8")
    }
}

function processService(serviceRoot, stats) {
    fixTsconfig(serviceRoot)
    ensureAppConfig(serviceRoot)
    ensureDomainConfigs(serviceRoot)
    migrateNamedConfigExports(serviceRoot)
    fixMainBootstrap(serviceRoot)
    patchAppModuleConfig(serviceRoot)
    const bootstrapPath = path.join(serviceRoot, "src", "bootstrap.ts")
    if (fs.existsSync(bootstrapPath)) {
        patchBootstrapConfigService(
            fs.readFileSync(bootstrapPath, "utf8"),
            bootstrapPath,
        )
    }
    patchNodeServiceConfig(serviceRoot)
    writeConfigIndex(serviceRoot)
    ensureScaffold(serviceRoot)

    const tsFiles = []
    walkFiles(path.join(serviceRoot, "src"), tsFiles, (f) => f.endsWith(".ts"))
    for (const filePath of tsFiles) {
        let content = fs.readFileSync(filePath, "utf8")
        const before = content
        content = stripUnknownAndAny(content)
        if (filePath.endsWith(".controller.ts")) {
            content = fixControllerReturnTypesSimple(content)
        }
        if (content !== before) {
            fs.writeFileSync(filePath, content, "utf8")
            stats.patchedTs++
        }
    }
    if (writeEnvFile(serviceRoot)) stats.envFiles++
    writeBriefs(serviceRoot)
    writeBriefsReadme(serviceRoot)
    stats.services++
    stats.briefs += tsFiles.length
}

const stats = {
    modules: 0,
    services: 0,
    patchedTs: 0,
    briefs: 0,
    configPatched: 0,
    envFiles: 0,
}

for (const moduleDir of listSystemDesignModules()) {
    const moduleNum = Number(path.basename(moduleDir).match(MODULE_RE)?.[1] ?? 0)
    if (ONLY_MODULE !== null && moduleNum !== ONLY_MODULE) continue
    stats.modules++
    const services = findNestServices(moduleDir)
    for (const serviceRoot of services) {
        processService(serviceRoot, stats)
    }
}

console.log(JSON.stringify(stats, null, 2))
