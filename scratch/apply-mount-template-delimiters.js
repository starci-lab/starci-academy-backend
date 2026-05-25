/**
 * Apply .mount/data/templates delimiter convention to mount markdown.
 * Scans: courses/, cv/, foundations/, headhuntings/
 * Run: node scratch/apply-mount-template-delimiters.js
 */

const fs = require("fs")
const path = require("path")

const DATA_ROOT = path.join(__dirname, "..", ".mount", "data")
const SCAN_DIRS = ["courses", "cv", "foundations", "headhuntings"]
const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")

const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_RE = /^#\s+(\S+)\s*$/

const L1_WRAP_KEYS = new Set([
    "title",
    "description",
    "body",
    "minutesRead",
    "isPremium",
    "difficulty",
    "score",
    "caption",
    "thumbnailUrl",
    "author",
    "kind",
    "value",
    "isRecommended",
    "websiteUrl",
    "logoUrl",
    "address",
    "phone",
    "email",
    "facebookUrl",
    "linkedinUrl",
    "fullName",
    "jobTitle",
    "avatarUrl",
    "phoneNumber",
    "zaloNumber",
    "weight",
    "orderIndex",
    "maxScore",
    "type",
])

const STRUCTURED_H1_KEYS = new Set([
    "requirements",
    "outputs",
    "prerequisites",
    "steps",
    "references",
    "submissions",
    "codeExplaining",
    "codeImplementations",
    "tags",
    "criterias",
])

const H3_WRAP_KEYS = new Set([
    "purpose",
    "technicalConstraints",
    "proTipsHints",
    "forbidden",
    "promptText",
    "score",
    "text",
    "code",
    "explain",
    "lang",
    "guide",
    "example",
    "alias",
    "url",
    "type",
    "title",
    "description",
    "hint",
    "orderIndex",
])

function isDelimiterLine(line) {
    return DELIMITER_RE.test(line)
}

function trimLines(lines) {
    const copy = [...lines]
    while (copy.length > 0 && !copy[0].trim()) copy.shift()
    while (copy.length > 0 && !copy[copy.length - 1].trim()) copy.pop()
    return copy
}

function isTightWrapped(lines) {
    const t = trimLines(lines)
    if (t.length === 0) return true
    if (t.length < 2) return false
    return DELIMITER_RE.test(t[0]) && DELIMITER_RE.test(t[t.length - 1])
}

function parseHeading(line) {
    const match = line.match(/^(#{1,6})\s+(.+)$/)
    if (!match) return null
    return { level: match[1].length, key: match[2].trim() }
}

function shouldWrapField(level, key) {
    if (level === 1 && L1_WRAP_KEYS.has(key)) return true
    if (level === 3 && H3_WRAP_KEYS.has(key)) return true
    if (level === 5 && H3_WRAP_KEYS.has(key)) return true
    return false
}

const ALL_L1_SECTION_KEYS = new Set([
    ...L1_WRAP_KEYS,
    ...STRUCTURED_H1_KEYS,
    "submissions",
])

/**
 * When collecting inner lines for a wrapped field, only stop at real template boundaries —
 * not markdown headings inside lesson/challenge body prose.
 */
function isInnerBoundary(parentLevel, parentKey, line, inFence) {
    if (inFence) return false
    const h = parseHeading(line.trim())
    if (!h) return false

    if (parentLevel === 1 && parentKey === "body") {
        return h.level === 1 && ALL_L1_SECTION_KEYS.has(h.key)
    }

    if (parentLevel === 1 && L1_WRAP_KEYS.has(parentKey)) {
        return h.level === 1
    }

    if (parentLevel === 3 && parentKey === "body") {
        if (h.level === 1) return true
        if (h.level === 2 && /^\d+/.test(h.key)) return true
        if (h.level === 3 && (h.key === "title" || h.key === "codeImplementations")) {
            return true
        }
        return false
    }

    if (parentLevel === 3 && H3_WRAP_KEYS.has(parentKey)) {
        if (h.level === 1) return true
        if (h.level === 2 && /^\d+/.test(h.key)) return true
        if (h.level === 3 && H3_WRAP_KEYS.has(h.key)) return true
        return false
    }

    if (parentLevel === 5 && H3_WRAP_KEYS.has(parentKey)) {
        if (h.level === 1) return true
        if (h.level === 2 && /^\d+/.test(h.key)) return true
        if (h.level === 3 && H3_WRAP_KEYS.has(h.key)) return true
        if (h.level === 5 && H3_WRAP_KEYS.has(h.key)) return true
        return false
    }

    if (h.level === 1) return true
    if (h.level === 2 && /^\d+/.test(h.key)) return true
    if (h.level >= 3 && h.level <= 6) return true
    return false
}

function stripAllDelimiterLines(lines) {
    return lines.filter((line) => !isDelimiterLine(line))
}

function buildWrapped(innerLines) {
    const stripped = stripAllDelimiterLines(innerLines)
    const t = trimLines(stripped)
    if (t.length === 0) {
        return [MOUNT_SECTION_DELIMITER_LINE, MOUNT_SECTION_DELIMITER_LINE]
    }
    return [MOUNT_SECTION_DELIMITER_LINE, ...t, MOUNT_SECTION_DELIMITER_LINE]
}

/**
 * @param {string[]} lines
 * @returns {{ lines: string[], fieldsWrapped: number, envelopesStripped: number }}
 */
function transformLines(lines) {
    let inFence = false
    let fieldsWrapped = 0
    let envelopesStripped = 0
    const output = []
    let index = 0

    while (index < lines.length) {
        const line = lines[index]
        const trimmed = line.trim()

        if (trimmed.startsWith("```")) {
            inFence = !inFence
            output.push(line)
            index += 1
            continue
        }

        const h = inFence ? null : parseHeading(trimmed)

        if (h && h.level === 1 && STRUCTURED_H1_KEYS.has(h.key)) {
            output.push(line)
            index += 1
            while (index < lines.length) {
                const peek = lines[index].trim()
                if (peek.startsWith("```")) break
                if (isDelimiterLine(lines[index]) && !inFence) {
                    envelopesStripped += 1
                    index += 1
                    continue
                }
                if (H1_RE.test(peek)) break
                break
            }
            continue
        }

        if (h && shouldWrapField(h.level, h.key)) {
            const parentLevel = h.level
            const parentKey = h.key
            output.push(line)
            index += 1
            const inner = []
            while (index < lines.length) {
                const innerLine = lines[index]
                const innerTrim = innerLine.trim()
                if (innerTrim.startsWith("```")) {
                    inFence = !inFence
                    inner.push(innerLine)
                    index += 1
                    continue
                }
                if (!inFence && isInnerBoundary(parentLevel, parentKey, innerLine, inFence)) {
                    break
                }
                inner.push(innerLine)
                index += 1
            }
            const normalized = buildWrapped(inner)
            const prior = trimLines(stripAllDelimiterLines(inner)).join("\n")
            const next = trimLines(
                normalized.filter((line) => !isDelimiterLine(line)),
            ).join("\n")
            if (prior !== next || !isTightWrapped(normalized)) {
                fieldsWrapped += 1
            }
            for (const wrappedLine of normalized) {
                output.push(wrappedLine)
            }
            continue
        }

        output.push(line)
        index += 1
    }

    return { lines: output, fieldsWrapped, envelopesStripped }
}

function classifyFile(relativePosix) {
    if (relativePosix.startsWith("cv/")) {
        return "cv"
    }
    if (relativePosix.startsWith("foundations/")) {
        if (/\/foundations\/[^/]+\/(en|vi)\.md$/.test(relativePosix)) {
            return "foundationItem"
        }
        if (/^foundations\/[^/]+\/(en|vi)\.md$/.test(relativePosix)) {
            return "foundationCategory"
        }
        return "foundation"
    }
    if (relativePosix.startsWith("headhuntings/")) {
        if (relativePosix.includes("/consultants/")) {
            return "headhuntingConsultant"
        }
        return "headhuntingCompany"
    }
    if (relativePosix.startsWith("courses/")) {
        const courseRel = relativePosix.slice("courses/".length)
        if (courseRel.includes("/challenges/")) return "challenge"
        if (courseRel.includes("/lesson-videos/")) return "lessonVideo"
        if (courseRel.includes("/contents/")) return "lesson"
        if (courseRel.includes("/milestones/") && courseRel.includes("/tasks/")) {
            return "milestoneTask"
        }
        if (courseRel.includes("/milestones/")) return "milestone"
        if (/^[^/]+\/[^/]+\.md$/.test(courseRel)) return "courseReadme"
    }
    return "mountDoc"
}

function listMountMdFiles() {
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
            const kind = classifyFile(relativePosix)
            results.push({ full, relativePosix, kind })
        }
    }
    for (const scanDir of SCAN_DIRS) {
        const root = path.join(DATA_ROOT, scanDir)
        if (fs.existsSync(root)) {
            walk(root)
        }
    }
    return results
}

function normalizeContent(content) {
    const rebuilt = content.replace(/\n{3,}/g, "\n\n")
    return rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`
}

function processFile(raw) {
    const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n")
    const result = transformLines(lines)
    const newContent = normalizeContent(result.lines.join("\n"))
    const normalizedRaw = normalizeContent(raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n"))
    const changed = newContent !== normalizedRaw
    return {
        content: changed ? newContent : raw,
        changed,
        fieldsWrapped: result.fieldsWrapped,
        envelopesStripped: result.envelopesStripped,
    }
}

const manifest = {
    appliedAt: new Date().toISOString(),
    filesChanged: [],
    totalFieldsWrapped: 0,
    totalEnvelopesStripped: 0,
    byKind: {},
}

function main() {
    const files = listMountMdFiles()
    for (const { full, relativePosix, kind } of files) {
        const raw = fs.readFileSync(full, "utf8")
        const result = processFile(raw)
        if (!manifest.byKind[kind]) {
            manifest.byKind[kind] = { changed: 0, fieldsWrapped: 0, envelopesStripped: 0 }
        }
        if (result.changed) {
            fs.writeFileSync(full, result.content, "utf8")
            manifest.filesChanged.push(relativePosix)
            manifest.totalFieldsWrapped += result.fieldsWrapped
            manifest.totalEnvelopesStripped += result.envelopesStripped
            manifest.byKind[kind].changed += 1
            manifest.byKind[kind].fieldsWrapped += result.fieldsWrapped
            manifest.byKind[kind].envelopesStripped += result.envelopesStripped
        }
    }

    const manifestPath = path.join(__dirname, "mount-template-delimiter-applied.json")
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2))
    console.log(JSON.stringify({
        filesScanned: files.length,
        filesChanged: manifest.filesChanged.length,
        totalFieldsWrapped: manifest.totalFieldsWrapped,
        totalEnvelopesStripped: manifest.totalEnvelopesStripped,
        byKind: manifest.byKind,
        manifestPath,
    }, null, 2))
}

main()
