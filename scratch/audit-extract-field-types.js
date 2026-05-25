/**
 * Scan challenge mount files: typeof extract for body, guide, example, text.
 * Run: node scratch/audit-extract-field-types.js
 */

const fs = require("fs")
const path = require("path")

const IDENT_RE = /^[a-zA-Z]\w*$/
const NUMERIC_HEADING_RE = /^(\d+)(?:[.)]\s+(.+))?$/

function stripMountSectionDelimiters(markdown) {
    return markdown
        .split(/\r?\n/)
        .filter((line) => !require("./mount-delimiter").isAnyDelimiterLine(line))
        .join("\n")
}

function collectHeadings(content, level) {
    const headingPrefix = `${"#".repeat(level)} `
    const headings = []
    let inFencedCodeBlock = false
    let currentPos = 0
    const lines = content.split("\n")
    for (const line of lines) {
        const trimmedLine = line.trim()
        if (trimmedLine.startsWith("```")) {
            inFencedCodeBlock = !inFencedCodeBlock
        }
        if (!inFencedCodeBlock && line.startsWith(headingPrefix)) {
            headings.push({
                key: line.slice(headingPrefix.length).trim(),
                pos: currentPos,
            })
        }
        currentPos += line.length + 1
    }
    return headings
}

function parseAtLevel(content, level) {
    const headings = collectHeadings(content, level)
    if (headings.length === 0) {
        return content.trim()
    }
    const sections = headings.map((h, i) => {
        const lineEnd = content.indexOf("\n", h.pos)
        const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
        const bodyEnd = i + 1 < headings.length ? headings[i + 1].pos : content.length
        return {
            key: h.key,
            body: content.slice(bodyStart, bodyEnd),
        }
    })
    const allNumeric = sections.every((s) => NUMERIC_HEADING_RE.test(s.key))
    if (allNumeric) {
        const result = []
        for (const s of sections) {
            const match = s.key.match(NUMERIC_HEADING_RE)
            const index = parseInt(match[1], 10)
            const parsed = parseAtLevel(s.body, level + 1)
            const node =
                typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
                    ? {
                        ...parsed,
                        orderIndex: index,
                    }
                    : {
                        orderIndex: index,
                        value: parsed,
                    }
            if (match[2] && typeof node === "object") {
                node.title = match[2].trim()
            }
            result[index] = node
        }
        return result.filter((val) => val !== undefined)
    }
    const result = {}
    for (const s of sections) {
        const cleanKey = IDENT_RE.test(s.key) ? s.key : s.key.replace(/\s+/g, "_")
        result[cleanKey] = parseAtLevel(s.body, level + 1)
    }
    return result
}

function extract(markdown) {
    const normalized = stripMountSectionDelimiters(markdown.replace(/^\uFEFF/, ""))
    return parseAtLevel(normalized, 1)
}

function typeOf(value) {
    if (value === null || value === undefined) {
        return "nullish"
    }
    if (Array.isArray(value)) {
        return "array"
    }
    if (typeof value === "object") {
        return "object"
    }
    return "string"
}

function walkFields(node, path, counts) {
    if (!node || typeof node !== "object") {
        return
    }
    if (Array.isArray(node)) {
        for (const entry of node) {
            walkFields(entry, path, counts)
        }
        return
    }
    for (const [
        key,
        value,
    ] of Object.entries(node)) {
        if ([
            "body",
            "guide",
            "example",
            "text",
            "hint",
            "description",
            "code",
            "explain",
            "lang",
        ].includes(key)) {
            const t = typeOf(value)
            counts[key] = counts[key] || {
                string: 0,
                object: 0,
                array: 0,
                nullish: 0,
            }
            counts[key][t] = (counts[key][t] || 0) + 1
        }
        walkFields(value, `${path}.${key}`, counts)
    }
}

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const counts = {}

function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkDir(full)
            continue
        }
        const relativePosix = full.replace(/\\/g, "/")
        const isChallenge = relativePosix.includes("/challenges/")
        const isContent = relativePosix.includes("/contents/") && !isChallenge
        if (entry.name === "en.md" && (isChallenge || isContent)) {
            const json = extract(fs.readFileSync(full, "utf8"))
            walkFields(json, "", counts)
        }
    }
}

walkDir(MOUNT_ROOT)
console.log(JSON.stringify(counts, null, 2))
