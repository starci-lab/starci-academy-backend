/**
 * Removes legacy monorepo `.repo/` paths from System Design lesson markdown.
 * Rewrites clone/cd/Source blocks to per-module GitHub repos (module-N-slug).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(
    __dirname,
    "..",
    ".mount",
    "data",
    "courses",
    "1-system-design-mastery",
    "modules",
)

const REPO_IN_CD =
    /system-design-mastery-module-(\d+)-(\d+-[\w-]+)/

function walk(dir, out) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name)
        if (e.isDirectory()) {
            if (e.name === "challenges") continue
            walk(full, out)
        } else if (
            e.isFile() &&
            (e.name === "vi.md" || e.name === "en.md") &&
            full.includes(`${path.sep}contents${path.sep}`)
        ) {
            out.push(full)
        }
    }
}

function lessonSlugFromPath(filePath) {
    const parts = filePath.split(path.sep)
    const i = parts.indexOf("contents")
    return i >= 0 && parts[i + 1] ? parts[i + 1] : null
}

function buildSourceBlock(repoName, lessonSlug, locale) {
    const base = `https://github.com/StarCi-Academy/${repoName}`
    const lessonUrl = `${base}/tree/main/${lessonSlug}`
    const dockerUrl = `${lessonUrl}/.docker`
    if (locale === "vi") {
        return `Source: [StarCi-Academy/${repoName}](${base}) trên GitHub — thư mục bài học: [\`${lessonSlug}\`](${lessonUrl}); **Docker Compose** và file hands-on nằm trong [\`${lessonSlug}/.docker\`](${dockerUrl}).`
    }
    return `Source: [StarCi-Academy/${repoName}](${base}) on GitHub — lesson directory: [\`${lessonSlug}\`](${lessonUrl}); **Docker Compose** and hands-on files live under [\`${lessonSlug}/.docker\`](${dockerUrl}).`
}

function patchContent(text, filePath) {
    if (!text.includes(".repo") && !text.includes("system-design-mastery.git")) {
        return null
    }

    const locale = path.basename(filePath) === "vi.md" ? "vi" : "en"
    const lessonSlug = lessonSlugFromPath(filePath)
    if (!lessonSlug) return "no_lesson_slug"

    const cdMatch = text.match(
        /cd\s+system-design-mastery\/\.repo\/(system-design-mastery-module-\d+-\d+-[\w-]+)\/([\w-]+)\/\.docker/,
    )
    let repoName = cdMatch?.[1]
    if (!repoName) {
        const anyRepo = text.match(REPO_IN_CD)
        if (!anyRepo) return "no_repo_name"
        repoName = anyRepo[0]
    }

    let out = text

    out = out.replace(
        /git clone https:\/\/github\.com\/StarCi-Academy\/system-design-mastery\.git/g,
        `git clone https://github.com/StarCi-Academy/${repoName}.git`,
    )

    out = out.replace(
        /cd system-design-mastery\/\.repo\/system-design-mastery-module-\d+-\d+-[\w-]+\/[\w-]+\/\.docker/g,
        `cd ${repoName}/${lessonSlug}/.docker`,
    )

    out = out.replace(
        /^Source:.*$/m,
        buildSourceBlock(repoName, lessonSlug, locale),
    )

    if (out === text) return "no_change"
    return out
}

const files = []
walk(ROOT, files)

let updated = 0
const skipped = []

for (const full of files) {
    const content = fs.readFileSync(full, "utf8")
    const result = patchContent(content, full)
    if (result === null) continue
    if (typeof result === "string" && result.startsWith("no_")) {
        skipped.push({ full, reason: result })
        continue
    }
    fs.writeFileSync(full, result, "utf8")
    updated++
}

console.log(`Updated ${updated} files`)
if (skipped.length) {
    console.log(`Skipped ${skipped.length}:`)
    for (const s of skipped.slice(0, 20)) {
        console.log(`  ${s.reason}: ${s.full}`)
    }
}
