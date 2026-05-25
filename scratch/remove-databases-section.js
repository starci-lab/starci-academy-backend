/**
 * Removes top-level `# databases` block from lesson mount files.
 * Run: node scratch/remove-databases-section.js
 */

const fs = require("fs")
const path = require("path")

const MOUNT_ROOT = path.join(__dirname,
    "..",
    ".mount",
    "data",
    "courses")

const TOP_LEVEL_SECTIONS = new Set([
    "title",
    "description",
    "body",
    "codeExplaining",
    "codeImplementations",
    "databases",
    "references",
    "minutesRead",
    "isPremium",
])

const isTopLevelH1 = (line) => {
    const match = line.trim().match(/^#\s+(\S+)\s*$/)
    if (!match) {
        return null
    }
    const key = match[1]
    return TOP_LEVEL_SECTIONS.has(key) ? key : null
}

function removeDatabasesSection(content) {
    const lines = content.split(/\r?\n/)
    const start = lines.findIndex((line) => isTopLevelH1(line) === "databases")
    if (start === -1) {
        return {
            changed: false,
            content,
        }
    }
    let end = lines.length
    for (let index = start + 1; index < lines.length; index += 1) {
        const key = isTopLevelH1(lines[index])
        if (key && key !== "databases") {
            end = index
            break
        }
    }
    const next = [
        ...lines.slice(0,
            start),
        ...lines.slice(end),
    ]
    const trimmed = next.join("\n").replace(/\n{3,}/g,
        "\n\n")
    return {
        changed: true,
        content: trimmed.endsWith("\n") ? trimmed : `${trimmed}\n`,
    }
}

function listLessonMdFiles(dir) {
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
            if (entry.name !== "en.md" && entry.name !== "vi.md") {
                continue
            }
            const relative = path.relative(dir,
                full).replace(/\\/g,
                "/")
            if (!relative.includes("/contents/")) {
                continue
            }
            if (relative.includes("/challenges/") || relative.includes("/lesson-videos/")) {
                continue
            }
            results.push(full)
        }
    }
    walk(dir)
    return results
}

function main() {
    const files = listLessonMdFiles(MOUNT_ROOT)
    const changed = []
    for (const file of files) {
        const raw = fs.readFileSync(file,
            "utf8")
        const result = removeDatabasesSection(raw)
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
        "databases-section-removed.json")
    fs.writeFileSync(manifestPath,
        JSON.stringify({
            removedAt: new Date().toISOString(),
            count: changed.length,
            files: changed,
        },
        null,
        2))
    console.log(`Removed # databases from ${changed.length} files`)
    console.log(`Wrote ${manifestPath}`)
}

main()
