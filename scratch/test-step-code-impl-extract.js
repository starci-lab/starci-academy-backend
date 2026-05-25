/**
 * Quick check: ExtractJsonFromMdService parses ### codeImplementations under steps.
 * Run: node scratch/test-step-code-impl-extract.js
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

function withOrderIndex(parsed, orderIndex) {
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        return {
            ...(parsed),
            orderIndex,
        }
    }
    return {
        orderIndex,
        value: typeof parsed === "string" ? parsed.trim() : parsed,
    }
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
            const node = withOrderIndex(parsed, index)
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
    const normalized = stripMountSectionDelimiters(
        markdown.replace(/^\uFEFF/, ""),
    )
    return parseAtLevel(normalized, 1)
}

const sample = path.join(
    __dirname,
    "..",
    ".mount",
    "data",
    "courses",
    "1-system-design-mastery",
    "modules",
    "5-rabbitmq-and-job-queues",
    "contents",
    "0-rabbitmq-fundamentals",
    "challenges",
    "1-work-queue-load-balancing-medium",
    "en.md",
)
const json = extract(fs.readFileSync(sample, "utf8"))
const step1 = json.steps?.[1]
console.log("step1 orderIndex:", step1?.orderIndex)
console.log("has codeImplementations:", !!step1?.codeImplementations)
const impls = step1?.codeImplementations ?? []
console.log("impl count:", impls.length)
for (const impl of impls) {
    console.log({
        orderIndex: impl.orderIndex,
        lang: String(impl.lang ?? "").slice(0, 20),
        guideLen: String(impl.guide ?? "").length,
        exampleLen: String(impl.example ?? "").length,
    })
}
