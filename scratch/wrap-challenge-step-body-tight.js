/**
 * Wraps each step `### body` block: <!-- @starci/seperator --> ... <!-- @starci/seperator -->
 * Content includes ### 1. Steps etc. until ### codeImplementations or next ##.
 * Run: node scratch/wrap-challenge-step-body-tight.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE

const H1_STEPS_RE = /^#\s+steps\s*$/i
const H2_STEP_RE = /^##\s+\d+\s*$/
const H3_BODY_RE = /^###\s+body\s*$/i
const H3_BODY_END_RE = /^###\s+codeImplementations\s*$/i

const manifest = {
    fixedAt: new Date().toISOString(),
    filesChanged: [],
    stepsWrapped: 0,
    alreadyTight: 0,
    noBody: 0,
}

function trimLines(lines) {
    const copy = [...lines]
    while (copy.length > 0 && !copy[0].trim()) {
        copy.shift()
    }
    while (copy.length > 0 && !copy[copy.length - 1].trim()) {
        copy.pop()
    }
    return copy
}

function isTightWrapped(lines) {
    const t = trimLines(lines)
    if (t.length < 2) {
        return t.length === 0
    }
    return DELIMITER_RE.test(t[0]) && DELIMITER_RE.test(t[t.length - 1])
}

function stripAllDelimiterLines(lines) {
    return lines.filter((line) => !DELIMITER_RE.test(line))
}

function buildWrapped(innerLines) {
    const stripped = stripAllDelimiterLines(trimLines(innerLines))
    if (stripped.length === 0) {
        return [MOUNT_SECTION_DELIMITER_LINE, MOUNT_SECTION_DELIMITER_LINE]
    }
    return [MOUNT_SECTION_DELIMITER_LINE, ...stripped, MOUNT_SECTION_DELIMITER_LINE]
}

function findStepBodyRanges(lines) {
    const ranges = []
    let inFence = false
    let inSteps = false

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
            continue
        }
        if (inFence) {
            continue
        }
        if (H1_STEPS_RE.test(trimmed)) {
            inSteps = true
            continue
        }
        if (inSteps && /^#\s+\S/.test(trimmed) && !H1_STEPS_RE.test(trimmed)) {
            inSteps = false
            continue
        }
        if (!inSteps) {
            continue
        }
        if (H3_BODY_RE.test(trimmed)) {
            const bodyStart = index + 1
            let bodyEnd = lines.length
            for (let j = index + 1; j < lines.length; j += 1) {
                const t = lines[j].trim()
                if (lines[j].trim().startsWith("```")) {
                    continue
                }
                if (H3_BODY_END_RE.test(t)) {
                    bodyEnd = j
                    break
                }
                if (H2_STEP_RE.test(t) && j > bodyStart) {
                    bodyEnd = j
                    break
                }
            }
            ranges.push({
                bodyHeadingIndex: index,
                contentStart: bodyStart,
                contentEnd: bodyEnd,
            })
        }
    }
    return ranges
}

function wrapFile(content) {
    const lines = content.split(/\r?\n/)
    const ranges = findStepBodyRanges(lines)
    if (ranges.length === 0) {
        return {
            content,
            changed: false,
            stats: { noBody: 1 },
        }
    }
    let changed = false
    let stepsWrapped = 0
    let alreadyTight = 0
    const sorted = [...ranges].sort((a, b) => b.contentStart - a.contentStart)
    const newLines = [...lines]

    for (const range of sorted) {
        const inner = newLines.slice(range.contentStart, range.contentEnd)
        if (isTightWrapped(inner)) {
            alreadyTight += 1
            continue
        }
        const wrapped = buildWrapped(inner)
        newLines.splice(
            range.contentStart,
            range.contentEnd - range.contentStart,
            ...wrapped,
        )
        changed = true
        stepsWrapped += 1
    }

    const rebuilt = newLines.join("\n")
    return {
        content: rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`,
        changed: changed && rebuilt !== content,
        stats: { stepsWrapped, alreadyTight },
    }
}

function listChallengeMd(dir) {
    const results = []
    const walk = (current) => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const full = path.join(current, entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            const posix = full.replace(/\\/g, "/")
            if (
                (entry.name === "en.md" || entry.name === "vi.md") &&
                posix.includes("/challenges/")
            ) {
                results.push(full)
            }
        }
    }
    walk(dir)
    return results
}

function main() {
    for (const file of listChallengeMd(MOUNT_ROOT)) {
        const raw = fs.readFileSync(file, "utf8")
        const result = wrapFile(raw)
        const rel = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/")
        if (result.stats.noBody) {
            manifest.noBody += 1
            continue
        }
        manifest.alreadyTight += result.stats.alreadyTight ?? 0
        if (result.changed) {
            fs.writeFileSync(file, result.content, "utf8")
            manifest.filesChanged.push(rel)
            manifest.stepsWrapped += result.stats.stepsWrapped ?? 0
        }
    }
    const out = path.join(__dirname, "challenge-step-body-wrap-manifest.json")
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2))
    console.log(JSON.stringify({
        filesChanged: manifest.filesChanged.length,
        stepsWrapped: manifest.stepsWrapped,
        alreadyTightSteps: manifest.alreadyTight,
        manifest: out,
    }, null, 2))
}

main()
