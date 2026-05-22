import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULE_RE = /^system-design-mastery-module-(\d+)-/

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist", ".briefs"].includes(e.name)) walk(full, out)
        } else if (e.isFile() && full.endsWith(".ts") && full.includes(`${path.sep}src${path.sep}`)) {
            out.push(full)
        }
    }
}

const corrupt = []
for (const e of fs.readdirSync(REPO, { withFileTypes: true })) {
    if (!e.isDirectory() || !MODULE_RE.test(e.name)) continue
    const n = Number(e.name.match(MODULE_RE)[1])
    if (n < 1 || n > 11) continue
    const files = []
    walk(path.join(REPO, e.name), files)
    for (const f of files) {
        const t = fs.readFileSync(f, "utf8")
        if (f.endsWith(".service.ts") && !t.includes("export class")) corrupt.push(f)
        if (f.endsWith(".controller.ts") && t.includes("@Get") && t.includes(")/**")) corrupt.push(f)
    }
}

console.log(corrupt.length)
for (const f of corrupt.slice(0, 20)) console.log(f)
