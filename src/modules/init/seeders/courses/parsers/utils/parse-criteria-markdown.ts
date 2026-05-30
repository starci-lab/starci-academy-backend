/** Per-language prose of one criterion (from a `### N` block: `#### lang` + `#### body`). */
export interface ParsedCriterionLang {
    /** Programming language from `#### lang` (typescript/java/csharp/go). */
    lang: string
    /** Criterion prose (English) from `#### body`. */
    body: string
}

/** One parsed criterion (criterion-first): agnostic fields + its per-language prose. */
export interface ParsedCriterion {
    /** Zero-based order from the `# N` heading. */
    orderIndex: number
    /** Whether failing this criterion zeroes the whole submission (from `## critical`). */
    critical: boolean
    /** Points for this criterion (from `## score`) — used only to sum the rubric weight, not stored. */
    score: number
    /** Per-language prose variants (one per programming language). */
    langs: Array<ParsedCriterionLang>
}

const SEPARATOR_LINE_RE = /^\s*<!--\s*@starci\/seperator\s*-->\s*$/
const TOP_LEVEL_CRITERION_HEADING_RE = /^#\s+(\d+)\s*$/

interface HeadingSlice {
    key: string
    body: string
}

/**
 * Collects markdown headings at a fixed `#` depth.
 */
export const collectHeadings = (content: string, level: number): Array<HeadingSlice> => {
    const prefix = "#".repeat(level)
    const headingRe = new RegExp(`^${prefix}\\s+(\\S.*)$`,
        "gm")
    const headings: Array<{ key: string, pos: number }> = []
    let match: RegExpExecArray | null
    while ((match = headingRe.exec(content)) !== null) {
        headings.push({
            key: match[1].trim(),
            pos: match.index,
        })
    }
    return headings.map((heading, index) => {
        const lineEnd = content.indexOf("\n",
            heading.pos)
        const bodyStart = lineEnd === -1 ? content.length : lineEnd + 1
        const bodyEnd =
            index + 1 < headings.length ? headings[index + 1].pos : content.length
        return {
            key: heading.key,
            body: content.slice(bodyStart,
                bodyEnd),
        }
    })
}

/**
 * Returns delimiter-bounded inner content when wrapped by `@starci/seperator` markers.
 */
export const cutDelimiterBoundedContent = (sectionBody: string): {
    content: string
    bounded: boolean
} => {
    const lines = sectionBody.split("\n")
    const markerIndices: Array<number> = []
    for (let index = 0; index < lines.length; index += 1) {
        if (SEPARATOR_LINE_RE.test(lines[index])) {
            markerIndices.push(index)
        }
    }
    if (markerIndices.length < 2) {
        return {
            content: sectionBody.trim(),
            bounded: false,
        }
    }
    const inner = lines
        .slice(markerIndices[0] + 1,
            markerIndices[markerIndices.length - 1])
        .join("\n")
    return {
        content: inner,
        bounded: true,
    }
}

/**
 * Parses a scalar field (`## score`, `## critical`, `#### lang`, `#### body`).
 */
export const parseScalarField = (sectionBody: string): string => {
    const { content, bounded } = cutDelimiterBoundedContent(sectionBody)
    return bounded ? content.trim() : sectionBody.trim()
}

/**
 * Parses a numeric score from a criterion's `## score` section.
 */
export const parseScore = (sectionBody: string): number => {
    const raw = parseScalarField(sectionBody)
    return Number(raw) || 0
}

/**
 * Parses a boolean flag from a criterion's `## critical` section.
 */
export const parseCritical = (sectionBody: string): boolean => {
    return parseScalarField(sectionBody).toLowerCase() === "true"
}

/**
 * Parses a criterion-first grading rubric markdown file (`criterias/<n>/approach.md` or `outcome.md`):
 *
 * ```
 * # 0
 * ## body
 * ### 0
 * #### lang
 * <!-- @starci/seperator -->
 * typescript
 * <!-- @starci/seperator -->
 * #### body
 * <!-- @starci/seperator -->
 * ...
 * <!-- @starci/seperator -->
 * ## score
 * <!-- @starci/seperator -->
 * 10
 * <!-- @starci/seperator -->
 * ## critical
 * <!-- @starci/seperator -->
 * false
 * <!-- @starci/seperator -->
 * ```
 *
 * @param markdown - Raw rubric markdown content.
 * @returns One bucket per programming language (in first-seen order), each with its ordered items.
 */
export const parseCriteriaMarkdown = (
    markdown: string,
): Array<ParsedCriterion> => {
    // top-level `# N` headings = the criteria (filter out any non-numeric `# X`)
    const criterionSections = collectHeadings(markdown,
        1)
        .filter((section) => TOP_LEVEL_CRITERION_HEADING_RE.test(`# ${section.key}`))

    const criteria: Array<ParsedCriterion> = []
    for (const criterionSection of criterionSections) {
        const orderIndexMatch = TOP_LEVEL_CRITERION_HEADING_RE.exec(`# ${criterionSection.key}`)
        if (!orderIndexMatch) {
            continue
        }
        const orderIndex = Number.parseInt(orderIndexMatch[1],
            10)
        // `## body` (lang buckets) + `## score` + `## critical` live directly under the criterion
        const fieldSections = collectHeadings(criterionSection.body,
            2)
        const bodySection = fieldSections.find((section) => section.key === "body")
        const scoreSection = fieldSections.find((section) => section.key === "score")
        const criticalSection = fieldSections.find((section) => section.key === "critical")
        const score = scoreSection ? parseScore(scoreSection.body) : 0
        const critical = criticalSection ? parseCritical(criticalSection.body) : false
        // a criterion with no `## body` (no language prose) is skipped
        if (!bodySection) {
            continue
        }
        // each `### N` under `## body` is one programming-language variant
        const langBlocks = collectHeadings(bodySection.body,
            3)
        const langs: Array<ParsedCriterionLang> = []
        for (const langBlock of langBlocks) {
            // each lang block carries `#### lang` + `#### body`
            const langFields = collectHeadings(langBlock.body,
                4)
            const langField = langFields.find((section) => section.key === "lang")
            const bodyField = langFields.find((section) => section.key === "body")
            if (!langField || !bodyField) {
                continue
            }
            langs.push({
                lang: parseScalarField(langField.body),
                body: parseScalarField(bodyField.body),
            })
        }
        criteria.push({
            orderIndex,
            critical,
            score,
            langs,
        })
    }
    return criteria
}
