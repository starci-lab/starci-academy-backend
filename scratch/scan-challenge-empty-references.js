/**
 * Scan challenge en.md: references items missing alias or url.
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-challenge-empty-references.js
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
                const refs = json.references
                if (!Array.isArray(refs)) {
                    if (refs != null) {
                        bad.push({
                            file: `${entryRel}/${ch.name}/en.md`,
                            issue: `references not array: ${typeof refs}`,
                        })
                    }
                    continue
                }
                refs.forEach((row, i) => {
                    const alias = row?.alias
                    const url = row?.url
                    if (
                        alias === undefined
                        || url === undefined
                        || (typeof alias === "string" && alias.trim() === "")
                        || (typeof url === "string" && url.trim() === "")
                    ) {
                        bad.push({
                            file: `${entryRel}/${ch.name}/en.md`,
                            orderIndex: row?.orderIndex ?? i,
                            alias: typeof alias,
                            url: typeof url,
                            issue:
                                row?.value !== undefined
                                    ? "parsed as value string not alias/url"
                                    : "missing alias or url",
                            preview: JSON.stringify(row).slice(0, 200),
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
    path.join(__dirname, "challenge-empty-references-scan.json"),
    JSON.stringify({ badCount: bad.length, bad }, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.forEach((r) => console.log(JSON.stringify(r)))
