/**
 * Fixes remaining mount audit issues:
 * - Strip BOM, truncate duplicate/corrupt challenge tails
 * - Lesson: add # isPremium (from sibling or false), wrap mount delimiters
 * - Challenge: wrap delimiters, add difficulty/score, merge codeImplementations → steps
 * Run: node scratch/fix-mount-audit-remaining.js
 */

const fs = require("fs")
const path = require("path")

const REPO_ROOT = path.join(__dirname,
    "..")
const MOUNT_ROOT = path.join(REPO_ROOT,
    ".mount",
    "data",
    "courses")

const {
    MOUNT_SECTION_DELIMITER_LINE,
    MOUNT_SECTION_DELIMITER_LINE_RE,
} = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_RE = /^#\s+(\S+)\s*$/

const LESSON_TOP_KEYS = new Set([
    "title",
    "description",
    "body",
    "codeExplaining",
    "codeImplementations",
    "references",
    "minutesRead",
    "isPremium",
])

const CHALLENGE_TOP_KEYS = new Set([
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
    "codeImplementations",
])

const DIFFICULTY_SCORE = {
    easy: 20,
    medium: 40,
    hard: 60,
}

const manifest = {
    fixedAt: new Date().toISOString(),
    bomStripped: [],
    truncated: [],
    lessonIsPremium: [],
    lessonDelimiters: [],
    challengeDelimiters: [],
    challengeMeta: [],
    challengeCodeImplMerged: [],
    challengeTruncated: [],
}

function stripBom(content) {
    const stripped = content.replace(/^\uFEFF+/,
        "")
    return {
        content: stripped,
        changed: stripped !== content,
    }
}

function classifyMountMd(relativePosix) {
    if (relativePosix.includes("/challenges/")) {
        return "challenge"
    }
    if (relativePosix.includes("/lesson-videos/")) {
        return "lessonVideo"
    }
    if (relativePosix.includes("/contents/")) {
        return "lesson"
    }
    return null
}

function listMountMdFiles() {
    const results = []
    const walk = (current,
        courseRelative) => {
        for (const entry of fs.readdirSync(current,
            {
                withFileTypes: true,
            })) {
            const full = path.join(current,
                entry.name)
            if (entry.isDirectory()) {
                walk(full,
                    courseRelative)
                continue
            }
            if (entry.name !== "en.md" && entry.name !== "vi.md") {
                continue
            }
            const relativePosix = path.relative(MOUNT_ROOT,
                full).replace(/\\/g,
                "/")
            const mountType = classifyMountMd(relativePosix)
            if (!mountType) {
                continue
            }
            results.push({
                full,
                relativePosix,
                mountType,
                locale: entry.name,
            })
        }
    }
    walk(MOUNT_ROOT,
        "")
    return results
}

function isTopLevelH1(line,
    keys) {
    const match = line.trim().match(H1_RE)
    if (!match) {
        return null
    }
    return keys.has(match[1]) ? match[1] : null
}

function findTopLevelSections(content,
    keys) {
    const lines = content.split(/\r?\n/)
    const sections = []
    let inFence = false
    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]
        const trimmed = line.trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
            continue
        }
        if (inFence) {
            continue
        }
        const key = isTopLevelH1(line,
            keys)
        if (key) {
            sections.push({
                key,
                start: index,
            })
        }
    }
    for (let index = 0; index < sections.length; index += 1) {
        const next = sections[index + 1]
        sections[index].end = next ? next.start : lines.length
        sections[index].bodyLines = lines.slice(sections[index].start + 1,
            sections[index].end)
    }
    return {
        lines,
        sections,
    }
}

function truncateCorruptChallenge(content) {
    const lines = content.split(/\r?\n/)
    const corruptIdx = lines.findIndex((line) => /m\s*=\s*#?\s*title/.test(line))
    if (corruptIdx >= 0) {
        return {
            content: lines.slice(0,
                corruptIdx).join("\n").trimEnd(),
            truncated: true,
            reason: "corrupt-marker",
        }
    }
    let titleCount = 0
    for (let index = 0; index < lines.length; index += 1) {
        if (/^#\s+title\s*$/.test(lines[index].trim())) {
            titleCount += 1
            if (titleCount === 2 && index > 5) {
                return {
                    content: lines.slice(0,
                        index).join("\n").trimEnd(),
                    truncated: true,
                    reason: "duplicate-title",
                }
            }
        }
    }
    return {
        content,
        truncated: false,
        reason: null,
    }
}

function bodyUsesDelimiter(bodyLines) {
    return bodyLines.some((line) => DELIMITER_RE.test(line))
}

function wrapSectionBody(bodyLines) {
    const trimmed = bodyLines.join("\n").trimEnd()
    if (!trimmed) {
        return [
            MOUNT_SECTION_DELIMITER_LINE,
            MOUNT_SECTION_DELIMITER_LINE,
        ]
    }
    if (bodyUsesDelimiter(bodyLines)) {
        return bodyLines
    }
    return [
        MOUNT_SECTION_DELIMITER_LINE,
        trimmed,
        MOUNT_SECTION_DELIMITER_LINE,
    ]
}

function rebuildWithDelimiters(content,
    keys) {
    const {
        sections,
    } = findTopLevelSections(content,
        keys)
    if (sections.length === 0) {
        return {
            content,
            changed: false,
        }
    }
    const hasAnyDelimiter = DELIMITER_RE.test(content)
    if (hasAnyDelimiter) {
        return {
            content,
            changed: false,
        }
    }
    const out = []
    for (const section of sections) {
        out.push(`# ${section.key}`)
        out.push(...wrapSectionBody(section.bodyLines))
        out.push("")
    }
    const rebuilt = out.join("\n").replace(/\n{3,}/g,
        "\n\n").trimEnd() + "\n"
    return {
        content: rebuilt,
        changed: true,
    }
}

function extractSectionRaw(content,
    key,
    keys) {
    const {
        sections,
    } = findTopLevelSections(content,
        keys)
    const section = sections.find((s) => s.key === key)
    if (!section) {
        return null
    }
    return section.bodyLines.join("\n").trim()
}

function removeSection(content,
    key,
    keys) {
    const {
        sections,
    } = findTopLevelSections(content,
        keys)
    const index = sections.findIndex((s) => s.key === key)
    if (index === -1) {
        return {
            content,
            removed: false,
        }
    }
    const start = sections[index].start
    const end = sections[index].end
    const lines = content.split(/\r?\n/)
    const next = [
        ...lines.slice(0,
            start),
        ...lines.slice(end),
    ]
    return {
        content: next.join("\n").replace(/\n{3,}/g,
            "\n\n").trimEnd(),
        removed: true,
        section: sections[index],
    }
}

function appendSection(content,
    key,
    body,
    useDelimiter) {
    const block = useDelimiter
        ? [
            "",
            `# ${key}`,
            MOUNT_SECTION_DELIMITER_LINE,
            body,
            MOUNT_SECTION_DELIMITER_LINE,
            "",
        ]
        : [
            "",
            `# ${key}`,
            body,
            "",
        ]
    const trimmed = content.trimEnd()
    return `${trimmed}${block.join("\n")}\n`
}

function inferDifficulty(filePath) {
    if (/-hard(\/|\\)/.test(filePath) || /-hard\.md$/.test(filePath)) {
        return "hard"
    }
    if (/-medium(\/|\\)/.test(filePath) || /-medium\.md$/.test(filePath)) {
        return "medium"
    }
    return "easy"
}

function mergeCodeImplementationsIntoSteps(content) {
    const removed = removeSection(content,
        "codeImplementations",
        CHALLENGE_TOP_KEYS)
    if (!removed.removed) {
        return {
            content,
            changed: false,
        }
    }
    const implBody = removed.section.bodyLines.join("\n").trim()
    if (!implBody) {
        return {
            content: removed.content.trimEnd() + "\n",
            changed: true,
        }
    }
    const {
        sections,
    } = findTopLevelSections(removed.content,
        CHALLENGE_TOP_KEYS)
    const steps = sections.find((s) => s.key === "steps")
    if (!steps) {
        return {
            content: removed.content,
            changed: false,
        }
    }
    const lines = removed.content.split(/\r?\n/)
    const insertAt = steps.end
    const maxStep = steps.bodyLines.reduce((max,
        line) => {
        const match = line.match(/^##\s+(\d+)\s*$/)
        if (!match) {
            return max
        }
        return Math.max(max,
            Number.parseInt(match[1],
                10))
    },
    -1)
    const nextIndex = maxStep + 1
    const graft = [
        "",
        `## ${nextIndex}`,
        implBody,
    ]
    const next = [
        ...lines.slice(0,
            insertAt),
        ...graft,
        ...lines.slice(insertAt),
    ]
    return {
        content: next.join("\n").trimEnd() + "\n",
        changed: true,
    }
}

function completeChallengeTail(content,
    filePath,
    useDelimiter) {
    let next = content
    let changed = false
    const hasDifficulty = extractSectionRaw(next,
        "difficulty",
        CHALLENGE_TOP_KEYS) !== null
    const hasScore = extractSectionRaw(next,
        "score",
        CHALLENGE_TOP_KEYS) !== null
    const difficulty = inferDifficulty(filePath)
    const score = String(DIFFICULTY_SCORE[difficulty] ?? 20)

    const submissionsSection = findTopLevelSections(next,
        CHALLENGE_TOP_KEYS).sections.find((s) => s.key === "submissions")
    if (submissionsSection) {
        const body = submissionsSection.bodyLines.join("\n")
        if (!/###\s+description/.test(body)) {
            const desc = "Submit your solution via the link below."
            const d = MOUNT_SECTION_DELIMITER_LINE
            const patch = useDelimiter
                ? `### description\n${d}\n${desc}\n${d}\n### score\n${d}\n${score}\n${d}`
                : `### description\n${desc}\n### score\n${score}`
            const lines = next.split(/\r?\n/)
            const insertAt = submissionsSection.end
            const graft = patch.split("\n")
            next = [
                ...lines.slice(0,
                    insertAt),
                ...graft,
                ...lines.slice(insertAt),
            ].join("\n")
            changed = true
        }
    }

    if (!hasDifficulty) {
        next = appendSection(next,
            "difficulty",
            difficulty,
            useDelimiter)
        changed = true
    }
    if (!hasScore) {
        next = appendSection(next,
            "score",
            score,
            useDelimiter)
        changed = true
    }
    return {
        content: next,
        changed,
    }
}

function fixLessonIsPremium(content,
    siblingContent) {
    const has = findTopLevelSections(content,
        LESSON_TOP_KEYS).sections.some((s) => s.key === "isPremium")
    if (has) {
        return {
            content,
            changed: false,
        }
    }
    const siblingValue = siblingContent
        ? extractSectionRaw(siblingContent,
            "isPremium",
            LESSON_TOP_KEYS)
        : null
    const value = (siblingValue ?? "false").trim() || "false"
    const useDelimiter = DELIMITER_RE.test(content) || DELIMITER_RE.test(siblingContent ?? "")
    return {
        content: appendSection(content,
            "isPremium",
            value,
            useDelimiter),
        changed: true,
    }
}

function processFile(file) {
    let content = fs.readFileSync(file.full,
        "utf8")
    const relativePath = `.mount/data/courses/${file.relativePosix}`
    let changed = false

    const bom = stripBom(content)
    if (bom.changed) {
        content = bom.content
        changed = true
        manifest.bomStripped.push(relativePath)
    }

    if (file.mountType === "challenge") {
        const trunc = truncateCorruptChallenge(content)
        if (trunc.truncated) {
            content = trunc.content
            changed = true
            manifest.challengeTruncated.push({
                path: relativePath,
                reason: trunc.reason,
            })
        }
    }

    const keys = file.mountType === "lesson"
        ? LESSON_TOP_KEYS
        : file.mountType === "challenge"
            ? CHALLENGE_TOP_KEYS
            : null

    if (!keys) {
        if (changed) {
            fs.writeFileSync(file.full,
                content.endsWith("\n") ? content : `${content}\n`)
        }
        return
    }

    if (file.mountType === "challenge") {
        const merged = mergeCodeImplementationsIntoSteps(content)
        if (merged.changed) {
            content = merged.content
            changed = true
            manifest.challengeCodeImplMerged.push(relativePath)
        }
    }

    const wrap = rebuildWithDelimiters(content,
        keys)
    if (wrap.changed) {
        content = wrap.content
        changed = true
        if (file.mountType === "lesson") {
            manifest.lessonDelimiters.push(relativePath)
        }
        else {
            manifest.challengeDelimiters.push(relativePath)
        }
    }

    const useDelimiter = DELIMITER_RE.test(content)

    if (file.mountType === "lesson") {
        const siblingPath = path.join(path.dirname(file.full),
            file.locale === "en.md" ? "vi.md" : "en.md")
        const siblingContent = fs.existsSync(siblingPath)
            ? stripBom(fs.readFileSync(siblingPath,
                "utf8")).content
            : null
        const premium = fixLessonIsPremium(content,
            siblingContent)
        if (premium.changed) {
            content = premium.content
            changed = true
            manifest.lessonIsPremium.push(relativePath)
        }
        if (file.locale === "vi.md" && siblingContent) {
            for (const key of [
                "references",
                "minutesRead",
            ]) {
                const has = findTopLevelSections(content,
                    LESSON_TOP_KEYS).sections.some((s) => s.key === key)
                const sib = extractSectionRaw(siblingContent,
                    key,
                    LESSON_TOP_KEYS)
                if (!has && sib) {
                    content = appendSection(content,
                        key,
                        sib,
                        useDelimiter)
                    changed = true
                }
            }
        }
    }

    if (file.mountType === "challenge") {
        const tail = completeChallengeTail(content,
            file.full,
            useDelimiter || DELIMITER_RE.test(content))
        if (tail.changed) {
            content = tail.content
            changed = true
            manifest.challengeMeta.push(relativePath)
        }
    }

    if (changed) {
        fs.writeFileSync(file.full,
            content.endsWith("\n") ? content : `${content}\n`)
    }
}

function main() {
    const files = listMountMdFiles()
    for (const file of files) {
        processFile(file)
    }
    const manifestPath = path.join(__dirname,
        "mount-audit-fix-manifest.json")
    fs.writeFileSync(manifestPath,
        JSON.stringify(manifest,
            null,
            2))
    console.log("Done. Manifest:", manifestPath)
    console.log(JSON.stringify({
        bomStripped: manifest.bomStripped.length,
        challengeTruncated: manifest.challengeTruncated.length,
        lessonIsPremium: manifest.lessonIsPremium.length,
        lessonDelimiters: manifest.lessonDelimiters.length,
        challengeDelimiters: manifest.challengeDelimiters.length,
        challengeMeta: manifest.challengeMeta.length,
        challengeCodeImplMerged: manifest.challengeCodeImplMerged.length,
    },
    null,
    2))
}

main()
