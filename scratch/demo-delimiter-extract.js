/**
 * Demo: generic delimiter cut + recursive extract (mirrors ExtractJsonFromMdService).
 * Run: node scratch/demo-delimiter-extract.js
 */

const fs = require("fs")
const path = require("path")

const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")

const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const IDENT_RE = /^[a-zA-Z]\w*$/
const NUMERIC_HEADING_RE = /^(\d+)(?:[.)]\s+(.+))?$/

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

function parseAtLevel(content, level) {
    const headings = collectHeadings(content, level)
    if (headings.length === 0) {
        return content.trim()
    }
    const sections = headings.map((h, i) => {
        const lineEnd = content.indexOf("\n", h.pos)
        const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
        const bodyEnd = i + 1 < headings.length ? headings[i + 1].pos : content.length
        return { key: h.key, body: content.slice(bodyStart, bodyEnd) }
    })
    if (sections.every((s) => NUMERIC_HEADING_RE.test(s.key))) {
        const result = []
        for (const s of sections) {
            const match = s.key.match(NUMERIC_HEADING_RE)
            const idx = parseInt(match[1], 10)
            const parsed = parseSectionBody(s.body, level)
            const node =
                typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
                    ? { ...parsed, orderIndex: idx }
                    : { orderIndex: idx, value: parsed }
            if (match[2] && typeof node === "object") {
                node.title = match[2].trim()
            }
            result[idx] = node
        }
        return result.filter((v) => v !== undefined)
    }
    const result = {}
    for (const s of sections) {
        const cleanKey = IDENT_RE.test(s.key) ? s.key : s.key.replace(/\s+/g, "_")
        result[cleanKey] = parseSectionBody(s.body, level)
    }
    return result
}

function extract(markdown) {
    return parseAtLevel(markdown.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n"), 1)
}

function show(label, json) {
    console.log(`\n${"=".repeat(60)}`)
    console.log(label)
    console.log("=".repeat(60))
    console.log(JSON.stringify(json, null, 2))
}

const mini = `# requirements
## 0
### score
${MOUNT_SECTION_DELIMITER_LINE}
5
${MOUNT_SECTION_DELIMITER_LINE}
### promptText
${MOUNT_SECTION_DELIMITER_LINE}
Rubric demo.
${MOUNT_SECTION_DELIMITER_LINE}
# title
${MOUNT_SECTION_DELIMITER_LINE}
Hello
${MOUNT_SECTION_DELIMITER_LINE}
`

show("Generic: score + promptText + title (all delimiter-bounded)", extract(mini))

const realPath = path.join(
    __dirname,
    "..",
    ".mount",
    "data",
    "foundations",
    "0-docker",
    "foundations",
    "0-docker-starci-video",
    "vi.md",
)
const real = extract(fs.readFileSync(realPath, "utf8"))
show("Foundation item", {
    title: real.title,
    score: real.tags?.[0]?.value,
    kind: real.kind,
})

console.log("\nRule: delimiter present → trimmed leaf string; else recurse headings.\n")
