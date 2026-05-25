/**
 * Report mount extract fields that are non-string (object/array) — treated as errors.
 * Run: node scratch/report-non-string-extract-fields.js
 */

const fs = require("fs")
const path = require("path")

const IDENT_RE = /^[a-zA-Z]\w*$/
const NUMERIC_HEADING_RE = /^(\d+)(?:[.)]\s+(.+))?$/
const { MOUNT_SECTION_DELIMITER_LINE_RE } = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE

function isDelimiterLine(line) {
    return DELIMITER_RE.test(line)
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

function parseSectionBody(sectionBody, level) {
    const { content, bounded } = cutDelimiterBoundedContent(sectionBody)
    if (bounded) {
        return content
    }
    return parseAtLevel(content, level + 1)
}

const MARKDOWN_LEAF_KEYS = new Set([
    "body",
    "guide",
    "example",
    "text",
    "hint",
    "description",
    "code",
    "explain",
    "lang",
])

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
            const parsed = parseSectionBody(s.body, level)
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
            if (match[2] && typeof node === "object" && node !== null) {
                node.title = match[2].trim()
            }
            result[index] = node
        }
        return result.filter((val) => val !== undefined)
    }
    const result = {}
    for (const s of sections) {
        const cleanKey = IDENT_RE.test(s.key) ? s.key : s.key.replace(/\s+/g, "_")
        result[cleanKey] = parseSectionBody(s.body, level)
    }
    return result
}

function extract(markdown) {
    const normalized = markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n")
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

function preview(value, max = 120) {
    if (typeof value === "string") {
        return value.slice(0, max).replace(/\s+/g, " ")
    }
    if (Array.isArray(value)) {
        return `array(len=${value.length})`
    }
    if (typeof value === "object" && value !== null) {
        return `object(keys=${Object.keys(value).slice(0, 8).join(",")})`
    }
    return String(value)
}

/**
 * @param {unknown} node
 * @param {string} jsonPath
 * @param {string} file
 * @param {Array<Record<string, unknown>>} findings
 */
function scanNode(node, jsonPath, file, findings) {
    if (node === null || node === undefined) {
        return
    }
    if (Array.isArray(node)) {
        for (let index = 0; index < node.length; index += 1) {
            scanNode(node[index], `${jsonPath}[${index}]`, file, findings)
        }
        return
    }
    if (typeof node !== "object") {
        return
    }
    for (const [
        key,
        value,
    ] of Object.entries(node)) {
        const childPath = jsonPath ? `${jsonPath}.${key}` : key
        if (MARKDOWN_LEAF_KEYS.has(key)) {
            const kind = typeOf(value)
            if (kind !== "string") {
                findings.push({
                    file,
                    field: key,
                    jsonPath: childPath,
                    kind,
                    preview: preview(value),
                })
            }
        }
        scanNode(value, childPath, file, findings)
    }
}

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const findings = []
let filesScanned = 0

function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walkDir(full)
            continue
        }
        const relativePosix = full.replace(/\\/g, "/")
        const isEn = entry.name === "en.md"
        const isVi = entry.name === "vi.md"
        const isMountMd =
            (isEn || isVi) &&
            (relativePosix.includes("/contents/") ||
                relativePosix.includes("/challenges/") ||
                relativePosix.includes("/milestones/"))
        if (!isMountMd) {
            continue
        }
        filesScanned += 1
        const relativeFile = path
            .relative(path.join(__dirname, ".."), full)
            .replace(/\\/g, "/")
        const json = extract(fs.readFileSync(full, "utf8"))
        scanNode(json, "", relativeFile, findings)
    }
}

walkDir(MOUNT_ROOT)

const byKind = {}
const byField = {}
const byArea = {
    challenge: 0,
    content: 0,
    milestone: 0,
    other: 0,
}
for (const row of findings) {
    byKind[row.kind] = (byKind[row.kind] || 0) + 1
    byField[row.field] = (byField[row.field] || 0) + 1
    if (row.file.includes("/challenges/")) {
        byArea.challenge += 1
    } else if (row.file.includes("/milestones/")) {
        byArea.milestone += 1
    } else if (row.file.includes("/contents/")) {
        byArea.content += 1
    } else {
        byArea.other += 1
    }
}

const uniqueFiles = [...new Set(findings.map((row) => row.file))].sort()

const report = {
    generatedAt: new Date().toISOString(),
    filesScanned,
    totalFindings: findings.length,
    uniqueFilesWithErrors: uniqueFiles.length,
    summary: {
        byKind,
        byField,
        byArea,
    },
    uniqueFiles,
    findings,
}

const outJson = path.join(__dirname, "non-string-extract-fields-report.json")
const outMd = path.join(__dirname, "NON-STRING-EXTRACT-FIELDS.md")

fs.writeFileSync(outJson, JSON.stringify(report, null, 2))

const mdLines = [
    "# Non-string extract fields (errors)",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    `- Files scanned: **${filesScanned}**`,
    `- Findings: **${findings.length}**`,
    `- Unique files: **${uniqueFiles.length}**`,
    "",
    "## Summary by kind",
    "",
    ...Object.entries(byKind).map(([k, n]) => `- \`${k}\`: ${n}`),
    "",
    "## Summary by field",
    "",
    ...Object.entries(byField)
        .sort((a, b) => b[1] - a[1])
        .map(([k, n]) => `- \`${k}\`: ${n}`),
    "",
    "## Summary by area",
    "",
    ...Object.entries(byArea).map(([k, n]) => `- ${k}: ${n}`),
    "",
    "## Unique files",
    "",
    ...uniqueFiles.map((f) => `- \`${f}\``),
    "",
    "## All findings",
    "",
    "| File | Field | Path | Kind | Preview |",
    "|------|-------|------|------|---------|",
    ...findings.map(
        (row) =>
            `| \`${row.file}\` | ${row.field} | \`${row.jsonPath}\` | ${row.kind} | ${row.preview.replace(/\|/g, "\\|")} |`,
    ),
]

fs.writeFileSync(outMd, mdLines.join("\n"))

console.log(`Scanned ${filesScanned} mount md files`)
console.log(`Non-string findings: ${findings.length} (${uniqueFiles.length} files)`)
console.log("byKind:", byKind)
console.log("byField:", byField)
console.log(`Wrote ${outJson}`)
console.log(`Wrote ${outMd}`)
