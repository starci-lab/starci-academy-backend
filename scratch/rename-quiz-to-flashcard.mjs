// One-shot rename: quiz -> flashcard across BE + FE code, file/dir names, and the
// .mount/data deck FOLDER names (folder rename only, never touches .md content prose).
import fs from "node:fs"
import path from "node:path"

const SKIP_DIRS = new Set(["node_modules", ".next", "dist", ".git", ".contexts", ".repo"])

// case-sensitive token replace (non-overlapping cases) — keeps Casing consistent
const replaceTokens = (s) =>
    s.replace(/Quiz/g, "Flashcard").replace(/QUIZ/g, "FLASHCARD").replace(/quiz/g, "flashcard")

const renameToken = (name) => replaceTokens(name)

// 1) text-replace inside code files (.ts/.tsx) under the given roots
const CODE_ROOTS = [
    "C:/Repositories/ac/starci-academy-backend/src",
    "C:/Repositories/ac/starci-academy-backend/apps",
    "C:/Repositories/starci-academy/src",
]
let textChanged = 0
const walkFiles = (dir, cb) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name)) continue
            walkFiles(path.join(dir, e.name), cb)
        } else cb(path.join(dir, e.name))
    }
}
for (const root of CODE_ROOTS) {
    walkFiles(root, (file) => {
        if (!/\.(ts|tsx)$/.test(file)) return
        const raw = fs.readFileSync(file, "utf8")
        if (!/quiz/i.test(raw)) return
        const next = replaceTokens(raw)
        if (next !== raw) {
            fs.writeFileSync(file, next)
            textChanged++
        }
    })
}

// 2) rename files + dirs whose NAME contains quiz (deepest-first so paths stay valid)
const RENAME_ROOTS = [
    "C:/Repositories/ac/starci-academy-backend/src",
    "C:/Repositories/ac/starci-academy-backend/apps",
    "C:/Repositories/starci-academy/src",
    // data: rename deck folders ONLY (no content edits) so the renamed seeder path matches
    "C:/Repositories/ac/starci-academy-backend/.mount/data/courses",
]
const collect = (dir, acc) => {
    if (!fs.existsSync(dir)) return
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name)) continue
            collect(p, acc)
        }
        acc.push({ p, name: e.name, dir: e.isDirectory() })
    }
}
const entries = []
for (const root of RENAME_ROOTS) collect(root, entries)
// deepest path first
entries.sort((a, b) => b.p.length - a.p.length)
let renamed = 0
for (const { p, name } of entries) {
    if (!/quiz/i.test(name)) continue
    const target = path.join(path.dirname(p), renameToken(name))
    if (target !== p) {
        fs.renameSync(p, target)
        renamed++
    }
}

console.log(JSON.stringify({ textChanged, renamed }, null, 2))
