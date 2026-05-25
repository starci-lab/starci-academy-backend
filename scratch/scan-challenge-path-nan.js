/**
 * Find challenge folders/files where orderIndex = NaN (bad mount folder names).
 * Run: node scratch/scan-challenge-path-nan.js
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const bad = []

function orderIndexFromName(name) {
    const prefix = name.split("-")[0]
    return Number.parseInt(prefix, 10)
}

function walk(dir, relBase) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        const rel = relBase ? `${relBase}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            if (entry.name === "challenges") {
                for (const child of fs.readdirSync(full, { withFileTypes: true })) {
                    const idx = orderIndexFromName(child.name)
                    if (Number.isNaN(idx)) {
                        bad.push({
                            challengesRoot: rel,
                            entry: child.name,
                            isDirectory: child.isDirectory(),
                            orderIndex: idx,
                        })
                    }
                }
            } else {
                walk(full, rel)
            }
        }
    }
}

walk(ROOT, "")
const out = { badCount: bad.length, bad }
fs.writeFileSync(
    path.join(__dirname, "challenge-path-nan-scan.json"),
    JSON.stringify(out, null, 2),
)
console.log(JSON.stringify({ badCount: bad.length }, null, 2))
bad.slice(0, 30).forEach((row) => console.log(JSON.stringify(row)))
