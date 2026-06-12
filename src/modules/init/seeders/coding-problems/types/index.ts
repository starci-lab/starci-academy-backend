import type {
    CodingDifficulty,
    CodingDomain,
    CodingLanguage,
    Locale,
} from "@modules/databases"

/** A parsed testcase ready to persist. */
export interface ParsedCodingProblemTestcase {
    /** Evaluation order (sequential across example + hidden cases). */
    orderIndex: number
    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    sortIndex: number
    /** Stdin contents. */
    input: string
    /** Expected stdout contents. */
    expectedOutput: string
    /** Whether this case is a public sample (authored under `# example`). */
    isSample: boolean
}

/** A parsed per-language starter code entry. */
export interface ParsedCodingProblemStarterCode {
    /** Language of the starter code. */
    language: CodingLanguage
    /** The starter source. */
    code: string
}

/** A parsed per-language reference solution entry. */
export interface ParsedCodingProblemSolution {
    /** Language of the solution. */
    language: CodingLanguage
    /** The full reference solution source. */
    code: string
}

/** A parsed per-locale translation of title/statement. */
export interface ParsedCodingProblemTranslation {
    /** Locale of the translation. */
    locale: Locale
    /** Translated title. */
    title: string
    /** Translated statement (Markdown). */
    statement: string
}

/** A fully parsed problem assembled from one mount directory's `en.md`/`vi.md`. */
export interface ParsedCodingProblem {
    /** Stable URL slug (the problem folder name). */
    slug: string
    /** Difficulty tier. */
    difficulty: CodingDifficulty
    /** Primary interview topic domain. */
    domain: CodingDomain
    /** Display order. */
    orderIndex: number
    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    sortIndex: number
    /** Whether listable. */
    enabled: boolean
    /** Topic tags. */
    tags: Array<string>
    /** Per-run CPU time limit (ms). */
    timeLimitMs: number
    /** Per-run memory limit (kb). */
    memoryLimitKb: number
    /** Points awarded for a first clean solve (derived from difficulty). */
    points: number
    /** Default (English) title. */
    title: string
    /** Default (English) statement Markdown. */
    statement: string
    /** Testcases in evaluation order (public examples + hidden cases). */
    testcases: Array<ParsedCodingProblemTestcase>
    /** Starter code per supported language. */
    starterCodes: Array<ParsedCodingProblemStarterCode>
    /** Full reference solution per supported language. */
    solutions: Array<ParsedCodingProblemSolution>
    /** Non-default locale overrides (e.g. `vi`). */
    translations: Array<ParsedCodingProblemTranslation>
    /**
     * Localized approach hints per locale (legacy Elasticsearch-only index).
     * The heading format no longer authors hints, so this is always empty — kept
     * so the dormant hint indexer keeps compiling.
     */
    hints: Partial<Record<Locale, string>>
}
