/**
 * Fixes remaining delimiter gaps after bulk apply:
 * - Step ### title missing closing delimiter (### score handled by apply script)
 * Run: node scratch/fix-mount-delimiter-gaps.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")

const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE

function isDelimiterLine(line) {
    return DELIMITER_RE.test(line)
}

function trimLines(lines) {
    const copy = [...lines]
    while (copy.length > 0 && !copy[0].trim()) copy.shift()
    while (copy.length > 0 && !copy[copy.length - 1].trim()) copy.pop()
    return copy
}

function stripAllDelimiterLines(lines) {
    return lines.filter((line) => !isDelimiterLine(line))
}

function buildTight(lines) {
    const stripped = stripAllDelimiterLines(trimLines(lines))
    if (stripped.length === 0) {
        return [MOUNT_SECTION_DELIMITER_LINE, MOUNT_SECTION_DELIMITER_LINE]
    }
    return [MOUNT_SECTION_DELIMITER_LINE, ...stripped, MOUNT_SECTION_DELIMITER_LINE]
}

const H1_STEPS_RE = /^#\s+steps\s*$/i
const H2_STEP_RE = /^##\s+\d+\s*$/
const H3_TITLE_RE = /^###\s+title\s*$/i
const H3_BODY_RE = /^###\s+body\s*$/i
const manifest = {
    fixedAt: new Date().toISOString(),
    filesChanged: [],
    stepTitlesWrapped: 0,
}

function fixContent(content) {
    const lines = content.replace(/\r\n/g, "\n").split("\n")
    let inFence = false
    let inSteps = false
    let changed = false
    let stepTitlesWrapped = 0

    for (let index = 0; index < lines.length; index += 1) {
        const trimmed = lines[index].trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
            continue
        }
        if (inFence) continue

        if (H1_STEPS_RE.test(trimmed)) {
            inSteps = true
            continue
        }
        if (inSteps && /^#\s+\S/.test(trimmed) && !H1_STEPS_RE.test(trimmed)) {
            inSteps = false
        }

        if (inSteps && H3_TITLE_RE.test(trimmed)) {
            const titleStart = index + 1
            let titleEnd = lines.length
            for (let j = index + 1; j < lines.length; j += 1) {
                const innerTrim = lines[j].trim()
                if (innerTrim.startsWith("```")) continue
                if (H3_BODY_RE.test(innerTrim) || H2_STEP_RE.test(innerTrim)) {
                    titleEnd = j
                    break
                }
            }
            const inner = lines.slice(titleStart, titleEnd)
            const trimmedInner = trimLines(inner)
            const needsClose =
                trimmedInner.length > 0 &&
                !isDelimiterLine(trimmedInner[trimmedInner.length - 1])
            const wrapped = buildTight(inner)
            if (needsClose || inner.join("\n") !== wrapped.join("\n")) {
                lines.splice(titleStart, titleEnd - titleStart, ...wrapped)
                stepTitlesWrapped += 1
                changed = true
            }
        }
    }

    if (!changed) {
        return { content, changed: false, stepTitlesWrapped }
    }
    const rebuilt = lines.join("\n").replace(/\n{3,}/g, "\n\n")
    return {
        content: rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`,
        changed: true,
        stepTitlesWrapped,
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
        const result = fixContent(raw)
        if (!result.changed) continue
        fs.writeFileSync(file, result.content, "utf8")
        const rel = path.relative(path.join(__dirname, ".."), file).replace(/\\/g, "/")
        manifest.filesChanged.push(rel)
        manifest.stepTitlesWrapped += result.stepTitlesWrapped
    }

    const out = path.join(__dirname, "mount-delimiter-gaps-fixed.json")
    fs.writeFileSync(out, JSON.stringify(manifest, null, 2))
    console.log(JSON.stringify({
        filesChanged: manifest.filesChanged.length,
        stepTitlesWrapped: manifest.stepTitlesWrapped,
        manifest: out,
    }, null, 2))
}

main()
