import fs from "node:fs"
import path from "node:path"
import {
    fileURLToPath 
} from "node:url"

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)),
    "..",
    ".repo")
const MODULE_RE = /^system-design-mastery-module-([1-9]|10)-/
const DEEP = /from\s+["'](\.\.?\/[^"']+\/[^"']+)["']/g
const SINGLE = /^import\s+(?:type\s+)?\{[^}]+\}\s+from\s+["'][^"']+["']\s*$/

function walk(dir, out) {
    for (const e of fs.readdirSync(dir,
        {
            withFileTypes: true 
        })) {
        const full = path.join(dir,
            e.name)
        if (e.isDirectory()) {
            if (!["node_modules",
                "dist",
                ".briefs"].includes(e.name)) walk(full,
                out)
        } else if (
            e.isFile() &&
            full.endsWith(".ts") &&
            !full.includes(`${path.sep}test${path.sep}`) &&
            !full.endsWith(".e2e-spec.ts")
        ) {
            out.push(full)
        }
    }
}

const mods = fs.readdirSync(REPO_ROOT).filter((n) => MODULE_RE.test(n))
let deep = 0
let single = 0
const samples = []
for (const m of mods) {
    const root = path.join(REPO_ROOT, m)
    const files = []
    walk(root, files)
    for (const f of files) {
        const t = fs.readFileSync(f, "utf8")
        for (const x of t.matchAll(DEEP)) {
            if (!x[1].endsWith("/index")) {
                deep++
                samples.push(`${x[1]}  ${path.relative(REPO_ROOT, f)}`)
            }
        }
        for (const line of t.split("\n")) {
            if (SINGLE.test(line.trim()) && line.includes(",")) single++
        }
    }
}
console.log({ deep, single })
if (samples.length) console.log(samples.join("\n"))
