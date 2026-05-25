/**
 * Ensures lesson `# body` is tightly wrapped with <!-- @starci/seperator -->
 * Run: node scratch/wrap-lesson-body-tight.js
 */

const fs = require("fs")
const path = require("path")

const DATA_ROOT = path.join(__dirname, "..", ".mount", "data")
const BODY_WRAP_SCAN_DIRS = ["courses", "cv", "foundations"]

const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_RE = /^#\s+(\S+)\s*$/

const LESSON_TOP_KEYS = new Set([
    "title",
    "description",
    "body",
    "thumbnailUrl",
    "codeExplaining",
    "codeImplementations",
    "references",
    "minutesRead",
    "isPremium",
])

const manifest = {
    fixedAt: new Date().toISOString(),
    wrapped: [],
    alreadyTight: [],
    missingBody: [],
}

function findTopLevelSections(content,
    keys) {
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
        sections[index].bodyLines = lines.slice(sections[index].start + 1,
            sections[index].end)
    }
    return {
        lines,
        sections,
    }
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

function stripAllDelimiterLines(lines) {
    return lines.filter((line) => !DELIMITER_RE.test(line))
}

function buildTightBodyLines(bodyLines) {
    const stripped = stripAllDelimiterLines(trimBodyLines(bodyLines))
    if (stripped.length === 0) {
        return [
            MOUNT_SECTION_DELIMITER_LINE,
            MOUNT_SECTION_DELIMITER_LINE,
        ]
    }
    return [
        MOUNT_SECTION_DELIMITER_LINE,
        ...stripped,
        MOUNT_SECTION_DELIMITER_LINE,
    ]
}

function ensureLessonBodyTight(content) {
    const {
        lines,
        sections,
    } = findTopLevelSections(content,
        LESSON_TOP_KEYS)
    const bodySection = sections.find((section) => section.key === "body")
    if (!bodySection) {
        return {
            content,
            changed: false,
            status: "missingBody",
        }
    }
    if (isBodyTightWrapped(bodySection.bodyLines)) {
        return {
            content,
            changed: false,
            status: "alreadyTight",
        }
    }
    const newBodyLines = buildTightBodyLines(bodySection.bodyLines)
    const newLines = [
        ...lines.slice(0,
            bodySection.start + 1),
        ...newBodyLines,
        "",
        ...lines.slice(bodySection.end),
    ]
    const rebuilt = newLines.join("\n").replace(/\n{3,}/g,
        "\n\n")
    return {
        content: rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`,
        changed: true,
        status: "wrapped",
    }
}

function listLessonMdFiles() {
    const results = []
    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            if (entry.name !== "en.md" && entry.name !== "vi.md") continue
            const relativePosix = path.relative(DATA_ROOT, full).replace(/\\/g, "/")
            const isCourseLesson =
                relativePosix.startsWith("courses/") &&
                relativePosix.includes("/contents/") &&
                !relativePosix.includes("/challenges/") &&
                !relativePosix.includes("/lesson-videos/")
            const isCv = relativePosix.startsWith("cv/")
            const isFoundationCategory =
                relativePosix.startsWith("foundations/") &&
                /^foundations\/[^/]+\/(en|vi)\.md$/.test(relativePosix)
            if (isCourseLesson || isCv || isFoundationCategory) {
                results.push(full)
            }
        }
    }
    for (const scanDir of BODY_WRAP_SCAN_DIRS) {
        const root = path.join(DATA_ROOT, scanDir)
        if (fs.existsSync(root)) {
            walk(root)
        }
    }
    return results
}

function main() {
    const files = listLessonMdFiles()
    for (const file of files) {
        const relativePath = path
            .relative(path.join(__dirname,
                ".."),
                file)
            .replace(/\\/g,
                "/")
        const raw = fs.readFileSync(file,
            "utf8")
        const result = ensureLessonBodyTight(raw)
        if (result.status === "missingBody") {
            manifest.missingBody.push(relativePath)
            continue
        }
        if (result.status === "alreadyTight") {
            manifest.alreadyTight.push(relativePath)
            continue
        }
        if (result.changed) {
            fs.writeFileSync(file,
                result.content,
                "utf8")
            manifest.wrapped.push(relativePath)
        }
    }
    const manifestPath = path.join(__dirname,
        "lesson-body-wrap-manifest.json")
    fs.writeFileSync(manifestPath,
        JSON.stringify(manifest,
            null,
            2))
    console.log(JSON.stringify({
        wrapped: manifest.wrapped.length,
        alreadyTight: manifest.alreadyTight.length,
        missingBody: manifest.missingBody.length,
        manifestPath,
    },
    null,
    2))
}

main()
