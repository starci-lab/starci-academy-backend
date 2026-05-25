/**
 * Audit challenges/ vs canonical: only directories `{N}-{slug}-{easy|medium|hard|insane}/` with en.md + vi.md.
 * Run: node scratch/audit-challenge-mount-structure.js
 */
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..", ".mount", "data", "courses")
const SEP = "<!-- @starci/seperator -->"
const FOLDER_RE = /^(\d+)-.+-((?:easy|medium|hard|insane))$/
const LOOSE_MD_RE = /^(easy|medium|hard|insane)\.md$/i
const REQUIRED_SECTIONS = [
    "title",
    "description",
    "requirements",
    "prerequisites",
    "steps",
    "outputs",
    "references",
    "submissions",
    "difficulty",
    "score",
]

const issues = {
    looseRootMd: [],
    badFolderName: [],
    missingEn: [],
    missingVi: [],
    missingSections: [],
    duplicateDifficulty: [],
}

function walk(dir, rel) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name)
        const entryRel = rel ? `${rel}/${entry.name}` : entry.name
        if (entry.isDirectory()) {
            if (entry.name === "challenges") {
                auditChallengesRoot(full, entryRel)
            } else {
                walk(full, entryRel)
            }
        }
    }
}

function auditChallengesRoot(challengesDir, rel) {
    for (const entry of fs.readdirSync(challengesDir, { withFileTypes: true })) {
        const full = path.join(challengesDir, entry.name)
        const entryRel = `${rel}/${entry.name}`
        if (entry.isDirectory()) {
            const match = entry.name.match(FOLDER_RE)
            if (!match) {
                issues.badFolderName.push({
                    path: entryRel,
                    reason: "folder must match {index}-{slug}-{easy|medium|hard|insane}",
                })
            } else {
                auditChallengeFolder(full, entryRel, match[1], match[2])
            }
            continue
        }
        if (entry.isFile() && LOOSE_MD_RE.test(entry.name)) {
            issues.looseRootMd.push({ path: entryRel, file: entry.name })
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            issues.looseRootMd.push({
                path: entryRel,
                file: entry.name,
                reason: "unexpected file in challenges/",
            })
        }
    }
}

function auditChallengeFolder(folder, rel, index, difficulty) {
    const en = path.join(folder, "en.md")
    const vi = path.join(folder, "vi.md")
    if (!fs.existsSync(en)) {
        issues.missingEn.push({ path: rel })
    } else {
        checkSections(en, rel, "en.md")
        checkDifficulty(en, rel, difficulty)
    }
    if (!fs.existsSync(vi)) {
        issues.missingVi.push({ path: rel })
    } else {
        checkSections(vi, rel, "vi.md")
    }
}

function checkSections(file, rel, localeFile) {
    const text = fs.readFileSync(file, "utf8")
    for (const key of REQUIRED_SECTIONS) {
        if (!new RegExp(`^# ${key}\\s*$`, "m").test(text)) {
            issues.missingSections.push({
                path: `${rel}/${localeFile}`,
                section: key,
            })
        }
    }
}

function checkDifficulty(file, rel, expected) {
    const text = fs.readFileSync(file, "utf8")
    const m = text.match(/^# difficulty\s*\n(?:<!-- @starci\/seperator -->\s*\n)?(\S+)/m)
    if (m && m[1] !== expected) {
        issues.missingSections.push({
            path: `${rel}/en.md`,
            section: `difficulty mismatch: folder=${expected} file=${m[1]}`,
        })
    }
}

walk(ROOT, "")

const summary = {
    looseRootMd: issues.looseRootMd.length,
    badFolderName: issues.badFolderName.length,
    missingEn: issues.missingEn.length,
    missingVi: issues.missingVi.length,
    missingSections: issues.missingSections.length,
}
const outPath = path.join(__dirname, "challenge-mount-structure-audit.json")
fs.writeFileSync(
    outPath,
    JSON.stringify({ summary, issues }, null, 2),
)
console.log(JSON.stringify(summary, null, 2))
if (issues.looseRootMd.length) {
    console.log("\nlooseRootMd (first 20):")
    issues.looseRootMd.slice(0, 20).forEach((r) => console.log(" ", r.path))
}
if (issues.badFolderName.length) {
    console.log("\nbadFolderName:")
    issues.badFolderName.forEach((r) => console.log(" ", r.path, r.reason))
}
if (issues.missingEn.length) {
    console.log("\nmissingEn:", issues.missingEn.length)
}
if (issues.missingVi.length) {
    console.log("\nmissingVi (first 15):")
    issues.missingVi.slice(0, 15).forEach((r) => console.log(" ", r.path))
}
