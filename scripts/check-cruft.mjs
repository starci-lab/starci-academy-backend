#!/usr/bin/env node
// check-cruft — flag junk that should never be committed: embedded git repos,
// leaked scratchpad/temp files, and heavy untracked dirs. Read-only; exits 1 if
// it finds anything, so it can gate CI. Run: `node scripts/check-cruft.mjs`.
import { execSync } from "node:child_process"

/** Patterns that mark a path as leaked temp / scratchpad cruft. */
const CRUFT_PATTERNS = [
    /AppDataLocalTemp/i, // scratchpad files that leak with a mangled C: path
    /\.migrate-tmp\//,   // course-content migration worktrees
    /^scratchpad\//,
]

/** Untracked dirs known to be heavy regenerable junk (warn, don't hard-fail). */
const HEAVY_JUNK_DIRS = [".audits", ".claude-vip"]

// maxBuffer bumped: this repo tracks thousands of .artifacts files, so a bare
// `git ls-files` blows the default 1 MB pipe.
const run = (cmd) => execSync(cmd, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }).trim()

let problems = 0

// 1. embedded git repositories (a nested .git the outer repo would track as a
//    gitlink, mode 160000 — this is what silently bloats `git add -A`)
const embedded = run("git ls-files -s")
    .split("\n")
    .filter((line) => line.startsWith("160000"))
    .map((line) => line.split("\t")[1])
    .filter(Boolean)
if (embedded.length) {
    problems += embedded.length
    console.error(`✗ ${embedded.length} embedded git repo(s) tracked as gitlinks:`)
    embedded.forEach((path) => console.error(`    ${path}`))
}

// 2. leaked temp / scratchpad files anywhere in the working tree (tracked or not)
const allFiles = run("git status --porcelain --untracked-files=all")
    .split("\n")
    .map((line) => line.slice(3))
    .filter(Boolean)
const leaked = allFiles.filter((path) => CRUFT_PATTERNS.some((re) => re.test(path)))
if (leaked.length) {
    problems += leaked.length
    console.error(`✗ ${leaked.length} leaked temp/scratchpad path(s) in the tree:`)
    leaked.slice(0, 10).forEach((path) => console.error(`    ${path}`))
    if (leaked.length > 10) {
        console.error(`    … and ${leaked.length - 10} more`)
    }
}

// 3. heavy junk dirs present on disk but ideally gitignored (warn only)
for (const dir of HEAVY_JUNK_DIRS) {
    try {
        run(`test -d ${dir}`)
        console.warn(`⚠ ${dir}/ exists — heavy regenerable junk; delete it if you don't need it`)
    } catch {
        // absent — good
    }
}

if (problems > 0) {
    console.error(`\ncheck-cruft: ${problems} problem(s). Delete the files and confirm .gitignore covers them.`)
    process.exit(1)
}
console.log("check-cruft: clean — no embedded repos, no leaked temp files.")
