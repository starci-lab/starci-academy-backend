/**
 * Scan challenge en.md: steps missing title (or parsed as value string).
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-challenge-empty-steps.js
 */
const fs = require("fs")
const path = require("path")
const {
    ExtractJsonFromMdService,
} = require("../src/modules/init/seeders/shared/extracts/extract-json-from-md.service")

const ex = new ExtractJsonFromMdService()
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const bad = []

function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name
        if (!entry.isDirectory()) {
            continue
        }
        if (entry.name === "challenges") {
            for (const ch of fs.readdirSync(full, { withFileTypes: true })) {
                if (!ch.isDirectory()) {
                    continue
                }
                const en = path.join(full, ch.name, "en.md")
                if (!fs.existsSync(en)) {
                    continue
                }
                const json = ex.extract(fs.readFileSync(en, "utf8"))
                const steps = json.steps
                if (!Array.isArray(steps)) {
                    if (steps != null) {
                        bad.push({
                            file: `${entryRel}/${ch.name}/en.md`,
                            issue: `steps not array: ${typeof steps}`,
                        })
                    }
                    continue
                }
                steps.forEach((row, i) => {
                    const title = row?.title
                    if (
                        title === undefined
                        || (typeof title === "string" && title.trim() === "")
                    ) {
                        bad.push({
                            file: `${entryRel}/${ch.name}/en.md`,
                            orderIndex: row?.orderIndex ?? i,
                            title: typeof title,
                            body: typeof row?.body,
                            issue:
                                row?.value !== undefined
                                    ? "parsed as value string not title/body"
                                    : "missing or empty title",
                            preview: JSON.stringify(row).slice(0, 220),
                        })
                    }
                })
            }
            continue
        }
        walk(full, entryRel)
    }
}

walk(ROOT, "")
fs.writeFileSync(
    path.join(__dirname, "challenge-empty-steps-scan.json"),
    JSON.stringify({ badCount: bad.length, bad }, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.slice(0, 15).forEach((r) => console.log(JSON.stringify(r)))
