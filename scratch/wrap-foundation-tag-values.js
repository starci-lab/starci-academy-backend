/**
 * Wraps each ### value under # tags with <!-- @starci/seperator -->.
 * Run: node scratch/wrap-foundation-tag-values.js
 */

const fs = require("fs")
const path = require("path")
const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")

const DATA_ROOT = path.join(__dirname, "..", ".mount", "data", "foundations")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_TAGS_RE = /^#\s+tags\s*$/i

function hasTagsSection(raw) {
    return /(?:^|\n)#\s+tags\s*(?:\n|$)/m.test(raw)
}
const H2_RE = /^##\s+\d+\s*$/
const H3_VALUE_RE = /^###\s+value\s*$/i
const H1_ANY_RE = /^#\s+\S/

function stripDelimiters(lines) {
    return lines.filter((line) => !DELIMITER_RE.test(line))
}

function buildTight(lines) {
    const stripped = stripDelimiters(lines)
    while (stripped.length > 0 && !stripped[0].trim()) stripped.shift()
    while (stripped.length > 0 && !stripped[stripped.length - 1].trim()) stripped.pop()
    if (stripped.length === 0) {
        return [MOUNT_SECTION_DELIMITER_LINE, MOUNT_SECTION_DELIMITER_LINE]
    }
    return [MOUNT_SECTION_DELIMITER_LINE, ...stripped, MOUNT_SECTION_DELIMITER_LINE]
}

function isTight(lines) {
    const t = [...lines]
    while (t.length > 0 && !t[0].trim()) t.shift()
    while (t.length > 0 && !t[t.length - 1].trim()) t.pop()
    return t.length >= 2 && DELIMITER_RE.test(t[0]) && DELIMITER_RE.test(t[t.length - 1])
}

function transform(content) {
    const lines = content.replace(/\r\n/g, "\n").split("\n")
    let inTags = false
    let inFence = false
    let changed = false
    let wrapped = 0

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
            continue
        }
        if (inFence) continue

        if (H1_TAGS_RE.test(trimmed)) {
            inTags = true
            continue
        }
        if (inTags && H1_ANY_RE.test(trimmed) && !H1_TAGS_RE.test(trimmed)) {
            inTags = false
        }
        if (!inTags) continue

        if (H3_VALUE_RE.test(trimmed)) {
            const start = index + 1
            let end = lines.length
            for (let j = start; j < lines.length; j += 1) {
                const t = lines[j].trim()
                if (t.startsWith("```")) continue
                if (H3_VALUE_RE.test(t) || H2_RE.test(t) || (H1_ANY_RE.test(t) && !H1_TAGS_RE.test(t))) {
                    end = j
                    break
                }
            }
            const inner = lines.slice(start, end)
            if (!isTight(inner)) {
                const tight = buildTight(inner)
                lines.splice(start, end - start, ...tight)
                index = start + tight.length - 1
                wrapped += 1
                changed = true
            }
        }
    }

    if (!changed) {
        return { content, changed: false, wrapped }
    }
    const rebuilt = lines.join("\n").replace(/\n{3,}/g, "\n\n")
    return {
        content: rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`,
        changed: true,
        wrapped,
    }
}

function walk(dir, files) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full, files)
            continue
        }
        if (entry.name !== "en.md" && entry.name !== "vi.md") continue
        const posix = full.replace(/\\/g, "/")
        if (/\/foundations\/[^/]+\/foundations\//.test(posix)) {
            files.push(full)
        }
    }
}

const files = []
walk(DATA_ROOT, files)
let totalWrapped = 0
let filesChanged = 0

for (const file of files) {
    const raw = fs.readFileSync(file, "utf8")
    if (!hasTagsSection(raw)) continue
    const result = transform(raw)
    if (result.changed) {
        fs.writeFileSync(file, result.content, "utf8")
        filesChanged += 1
        totalWrapped += result.wrapped
    }
}

console.log(JSON.stringify({ filesChanged, totalWrapped }, null, 2))
