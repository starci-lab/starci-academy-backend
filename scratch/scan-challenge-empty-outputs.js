/**
 * Find challenge en.md where # outputs has empty/missing ### text.
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-challenge-empty-outputs.js
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
        if (entry.isDirectory()) {
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
                    const outputs = json.outputs
                    if (!Array.isArray(outputs)) {
                        if (outputs != null) {
                            bad.push({
                                file: `${entryRel}/${ch.name}/en.md`,
                                issue: `outputs not array: ${typeof outputs}`,
                            })
                        }
                        continue
                    }
                    outputs.forEach((row, i) => {
                        const text = row?.text
                        if (
                            text === undefined
                            || text === null
                            || (typeof text === "string" && text.trim() === "")
                        ) {
                            bad.push({
                                file: `${entryRel}/${ch.name}/en.md`,
                                orderIndex: row?.orderIndex ?? i,
                                issue: `empty output text (${typeof text})`,
                                preview: JSON.stringify(row).slice(0, 120),
                            })
                        }
                    })
                }
            } else {
                walk(full, entryRel)
            }
        }
    }
}

walk(ROOT, "")
const out = { badCount: bad.length, bad }
fs.writeFileSync(
    path.join(__dirname, "challenge-empty-outputs-scan.json"),
    JSON.stringify(out, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.slice(0, 25).forEach((r) => console.log(JSON.stringify(r)))
