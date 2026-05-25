/**
 * Full delimiter pipeline: courses + cv + foundations + headhuntings.
 * Run: node scratch/pipeline-mount-delimiters.js
 */

const { execSync } = require("child_process")
const path = require("path")

const ROOT = path.join(__dirname, "..")
const steps = [
    ["apply", "node scratch/apply-mount-template-delimiters.js"],
    ["wrap-body", "node scratch/wrap-lesson-body-tight.js"],
    ["wrap-foundation-tags", "node scratch/wrap-foundation-tag-values.js"],
    ["fix-gaps", "node scratch/fix-mount-delimiter-gaps.js"],
    ["wrap-challenge-steps", "node scratch/wrap-challenge-step-body-tight.js"],
]

for (const [name, cmd] of steps) {
    console.log(`\n--- ${name} ---`)
    execSync(cmd, { cwd: ROOT, stdio: "inherit" })
}

console.log("\nDone. Optional: node scratch/audit-mount-full.js (courses gates only)\n")
