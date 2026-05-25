/**
 * Lesson en.md: references items missing alias or url.
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-lesson-empty-references.js
 */
const fs = require("fs")
const path = require("path")
const {
    ExtractJsonFromMdService,
} = require("../src/modules/init/seeders/shared/extracts/extract-json-from-md.service")

const ex = new ExtractJsonFromMdService()
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const LESSON_EN = /\/contents\/[^/]+\/en\.md$/
const bad = []

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === "challenges" || entry.name === "lesson-videos") {
                continue
            }
            walk(full)
            continue
        }
        if (entry.name !== "en.md") {
            continue
        }
        const rel = full.replace(/\\/g, "/").replace(ROOT.replace(/\\/g, "/") + "/", "")
        if (!LESSON_EN.test("/" + rel)) {
            continue
        }
        const json = ex.extract(fs.readFileSync(full, "utf8"))
        const refs = json.references
        if (!Array.isArray(refs)) {
            if (refs != null) {
                bad.push({
                    file: rel,
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
                    file: rel,
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
}

walk(ROOT)
fs.writeFileSync(
    path.join(__dirname, "lesson-empty-references-scan.json"),
    JSON.stringify({ badCount: bad.length, bad }, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.forEach((r) => console.log(JSON.stringify(r)))
