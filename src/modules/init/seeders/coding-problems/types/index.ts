import type {
    CodingDifficulty,
    CodingDomain,
    CodingLanguage,
    Locale,
} from "@modules/databases"

/**
 * YAML frontmatter shape at the top of a problem's `en.md`. Drives every column
 * of the seeded problem plus which testcases are samples and the per-language
 * starter code.
 */
export interface CodingProblemFrontmatter {
    /** Stable URL slug (unique). */
    slug: string
    /** Difficulty tier (`easy` | `medium` | `hard`). */
    difficulty: CodingDifficulty
    /** Primary interview topic domain (used to group the list). */
    domain?: CodingDomain
    /** Display order within the problem list. */
    orderIndex?: number
    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    sortIndex?: number
    /** Whether the problem is listable. */
    enabled?: boolean
    /** Topic tags for filtering. */
    tags?: Array<string>
    /** Per-run CPU time limit in milliseconds. */
    timeLimitMs?: number
    /** Per-run memory limit in kilobytes. */
    memoryLimitKb?: number
    /** Default (English) title. */
    title: string
    /** Testcase order indices that are public samples (the rest are hidden). */
    samples?: Array<number>
    /** Map of language value → starter code string. */
    starterCodes?: Partial<Record<CodingLanguage, string>>
}

/** A parsed testcase ready to persist. */
export interface ParsedCodingProblemTestcase {
    /** Evaluation order (numeric stem of the `<n>.in`/`<n>.out` file). */
    orderIndex: number
    /** Pure ordering index used to reorder the list (decoupled from orderIndex). */
    sortIndex: number
    /** Stdin contents. */
    input: string
    /** Expected stdout contents. */
    expectedOutput: string
    /** Whether this case is a public sample. */
    isSample: boolean
}

/** A parsed per-language starter code entry. */
export interface ParsedCodingProblemStarterCode {
    /** Language of the starter code. */
    language: CodingLanguage
    /** The starter source. */
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

/** Result of splitting a markdown file into YAML frontmatter + body. */
export interface FrontmatterSplit<TData> {
    /** Parsed YAML frontmatter object. */
    data: TData
    /** Markdown body after the frontmatter block. */
    body: string
}

/** A fully parsed problem assembled from one mount directory. */
export interface ParsedCodingProblem {
    /** Stable URL slug. */
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
    /** Default (English) title. */
    title: string
    /** Default (English) statement Markdown. */
    statement: string
    /** Testcases in evaluation order. */
    testcases: Array<ParsedCodingProblemTestcase>
    /** Starter code per supported language. */
    starterCodes: Array<ParsedCodingProblemStarterCode>
    /** Non-default locale overrides (e.g. `vi`). */
    translations: Array<ParsedCodingProblemTranslation>
    /**
     * Localized "approach hint" markdown per locale (e.g. `en`, `vi`).
     * Indexed into Elasticsearch only — NEVER persisted to Postgres.
     */
    hints: Partial<Record<Locale, string>>
}
