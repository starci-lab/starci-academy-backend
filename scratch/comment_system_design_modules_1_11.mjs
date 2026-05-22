/**
 * Áp comment strict §4 coding-rules.md cho System Design modules 1–11.
 * Usage: node scratch/comment_system_design_modules_1_11.mjs [from] [to]
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(__dirname, "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/
const FROM = Number(process.argv[2] ?? 1)
const TO = Number(process.argv[3] ?? 11)

function listModules() {
    return fs
        .readdirSync(REPO, { withFileTypes: true })
        .filter((e) => e.isDirectory() && MODULE_RE.test(e.name))
        .map((e) => ({
            num: Number(e.name.match(MODULE_RE)[1]),
            path: path.join(REPO, e.name),
        }))
        .filter((m) => m.num >= FROM && m.num <= TO)
        .sort((a, b) => a.num - b.num)
}

function walk(dir, out, filter) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist", ".briefs", ".git"].includes(e.name)) {
                walk(full, out, filter)
            }
        } else if (e.isFile() && filter(full)) {
            out.push(full)
        }
    }
}

function hasJSDocBefore(text, index) {
    const before = text.slice(0, index).trimEnd()
    return /\/\*\*[\s\S]*?\*\/\s*$/.test(before)
}

function hasLogicCode(block) {
    return block.includes("Logic —") && block.includes("Code —")
}

function jsdocLogicCode(logicVi, codeVi, logicEn, codeEn) {
    return `/**
 * Logic — ${logicVi}
 * Code — ${codeVi}
 * (EN Logic: ${logicEn})
 * (EN Code: ${codeEn})
 */`
}

function jsdocSimple(vi, en) {
    return `/**
 * ${vi}
 * (EN: ${en})
 */`
}

function inferMethod(methodName, filePath, isAsync, routeDecorator) {
    const table = {
        bootstrap: [
            "Khởi động Nest app, ValidationPipe, lắng nghe `0.0.0.0` cho Docker.",
            "`NestFactory.create` → `useGlobalPipes(ValidationPipe)` → `ConfigService` → `listen(port, '0.0.0.0')`.",
            "Start Nest with ValidationPipe and Docker bind.",
            "`NestFactory.create` → `useGlobalPipes` → `listen` on `0.0.0.0`.",
        ],
        onModuleInit: [
            "Khởi tạo client khi module sẵn sàng (Redis/Kafka).",
            "`OnModuleInit`: `config.getOrThrow` → tạo client (`Redis`, `ClientKafka.connect`).",
            "Initialize clients when module is ready.",
            "`OnModuleInit` + `ConfigService` → client connection.",
        ],
        onModuleDestroy: [
            "Đóng connection khi shutdown.",
            "`OnModuleDestroy`: `quit()` / `disconnect()` / `close()`.",
            "Graceful shutdown of clients.",
            "`OnModuleDestroy` cleanup calls.",
        ],
        getStatus: [
            "Health + hostname — demo load balancer / replica.",
            "`os.hostname()` → `{ status, servedBy, timestamp }`.",
            "Health + hostname for LB/replica demos.",
            "`os.hostname()` response object.",
        ],
        runHeavyCalculation: [
            "Stress CPU để so sánh scale vertical vs horizontal.",
            "Vòng `Math.sqrt`/`Math.atan` + đo `Date.now()` duration.",
            "CPU stress for vertical vs horizontal scaling demo.",
            "Loop + timing with `Date.now()`.",
        ],
        getPullFeed: [
            "Fanout-on-read khi user mở feed.",
            "`follows.get` → filter `posts` → sort `createdAt`.",
            "Fanout-on-read at request time.",
            "Filter followed authors' posts.",
        ],
        getPushFeed: [
            "Fanout-on-write — timeline đã materialize.",
            "`pushedTimelines.get` → `posts.find` by id.",
            "Read materialized push timeline.",
            "Map stored post ids to posts.",
        ],
        createPost: [
            "Post mới + fanout-on-write tới followers.",
            "`posts.push` + loop `unshift` timeline (cap 100).",
            "Create post and push to follower timelines.",
            "Fanout write loop with trim.",
        ],
        seedTimeline: [
            "Seed Redis ZSET timeline (score = time).",
            "`ZADD` + `ZREMRANGEBYRANK` cap 500.",
            "Seed ZSET timeline cache.",
            "`ZADD` then trim rank.",
        ],
        getCachedFeed: [
            "Đọc feed cache mới nhất.",
            "`ZREVRANGE 0 19 WITHSCORES`.",
            "Read newest cached feed.",
            "`ZREVRANGE` parse pairs.",
        ],
        getHybridFeed: [
            "Hybrid: push posts + KOL pull + key salting.",
            "`SET` salted key + merge + sort.",
            "Hybrid fanout merge + salted KOL cache.",
            "Redis SET + array merge.",
        ],
        routePost: [
            "Route KOL pull vs regular push fanout.",
            "`celebrityAuthors.has` → branch metadata.",
            "Classify celebrity vs regular routing.",
            "Set lookup → route decision.",
        ],
        publish: [
            "HTTP producer → Kafka topic.",
            "`client.emit` với key/payload từ DTO.",
            "Produce event to Kafka topic.",
            "`ClientKafka.emit` from DTO.",
        ],
        process: [
            "Consumer xử lý từng message.",
            "Optional delay + increment counter + `logger.log`.",
            "Process one consumed message.",
            "Delay demo + structured log.",
        ],
        connectRedis: [
            "Lazy-connect Redis.",
            "`status === 'wait'` → `connect()`.",
            "Lazy Redis connect.",
            "ioredis lazy connect.",
        ],
        getFeedKey: [
            "Key namespace timeline/user.",
            "Template `feed:${userId}`.",
            "Per-user feed Redis key.",
            "Template string key.",
        ],
        getSaltedKolKey: [
            "Hotkey mitigation — salt KOL cache.",
            "`charCodeAt % 4` suffix.",
            "Salted KOL Redis key.",
            "Modulo salt bucket.",
        ],
    }

    if (table[methodName]) {
        const [lv, cv, le, ce] = table[methodName]
        if (routeDecorator) {
            return [
                `${lv} Endpoint \`${routeDecorator}\`.`,
                `${cv} Delegate → \`this.service.${methodName}()\`.`,
                `${le} Endpoint \`${routeDecorator}\`.`,
                `${ce} Delegates to service \`${methodName}\`.`,
            ]
        }
        return table[methodName]
    }

    const p = methodName.match(/^(get|find|list|create|post|send|publish|emit|handle|process|save|update|delete)/i)
    let lv = `Nghiệp vụ \`${methodName}\` (lab).`
    let cv = isAsync ? `\`async ${methodName}()\` + injected deps.` : `\`${methodName}()\` trong class.`
    let le = `Lab handler \`${methodName}\`.`
    let ce = isAsync ? `Async \`${methodName}\`.` : `Sync \`${methodName}\`.`
    if (p) {
        const k = p[1].toLowerCase()
        if (["get", "find", "list"].includes(k)) {
            cv = "Đọc state / query → map response."
            ce = "Read/query → response."
        } else if (["create", "post", "send", "publish", "emit", "save", "update"].includes(k)) {
            cv = "Validate → mutate / emit → return summary."
            ce = "Write path with validation."
        } else if (["handle", "process"].includes(k)) {
            cv = "Parse payload → side effects → return/ack."
            ce = "Process payload pipeline."
        }
    }
    return [lv, cv, le, ce]
}

function fixBrokenReturnTypes(text) {
    return text
        .replace(/=\s*"([^"]*)"\s*:\s*ReturnType/g, '= "$1"): ReturnType')
        .replace(/=\s*'([^']*)'\s*:\s*ReturnType/g, "= '$1'): ReturnType")
        .replace(/(\w+)\(\s*:\s*ReturnType/g, "$1(): ReturnType")
}

function getRouteAbove(text, methodIndex) {
    const chunk = text.slice(Math.max(0, methodIndex - 500), methodIndex)
    const m = chunk.match(/@(Get|Post|Put|Patch|Delete)\(([^)]*)\)[^\n]*\n(?:[^\n]*\n){0,8}\s*(?:async\s+)?(\w+)\s*\(/)
    if (!m) return null
    const pathArg = m[2].replace(/['"]/g, "") || "/"
    return `${m[1].toUpperCase()} ${pathArg}`
}

function shouldSkipClassJSDoc(text, offset) {
    const slice = text.slice(Math.max(0, offset - 120), offset)
    return /@(Controller|Injectable|Module)\(/.test(slice)
}

function patchMethodsStrict(text, filePath) {
    const isController = filePath.endsWith(".controller.ts")
    const isBootstrap = filePath.endsWith("bootstrap.ts")
    const isConfig = filePath.endsWith(".config.ts")
    if (
        !filePath.endsWith(".service.ts") &&
        !isController &&
        !isBootstrap &&
        !isConfig
    ) {
        return text
    }

    const methodRe =
        /(\n)(    (?:(?:public|private|protected)\s+)?(?:(?:async)\s+)?(\w+)\s*\(([^)]*)\)(\s*:[^{]+)?\s*\{)/g

    let result = ""
    let last = 0
    let match

    while ((match = methodRe.exec(text)) !== null) {
        const [full, , indentAndSig, methodName] = match
        const offset = match.index
        const end = offset + full.length

        if (methodName === "constructor") {
            result += text.slice(last, end)
            last = end
            continue
        }

        // Bỏ qua thân rỗng `{}` (regex có thể khớp nhầm constructor rỗng).
        if (/^\{\s*\}/.test(text.slice(end))) {
            const emptyEnd = end + text.slice(end).match(/^\{\s*\}/)[0].length
            result += text.slice(last, emptyEnd)
            last = emptyEnd
            continue
        }

        const beforeMatch = text.slice(last, offset)
        const route = isController ? getRouteAbove(text, offset) : null
        const isAsync = indentAndSig.includes("async ")
        const [lv, cv, le, ce] = inferMethod(methodName, filePath, isAsync, route)
        const block = jsdocLogicCode(lv, cv, le, ce)

        if (hasJSDocBefore(text, offset)) {
            const jdMatch = beforeMatch.match(/\/\*\*[\s\S]*?\*\/\s*$/)
            let replaceJd = false
            if (jdMatch && !hasLogicCode(jdMatch[0])) {
                const jdStart = beforeMatch.length - jdMatch[0].length
                const absJdEnd = last + jdStart + jdMatch[0].length
                const gap = text.slice(absJdEnd, offset)
                replaceJd = /^\s*$/.test(gap)
            }
            if (replaceJd && jdMatch) {
                result += beforeMatch.slice(0, beforeMatch.length - jdMatch[0].length)
                result += block + "\n"
            } else {
                result += beforeMatch
            }
        } else {
            result += beforeMatch + block + "\n"
        }

        result += indentAndSig
        last = end
    }

    result += text.slice(last)

    result = result.replace(
        /(\n)(export async function bootstrap\s*\([^)]*\)\s*(?::\s*Promise<void>)?\s*\{)/g,
        (m, nl, sig) => {
            const idx = result.indexOf(m)
            if (idx < 0 || hasJSDocBefore(result, idx)) return m
            const [lv, cv, le, ce] = inferMethod("bootstrap", filePath, true, null)
            return nl + jsdocLogicCode(lv, cv, le, ce) + "\n" + sig
        },
    )

    if (isConfig) {
        result = result.replace(
            /(\n)(export const \w+ = registerAs\(\s*\n?\s*"[^"]+",\s*\n?\s*\(\)\s*:\s*\w+\s*=>\s*\(\{)/g,
            (m, nl, decl) => {
                const idx = result.indexOf(m)
                if (idx < 0 || hasJSDocBefore(result, idx)) return m
                const [lv, cv, le, ce] = inferMethod("registerAs", filePath, false, null)
                return nl + jsdocLogicCode(lv, cv, le, ce) + "\n" + decl
            },
        )
    }

    return result
}

function inferFileHeader(filePath) {
    const base = path.basename(filePath)
    const map = {
        "main.ts": ["Entry — gọi `bootstrap()` only.", "Node entry — calls `bootstrap()` only."],
        "bootstrap.ts": ["Bootstrap Nest HTTP/microservice.", "Nest bootstrap."],
        "app.module.ts": ["Root module — config + features.", "Root AppModule."],
    }
    if (map[base]) return jsdocSimple(map[base][0], map[base][1])
    if (base.endsWith(".service.ts")) {
        return jsdocSimple(
            "Service lesson — methods documented Logic + Code (§4).",
            "Lesson service — Logic + Code on methods (§4).",
        )
    }
    if (base.endsWith(".controller.ts")) {
        return jsdocSimple(
            "HTTP/Kafka controller — routes delegate to service.",
            "Controller — routes delegate to service.",
        )
    }
    if (base.endsWith(".module.ts")) {
        return jsdocSimple("Feature module wiring.", "Feature module wiring.")
    }
    if (base.endsWith(".config.ts")) {
        return jsdocSimple(
            "Config `registerAs` — `process.env` chỉ ở factory.",
            "Config factory — env vars here only.",
        )
    }
    return null
}

function patchTsFile(filePath) {
    if (filePath.includes("system-design-mastery-module-11-news-feed-fanout-and-caching")) {
        return false
    }
    if (!fs.readFileSync(filePath, "utf8").includes("export class") && filePath.endsWith(".service.ts")) {
        return false
    }
    let text = fs.readFileSync(filePath, "utf8")
    const original = text
    text = fixBrokenReturnTypes(text)

    const header = inferFileHeader(filePath)
    if (header && !text.trimStart().startsWith("/**")) {
        text = header + "\n" + text
    }

    text = text.replace(/(\n)(export class \w+)/g, (m, nl, decl, offset) => {
        if (hasJSDocBefore(text, offset) || shouldSkipClassJSDoc(text, offset)) return m
        const name = decl.replace("export class ", "")
        return (
            nl +
            jsdocSimple(
                `Class \`${name}\` — component lab.`,
                `Class \`${name}\` — lesson component.`,
            ) +
            "\n" +
            decl
        )
    })

    text = patchMethodsStrict(text, filePath)

    if (text !== original) {
        fs.writeFileSync(filePath, text, "utf8")
        return true
    }
    return false
}

function lessonMeta(lesson) {
    const title = lesson.replace(/^\d+-/, "").replace(/-/g, " ")
    return {
        vi: `Stack Docker: ${title}.`,
        en: `Docker stack: ${title}.`,
        demo: "HTTP :3000 (xem compose).",
    }
}

function composeHeader(lesson, meta) {
    return `# Kiến trúc: ${meta.vi}
# (EN: ${meta.en})
#
# Demo: ${meta.demo}
#
# Thư mục làm việc: ${lesson}/.docker
# (EN: Working directory: ${lesson}/.docker)
#
# Khởi chạy: cd ${lesson}/.docker && docker compose up -d --build
# (EN: Start: cd ${lesson}/.docker && docker compose up -d --build)
#
# Log: docker compose logs -f
# (EN: Logs: docker compose logs -f)
#
# Dọn: docker compose down -v
# (EN: Cleanup: docker compose down -v)
#
`
}

function annotateService(yaml, name, vi, en) {
    const re = new RegExp(`^(  ${name}:)\\s*$`, "m")
    if (!re.test(yaml)) return yaml
    if (yaml.includes(`# ${vi.slice(0, 20)}`)) return yaml
    return yaml.replace(re, `  # ${vi}\n  # (EN: ${en})\n  ${name}:`)
}

function patchCompose(composePath, lesson) {
    let yaml = fs.readFileSync(composePath, "utf8")
    const meta = lessonMeta(lesson)
    if (!yaml.includes("Thư mục làm việc")) {
        yaml = composeHeader(lesson, meta) + yaml.replace(/^#.*\n(?:# \(EN:.*\n)*/m, "").trimStart()
    }
    for (const [name, vi, en] of [
        ["api", "NestJS HTTP API.", "NestJS HTTP API."],
        ["db", "PostgreSQL persistence.", "PostgreSQL persistence."],
        ["postgres", "PostgreSQL persistence.", "PostgreSQL persistence."],
        ["redis", "Redis cache/queue/rate-limit.", "Redis cache/queue/rate-limit."],
        ["nginx", "Nginx LB / reverse proxy.", "Nginx load balancer."],
        ["kafka", "Kafka broker.", "Kafka broker."],
        ["kafka-ui", "Kafka UI — lag/offset.", "Kafka UI — lag/offset."],
        ["mailhog", "MailHog SMTP mock :8025.", "MailHog SMTP mock."],
    ]) {
        yaml = annotateService(yaml, name, vi, en)
    }
    fs.writeFileSync(composePath, yaml.endsWith("\n") ? yaml : `${yaml}\n`, "utf8")
    return true
}

let tsPatched = 0
let composePatched = 0

for (const mod of listModules()) {
    const tsFiles = []
    walk(mod.path, tsFiles, (f) => {
        if (!f.endsWith(".ts") || !f.includes(`${path.sep}src${path.sep}`)) return false
        return (
            f.endsWith(".service.ts") ||
            f.endsWith(".controller.ts") ||
            f.endsWith("bootstrap.ts") ||
            f.endsWith(".config.ts") ||
            f.endsWith("main.ts") ||
            f.endsWith(".processor.ts") ||
            (f.includes(`${path.sep}dto${path.sep}`) && f.endsWith(".ts"))
        )
    })
    for (const f of tsFiles) {
        if (patchTsFile(f)) tsPatched++
    }
    for (const e of fs.readdirSync(mod.path, { withFileTypes: true })) {
        if (!e.isDirectory() || !/^\d+-/.test(e.name)) continue
        const cp = path.join(mod.path, e.name, ".docker", "compose.yaml")
        if (fs.existsSync(cp)) {
            patchCompose(cp, e.name)
            composePatched++
        }
    }
}

console.log({ modules: `${FROM}-${TO}`, tsPatched, composePatched })
