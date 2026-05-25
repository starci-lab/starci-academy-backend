/**
 * Removes `### title` blocks under `# outputs` → `## N` in challenge mount files.
 * Run: node scratch/remove-challenge-output-title.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname,
    "..",
    ".mount",
    "data",
    "courses")

const OUTPUTS_KEY = "outputs"
const { MOUNT_SECTION_DELIMITER_LINE_RE } = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE

function isTopLevelH1(line,
    key) {
    const match = line.trim().match(/^#\s+(\S+)\s*$/)
    if (!match) {
        return false
    }
    if (key === undefined) {
        return true
    }
    return match[1] === key
}

function removeOutputTitleBlocks(content) {
    const lines = content.split(/\r?\n/)
    const out = []
    let inOutputs = false
    let inFence = false
    let inOutputItem = false
    let skippingTitle = false

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const trimmed = line.trim()

        if (trimmed.startsWith("```")) {
            inFence = !inFence
            if (!skippingTitle) {
                out.push(line)
            }
            continue
        }

        if (!inFence && isTopLevelH1(line,
            OUTPUTS_KEY)) {
            inOutputs = true
            inOutputItem = false
            skippingTitle = false
            out.push(line)
            continue
        }

        if (!inFence && inOutputs && isTopLevelH1(line)) {
            inOutputs = false
            inOutputItem = false
            skippingTitle = false
            out.push(line)
            continue
        }

        if (!inOutputs || inFence) {
            out.push(line)
            continue
        }

        if (/^##\s+\d+\s*$/.test(trimmed)) {
            inOutputItem = true
            skippingTitle = false
            out.push(line)
            continue
        }

        if (inOutputItem && /^###\s+title\s*$/i.test(trimmed)) {
            skippingTitle = true
            continue
        }

        if (skippingTitle) {
            if (/^###\s+\S+/i.test(trimmed) && !/^###\s+title\s*$/i.test(trimmed)) {
                skippingTitle = false
                out.push(line)
            }
            continue
        }

        out.push(line)
    }

    const rebuilt = out.join("\n").replace(/\n{3,}/g,
        "\n\n")
    return {
        content: rebuilt.endsWith("\n") ? rebuilt : `${rebuilt}\n`,
        changed: rebuilt !== content,
    }
}

function listChallengeMdFiles(dir) {
    const results = []
    const walk = (current) => {
        for (const entry of fs.readdirSync(current,
            {
                withFileTypes: true,
            })) {
            const full = path.join(current,
                entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            const relativePosix = full.replace(/\\/g,
                "/")
            if ((entry.name === "en.md" || entry.name === "vi.md") &&
                relativePosix.includes("/challenges/")) {
                results.push(full)
            }
        }
    }
    walk(dir)
    return results
}

function main() {
    const files = listChallengeMdFiles(MOUNT_ROOT)
    const changed = []
    for (const file of files) {
        const raw = fs.readFileSync(file,
            "utf8")
        const result = removeOutputTitleBlocks(raw)
        if (result.changed) {
            fs.writeFileSync(file,
                result.content,
                "utf8")
            changed.push(path.relative(path.join(__dirname,
                ".."),
                file).replace(/\\/g,
                "/"))
        }
    }
    const manifestPath = path.join(__dirname,
        "challenge-output-title-removed.json")
    fs.writeFileSync(manifestPath,
        JSON.stringify({
            removedAt: new Date().toISOString(),
            count: changed.length,
            files: changed,
        },
        null,
        2))
    console.log(`Removed output ### title from ${changed.length} files`)
    console.log(`Wrote ${manifestPath}`)
}

main()
