/**
 * Normalize # references in lesson contents en.md / vi.md.
 * Run: node scratch/fix-lesson-references-structure.js
 */
const fs = require("fs")
const path = require("path")

const DELIM = "<!-- @starci/seperator -->"
const HEADING_H2_NUM = /^## (\d+)\s*$/
const HEADING_H3_REF = /^### (alias|url)\s*$/
const HEADING_H3_INDEX = /^### (\d+)\s*$/
const HEADING_H1 = /^# [a-z]/
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const LESSON_MD = /\/contents\/[^/]+\/(en|vi)\.md$/

function isDelimiter(line) {
    return line.trim() === DELIM
}

function isEmpty(line) {
    return line.trim() === ""
}

function normalizeReferenceItem(lines) {
    const aliasLines = []
    const urlLines = []
    let i = 0
    while (i < lines.length) {
        const line = lines[i]
        if (isEmpty(line) || isDelimiter(line)) {
            i += 1
            continue
        }
        if (HEADING_H3_REF.test(line)) {
            const kind = line.match(HEADING_H3_REF)[1]
            i += 1
            const chunk = []
            while (
                i < lines.length
                && !HEADING_H3_REF.test(lines[i])
                && !HEADING_H2_NUM.test(lines[i])
                && !HEADING_H3_INDEX.test(lines[i])
                && !HEADING_H1.test(lines[i])
            ) {
                if (!isDelimiter(lines[i]) && !isEmpty(lines[i])) {
                    chunk.push(lines[i])
                }
                i += 1
            }
            if (kind === "alias") {
                aliasLines.push(...chunk)
            } else {
                urlLines.push(...chunk)
            }
            continue
        }
        const chunk = []
        while (
            i < lines.length
            && !HEADING_H3_REF.test(lines[i])
            && !HEADING_H2_NUM.test(lines[i])
            && !HEADING_H3_INDEX.test(lines[i])
            && !HEADING_H1.test(lines[i])
        ) {
            if (!isDelimiter(lines[i]) && !isEmpty(lines[i])) {
                chunk.push(lines[i])
            }
            i += 1
        }
        if (aliasLines.length === 0) {
            aliasLines.push(...chunk)
        } else if (urlLines.length === 0) {
            urlLines.push(...chunk)
        } else {
            urlLines.push(...chunk)
        }
    }
    let alias = aliasLines.join("\n").trim()
    const url = urlLines.join("\n").trim()
    if (!alias && url) {
        try {
            const u = new URL(url)
            const tail = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname
            alias = tail.replace(/[-_]/g, " ")
        } catch {
            alias = url
        }
    }
    const out = []
    if (alias) {
        out.push("### alias", DELIM, alias, DELIM)
    }
    if (url) {
        out.push("### url", DELIM, url, DELIM)
    }
    return out
}

function fixReferencesSection(lines) {
    const out = []
    let i = 0
    let changed = false
    while (i < lines.length) {
        if (lines[i] !== "# references") {
            out.push(lines[i])
            i += 1
            continue
        }
        out.push(lines[i])
        i += 1
        while (i < lines.length && !HEADING_H1.test(lines[i])) {
            let index = null
            if (HEADING_H2_NUM.test(lines[i])) {
                index = lines[i].match(HEADING_H2_NUM)[1]
                i += 1
            } else if (HEADING_H3_INDEX.test(lines[i])) {
                index = lines[i].match(HEADING_H3_INDEX)[1]
                i += 1
                changed = true
            } else {
                out.push(lines[i])
                i += 1
                continue
            }
            const itemLines = []
            while (
                i < lines.length
                && !HEADING_H2_NUM.test(lines[i])
                && !HEADING_H3_INDEX.test(lines[i])
                && !HEADING_H1.test(lines[i])
            ) {
                itemLines.push(lines[i])
                i += 1
            }
            const normalized = normalizeReferenceItem(itemLines)
            const rebuilt = [`## ${index}`, ...normalized, ""]
            const original = [`## ${index}`, ...itemLines]
            if (JSON.stringify(rebuilt) !== JSON.stringify(original)) {
                changed = true
            }
            out.push(...rebuilt)
        }
    }
    return { content: out.join("\n"), changed }
}

function walk(dir) {
    let count = 0
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === "challenges" || entry.name === "lesson-videos") {
                continue
            }
            count += walk(full)
            continue
        }
        if (entry.name !== "en.md" && entry.name !== "vi.md") {
            continue
        }
        const rel = full.replace(/\\/g, "/")
        if (!LESSON_MD.test(rel)) {
            continue
        }
        const text = fs.readFileSync(full, "utf8")
        const { content, changed } = fixReferencesSection(text.split("\n"))
        if (changed) {
            fs.writeFileSync(full, content)
            count += 1
            console.log(path.relative(ROOT, full).replace(/\\/g, "/"))
        }
    }
    return count
}

const fixed = walk(ROOT)
console.log(`Fixed ${fixed} file(s)`)
