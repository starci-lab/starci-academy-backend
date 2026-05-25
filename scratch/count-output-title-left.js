/**
 * Count `### title` still present under `# outputs` in challenge mount files.
 */
const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname, "..", ".mount", "data", "courses")

function isTopLevelH1(line, key) {
    const match = line.trim().match(/^#\s+(\S+)\s*$/)
    if (!match) {
        return false
    }
    if (key === undefined) {
        return true
    }
    return match[1] === key
}

function countBadInFile(filePath) {
    const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/)
    let inOutputs = false
    let inOutputItem = false
    let bad = 0
    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith("```")) {
            continue
        }
        if (isTopLevelH1(line, "outputs")) {
            inOutputs = true
            inOutputItem = false
            continue
        }
        if (inOutputs && isTopLevelH1(line)) {
            inOutputs = false
            inOutputItem = false
            continue
        }
        if (!inOutputs) {
            continue
        }
        if (/^##\s+\d+\s*$/.test(trimmed)) {
            inOutputItem = true
            continue
        }
        if (inOutputItem && /^###\s+title\s*$/i.test(trimmed)) {
            bad += 1
        }
    }
    return bad
}

function walk(dir, results) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(full, results)
            continue
        }
        const relativePosix = full.replace(/\\/g, "/")
        if (
            (entry.name === "en.md" || entry.name === "vi.md") &&
            relativePosix.includes("/challenges/")
        ) {
            const bad = countBadInFile(full)
            if (bad > 0) {
                results.push({ file: relativePosix, bad })
            }
        }
    }
}

const results = []
walk(MOUNT_ROOT, results)
const totalBad = results.reduce((sum, row) => sum + row.bad, 0)
console.log(JSON.stringify({ filesWithTitle: results.length, totalBad, sample: results.slice(0, 5) }, null, 2))
