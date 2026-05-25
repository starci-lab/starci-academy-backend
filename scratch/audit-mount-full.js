/**
 * Run full mount audit suite; writes scratch/MOUNT-FULL-AUDIT-SUMMARY.json
 * Run: node scratch/audit-mount-full.js
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const scripts = [
    { name: "lesson-body-tight", cmd: "node scratch/audit-lesson-body-tight.js" },
    { name: "challenge-step-body-tight", cmd: "node scratch/audit-challenge-step-body-tight.js" },
    { name: "non-string-extract", cmd: "node scratch/report-non-string-extract-fields.js" },
    { name: "structure", cmd: "node scratch/audit-mount-content-challenges.js" },
]

const results = {}
for (const { name, cmd } of scripts) {
    try {
        const out = execSync(cmd, { cwd: ROOT, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
        results[name] = { ok: true, stdout: out.trim() }
    } catch (error) {
        results[name] = {
            ok: false,
            stdout: (error.stdout || "").trim(),
            stderr: (error.stderr || "").trim(),
        }
    }
}

const lessonAudit = JSON.parse(
    fs.readFileSync(path.join(__dirname, "lesson-body-tight-audit.json"), "utf8"),
)
const challengeAudit = JSON.parse(
    fs.readFileSync(path.join(__dirname, "challenge-step-body-tight-audit.json"), "utf8"),
)
const nonString = JSON.parse(
    fs.readFileSync(path.join(__dirname, "non-string-extract-fields-report.json"), "utf8"),
)
const structure = JSON.parse(
    fs.readFileSync(path.join(__dirname, "mount-structure-audit.json"), "utf8"),
)

const summary = {
    generatedAt: new Date().toISOString(),
    delimiter: "<!-- @starci/seperator -->",
    gates: {
        lessonBodyTight: lessonAudit.tight,
        challengeStepBodyTight: challengeAudit.tight,
        extractNonString: nonString.totalFindings === 0,
        structureCanonical:
            (structure.summary?.lesson?.nonCanonical ?? 0) === 0 &&
            (structure.summary?.challenge?.nonCanonical ?? 0) === 0,
    },
    counts: {
        lessonLoose: lessonAudit.looseCount,
        challengeLooseFiles: challengeAudit.looseFileCount,
        nonStringFindings: nonString.totalFindings,
    },
    scriptRuns: results,
}

fs.writeFileSync(
    path.join(__dirname, "MOUNT-FULL-AUDIT-SUMMARY.json"),
    JSON.stringify(summary, null, 2),
)

const allPass = Object.values(summary.gates).every(Boolean)
console.log(JSON.stringify({ allPass, gates: summary.gates, counts: summary.counts }, null, 2))
process.exit(allPass ? 0 : 1)
