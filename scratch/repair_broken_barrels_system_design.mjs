/**
 * Repair corrupted `from "."` / `export * from "."` after overly aggressive import collapse.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-([1-9]|10)-/

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist", ".briefs"].includes(e.name)) walk(full, out)
        } else if (e.isFile() && (full.endsWith(".ts") || full.endsWith(".tsx"))) out.push(full)
    }
}

function rebuildConfigIndex(configDir) {
    const files = fs
        .readdirSync(configDir)
        .filter((f) => f.endsWith(".config.ts"))
        .map((f) => f.replace(/\.ts$/, ""))
    if (!files.length) return false
    const content = `${files.map((c) => `export * from "./${c}"`).join("\n")}\n`
    fs.writeFileSync(path.join(configDir, "index.ts"), content, "utf8")
    return true
}

function rebuildFeatureIndex(dir) {
    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".ts") && f !== "index.ts")
        .map((f) => f.replace(/\.ts$/, ""))
    if (!files.length) return false
    const content = `${files.map((c) => `export * from "./${c}"`).join("\n")}\n`
    fs.writeFileSync(path.join(dir, "index.ts"), content, "utf8")
    return true
}

let fixed = 0
for (const mod of fs.readdirSync(REPO_ROOT).filter((n) => MODULE_RE.test(n))) {
    const files = []
    walk(path.join(REPO_ROOT, mod), files)
    for (const file of files) {
        let text = fs.readFileSync(file, "utf8")
        const dir = path.dirname(file)
        const base = path.basename(file)

        if (base === "index.ts" && text.includes('from "."')) {
            if (path.basename(dir) === "config") {
                rebuildConfigIndex(dir)
                fixed++
                continue
            }
            rebuildFeatureIndex(dir)
            fixed++
            continue
        }

        if (!text.includes('from "."')) continue

        let next = text
        if (dir.endsWith(`${path.sep}events`) || dir.includes(`${path.sep}events${path.sep}`)) {
            next = next
                .replace(/import \{ EventsService \} from "\."/g, 'import {\n    EventsService,\n} from "./events.service"')
                .replace(/import \{ PublishEventDto \} from "\."/g, 'import {\n    PublishEventDto,\n} from "./dto"')
                .replace(
                    /import \{\s*EventsService,\s*\} from "\."/g,
                    'import {\n    EventsService,\n} from "./events.service"',
                )
                .replace(
                    /import \{\s*PublishEventDto,\s*\} from "\."/g,
                    'import {\n    PublishEventDto,\n} from "./dto"',
                )
        }
        if (next !== text) {
            fs.writeFileSync(file, next, "utf8")
            fixed++
        }
    }
}

// Rebuild all config/index.ts under modules 1-10
for (const mod of fs.readdirSync(REPO_ROOT).filter((n) => MODULE_RE.test(n))) {
    const files = []
    walk(path.join(REPO_ROOT, mod), files)
    for (const file of files) {
        if (file.endsWith(`${path.sep}config${path.sep}index.ts`)) {
            const t = fs.readFileSync(file, "utf8")
            if (t.includes('from "."') || !t.includes(".config")) {
                rebuildConfigIndex(path.dirname(file))
                fixed++
            }
        }
    }
}

console.log(`Repaired: ${fixed}`)
