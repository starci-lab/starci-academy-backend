/**
 * Rename challenge folders missing -{easy|medium|hard|insane} suffix (canonical mount).
 * Run: node scratch/fix-challenge-folder-names.js
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const FOLDER_RE = /^(\d+)-.+-((?:easy|medium|hard|insane))$/
const DIFF_RE =
    /^# difficulty\s*\r?\n(?:<!-- @starci\/seperator -->\s*\r?\n)?(easy|medium|hard|insane)\s*$/m

const audit = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, "challenge-mount-structure-audit.json"),
        "utf8",
    ),
)

const renames = []

for (const row of audit.issues.badFolderName) {
    const folder = path.join(ROOT, row.path)
    const en = path.join(folder, "en.md")
    if (!fs.existsSync(en)) {
        console.error("skip missing en.md:", row.path)
        continue
    }
    const text = fs.readFileSync(en, "utf8")
    const match = text.match(DIFF_RE)
    const difficulty = match ? match[1] : "easy"
    const base = path.basename(folder)
    if (FOLDER_RE.test(base)) {
        continue
    }
    const suffix = `-${difficulty}`
    if (base.endsWith(suffix)) {
        continue
    }
    const target = path.join(path.dirname(folder), `${base}${suffix}`)
    if (fs.existsSync(target)) {
        console.error("target exists:", target)
        continue
    }
    fs.renameSync(folder, target)
    renames.push({ from: base, to: `${base}${suffix}`, path: row.path })
    console.log("renamed:", base, "->", `${base}${suffix}`)
}

const manifest = {
    fixedAt: new Date().toISOString(),
    count: renames.length,
    renames,
}
fs.writeFileSync(
    path.join(__dirname, "challenge-folder-rename-manifest.json"),
    JSON.stringify(manifest, null, 2),
)
console.log(`Done. ${renames.length} folder(s) renamed.`)
