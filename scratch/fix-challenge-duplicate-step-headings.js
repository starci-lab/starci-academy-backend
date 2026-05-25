/**
 * Remove consecutive duplicate ## N lines under # steps.
 * Run: node scratch/fix-challenge-duplicate-step-headings.js
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const H2 = /^## (\d+)\s*$/
const H1 = /^# [a-z]/

function fixFile(lines) {
    let inSteps = false
    let changed = false
    const out = []
    for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i]
        if (line === "# steps") {
            inSteps = true
            out.push(line)
            continue
        }
        if (inSteps && H1.test(line)) {
            inSteps = false
        }
        if (inSteps) {
            const m = line.match(H2)
            if (m && i + 1 < lines.length) {
                const next = lines[i + 1].match(H2)
                if (next && next[1] === m[1]) {
                    changed = true
                    continue
                }
            }
        }
        out.push(line)
    }
    return { content: out.join("\n"), changed }
}

function walk(dir) {
    let count = 0
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
                        if (!fs.existsSync(md)) {
                            continue
                        }
                        const text = fs.readFileSync(md, "utf8")
                        const { content, changed } = fixFile(text.split("\n"))
                        if (changed) {
                            fs.writeFileSync(md, content)
                            count += 1
                            console.log(path.relative(ROOT, md).replace(/\\/g, "/"))
                        }
                    }
                }
            } else {
                count += walk(full)
            }
        }
    }
    return count
}

console.log(`Fixed ${walk(ROOT)} file(s)`)
