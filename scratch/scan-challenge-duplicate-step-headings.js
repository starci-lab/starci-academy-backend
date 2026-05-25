/**
 * Find duplicate consecutive ## N under # steps in challenge md.
 * Run: node scratch/scan-challenge-duplicate-step-headings.js
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const H2 = /^## (\d+)\s*$/
const H1 = /^# [a-z]/
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
                for (const locale of ["en.md", "vi.md"]) {
                    const md = path.join(full, ch.name, locale)
                    if (!fs.existsSync(md)) {
                        continue
                    }
                    const lines = fs.readFileSync(md, "utf8").split("\n")
                    let inSteps = false
                    for (let i = 0; i < lines.length; i += 1) {
                        if (lines[i] === "# steps") {
                            inSteps = true
                            continue
                        }
                        if (inSteps && H1.test(lines[i])) {
                            inSteps = false
                            continue
                        }
                        if (!inSteps) {
                            continue
                        }
                        const m = lines[i].match(H2)
                        if (!m) {
                            continue
                        }
                        const idx = m[1]
                        if (i + 1 < lines.length && lines[i + 1].match(H2)?.[1] === idx) {
                            bad.push({
                                file: `${entryRel}/${ch.name}/${locale}`,
                                line: i + 1,
                                index: idx,
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
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.forEach((r) => console.log(JSON.stringify(r)))
