/**
 * Fix # references: ### <n> → ## <n> (parser expects level-2 numeric headings).
 * Run: node scratch/fix-references-heading-level.js
 */
const fs = require("fs")
const path = require("path")

const FILES = [
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/0-monolith-vs-microservices/en.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/0-monolith-vs-microservices/vi.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/1-introduction-to-kubernetes/en.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/1-introduction-to-kubernetes/vi.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/2-kubernetes-core-concepts/en.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/2-kubernetes-core-concepts/vi.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/3-complex-applications-and-helm-charts/en.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/3-complex-applications-and-helm-charts/vi.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/4-kubernetes-on-cloud/en.md",
    "1-system-design-mastery/modules/2-kubernetes-fundamentals/contents/4-kubernetes-on-cloud/vi.md",
]

const REF_INDEX_RE = /^### (\d+)\s*$/
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")

let changed = 0

for (const rel of FILES) {
    const full = path.join(ROOT, rel)
    const text = fs.readFileSync(full, "utf8")
    const lines = text.split("\n")
    let inReferences = false
    let fileChanged = false
    const out = lines.map((line) => {
        if (line === "# references") {
            inReferences = true
            return line
        }
        if (inReferences && line.startsWith("# ") && line !== "# references") {
            inReferences = false
        }
        if (inReferences) {
            const match = line.match(REF_INDEX_RE)
            if (match) {
                fileChanged = true
                return `## ${match[1]}`
            }
        }
        return line
    })
    if (fileChanged) {
        fs.writeFileSync(full, out.join("\n"))
        changed += 1
        console.log("fixed:", rel)
    } else {
        console.log("skip (no change):", rel)
    }
}

console.log(`Done. ${changed} file(s) updated.`)
