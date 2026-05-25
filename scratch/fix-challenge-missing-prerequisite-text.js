/**
 * Restore # prerequisites when ## N has no ### text (often after bad delimiter fix).
 * Run: node scratch/fix-challenge-missing-prerequisite-text.js
 */
const fs = require("fs")
const path = require("path")

const DELIM = "<!-- @starci/seperator -->"
const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const fixed = []

function getTitleAfter(lines, start) {
    for (let i = start; i < lines.length; i += 1) {
        if (lines[i] === "# title") {
            for (let j = i + 1; j < lines.length; j += 1) {
                if (lines[j].startsWith("# ")) {
                    break
                }
                const t = lines[j].trim()
                if (t && t !== DELIM) {
                    return t
                }
            }
            break
        }
    }
    return null
}

function hasTextUnderNumericSection(lines, start, end) {
    for (let i = start + 1; i < end; i += 1) {
        if (lines[i].match(/^### text\s*$/)) {
            return true
        }
    }
    return false
}

function fixFile(filePath) {
    const lines = fs.readFileSync(filePath, "utf8").split("\n")
    const locale = filePath.endsWith("vi.md") ? "vi" : "en"
    const out = []
    let changed = false
    let i = 0

    while (i < lines.length) {
        if (lines[i] !== "# prerequisites") {
            out.push(lines[i])
            i += 1
            continue
        }
        out.push(lines[i])
        i += 1
        const title = getTitleAfter(lines, 0) ?? "this lesson"
        const inserts = []

        while (i < lines.length && !lines[i].match(/^# [a-z]/)) {
            const line = lines[i]
            const numMatch = line.match(/^## (\d+)\s*$/)
            if (numMatch) {
                const sectionStart = i
                i += 1
                let sectionEnd = i
                while (
                    sectionEnd < lines.length
                    && !lines[sectionEnd].match(/^## \d+\s*$/)
                    && !lines[sectionEnd].match(/^# [a-z]/)
                ) {
                    sectionEnd += 1
                }
                if (!hasTextUnderNumericSection(lines, sectionStart, sectionEnd)) {
                    changed = true
                    const index = numMatch[1]
                    const text =
                        locale === "vi"
                            ? index === "0"
                                ? `Đã hoàn thành bài học (“${title}”) và có project Next.js chạy được.`
                                : `Đã nắm các khái niệm trong bài học liên quan đến challenge này.`
                            : index === "0"
                                ? `Completed the lesson (“${title}”) and have a runnable Next.js project.`
                                : `Understand the lesson concepts required for this challenge.`
                    inserts.push(
                        `## ${index}`,
                        "### text",
                        DELIM,
                        text,
                        DELIM,
                        "",
                    )
                    i = sectionEnd
                    continue
                }
                for (let j = sectionStart; j < sectionEnd; j += 1) {
                    out.push(lines[j])
                }
                i = sectionEnd
                continue
            }
            if (inserts.length === 0) {
                out.push(line)
            }
            i += 1
        }

        if (inserts.length > 0) {
            out.push(...inserts)
        } else if (
            changed === false
            && out[out.length - 1] === "# prerequisites"
        ) {
            const scan = lines.slice(
                lines.indexOf("# prerequisites") + 1,
            )
            const hasAnyNumeric = scan.some((l) => l.match(/^## \d+\s*$/))
            if (!hasAnyNumeric) {
                changed = true
                const text =
                    locale === "vi"
                        ? `Đã hoàn thành bài học (“${title}”) và có project Next.js chạy được.`
                        : `Completed the lesson (“${title}”) and have a runnable Next.js project.`
                out.push(
                    "## 0",
                    "### text",
                    DELIM,
                    text,
                    DELIM,
                    "",
                )
            }
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, out.join("\n"))
        fixed.push(filePath)
    }
}

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            if (entry.name === "challenges") {
                for (const ch of fs.readdirSync(full, { withFileTypes: true })) {
                    if (!ch.isDirectory()) {
                        continue
                    }
                    for (const locale of ["en.md", "vi.md"]) {
                        const md = path.join(full, ch.name, locale)
                        if (fs.existsSync(md)) {
                            fixFile(md)
                        }
                    }
                }
            } else {
                walk(full)
            }
        }
    }
}

walk(ROOT)
console.log(`Fixed ${fixed.length} file(s)`)
fixed.forEach((f) =>
    console.log(" ", path.relative(ROOT, f).replace(/\\/g, "/")),
)
