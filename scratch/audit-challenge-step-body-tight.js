/**
 * Audit: each step `### body` must be wrapped <!-- @starci/seperator --> ... <!-- @starci/seperator -->
 * Run: node scratch/audit-challenge-step-body-tight.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const { MOUNT_SECTION_DELIMITER_LINE_RE } = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE

const H1_STEPS_RE = /^#\s+steps\s*$/i
const H2_STEP_RE = /^##\s+\d+\s*$/
const H3_BODY_RE = /^###\s+body\s*$/i
const H3_BODY_END_RE = /^###\s+codeImplementations\s*$/i

function trimLines(lines) {
    const copy = [...lines]
    while (copy.length > 0 && !copy[0].trim()) copy.shift()
    while (copy.length > 0 && !copy[copy.length - 1].trim()) copy.pop()
    return copy
}

function isTight(lines) {
    const t = trimLines(lines)
    if (t.length === 0) return true
    if (t.length < 2) return false
    return DELIMITER_RE.test(t[0]) && DELIMITER_RE.test(t[t.length - 1])
}

function auditContent(content) {
    const lines = content.split(/\r?\n/)
    const loose = []
    let inFence = false
    let inSteps = false
    let stepIndex = -1

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
            continue
        }
        if (!inSteps) continue
        if (H2_STEP_RE.test(trimmed)) {
            stepIndex = parseInt(trimmed.replace(/^##\s+/, ""), 10)
            continue
        }
        if (H3_BODY_RE.test(trimmed)) {
            const bodyStart = index + 1
            let bodyEnd = lines.length
            for (let j = index + 1; j < lines.length; j += 1) {
                const t = lines[j].trim()
                if (H3_BODY_END_RE.test(t)) {
                    bodyEnd = j
                    break
                }
                if (H2_STEP_RE.test(t) && j > bodyStart) {
                    bodyEnd = j
                    break
                }
            }
            const inner = lines.slice(bodyStart, bodyEnd)
            if (!isTight(inner)) {
                loose.push({
                    stepIndex,
                    line: index + 1,
                    firstInner: trimLines(inner)[0]?.slice(0, 40),
                })
            }
        }
    }
    return loose
}

function walk(dir, results) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full, results)
            continue
        }
        const posix = full.replace(/\\/g, "/")
        if (
            (entry.name === "en.md" || entry.name === "vi.md") &&
            posix.includes("/challenges/")
        ) {
            const rel = path.relative(path.join(__dirname, ".."), full).replace(/\\/g, "/")
            const loose = auditContent(fs.readFileSync(full, "utf8"))
            if (loose.length > 0) {
                results.push({ file: rel, loose })
            }
        }
    }
}

const looseFiles = []
walk(MOUNT_ROOT, looseFiles)

const report = {
    generatedAt: new Date().toISOString(),
    tight: looseFiles.length === 0,
    looseFileCount: looseFiles.length,
    looseFiles,
}

fs.writeFileSync(
    path.join(__dirname, "challenge-step-body-tight-audit.json"),
    JSON.stringify(report, null, 2),
)

console.log(JSON.stringify({
    tight: report.tight,
    looseFileCount: report.looseFileCount,
}, null, 2))
