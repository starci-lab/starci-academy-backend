import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULES = [
    "system-design-mastery-module-9-high-throughput-notification-system",
    "system-design-mastery-module-10-advanced-message-broker",
]
const GENERIC = /\n\/\*\*\n \* Logic — xử lý demo cho[^*]+\*\/\n/g

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const f = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist"].includes(e.name)) walk(f, out)
        } else if (e.isFile() && f.endsWith(".ts")) out.push(f)
    }
}

let n = 0
for (const mod of MODULES) {
    const files = []
    walk(path.join(REPO, mod), files)
    for (const file of files) {
        const t = fs.readFileSync(file, "utf8")
        const next = t.replace(GENERIC, "\n")
        if (next !== t) {
            fs.writeFileSync(file, next, "utf8")
            n++
        }
    }
}
console.log({ stripped: n })
