#!/usr/bin/env node
/**
 * check-repo-visibility.mjs — gate: GitHub source-repo visibility MUST match `# isPremium`.
 *
 * Rule (`.audits/rules/migrate-github.md` §0/§4): biên repo = biên phân quyền.
 *   - isPremium = false (free)  ⇒ repo PUBLIC  (học viên clone được).
 *   - isPremium = true  (paid)  ⇒ repo PRIVATE (khoá độc lập).
 * Lọt khỏi audit nội dung cũ vì check-lesson chỉ soi body/challenge, KHÔNG soi visibility →
 * free-lesson lỡ private = "source code thiếu bài"; premium lỡ public = lộ source trả phí.
 *
 * Dùng: node .audits/check-repo-visibility.mjs [<dir> ...] [--json]
 *   <dir> = course / module / lesson dir (tự walk tìm lesson = thư mục có vi.md + bodies/).
 *           Không truyền → mặc định quét MỌI course dưới .mount/data/courses.
 * Nguồn visibility: `gh repo list StarCi-Academy --limit 1000` (cần `gh auth login`).
 * Exit 1 nếu có mismatch / repo thiếu (gate fail); 0 nếu khớp hết.
 */
import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

const ORG = "StarCi-Academy"
const DEFAULT_ROOT = path.resolve(".mount/data/courses")
const SEPARATOR = "<!-- @starci/seperator -->"

const args = process.argv.slice(2)
const asJson = args.includes("--json")
const roots = args.filter((a) => !a.startsWith("--"))
const scanRoots = roots.length > 0 ? roots : [DEFAULT_ROOT]

/** Read a `# key` value from a separator-delimited metadata md (vi.md). */
const readMeta = (mdPath, key) => {
    if (!fs.existsSync(mdPath)) {
        return null
    }
    const lines = fs.readFileSync(mdPath, "utf8").split(/\r?\n/)
    const headerAt = lines.findIndex((line) => line.trim() === `# ${key}`)
    if (headerAt < 0) {
        return null
    }
    // first non-separator, non-empty line after the header
    for (let i = headerAt + 1; i < lines.length; i += 1) {
        const value = lines[i].trim()
        if (value === SEPARATOR || value === "") {
            continue
        }
        if (value.startsWith("# ")) {
            return null
        }
        return value
    }
    return null
}

/** Extract the source repo name (under the org) from a lesson's body clone URLs. */
const repoFromLesson = (lessonDir) => {
    const bodiesDir = path.join(lessonDir, "bodies")
    if (!fs.existsSync(bodiesDir)) {
        return null
    }
    // greedy: grab the whole repo slug (hyphens included) up to a `/`, whitespace or EOL;
    // `.git` is in the char class so it gets captured then stripped below.
    const re = new RegExp(`github\\.com/${ORG}/([A-Za-z0-9._-]+)`, "i")
    for (const langDir of fs.readdirSync(bodiesDir)) {
        for (const file of ["vi.md", "en.md"]) {
            const p = path.join(bodiesDir, langDir, file)
            if (!fs.existsSync(p)) {
                continue
            }
            const match = re.exec(fs.readFileSync(p, "utf8"))
            if (match) {
                return match[1].replace(/\.git$/, "")
            }
        }
    }
    return null
}

/** Recursively collect lesson dirs (a dir with vi.md + a bodies/ subdir). */
const collectLessons = (dir, out) => {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
        return
    }
    const hasBody = fs.existsSync(path.join(dir, "bodies"))
    const hasMeta = fs.existsSync(path.join(dir, "vi.md"))
    if (hasBody && hasMeta) {
        out.push(dir)
        return
    }
    for (const entry of fs.readdirSync(dir)) {
        const child = path.join(dir, entry)
        if (entry.startsWith(".")) {
            continue
        }
        if (fs.statSync(child).isDirectory()) {
            collectLessons(child, out)
        }
    }
}

/** Snapshot every org repo's visibility via gh (one call). */
const fetchVisibility = () => {
    const raw = execSync(
        `gh repo list ${ORG} --limit 1000 --json name,visibility`,
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    )
    const map = new Map()
    for (const repo of JSON.parse(raw)) {
        map.set(repo.name, String(repo.visibility).toLowerCase())
    }
    return map
}

const lessons = []
for (const root of scanRoots) {
    collectLessons(path.resolve(root), lessons)
}

let visibility
try {
    visibility = fetchVisibility()
} catch (error) {
    console.error(`gh repo list failed (run \`gh auth login\`?): ${error.message}`)
    process.exit(2)
}

const issues = []
let checked = 0
for (const lessonDir of lessons) {
    const repo = repoFromLesson(lessonDir)
    if (!repo) {
        continue // no source repo referenced (theory-only lesson) — nothing to gate
    }
    const premiumRaw = readMeta(path.join(lessonDir, "vi.md"), "isPremium")
    const isPremium = premiumRaw === "true"
    const expected = isPremium ? "private" : "public"
    const actual = visibility.get(repo)
    checked += 1
    if (!actual) {
        issues.push({ kind: "MISSING_REPO", lesson: lessonDir, repo, isPremium, actual: null, expected })
    } else if (actual !== expected) {
        const kind = expected === "public" ? "FREE_BUT_PRIVATE" : "PREMIUM_BUT_PUBLIC"
        issues.push({ kind, lesson: lessonDir, repo, isPremium, actual, expected })
    }
}

if (asJson) {
    console.log(JSON.stringify({ checked, issueCount: issues.length, issues }, null, 2))
} else {
    console.log(`Checked ${checked} lesson source repos across ${lessons.length} lessons.`)
    if (issues.length === 0) {
        console.log("✓ All repo visibilities match isPremium (free→public, premium→private).")
    } else {
        console.log(`✗ ${issues.length} mismatch(es):`)
        for (const issue of issues) {
            const fix = issue.kind === "FREE_BUT_PRIVATE"
                ? "→ make PUBLIC"
                : issue.kind === "PREMIUM_BUT_PUBLIC"
                    ? "→ make PRIVATE"
                    : "→ repo not found"
            console.log(`  [${issue.kind}] ${issue.repo} (isPremium=${issue.isPremium}, vis=${issue.actual ?? "—"}) ${fix}`)
        }
        console.log(
            "\nFix: gh repo edit "
            + `${ORG}/<repo> --visibility <public|private> --accept-visibility-change-consequences`,
        )
    }
}

process.exit(issues.length > 0 ? 1 : 0)
