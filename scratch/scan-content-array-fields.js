/**
 * Find content en.md where codeExplainings | codeImplementations | references are not arrays.
 * Uses same extract logic as report-non-string (delimiter + numeric headings).
 */
const fs = require("fs")
const path = require("path")
const {
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")

const NUMERIC_SECTION_KEY_RE = /^\d+$/
const ARRAY_FIELDS = ["codeExplainings", "codeImplementations", "references"]
const LEGACY_FIELD = "codeExplaining"
const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")

function isDelimiterLine(line) {
    return MOUNT_SECTION_DELIMITER_LINE_RE.test(line)
}

function cutDelimiterBoundedContent(sectionBody) {
    const lines = sectionBody.split("\n")
    const delimiterIndices = []
    for (let index = 0; index < lines.length; index += 1) {
        if (isDelimiterLine(lines[index])) {
            delimiterIndices.push(index)
        }
    }
    if (delimiterIndices.length === 0) {
        return { content: sectionBody.trim(), bounded: false }
    }
    const openIndex = delimiterIndices[0]
    const closeIndex =
        delimiterIndices.length > 1
            ? delimiterIndices[delimiterIndices.length - 1]
            : -1
    if (closeIndex > openIndex) {
        return {
            content: lines.slice(openIndex + 1, closeIndex).join("\n").trim(),
            bounded: true,
        }
    }
    return {
        content: lines.slice(openIndex + 1).join("\n").trim(),
        bounded: true,
    }
}

function collectHeadings(content, level) {
    const prefix = `${"#".repeat(level)} `
    const headings = []
    let inFence = false
    let pos = 0
    for (const line of content.split("\n")) {
        if (line.trim().startsWith("```")) {
            inFence = !inFence
        }
        if (!inFence && line.startsWith(prefix)) {
            headings.push({ key: line.slice(prefix.length).trim(), pos })
        }
        pos += line.length + 1
    }
    return headings
}

function sliceSections(content, level) {
    const headings = collectHeadings(content, level)
    return headings.map((heading, index) => {
        const lineEnd = content.indexOf("\n", heading.pos)
        const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
        const bodyEnd =
            index + 1 < headings.length ? headings[index + 1].pos : content.length
        return { key: heading.key, body: content.slice(bodyStart, bodyEnd) }
    })
}

function parseSectionBody(sectionBody, level) {
    const { content, bounded } = cutDelimiterBoundedContent(sectionBody)
    if (bounded) {
        return content
    }
    return parseAtLevel(content, level + 1)
}

function parseAtLevel(content, level) {
    const sections = sliceSections(content, level)
    if (sections.length === 0) {
        return content.trim()
    }
    const allNumeric = sections.every((s) => NUMERIC_SECTION_KEY_RE.test(s.key))
    if (allNumeric) {
        return sections
            .map((section) => {
                const orderIndex = Number.parseInt(section.key, 10)
                const parsed = parseSectionBody(section.body, level)
                if (
                    typeof parsed === "object" &&
                    parsed !== null &&
                    !Array.isArray(parsed)
                ) {
                    return { ...parsed, orderIndex }
                }
                return { orderIndex, value: parsed }
            })
            .sort((a, b) => a.orderIndex - b.orderIndex)
    }
    const result = {}
    for (const section of sections) {
        result[section.key] = parseSectionBody(section.body, level)
    }
    return result
}

function extract(markdown) {
    const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
    const result = parseAtLevel(normalized, 1)
    if (typeof result === "object" && result !== null && !Array.isArray(result)) {
        return result
    }
    return { data: result }
}

const bomFiles = []
const crlfOnly = []
const badFields = []
const legacyCodeExplaining = []
let scanned = 0

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full)
            continue
        }
        if (entry.name !== "en.md") {
            continue
        }
        const rel = full.replace(/\\/g, "/")
        if (!rel.includes("/contents/")) {
            continue
        }
        scanned += 1
        const raw = fs.readFileSync(full)
        const text = raw.toString("utf8")
        if (raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
            bomFiles.push(rel)
        }
        if (text.includes("\r\n") && !text.includes("\n\n")) {
            // skip noisy check
        }
        if (text.includes("\r\n")) {
            crlfOnly.push(rel)
        }
        const json = extract(text)
        if (json[LEGACY_FIELD] !== undefined) {
            legacyCodeExplaining.push({
                file: rel,
                kind: Array.isArray(json[LEGACY_FIELD])
                    ? "array"
                    : typeof json[LEGACY_FIELD],
            })
        }
        for (const field of ARRAY_FIELDS) {
            const val = json[field]
            if (val === undefined || val === null) {
                continue
            }
            if (!Array.isArray(val)) {
                badFields.push({
                    file: rel,
                    field,
                    kind: typeof val,
                    keys:
                        typeof val === "object" && val !== null
                            ? Object.keys(val).slice(0, 6).join(",")
                            : String(val).slice(0, 80),
                })
            }
        }
    }
}

walk(MOUNT_ROOT)

console.log("Content en.md scanned:", scanned)
console.log("UTF-8 BOM (raw bytes, extract strips):", bomFiles.length)
if (bomFiles.length) {
    console.log("  sample:", bomFiles.slice(0, 3))
}
console.log("CRLF line endings:", crlfOnly.length)
console.log("Legacy # codeExplaining present:", legacyCodeExplaining.length)
if (legacyCodeExplaining.length) {
    console.log("  samples:", legacyCodeExplaining.slice(0, 5))
}
console.log("Non-array ARRAY_FIELDS:", badFields.length)
for (const row of badFields) {
    console.log(`  ${row.field} (${row.kind}) ${row.keys}`)
    console.log(`    ${row.file}`)
}
