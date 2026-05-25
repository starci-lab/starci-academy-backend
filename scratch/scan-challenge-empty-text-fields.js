/**
 * Scan challenge en.md: outputs + prerequisites items missing .text
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-challenge-empty-text-fields.js
 */
const fs = require("fs")
const path = require("path")
const {
    ExtractJsonFromMdService,
} = require("../src/modules/init/seeders/shared/extracts/extract-json-from-md.service")

const ex = new ExtractJsonFromMdService()
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const FIELDS = ["outputs", "prerequisites"]
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
                for (const field of FIELDS) {
                    const rows = json[field]
                    if (!Array.isArray(rows)) {
                        if (rows != null) {
                            bad.push({
                                file: `${entryRel}/${ch.name}/en.md`,
                                field,
                                issue: `not array: ${typeof rows}`,
                            })
                        }
                        continue
                    }
                    for (let i = 0; i < rows.length; i += 1) {
                        const row = rows[i]
                        const text = row?.text
                        if (
                            text === undefined
                            || text === null
                            || (typeof text === "string" && text.trim() === "")
                        ) {
                            bad.push({
                                file: `${entryRel}/${ch.name}/en.md`,
                                field,
                                orderIndex: row?.orderIndex ?? i,
                                issue:
                                    row?.value !== undefined
                                        ? "has value not text (delimiter/title gap)"
                                        : `empty text (${typeof text})`,
                                preview: JSON.stringify(row).slice(0, 160),
                            })
                        }
                    }
                }
            }
            continue
        }
        walk(full, entryRel)
    }
}

walk(ROOT, "")
fs.writeFileSync(
    path.join(__dirname, "challenge-empty-text-fields-scan.json"),
    JSON.stringify({ badCount: bad.length, bad }, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.forEach((r) => console.log(JSON.stringify(r)))
