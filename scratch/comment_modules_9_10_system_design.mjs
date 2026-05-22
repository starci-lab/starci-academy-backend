/**
 * Bổ sung comment song ngữ (VI + EN) cho module 9 & 10 — chuẩn module 1–3.
 * - compose.yaml: header block + comment từng service/port
 * - TypeScript: JSDoc file/class/method (khi thiếu)
 * - README.md module
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.join(__dirname, "..", ".repo")

const MODULES = [
    "system-design-mastery-module-9-high-throughput-notification-system",
    "system-design-mastery-module-10-advanced-message-broker",
]

const COMPOSE_META = {
    "0-notification-system-architecture": {
        vi: "API nhận notification → Postgres (log QUEUED/SENT) + BullMQ (Redis) → worker gửi MailHog SMTP.",
        en: "API accepts notifications → Postgres status log + BullMQ (Redis) → worker sends via MailHog SMTP.",
        demo: "POST /notifications/send → MailHog UI http://localhost:8025",
    },
    "1-rate-limiting-and-priority-queues": {
        vi: "Token bucket Redis (RATE_LIMIT_MAX/window) + BullMQ priority queue (OTP ưu tiên hơn Marketing).",
        en: "Redis token bucket rate limit + BullMQ priority queue (OTP before Marketing).",
        demo: "Spam cùng userId → 429; OTP vẫn qua; so sánh thứ tự job",
    },
    "2-failover-and-delivery-guarantees": {
        vi: "SMTP primary/secondary MailHog + BullMQ retry; job failed = DLQ demo.",
        en: "Primary/secondary MailHog SMTP failover + BullMQ retries; failed jobs as DLQ demo.",
        demo: "docker stop mailhog-primary → gửi qua secondary",
    },
    "0-log-based-messaging-fundamentals": {
        vi: "Producer HTTP ingest-api → topic platform-events; consumer-a/b cùng group chia partition.",
        en: "HTTP producer ingest-api → platform-events topic; consumer-a/b share group partitions.",
        demo: "POST /events + Kafka UI http://localhost:8080 (lag/offset)",
    },
    "1-ordering-partitions-and-operations": {
        vi: "partitionKey bắt buộc; consumer-slow delay 3s → quan sát lag trên Kafka UI.",
        en: "Required partitionKey; consumer-slow 3s delay → observe consumer lag in Kafka UI.",
        demo: "Gửi cùng partitionKey liên tiếp; so sánh fast vs slow consumer",
    },
    "2-reliability-replay-and-deduplication": {
        vi: "Dedup clientMessageId (Redis SETNX) + Postgres processed_events; simulateFailure → retry/DLQ.",
        en: "Dedup clientMessageId (Redis SETNX) + Postgres; simulateFailure triggers retry/DLQ path.",
        demo: "Gửi trùng clientMessageId; POST simulateFailure: true",
    },
}

function walk(dir, out, filter) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist", ".briefs"].includes(e.name)) walk(full, out, filter)
        } else if (e.isFile() && filter(full)) out.push(full)
    }
}

function hasJSDocBefore(text, index) {
    const before = text.slice(0, index).trimEnd()
    return /\/\*\*[\s\S]*?\*\/\s*$/.test(before)
}

function prependIfMissing(text, block) {
    const trimmed = text.trimStart()
    if (trimmed.startsWith("/**")) return text
    return `${block}\n${text}`
}

function jsdoc(vi, en) {
    return `/**
 * ${vi}
 * (EN: ${en})
 */`
}

function inferTsComment(filePath, content) {
    const base = path.basename(filePath)
    const rel = filePath.replace(/\\/g, "/")
    const lesson = rel.match(/module-\d+-[^/]+\/([^/]+)\//)?.[1] ?? ""

    if (base === "index.ts") {
        const parent = path.basename(path.dirname(filePath))
        if (["dto", "entities", "config", "enums", "types", "constants"].includes(parent)) {
            return jsdoc(
                `Barrel re-export thư mục ${parent}/.`,
                `Barrel re-export for ${parent}/ folder.`,
            )
        }
        if (parent !== "src") {
            return jsdoc(
                `Barrel feature ${parent} — export controller/service/module.`,
                `Feature barrel ${parent} — exports controller/service/module.`,
            )
        }
        return null
    }

    if (base === "main.ts") {
        return jsdoc(
            "Entry Node (`nest build` → dist/main.js) — chỉ gọi `bootstrap()`.",
            "Node entry (`nest build` → dist/main.js) — invokes `bootstrap()` only.",
        )
    }

    if (base === "bootstrap.ts") {
        if (content.includes("connectMicroservice") || content.includes("Transport.KAFKA")) {
            return jsdoc(
                "Khởi tạo Nest microservice Kafka — đăng ký consumer group và lắng nghe message.",
                "Bootstrap Nest Kafka microservice — registers consumer group and listens for messages.",
            )
        }
        return jsdoc(
            "Khởi tạo Nest HTTP app — ValidationPipe + listen `0.0.0.0`.",
            "Bootstrap Nest HTTP app — ValidationPipe + listen on `0.0.0.0`.",
        )
    }

    if (base === "app.module.ts") {
        if (lesson.includes("log-based")) {
            return jsdoc(
                "Module gốc — ConfigModule + Kafka producer/consumer wiring cho lesson log fundamentals.",
                "Root module — ConfigModule + Kafka producer/consumer wiring for log fundamentals lesson.",
            )
        }
        if (lesson.includes("ordering")) {
            return jsdoc(
                "Module gốc — Kafka ordering lab (partition key + consumer group).",
                "Root module — Kafka ordering lab (partition key + consumer group).",
            )
        }
        if (lesson.includes("reliability")) {
            return jsdoc(
                "Module gốc — Kafka + TypeORM Postgres + reliability consumer.",
                "Root module — Kafka + TypeORM Postgres + reliability consumer.",
            )
        }
        if (rel.includes("notification")) {
            return jsdoc(
                "Module gốc — Postgres + BullMQ + Notifications feature.",
                "Root module — Postgres + BullMQ + Notifications feature.",
            )
        }
        if (rel.includes("rate-limit")) {
            return jsdoc(
                "Module gốc — Rate limit (Redis) + BullMQ priority queue + notifications.",
                "Root module — Redis rate limit + BullMQ priority queue + notifications.",
            )
        }
        if (rel.includes("failover")) {
            return jsdoc(
                "Module gốc — SMTP failover + BullMQ retry/DLQ + notifications.",
                "Root module — SMTP failover + BullMQ retry/DLQ + notifications.",
            )
        }
        return jsdoc(
            "Module gốc — gom config và feature modules.",
            "Root module — wires config and feature modules.",
        )
    }

    if (base.endsWith(".config.ts")) {
        const ns = base.replace(".config.ts", "")
        return jsdoc(
            `Cấu hình namespace \`${ns}\` — đọc biến môi trường trong factory registerAs.`,
            `Config namespace \`${ns}\` — environment variables in registerAs factory.`,
        )
    }

    if (base.endsWith(".controller.ts")) {
        if (content.includes("EventPattern")) {
            return jsdoc(
                "Kafka consumer controller — `@EventPattern` nhận message từ topic.",
                "Kafka consumer controller — `@EventPattern` handles topic messages.",
            )
        }
        return jsdoc(
            "HTTP controller — route demo cho lesson (map request → service).",
            "HTTP controller — lesson demo routes (maps requests to service).",
        )
    }

    if (base.endsWith(".service.ts")) {
        if (base.includes("consumer")) {
            return jsdoc(
                "Kafka consumer service — xử lý payload từng message (có thể delay để demo lag).",
                "Kafka consumer service — processes each message payload (optional delay for lag demo).",
            )
        }
        if (base.includes("smtp")) {
            return jsdoc(
                "SMTP client — gửi email qua primary, failover sang secondary khi lỗi.",
                "SMTP client — sends via primary, fails over to secondary on error.",
            )
        }
        if (base.includes("rate-limit")) {
            return jsdoc(
                "Rate limit service — token bucket trên Redis theo userId + channel.",
                "Rate limit service — Redis token bucket per userId + channel.",
            )
        }
        if (base.includes("failover")) {
            return jsdoc(
                "Failover orchestration — retry SMTP và cập nhật trạng thái gửi.",
                "Failover orchestration — SMTP retries and delivery status updates.",
            )
        }
        if (base.includes("reliability")) {
            return jsdoc(
                "Idempotent consumer — dedup Redis + persist Postgres + simulate failure.",
                "Idempotent consumer — Redis dedup + Postgres persist + simulated failure.",
            )
        }
        if (base.includes("events")) {
            return jsdoc(
                "Kafka producer service — HTTP nhận event và `emit` lên topic.",
                "Kafka producer service — accepts HTTP events and `emit`s to topic.",
            )
        }
        if (base.includes("notification")) {
            return jsdoc(
                "Notification service — enqueue BullMQ, cập nhật trạng thái DB.",
                "Notification service — enqueues BullMQ jobs and updates DB status.",
            )
        }
        return jsdoc(
            "Service logic chính của bài lab.",
            "Core lesson lab service logic.",
        )
    }

    if (base.endsWith(".processor.ts")) {
        return jsdoc(
            "BullMQ processor — worker lấy job từ queue và gửi SMTP.",
            "BullMQ processor — worker dequeues jobs and sends SMTP.",
        )
    }

    if (base.endsWith(".dto.ts")) {
        return jsdoc(
            "DTO request — validation `class-validator` cho API demo.",
            "Request DTO — `class-validator` rules for demo API.",
        )
    }

    if (base.endsWith(".entity.ts")) {
        return jsdoc(
            "TypeORM entity — bảng persistence cho demo.",
            "TypeORM entity — persistence table for demo.",
        )
    }

    if (base.endsWith(".module.ts")) {
        return jsdoc(
            "Nest feature module — đăng ký controller/service/providers.",
            "Nest feature module — registers controllers/services/providers.",
        )
    }

    return null
}

function patchTsFile(filePath) {
    let text = fs.readFileSync(filePath, "utf8")
    const original = text
    const header = inferTsComment(filePath, text)
    if (header) {
        text = prependIfMissing(text, header)
    }

    // Class-level JSDoc
    text = text.replace(
        /(\n)(export class \w+)/g,
        (match, nl, decl, offset) => {
            const idx = text.indexOf(match, offset)
            if (hasJSDocBefore(text, idx)) return match
            const name = decl.replace("export class ", "")
            const block = jsdoc(
                `Class \`${name}\` — thành phần demo lesson.`,
                `Class \`${name}\` — lesson demo component.`,
            )
            return `${nl}${block}\n${decl}`
        },
    )

    // Key public async methods without JSDoc
    text = text.replace(
        /(\n)(    async \w+\([^)]*\)[^{]*\{)/g,
        (match, nl, method, offset) => {
            if (hasJSDocBefore(text, offset)) return match
            const m = method.match(/async (\w+)/)
            if (!m) return match
            const block = jsdoc(
                `Logic — xử lý demo cho \`${m[1]}\`.`,
                `Logic — demo handler for \`${m[1]}\`.`,
            )
            return `${nl}${block}\n${method}`
        },
    )

    if (text !== original) {
        fs.writeFileSync(filePath, text, "utf8")
        return true
    }
    return false
}

function composeHeader(lesson, meta) {
    return `# Kiến trúc: ${meta.vi}
# (EN: ${meta.en})
#
# Demo gợi ý: ${meta.demo}
#
# Thư mục làm việc: ${lesson}/.docker
# (EN: Working directory: ${lesson}/.docker)
#
# Khởi chạy stack:
# (EN: Start stack:)
#   cd ${lesson}/.docker && docker compose up -d --build
#
# Xem log:
# (EN: View logs:)
#   docker compose logs -f
#
# Dọn dẹp:
# (EN: Cleanup:)
#   docker compose down -v
#
`
}

function annotateComposeServiceBlock(yaml, serviceName, vi, en) {
    const re = new RegExp(`^(  ${serviceName}:)\\s*$`, "m")
    if (!re.test(yaml)) return yaml
    if (yaml.includes(`# ${vi.slice(0, 12)}`) && yaml.includes(serviceName)) return yaml
    return yaml.replace(re, `  # ${vi}\n  # (EN: ${en})\n  ${serviceName}:`)
}

function annotateComposePort(yaml, portLine, vi, en) {
    if (yaml.includes(vi)) return yaml
    return yaml.replace(
        new RegExp(`^(      - "${portLine}")\\s*$`, "m"),
        `      # ${vi}\n      # (EN: ${en})\n      - "${portLine}"`,
    )
}

function patchCompose(composePath, lesson) {
    const meta = COMPOSE_META[lesson]
    if (!meta) return false
    let yaml = fs.readFileSync(composePath, "utf8")
    if (!yaml.includes("Thư mục làm việc")) {
        yaml = yaml.replace(/^#.*\n(# \(EN:.*\n)?/m, "")
        yaml = composeHeader(lesson, meta) + yaml.trimStart()
    }

    if (lesson.startsWith("0-log") || lesson.startsWith("1-ordering") || lesson.startsWith("2-reliability")) {
        yaml = annotateComposeServiceBlock(
            yaml,
            "kafka",
            "Kafka KRaft broker — log phân vùng cho lesson.",
            "Kafka KRaft broker — partitioned log for the lesson.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "kafka-ui",
            "Kafka UI — xem topic, offset, consumer lag.",
            "Kafka UI — inspect topics, offsets, consumer lag.",
        )
        yaml = annotateComposePort(yaml, "9092:9092", "Broker Kafka PLAINTEXT.", "Kafka broker PLAINTEXT port.")
        yaml = annotateComposePort(yaml, "8080:8080", "Giao diện Kafka UI.", "Kafka UI web port.")
    }

    if (lesson.includes("notification") || lesson.includes("rate-limit") || lesson.includes("failover")) {
        yaml = annotateComposeServiceBlock(
            yaml,
            "api",
            "NestJS API — nhận request, enqueue BullMQ.",
            "NestJS API — accepts requests and enqueues BullMQ jobs.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "db",
            "PostgreSQL — log trạng thái notification.",
            "PostgreSQL — notification status log.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "redis",
            "Redis — BullMQ backend" + (lesson.includes("rate-limit") ? " + token bucket." : "."),
            "Redis — BullMQ backend" + (lesson.includes("rate-limit") ? " + token bucket." : "."),
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "mailhog",
            "MailHog SMTP mock — UI http://localhost:8025.",
            "MailHog mock SMTP — UI at http://localhost:8025.",
        )
        yaml = annotateComposePort(yaml, "3000:3000", "HTTP API lesson.", "Lesson HTTP API port.")
        yaml = annotateComposePort(yaml, "8025:8025", "MailHog web inbox.", "MailHog web inbox port.")
    }

    if (lesson.startsWith("0-log")) {
        yaml = annotateComposeServiceBlock(yaml, "ingest-api", "HTTP producer — POST /events.", "HTTP producer — POST /events.")
        yaml = annotateComposeServiceBlock(
            yaml,
            "consumer-a",
            "Consumer A — group broker-lesson0-group.",
            "Consumer A — group broker-lesson0-group.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "consumer-b",
            "Consumer B — cùng group, chia partition.",
            "Consumer B — same group, shares partitions.",
        )
    }
    if (lesson.startsWith("1-ordering")) {
        yaml = annotateComposeServiceBlock(
            yaml,
            "ordering-producer",
            "Producer — bắt buộc partitionKey trong body.",
            "Producer — requires partitionKey in body.",
        )
        yaml = annotateComposeServiceBlock(yaml, "consumer-fast", "Consumer nhanh — không delay.", "Fast consumer — no artificial delay.")
        yaml = annotateComposeServiceBlock(
            yaml,
            "consumer-slow",
            "Consumer chậm — CONSUMER_DELAY_MS=3000 (demo lag).",
            "Slow consumer — CONSUMER_DELAY_MS=3000 (lag demo).",
        )
    }
    if (lesson.startsWith("2-reliability")) {
        yaml = annotateComposeServiceBlock(
            yaml,
            "ingest-api",
            "Producer — clientMessageId + simulateFailure.",
            "Producer — clientMessageId + simulateFailure flag.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "reliability-consumer",
            "Idempotent consumer — dedup + Postgres.",
            "Idempotent consumer — dedup + Postgres persistence.",
        )
        yaml = annotateComposeServiceBlock(yaml, "postgres", "Postgres — bảng processed_events.", "Postgres — processed_events table.")
        yaml = annotateComposeServiceBlock(yaml, "redis", "Redis — dedup SETNX + sequence INCR.", "Redis — dedup SETNX + sequence INCR.")
    }
    if (lesson.includes("failover")) {
        yaml = annotateComposeServiceBlock(
            yaml,
            "mailhog-primary",
            "SMTP primary — tắt container để demo failover.",
            "Primary SMTP — stop container to demo failover.",
        )
        yaml = annotateComposeServiceBlock(
            yaml,
            "mailhog-secondary",
            "SMTP secondary — nhận khi primary lỗi.",
            "Secondary SMTP — used when primary fails.",
        )
    }

    fs.writeFileSync(composePath, yaml.endsWith("\n") ? yaml : `${yaml}\n`, "utf8")
    return true
}

function patchModuleReadme(moduleDir, vi, en, lessons) {
    const readme = path.join(moduleDir, "README.md")
    const body = `# System Design Mastery — ${path.basename(moduleDir)}

## Tổng quan (VI)
${vi}

## Overview (EN)
${en}

## Lessons
${lessons.map((l) => `- \`${l}\``).join("\n")}

## Comment & cấu trúc
- \`compose.yaml\`: header + comment từng service (song ngữ).
- \`src/**\`: JSDoc VI + \`(EN:)\` trên file/class/method chính.
- \`.briefs/\`: mục đích demo từng file (chạy \`node scratch/apply_coding_rules_system_design.mjs\`).
`
    fs.writeFileSync(readme, body, "utf8")
}

let composeCount = 0
let tsCount = 0

for (const mod of MODULES) {
    const modPath = path.join(REPO, mod)
    const lessons = fs.readdirSync(modPath, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    for (const lesson of lessons) {
        const composePath = path.join(modPath, lesson, ".docker", "compose.yaml")
        if (fs.existsSync(composePath) && patchCompose(composePath, lesson)) composeCount++
    }
    const tsFiles = []
    walk(modPath, tsFiles, (f) => f.endsWith(".ts") && f.includes(`${path.sep}src${path.sep}`))
    for (const f of tsFiles) {
        if (patchTsFile(f)) tsCount++
    }
}

patchModuleReadme(
    path.join(REPO, "system-design-mastery-module-9-high-throughput-notification-system"),
    "Hệ thống thông báo throughput cao: API nhanh, xử lý nặng qua BullMQ, thêm rate limit, priority, failover SMTP.",
    "High-throughput notifications: fast API, BullMQ workers, then rate limiting, priorities, and SMTP failover.",
    ["0-notification-system-architecture", "1-rate-limiting-and-priority-queues", "2-failover-and-delivery-guarantees"],
)

patchModuleReadme(
    path.join(REPO, "system-design-mastery-module-10-advanced-message-broker"),
    "Kafka-style message broker: log fundamentals, ordering/partitions/lag, reliability + dedup (không WebSocket chat).",
    "Kafka-style broker labs: log fundamentals, ordering/partitions/lag, reliability and deduplication (not WebSocket chat).",
    ["0-log-based-messaging-fundamentals", "1-ordering-partitions-and-operations", "2-reliability-replay-and-deduplication"],
)

console.log({ composeLessons: composeCount, tsFilesPatched: tsCount })
