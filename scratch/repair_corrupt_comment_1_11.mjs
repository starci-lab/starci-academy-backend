/**
 * Sửa file TS bị hỏng bởi comment_system_design_modules_1_11.mjs (lỗi constructor continue).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/

function classNameFromServiceFile(filePath) {
    const base = path.basename(filePath, ".service.ts")
    const parts = base.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    let name = parts.join("")
    if (!name.endsWith("Service")) name += "Service"
    return name
}

function detectImports(body) {
    const lines = []
    const nest = new Set(["Injectable"])
    if (/\bLogger\b/.test(body)) nest.add("Logger")
    if (/\bConfigService\b/.test(body)) nest.add("ConfigService")
    if (/\bClientKafka\b/.test(body)) nest.add("ClientKafka")
    if (/\bInject\b/.test(body)) nest.add("Inject")
    if (/\bOnModuleInit\b/.test(body)) nest.add("OnModuleInit")
    if (/\bOnModuleDestroy\b/.test(body)) nest.add("OnModuleDestroy")
    if (/\bInjectRepository\b/.test(body)) nest.add("InjectRepository")
    if (/\bos\./.test(body)) lines.push('import * as os from "os"')
    if (/\bRedis\b/.test(body) || /\bioredis\b/.test(body)) lines.push('import Redis from "ioredis"')
    if (/\bTypeOrmModule\b/.test(body)) {
        /* noop */
    }
    const nestImports = Array.from(nest).sort()
    lines.unshift(
        `import {\n    ${nestImports.join(",\n    ")},\n} from "@nestjs/common"`,
    )
    if (nest.has("ConfigService") || /\bKafkaConfig\b/.test(body) || /\bRedisConfig\b/.test(body)) {
        lines.push('import {\n    ConfigService,\n} from "@nestjs/config"')
    }
    if (nest.has("ClientKafka")) {
        lines.push('import {\n    ClientKafka,\n} from "@nestjs/microservices"')
    }
    if (/\bKafkaConfig\b/.test(body)) {
        lines.push('import type {\n    KafkaConfig,\n} from "../config"')
    }
    if (/\bRedisConfig\b/.test(body)) {
        lines.push('import type {\n    RedisConfig,\n} from "../config"')
    }
    return lines.join("\n")
}

function repairService(filePath, text) {
    if (text.includes("export class")) return text
    const className = classNameFromServiceFile(filePath)
    const imports = detectImports(text)
    let body = text.trim()
    let extra = ""
    if (/\bthis\.processed\b/.test(body)) extra += "    private processed = 0\n\n"
    if (/\bthis\.config\b/.test(body)) {
        extra += `    constructor(private readonly config: ConfigService) {}\n\n`
    }
    if (/\bthis\.redis\b/.test(body) && /\bOnModuleInit\b/.test(body)) {
        extra += "    private redis!: Redis\n\n"
    }

    const header = `${imports}

/**
 * Service logic chính của lesson.
 * (EN: Core lesson service logic.)
 */
@Injectable()
export class ${className} {
    private readonly logger = new Logger(${className}.name)

${extra}`
    if (!body.startsWith("/**")) {
        body = `    ${body.split("\n").join("\n    ")}`
    }
    return header + body + "\n}\n"
}

function repairController(text) {
    let t = text
    t = t.replace(/(@(?:Get|Post|Put|Patch|Delete)\([^)]*\))\/\*\*/g, "$1\n    /**")
    t = t.replace(
        /(@Controller\([^)]*\))\n\/\*\*\n \* Class `/g,
        "/**\n * Class `",
    )
    t = t.replace(
        /(@Injectable\(\))\n\/\*\*\n \* Class `/g,
        "$1\n",
    )
    if (t.includes("export class") && t.split("export class").length > 2) {
        const idx = t.indexOf("export class")
        const before = t.slice(0, idx)
        const after = t.slice(idx)
        const cleanBefore = before.replace(
            /\/\*\*\n \* Class `[^`]+` — thành phần lab[^\n]*\n \* \(EN:[^\n]*\n \*\/\n/g,
            "",
        )
        t = cleanBefore + after
    }
    return t
}

function walkModules(from, to, fn) {
    let n = 0
    for (const e of fs.readdirSync(REPO, { withFileTypes: true })) {
        if (!e.isDirectory() || !MODULE_RE.test(e.name)) continue
        const num = Number(e.name.match(MODULE_RE)[1])
        if (num < from || num > to) continue
        const mod = path.join(REPO, e.name)
        const stack = [mod]
        while (stack.length) {
            const dir = stack.pop()
            for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
                const full = path.join(dir, ent.name)
                if (ent.isDirectory()) {
                    if (!["node_modules", "dist", ".briefs"].includes(ent.name)) stack.push(full)
                } else if (ent.isFile() && full.endsWith(".ts") && full.includes(`${path.sep}src${path.sep}`)) {
                    const orig = fs.readFileSync(full, "utf8")
                    const next = fn(full, orig)
                    if (next !== orig) {
                        fs.writeFileSync(full, next, "utf8")
                        n++
                    }
                }
            }
        }
    }
    return n
}

let repaired = walkModules(1, 11, (file, text) => {
    if (file.endsWith(".service.ts")) return repairService(file, text)
    if (file.endsWith(".controller.ts")) return repairController(text)
    return text
})

console.log({ repaired })
