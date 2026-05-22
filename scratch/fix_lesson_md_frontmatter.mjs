/**
 * Normalizes legacy lesson markdown: first heading was used as title text instead of `# title`.
 * Skips `challenges/` paths. Idempotent.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(
    __dirname,
    "..",
    ".mount",
    "data",
    "courses",
    "1-system-design-mastery",
    "modules",
)

function shouldSkip(rel) {
    const parts = rel.split(path.sep)
    return parts.includes("challenges")
}

function tryFix(md) {
    const text = md.replace(/^\uFEFF/, "")
    const lines = text.split(/\n/)
    if (lines[0]?.trim() === "# title") return null

    if (lines.length < 5) return "too_short"
    const h0 = lines[0].trim()
    const h2 = lines[2].trim()
    const h4 = lines[4].trim()
    if (
        !h0.startsWith("# ") ||
        !h2.startsWith("# ") ||
        h4 !== "# body"
    ) {
        return "pattern_mismatch"
    }
    if (lines[1].trim() !== "" || lines[3].trim() !== "") {
        return "pattern_mismatch_blank"
    }

    const title = h0.slice(2)
    const description = h2.slice(2)
    const rest = lines.slice(4).join("\n")
    return `# title\n${title}\n\n# description\n${description}\n\n${rest}`
}

function walk(dir, baseRel, out, inContentsTree) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
        const full = path.join(dir, e.name)
        const rel = path.join(baseRel, e.name)
        if (e.isDirectory()) {
            const nextInContents =
                inContentsTree || e.name === "contents"
            walk(full, rel, out, nextInContents)
        } else if (
            e.isFile() &&
            e.name.endsWith(".md") &&
            inContentsTree &&
            !shouldSkip(rel)
        ) {
            out.push({ full, rel })
        }
    }
}

const files = []
walk(ROOT, "", files, false)

let fixed = 0
const problems = []

for (const { full, rel } of files) {
    const content = fs.readFileSync(full, "utf8")
    const result = tryFix(content)
    if (result === null) continue
    if (typeof result === "string" && result.startsWith("# title\n")) {
        fs.writeFileSync(full, result, "utf8")
        fixed += 1
        continue
    }
    problems.push({ rel, reason: result })
}

console.log("ROOT", ROOT)
console.log("scanned", files.length, "md files (no challenges)")
console.log("fixed", fixed)
if (problems.length) {
    console.log("unmatched", problems.length)
    for (const p of problems) console.log(p.rel, p.reason)
}
