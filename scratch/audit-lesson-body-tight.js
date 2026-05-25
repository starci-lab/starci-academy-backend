/**
 * Audit: lesson `# body` must be tightly wrapped (<!-- @starci/seperator -->).
 * Run: node scratch/audit-lesson-body-tight.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const { MOUNT_SECTION_DELIMITER_LINE_RE } = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_RE = /^#\s+(\S+)\s*$/
const LESSON_TOP_KEYS = new Set([
    "title",
    "description",
    "body",
    "codeExplaining",
    "codeImplementations",
    "references",
    "minutesRead",
    "isPremium",
])

function findTopLevelSections(content, keys) {
    const lines = content.split(/\r?\n/)
    const sections = []
    let inFence = false
    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
            continue
        }
        if (inFence) {
            continue
        }
        const match = trimmed.match(H1_RE)
        if (match && keys.has(match[1])) {
            sections.push({
                key: match[1],
                start: index,
            })
        }
    }
    for (let index = 0; index < sections.length; index += 1) {
        const next = sections[index + 1]
        sections[index].end = next ? next.start : lines.length
        sections[index].bodyLines = lines.slice(sections[index].start + 1, sections[index].end)
    }
    return sections
}

function trimBodyLines(bodyLines) {
    const copy = [...bodyLines]
    while (copy.length > 0 && !copy[0].trim()) {
        copy.shift()
    }
    while (copy.length > 0 && !copy[copy.length - 1].trim()) {
        copy.pop()
    }
    return copy
}

function isBodyTightWrapped(bodyLines) {
    const trimmed = trimBodyLines(bodyLines)
    if (trimmed.length < 2) {
        return false
    }
    return DELIMITER_RE.test(trimmed[0]) && DELIMITER_RE.test(trimmed[trimmed.length - 1])
}

const loose = []
const missing = []

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full)
            continue
        }
        const relativePosix = full.replace(/\\/g, "/")
        if (
            (entry.name === "en.md" || entry.name === "vi.md") &&
            relativePosix.includes("/contents/") &&
            !relativePosix.includes("/challenges/") &&
            !relativePosix.includes("/lesson-videos/")
        ) {
            const relativePath = path.relative(path.join(__dirname, ".."), full).replace(/\\/g, "/")
            const sections = findTopLevelSections(fs.readFileSync(full, "utf8"), LESSON_TOP_KEYS)
            const body = sections.find((section) => section.key === "body")
            if (!body) {
                missing.push(relativePath)
                continue
            }
            if (!isBodyTightWrapped(body.bodyLines)) {
                loose.push(relativePath)
            }
        }
    }
}

walk(MOUNT_ROOT)

const report = {
    generatedAt: new Date().toISOString(),
    tight: loose.length === 0 && missing.length === 0,
    looseCount: loose.length,
    missingBodyCount: missing.length,
    loose,
    missingBody: missing,
}

fs.writeFileSync(
    path.join(__dirname, "lesson-body-tight-audit.json"),
    JSON.stringify(report, null, 2),
)

console.log(JSON.stringify({
    tight: report.tight,
    looseCount: report.looseCount,
    missingBodyCount: report.missingBodyCount,
}, null, 2))
