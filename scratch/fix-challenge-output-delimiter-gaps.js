/**
 * Fix outputs/prerequisites items where ## N has delimiter or title line before ### text
 * (extract yields { value: "..." } instead of { text: "..." }).
 * Run: node scratch/fix-challenge-output-delimiter-gaps.js
 */
const fs = require("fs")
const path = require("path")

const DELIM = "<!-- @starci/seperator -->"
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const SECTIONS = new Set(["outputs", "prerequisites"])
const fixed = []

function fixFile(filePath) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n")
    let inSection = false
    let sectionKey = ""
    let changed = false
    const out = []

    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i]
        const h1 = line.match(/^# (\S+)\s*$/)
        if (h1) {
            inSection = SECTIONS.has(h1[1])
            sectionKey = h1[1]
            out.push(line)
            continue
        }
        if (inSection && line.match(/^# \S/)) {
            inSection = false
        }
        if (
            inSection
            && line.match(/^## \d+\s*$/)
            && i + 1 < lines.length
        ) {
            out.push(line)
            let j = i + 1
            while (j < lines.length && lines[j].trim() === "") {
                j += 1
            }
            if (j < lines.length && lines[j].trim() === DELIM) {
                changed = true
                j += 1
                while (j < lines.length && lines[j].trim() === "") {
                    j += 1
                }
            }
            while (
                j < lines.length
                && !lines[j].match(/^## \d+\s*$/)
                && !lines[j].match(/^# \S/)
                && !lines[j].match(/^### text\s*$/)
            ) {
                const peek = lines[j].trim()
                if (peek && peek !== DELIM) {
                    changed = true
                    j += 1
                    if (j < lines.length && lines[j].trim() === DELIM) {
                        j += 1
                    }
                    while (j < lines.length && lines[j].trim() === "") {
                        j += 1
                    }
                    continue
                }
                break
            }
            i = j - 1
            continue
        }
        out.push(line)
    }

    if (changed) {
        fs.writeFileSync(filePath, out.join("\n"))
        fixed.push(filePath)
    }
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === "challenges") {
                for (const ch of fs.readdirSync(full, { withFileTypes: true })) {
                    if (!ch.isDirectory()) {
                        continue
                    }
                    for (const locale of ["en.md", "vi.md"]) {
                        const md = path.join(full, ch.name, locale)
                        if (fs.existsSync(md)) {
                            fixFile(md)
                        }
                    }
                }
            } else {
                walk(full)
            }
        }
    }
}

walk(ROOT)
console.log(`Fixed ${fixed.length} file(s):`)
fixed.forEach((f) => console.log(" ", path.relative(ROOT, f).replace(/\\/g, "/")))
