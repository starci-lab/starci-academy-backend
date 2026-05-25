/**
 * Lesson-only en.md: references / codeImplementations / codeExplainings must be array or absent.
 * Run: npx ts-node -r tsconfig-paths/register scratch/scan-lesson-references-type.js
 */
const fs = require("fs")
const path = require("path")
const {
    ExtractJsonFromMdService,
} = require("../src/modules/init/seeders/shared/extracts/extract-json-from-md.service")

const ex = new ExtractJsonFromMdService()
const root = path.join(__dirname, "..", ".mount", "data", "courses")
const LESSON_EN = /\/contents\/[^/]+\/en\.md$/
const FIELDS = ["references", "codeImplementations", "codeExplainings"]
const bad = []
let bom = 0
let crlf = 0
let scanned = 0

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
        const rel = full.replace(/\\/g, "/")
        if (!LESSON_EN.test(rel)) {
            continue
        }
        scanned += 1
        const raw = fs.readFileSync(full)
        if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
            bom += 1
        }
        const text = raw.toString("utf8")
        if (text.includes("\r\n")) {
            crlf += 1
        }
        const json = ex.extract(text)
        for (const field of FIELDS) {
            const val = json[field]
            if (val != null && !Array.isArray(val)) {
                bad.push({
                    file: rel,
                    field,
                    kind: typeof val,
                    preview: typeof val === "string" ? val.slice(0, 80) : JSON.stringify(val).slice(0, 80),
                })
            }
        }
    }
}

walk(root)
const out = { scanned, bom, crlf, badCount: bad.length, bad }
fs.writeFileSync(
    path.join(__dirname, "lesson-array-fields-scan.json"),
    JSON.stringify(out, null, 2),
)
console.log(JSON.stringify({ scanned, bom, crlf, badCount: bad.length }, null, 2))
if (bad.length) {
    console.log("first:", bad[0])
}
