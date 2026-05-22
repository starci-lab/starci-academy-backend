/**
 * Move TypeORM entities to src/entities/postgresql/<connection>/ for modules 1–12.
 * Default connection folder: primary.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.join(__dirname, "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/
const DEFAULT_CONNECTION = "primary"
const MIN_MODULE = 1
const MAX_MODULE = 12

function listModules() {
    return fs
        .readdirSync(REPO_ROOT, { withFileTypes: true })
        .filter((e) => {
            if (!e.isDirectory() || !MODULE_RE.test(e.name)) return false
            const n = Number(e.name.match(MODULE_RE)[1])
            return n >= MIN_MODULE && n <= MAX_MODULE
        })
        .map((e) => path.join(REPO_ROOT, e.name))
}

function findNestServiceRoots(moduleDir) {
    const roots = []
    function walk(dir) {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (!e.isDirectory() || e.name === "node_modules" || e.name === "dist") continue
            const full = path.join(dir, e.name)
            if (fs.existsSync(path.join(full, "src", "main.ts"))) {
                roots.push(full)
            } else {
                walk(full)
            }
        }
    }
    walk(moduleDir)
    return roots
}

function walkTs(dir, out) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (["node_modules", "dist", ".briefs"].includes(e.name)) continue
            walkTs(full, out)
        } else if (e.isFile() && full.endsWith(".ts")) {
            out.push(full)
        }
    }
}

function isUnderEntitiesPostgresql(file, srcRoot) {
    const rel = path.relative(srcRoot, file).replace(/\\/g, "/")
    return rel.startsWith("entities/postgresql/")
}

function findEntityFiles(srcRoot) {
    const out = []
    walkTs(srcRoot, out)
    return out.filter((f) => {
        if (!f.endsWith(".entity.ts")) return false
        if (isUnderEntitiesPostgresql(f, srcRoot)) return false
        return true
    })
}

function ensureBarrel(dir) {
    if (!fs.existsSync(dir)) return
    const tsFiles = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".ts") && f !== "index.ts")
    if (!tsFiles.length) return
    const content = `${tsFiles.map((f) => `export * from "./${f.replace(/\.ts$/, "")}"`).join("\n")}\n`
    const indexPath = path.join(dir, "index.ts")
    fs.writeFileSync(indexPath, content, "utf8")
}

function entitiesImportPath(fromFile, srcRoot) {
    const entitiesDir = path.join(srcRoot, "entities")
    let rel = path.relative(path.dirname(fromFile), entitiesDir).replace(/\\/g, "/")
    if (!rel || rel === ".") rel = "./entities"
    return rel
}

function patchFeatureIndex(indexPath) {
    if (!fs.existsSync(indexPath)) return
    let text = fs.readFileSync(indexPath, "utf8")
    const before = text
    text = text
        .replace(/^export \* from "\.\/entities"\s*\n/gm, "")
        .replace(/^export \* from '\.\/entities'\s*\n/gm, "")
        .replace(/^export \* from "\.\/.*\.entity"\s*\n/gm, "")
        .replace(/^export \* from '\.\/.*\.entity'\s*\n/gm, "")
        .replace(/^export \{\s*[^}]+\s*\} from "\.\/.*\.entity"\s*\n/gm, "")
    if (text !== before) {
        fs.writeFileSync(indexPath, text, "utf8")
    }
}

function getEntityClassNames(connDir) {
    const names = []
    if (!fs.existsSync(connDir)) return names
    for (const f of fs.readdirSync(connDir)) {
        if (!f.endsWith(".entity.ts")) continue
        const content = fs.readFileSync(path.join(connDir, f), "utf8")
        const m = content.match(/export class (\w+)/)
        if (m) names.push(m[1])
    }
    return names
}

function patchImports(file, srcRoot, entityNames) {
    const relEntities = entitiesImportPath(file, srcRoot)
    const inFeature = path.dirname(file) !== srcRoot
    let text = fs.readFileSync(file, "utf8")
    const before = text

    if (inFeature) {
        text = text.replace(/from "\.\/entities"/g, `from "${relEntities}"`)
        text = text.replace(/from '\.\/entities'/g, `from '${relEntities}'`)
        text = text.replace(
            /from "\.\/entities\/[^"]+"/g,
            `from "${relEntities}"`,
        )
        text = text.replace(
            /from '\.\/entities\/[^']+'/g,
            `from '${relEntities}'`,
        )
        for (const name of entityNames) {
            const re = new RegExp(
                `import\\s*\\{([^}]*\\b${name}\\b[^}]*)\\}\\s*from\\s*["']\\.["']`,
                "g",
            )
            text = text.replace(re, `import {$1} from "${relEntities}"`)
        }
    } else {
        for (const name of entityNames) {
            const re = new RegExp(
                `import\\s*\\{([^}]*\\b${name}\\b[^}]*)\\}\\s*from\\s*["']\\./[^"']+["']`,
                "g",
            )
            text = text.replace(re, `import {$1} from "./entities"`)
        }
    }

    text = text.replace(
        /from "\.\/[^"]+\/entities\/[^"]+\.entity"/g,
        `from "${inFeature ? relEntities : "./entities"}"`,
    )
    text = text.replace(
        /from '\.\/[^']+\/entities\/[^']+\.entity'/g,
        `from '${inFeature ? relEntities : "./entities"}'`,
    )
    text = text.replace(/from "\.\/[^"]+\/entities"/g, `from "${inFeature ? relEntities : "./entities"}"`)
    text = text.replace(/from '\.\/[^']+\/entities'/g, `from '${inFeature ? relEntities : "./entities"}'`)

    if (text !== before) {
        fs.writeFileSync(file, text, "utf8")
    }
}

function removeEmptyDirs(dir) {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) removeEmptyDirs(path.join(dir, e.name))
    }
    const entries = fs.readdirSync(dir)
    if (entries.length === 0) {
        fs.rmdirSync(dir)
    }
}

function cleanupStaleFeatureEntityBarrels(srcRoot) {
    const allTs = []
    walkTs(srcRoot, allTs)
    let removed = 0
    for (const f of allTs) {
        const rel = path.relative(srcRoot, f).replace(/\\/g, "/")
        const m = rel.match(/^([^/]+)\/entities\/index\.ts$/)
        if (m) {
            fs.unlinkSync(f)
            removeEmptyDirs(path.join(srcRoot, m[1], "entities"))
            removed++
        }
    }
    return removed
}

function migrateService(serviceRoot) {
    const srcRoot = path.join(serviceRoot, "src")
    if (!fs.existsSync(srcRoot)) return { moved: 0, cleaned: 0 }

    const cleaned = cleanupStaleFeatureEntityBarrels(srcRoot)

    const entityFiles = findEntityFiles(srcRoot)
    if (!entityFiles.length) return { moved: 0, cleaned }

    const conn = DEFAULT_CONNECTION
    const destDir = path.join(srcRoot, "entities", "postgresql", conn)
    fs.mkdirSync(destDir, { recursive: true })

    let moved = 0
    for (const file of entityFiles) {
        const base = path.basename(file)
        const dest = path.join(destDir, base)
        if (path.resolve(file) === path.resolve(dest)) continue
        if (fs.existsSync(dest)) {
            fs.unlinkSync(file)
        } else {
            fs.renameSync(file, dest)
        }
        moved++
    }

    const pgDir = path.join(srcRoot, "entities", "postgresql")
    ensureBarrel(destDir)
    ensureBarrel(pgDir)
    fs.writeFileSync(
        path.join(pgDir, "index.ts"),
        `export * from "./${conn}"\n`,
        "utf8",
    )
    const entitiesRoot = path.join(srcRoot, "entities")
    fs.writeFileSync(
        path.join(entitiesRoot, "index.ts"),
        `export * from "./postgresql"\n`,
        "utf8",
    )

    const entityNames = getEntityClassNames(destDir)
    const allTs = []
    walkTs(srcRoot, allTs)
    for (const f of allTs) {
        patchImports(f, srcRoot, entityNames)
    }

    for (const f of allTs) {
        if (f.endsWith("index.ts") && path.dirname(f) !== srcRoot) {
            const depth = path.relative(srcRoot, path.dirname(f)).split(path.sep).length
            if (depth === 1) {
                patchFeatureIndex(f)
            }
        }
    }

    function removeStaleEntityDirs(dir, srcRoot) {
        if (!fs.existsSync(dir)) return
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, e.name)
            if (e.isDirectory()) {
                const rel = path.relative(srcRoot, full).replace(/\\/g, "/")
                if (rel.endsWith("/entities") && !rel.startsWith("entities/postgresql")) {
                    removeStaleEntityDirs(full, srcRoot)
                    removeEmptyDirs(full)
                } else {
                    removeStaleEntityDirs(full, srcRoot)
                }
            }
        }
    }
    removeStaleEntityDirs(srcRoot, srcRoot)

    return { moved, cleaned, service: path.basename(serviceRoot) }
}

let totalMoved = 0
const report = []

for (const moduleDir of listModules()) {
    for (const serviceRoot of findNestServiceRoots(moduleDir)) {
        const r = migrateService(serviceRoot)
        if (r.moved > 0 || r.cleaned > 0) {
            totalMoved += r.moved
            report.push(
                `${path.relative(REPO_ROOT, serviceRoot)}: moved ${r.moved}, cleaned ${r.cleaned} stale barrel(s)`,
            )
        }
    }
}

console.log(`Moved ${totalMoved} entity file(s) to entities/postgresql/${DEFAULT_CONNECTION}/`)
for (const line of report) {
    console.log(`  ${line}`)
}
