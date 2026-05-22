import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".repo")
const MODULES = [
    "system-design-mastery-module-9-high-throughput-notification-system",
    "system-design-mastery-module-10-advanced-message-broker",
]

const CLASS_BLOCK =
    /\n\/\*\*\n \* Class `[^`]+` — thành phần demo lesson\.\n \* \(EN: Class `[^`]+` — lesson demo component\.\)\n \*\//g

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (!["node_modules", "dist"].includes(e.name)) walk(full, out)
        } else if (e.isFile() && full.endsWith(".ts")) out.push(full)
    }
}

let n = 0
for (const mod of MODULES) {
    const files = []
    walk(path.join(REPO, mod), files)
    for (const f of files) {
        let t = fs.readFileSync(f, "utf8")
        const next = t.replace(CLASS_BLOCK, "")
        if (next !== t) {
            fs.writeFileSync(f, next, "utf8")
            n++
        }
    }
}
console.log({ removedClassBlocks: n })
