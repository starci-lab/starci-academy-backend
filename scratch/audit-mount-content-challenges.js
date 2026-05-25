/**
 * Audits mount course lesson, lesson-video, and challenge markdown.
 * Output: scratch/mount-structure-audit.json + scratch/MOUNT-STRUCTURE-AUDIT.md
 */

const fs = require("fs")
const path = require("path")

const REPO_ROOT = path.join(__dirname,
    "..")
const MOUNT_ROOT = path.join(REPO_ROOT,
    ".mount",
    "data",
    "courses")

const { MOUNT_SECTION_DELIMITER_LINE_RE } = require("./mount-delimiter")
const DELIMITER_RE = MOUNT_SECTION_DELIMITER_LINE_RE
const H1_RE = /^#\s+(\S+)\s*$/

const SCHEMAS = {
    lesson: {
        label: "Lesson (contents/<slug>/en|vi.md)",
        required: [
            "title",
            "description",
            "body",
            "references",
            "minutesRead",
            "isPremium",
        ],
        optional: [
            "codeExplaining",
            "codeImplementations",
        ],
    },
    lessonVideo: {
        label: "Lesson video (contents/.../lesson-videos/<slug>/en|vi.md)",
        required: [
            "title",
            "description",
            "caption",
            "url",
            "thumbnailUrl",
            "durationMs",
            "kind",
            "hostPlatform",
        ],
        optional: [],
    },
    challenge: {
        label: "Challenge (contents/.../challenges/<slug>/en|vi.md)",
        required: [
            "title",
            "description",
            "requirements",
            "outputs",
            "prerequisites",
            "steps",
            "references",
            "submissions",
            "difficulty",
            "score",
        ],
        optional: [],
    },
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

function listCourseMdFiles(dir) {
    const results = []
    if (!fs.existsSync(dir)) {
        return results
    }
    const walk = (current) => {
        for (const entry of fs.readdirSync(current,
            {
                withFileTypes: true,
            })) {
            const full = path.join(current,
                entry.name)
            if (entry.isDirectory()) {
                walk(full)
                continue
            }
            if (entry.name !== "en.md" && entry.name !== "vi.md") {
                continue
            }
            const relativePosix = path.relative(dir,
                full).replace(/\\/g,
                "/")
            const mountType = classifyMountMd(relativePosix)
            if (!mountType) {
                continue
            }
            results.push({
                full,
                mountType,
            })
        }
    }
    walk(dir)
    return results
}

function analyzeFile(filePath,
    mountType) {
    const schema = SCHEMAS[mountType]
    const raw = fs.readFileSync(filePath,
        "utf8")
    const lines = raw.replace(/^\uFEFF+/,
        "").split(/\r?\n/)
    const h1Sections = []
    let delimiterLineCount = 0
    let inFence = false

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith("```")) {
            inFence = !inFence
        }
        if (!inFence && DELIMITER_RE.test(line)) {
            delimiterLineCount += 1
        }
        const h1 = line.match(H1_RE)
        if (!inFence && h1) {
            h1Sections.push(h1[1])
        }
    }

    const allowed = new Set([
        ...schema.required,
        ...schema.optional,
    ])
    const missingSections = schema.required.filter((key) => !h1Sections.includes(key))
    const extraSections = [
        ...new Set(h1Sections.filter((key) => !allowed.has(key))),
    ]
    const duplicateSections = [
        ...new Set(
            h1Sections.filter((key,
                index) => h1Sections.indexOf(key) !== index),
        ),
    ]
    const usesDelimiter = delimiterLineCount > 0
    const orderMismatch = false

    return {
        relativePath: path.relative(REPO_ROOT,
            filePath).replace(/\\/g,
            "/"),
        locale: path.basename(filePath),
        mountType,
        schemaLabel: schema.label,
        h1Sections,
        missingSections,
        extraSections,
        duplicateSections,
        usesDelimiter,
        delimiterLineCount,
        orderMismatch,
        isCanonical: missingSections.length === 0 &&
            extraSections.length === 0 &&
            duplicateSections.length === 0,
    }
}

function collectPairMismatches(entries) {
    const byStem = new Map()
    for (const entry of entries) {
        const stem = entry.relativePath.replace(/\/(en|vi)\.md$/,
            "")
        const list = byStem.get(stem) ?? []
        list.push(entry)
        byStem.set(stem,
            list)
    }
    const mismatches = []
    for (const [
        stem,
        pair,
    ] of byStem) {
        if (pair.length < 2) {
            continue
        }
        const en = pair.find((p) => p.locale === "en.md")
        const vi = pair.find((p) => p.locale === "vi.md")
        if (!en || !vi) {
            continue
        }
        if (en.h1Sections.join("|") !== vi.h1Sections.join("|")) {
            mismatches.push({
                stem,
                en: en.h1Sections,
                vi: vi.h1Sections,
            })
        }
    }
    return mismatches
}

function groupByMountType(entries) {
    const grouped = {
    }
    for (const type of Object.keys(SCHEMAS)) {
        grouped[type] = entries.filter((e) => e.mountType === type)
    }
    return grouped
}

function loadFixedIssues() {
    const items = []
    const databasesPath = path.join(__dirname,
        "databases-section-removed.json")
    if (fs.existsSync(databasesPath)) {
        const manifest = JSON.parse(fs.readFileSync(databasesPath,
            "utf8"))
        items.push({
            issue: "Lesson `# databases` (System Design)",
            action: "Removed `# databases` block from mount (not seeded by content parser)",
            status: "fixed",
            fixedAt: manifest.removedAt,
            detail: `${manifest.count} files — scratch/databases-section-removed.json`,
        })
    }
    const remainingPath = path.join(__dirname,
        "mount-audit-fix-manifest.json")
    if (fs.existsSync(remainingPath)) {
        const manifest = JSON.parse(fs.readFileSync(remainingPath,
            "utf8"))
        items.push({
            issue: "Lesson `# isPremium`, delimiters, EN/VI; challenge delimiters/meta",
            action: "BOM strip, delimiter wrap, isPremium sync, challenge tail repair",
            status: "fixed",
            fixedAt: manifest.fixedAt,
            detail: `scratch/mount-audit-fix-manifest.json (isPremium: ${manifest.lessonIsPremium?.length ?? 0}, challenge delimiters: ${manifest.challengeDelimiters?.length ?? 0})`,
        })
    }
    return items
}

function buildMarkdownReport(report) {
    const fixedIssues = loadFixedIssues()
    const lines = [
        "# Mount structure audit (content + challenges)",
        "",
        `Generated: ${report.generatedAt}`,
        "",
    ]
    if (fixedIssues.length > 0) {
        lines.push("## Đã xử lý")
        lines.push("")
        lines.push("| Vấn đề | Hành động | Trạng thái | Chi tiết |")
        lines.push("|--------|-----------|------------|----------|")
        for (const item of fixedIssues) {
            lines.push(`| ${item.issue} | ${item.action} | **Đã fix** (${item.fixedAt.slice(0, 10)}) | ${item.detail} |`)
        }
        lines.push("")
    }
    lines.push("## Chuẩn tham chiếu")
    lines.push("")
    for (const [
        type,
        schema,
    ] of Object.entries(SCHEMAS)) {
        lines.push(`### ${schema.label}`)
        lines.push(`- Required \`# \`: ${schema.required.map((s) => `\`${s}\``).join(", ")}`)
        if (schema.optional.length > 0) {
            lines.push(`- Optional \`# \`: ${schema.optional.map((s) => `\`${s}\``).join(", ")}`)
        }
        lines.push("")
    }
    lines.push("- Delimiter mount: `<!-- @starci/seperator -->` bọc giá trị field.")
    lines.push("- Template thuần: `.mount/data/templates/content.md`, `challenge.md`.")
    lines.push("- Extract: `title` / `description` / `body` unwrap → string; không reconstruct làm chuẩn mount.")
    lines.push("")
    lines.push("## Tổng quan")
    lines.push("")
    lines.push("| Loại | Tổng file | Không chuẩn | Có delimiter | Không delimiter |")
    lines.push("|------|-----------|-------------|--------------|-----------------|")
    for (const row of report.byType) {
        lines.push(`| ${row.label} | ${row.total} | ${row.nonCanonical} | ${row.withDelimiter} | ${row.withoutDelimiter} |`)
    }
    lines.push(`| EN/VI lệch section | ${report.summary.enViSectionMismatches} cặp | | | |`)
    lines.push("")
    for (const section of [
        {
            title: "Lesson — thiếu section bắt buộc",
            key: "lessonMissing",
        },
        {
            title: "Lesson — section thừa (chưa hỗ trợ parser)",
            key: "lessonExtra",
        },
        {
            title: "Lesson — không có delimiter",
            key: "lessonNoDelimiter",
        },
        {
            title: "Lesson video — không chuẩn",
            key: "lessonVideoIssues",
        },
        {
            title: "Challenge — thiếu section bắt buộc",
            key: "challengeMissing",
        },
        {
            title: "Challenge — section thừa",
            key: "challengeExtra",
        },
        {
            title: "Challenge — không có delimiter",
            key: "challengeNoDelimiter",
        },
        {
            title: "EN/VI khác danh sách `#` section",
            key: "enViMismatches",
        },
    ]) {
        const items = report.lists[section.key]
        lines.push(`## ${section.title} (${items.length})`)
        lines.push("")
        if (items.length === 0) {
            lines.push("_Không có._")
            lines.push("")
            continue
        }
        const max = 80
        for (const item of items.slice(0,
            max)) {
            if (typeof item === "string") {
                lines.push(`- \`${item}\``)
                continue
            }
            if (item.stem) {
                lines.push(`- \`${item.stem}\``)
                lines.push(`  - en: ${item.en.join(", ")}`)
                lines.push(`  - vi: ${item.vi.join(", ")}`)
                continue
            }
            const details = [
                item.missingSections?.length ? `missing: ${item.missingSections.join(", ")}` : null,
                item.extraSections?.length ? `extra: ${item.extraSections.join(", ")}` : null,
                item.duplicateSections?.length ? `dup: ${item.duplicateSections.join(", ")}` : null,
            ].filter(Boolean).join("; ")
            lines.push(`- \`${item.relativePath}\`${details ? ` — ${details}` : ""}`)
        }
        if (items.length > max) {
            lines.push(`- _... và ${items.length - max} file khác (xem JSON)._`)
        }
        lines.push("")
    }
    return lines.join("\n")
}

function main() {
    const files = listCourseMdFiles(MOUNT_ROOT)
    const entries = files.map((f) => analyzeFile(f.full,
        f.mountType))
    const grouped = groupByMountType(entries)
    const enViSectionMismatches = collectPairMismatches(entries)

    const byType = Object.entries(SCHEMAS).map(([
        type,
        schema,
    ]) => {
        const list = grouped[type]
        return {
            type,
            label: schema.label,
            total: list.length,
            nonCanonical: list.filter((e) => !e.isCanonical).length,
            withDelimiter: list.filter((e) => e.usesDelimiter).length,
            withoutDelimiter: list.filter((e) => !e.usesDelimiter).length,
        }
    })

    const report = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalFiles: entries.length,
            enViSectionMismatches: enViSectionMismatches.length,
        },
        schemas: SCHEMAS,
        byType,
        issues: {
            lesson: grouped.lesson.filter((e) => !e.isCanonical),
            lessonVideo: grouped.lessonVideo.filter((e) => !e.isCanonical),
            challenge: grouped.challenge.filter((e) => !e.isCanonical),
        },
        lists: {
            lessonMissing: grouped.lesson.filter((e) => e.missingSections.length > 0),
            lessonExtra: grouped.lesson.filter((e) => e.extraSections.length > 0),
            lessonNoDelimiter: grouped.lesson.filter((e) => !e.usesDelimiter),
            lessonVideoIssues: grouped.lessonVideo.filter((e) => !e.isCanonical),
            challengeMissing: grouped.challenge.filter((e) => e.missingSections.length > 0),
            challengeExtra: grouped.challenge.filter((e) => e.extraSections.length > 0),
            challengeNoDelimiter: grouped.challenge.filter((e) => !e.usesDelimiter),
            enViMismatches: enViSectionMismatches,
        },
    }

    const jsonPath = path.join(__dirname,
        "mount-structure-audit.json")
    fs.writeFileSync(jsonPath,
        JSON.stringify({
            ...report,
            entries,
        },
        null,
        2))

    const mdPath = path.join(__dirname,
        "MOUNT-STRUCTURE-AUDIT.md")
    fs.writeFileSync(mdPath,
        buildMarkdownReport(report))

    console.log(`Wrote ${jsonPath}`)
    console.log(`Wrote ${mdPath}`)
    console.log(JSON.stringify({
        byType,
        enVi: enViSectionMismatches.length,
    },
    null,
    2))
}

main()
