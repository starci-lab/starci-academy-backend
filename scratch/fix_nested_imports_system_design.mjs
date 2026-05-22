/**
 * Fix modules 1–10 per coding-rules §3.5:
 * - Expand single-line imports to multi-line destructuring
 * - Rewrite nested paths (./dto/foo.dto) → barrel (./dto)
 * - Ensure dto/entities/schemas/config feature barrels
 */
import fs from "node:fs"
import path from "node:path"
import {
    fileURLToPath 
} from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname,
    "..",
    ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/
const ONLY_MODULE = process.argv[2] ? Number(process.argv[2]) : null

const BARREL_DIRS = ["dto",
    "entities",
    "schemas",
    "enums",
    "types",
    "constants"]

const ENTITY_PG_BARRELS = [
    ["entities", "postgresql"],
    ["entities", "postgresql", "primary"],
]

const SCHEMA_MONGO_BARRELS = [
    ["schemas", "mongodb"],
    ["schemas", "mongodb", "primary"],
]

function listModules() {
    return fs
        .readdirSync(REPO_ROOT,
            {
                withFileTypes: true 
            })
        .filter((e) => {
            if (!e.isDirectory() || !MODULE_RE.test(e.name)) return false
            const n = Number(e.name.match(MODULE_RE)[1])
            if (ONLY_MODULE != null) return n === ONLY_MODULE
            return n >= 1 && n <= 20
        })
        .map((e) => path.join(REPO_ROOT,
            e.name))
}

function walkTs(dir, out) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir,
        {
            withFileTypes: true 
        })) {
        const full = path.join(dir,
            e.name)
        if (e.isDirectory()) {
            if (["node_modules",
                "dist",
                ".briefs"].includes(e.name)) continue
            walkTs(full,
                out)
        } else if (e.isFile() && full.endsWith(".ts")) {
            out.push(full)
        }
    }
}

function ensureBarrelInDir(dir) {
    const indexPath = path.join(dir,
        "index.ts")
    const tsFiles = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    if (!tsFiles.length) return 0
    const lines = tsFiles.map((f) => `export * from "./${f.replace(/\.ts$/,
        "")}"`)
    const content = `${lines.join("\n")}\n`
    if (!fs.existsSync(indexPath)) {
        fs.writeFileSync(indexPath,
            content,
            "utf8")
        return 1
    }
    let updated = 0
    const existing = fs.readFileSync(indexPath,
        "utf8")
    for (const f of tsFiles) {
        const stem = f.replace(/\.ts$/,
            "")
        if (!existing.includes(`"./${stem}"`)) {
            fs.appendFileSync(indexPath,
                `export * from "./${stem}"\n`,
                "utf8")
            updated++
        }
    }
    return updated
}

function ensureBarrels(serviceSrc) {
    let created = 0
    const barrelDirPaths = []
    function collectBarrelDirs(dir) {
        if (!fs.existsSync(dir)) return
        for (const e of fs.readdirSync(dir,
            {
                withFileTypes: true 
            })) {
            if (!e.isDirectory() || ["node_modules",
                "dist"].includes(e.name)) continue
            const full = path.join(dir,
                e.name)
            if (BARREL_DIRS.includes(e.name)) barrelDirPaths.push(full)
            else if (full.startsWith(serviceSrc)) collectBarrelDirs(full)
        }
    }
    collectBarrelDirs(serviceSrc)
    for (const dir of barrelDirPaths) {
        created += ensureBarrelInDir(dir)
    }
    const pgPrimary = path.join(serviceSrc, "entities", "postgresql", "primary")
    if (fs.existsSync(pgPrimary)) {
        created += ensureBarrelInDir(pgPrimary)
        const pgDir = path.join(serviceSrc, "entities", "postgresql")
        const pgIndex = path.join(pgDir, "index.ts")
        if (!fs.existsSync(pgIndex)) {
            fs.writeFileSync(pgIndex, `export * from "./primary"\n`, "utf8")
            created++
        }
        const entitiesIndex = path.join(serviceSrc, "entities", "index.ts")
        if (!fs.existsSync(entitiesIndex)) {
            fs.writeFileSync(entitiesIndex, `export * from "./postgresql"\n`, "utf8")
            created++
        }
    }
    const mongoPrimary = path.join(serviceSrc, "schemas", "mongodb", "primary")
    if (fs.existsSync(mongoPrimary)) {
        created += ensureBarrelInDir(mongoPrimary)
        const mongoDir = path.join(serviceSrc, "schemas", "mongodb")
        const mongoIndex = path.join(mongoDir, "index.ts")
        if (!fs.existsSync(mongoIndex)) {
            fs.writeFileSync(mongoIndex, `export * from "./primary"\n`, "utf8")
            created++
        }
        const schemasIndex = path.join(serviceSrc, "schemas", "index.ts")
        if (!fs.existsSync(schemasIndex)) {
            fs.writeFileSync(schemasIndex, `export * from "./mongodb"\n`, "utf8")
            created++
        }
    }
    // Feature folders under src/ (events, consumer, reliability, …)
    for (const e of fs.readdirSync(serviceSrc,
        {
            withFileTypes: true 
        })) {
        if (!e.isDirectory()) continue
        if (["config",
            "enums",
            "types",
            "constants",
            "dto",
            "entities",
            "schemas"].includes(e.name)) {
            continue
        }
        const dir = path.join(serviceSrc,
            e.name)
        const indexPath = path.join(dir,
            "index.ts")
        const tsFiles = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith(".ts") && f !== "index.ts")
        if (!tsFiles.length) continue
        const lines = tsFiles.map((f) => `export * from "./${f.replace(/\.ts$/,
            "")}"`)
        const content = `${lines.join("\n")}\n`
        if (!fs.existsSync(indexPath)) {
            fs.writeFileSync(indexPath,
                content,
                "utf8")
            created++
        } else {
            const existing = fs.readFileSync(indexPath,
                "utf8")
            for (const f of tsFiles) {
                const stem = f.replace(/\.ts$/,
                    "")
                if (!existing.includes(`"./${stem}"`)) {
                    fs.appendFileSync(indexPath,
                        `export * from "./${stem}"\n`,
                        "utf8")
                    created++
                }
            }
        }
    }
    // config/index.ts
    const configDir = path.join(serviceSrc,
        "config")
    if (fs.existsSync(configDir) && fs.statSync(configDir).isDirectory()) {
        const indexPath = path.join(configDir,
            "index.ts")
        const configs = fs
            .readdirSync(configDir)
            .filter((f) => f.endsWith(".config.ts"))
            .map((f) => f.replace(/\.ts$/,
                ""))
        if (configs.length) {
            const content = `${configs.map((c) => `export * from "./${c}"`).join("\n")}\n`
            if (!fs.existsSync(indexPath)) {
                fs.writeFileSync(indexPath,
                    content,
                    "utf8")
                created++
            }
        }
    }
    return created
}

function expandSingleLineImport(line) {
    const m = line.match(/^(\s*)(import\s+(?:type\s+)?)\{([^}]+)\}(\s+from\s+["'][^"']+["']\s*)$/)
    if (!m) return line
    const symbols = m[3]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    if (symbols.length <= 1) return line
    const indent = m[1] || ""
    const head = m[2]
    const tail = m[4]
    const body = symbols.map((s) => `${indent}    ${s},`).join("\n")
    return `${indent}${head}{\n${body}\n${indent}}${tail}`
}

function collapseNestedPath(spec, filePath) {
    if (!spec.startsWith("./") && !spec.startsWith("../")) return spec
    const parts = spec.split("/")
    // Chỉ path ≥ 3 segment: ./dto/foo.dto, ./events/events.service (không đụng ./events.service sibling).
    if (parts.length < 3) return spec
    const fileDir = path.dirname(filePath)
    const parentDir = path.resolve(
        fileDir,
        ...parts.slice(0,
            -1).map((p) => (p === "." ? "" : p)),
    )
    const barrelIndex = path.join(parentDir,
        "index.ts")
    if (fs.existsSync(barrelIndex)) {
        return parts.slice(0,
            -1).join("/") || "."
    }
    return spec
}

function fixFileContent(text, filePath) {
    let changed = false
    const lines = text.split("\n")
    const out = []
    for (const line of lines) {
        let next = line
        if (/^import\s+(?:type\s+)?\{[^}]+\}\s+from\s+["'][^"']+["']\s*$/.test(line.trim())) {
            const expanded = expandSingleLineImport(line)
            if (expanded !== line) {
                next = expanded
                changed = true
            }
        }
        if (/^export\s+\*/.test(next.trim())) {
            out.push(next)
            continue
        }
        const fromMatch = next.match(/from\s+["'](\.\.?\/[^"']+)["']/)
        if (fromMatch) {
            const collapsed = collapseNestedPath(fromMatch[1],
                filePath)
            if (collapsed !== fromMatch[1]) {
                next = next.replace(fromMatch[1],
                    collapsed)
                changed = true
            }
        }
        if (next.includes("\n")) {
            out.push(...next.split("\n"))
        } else {
            out.push(next)
        }
    }
    return {
        text: out.join("\n"), changed 
    }
}

function findServiceRoots(moduleDir) {
    const roots = new Set()
    const files = []
    walkTs(moduleDir,
        files)
    for (const f of files) {
        if (f.endsWith(`${path.sep}src${path.sep}main.ts`) || f.endsWith(`${path.sep}src${path.sep}bootstrap.ts`)) {
            roots.add(f.slice(0,
                f.indexOf(`${path.sep}src${path.sep}`)))
        }
    }
    return [...roots]
}

let barrelsCreated = 0
let filesFixed = 0

for (const mod of listModules()) {
    for (const serviceRoot of findServiceRoots(mod)) {
        const src = path.join(serviceRoot,
            "src")
        barrelsCreated += ensureBarrels(src)
        const files = []
        walkTs(src,
            files)
        for (const file of files) {
            const raw = fs.readFileSync(file,
                "utf8")
            const { text, changed } = fixFileContent(raw,
                file)
            if (changed) {
                fs.writeFileSync(file,
                    text,
                    "utf8")
                filesFixed++
            }
        }
    }
}

console.log(`Barrels created/updated: ${barrelsCreated}`)
console.log(`Files import-fixed: ${filesFixed}`)
