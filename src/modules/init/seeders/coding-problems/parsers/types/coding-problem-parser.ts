/** One per-language code item (`## <n>` -> `### lang` + `### content`). */
export interface RawLangCodeItem {
    /** Language string from `### lang`. */
    lang?: string
    /** Code string from `### content`. */
    content?: string
}

/** One IO item (`## <n>` -> `### input` + `### output`). */
export interface RawIoItem {
    /** Stdin string from `### input`. */
    input?: string
    /** Expected stdout string from `### output`. */
    output?: string
}

/** One topic tag item (`## <n>` -> `### value`) from a problem's `# tags`. */
export interface RawCodingProblemTag {
    /** Tag value string from `### value`. */
    value?: string
}

/** Shape produced by the markdown extractor for a problem `en.md`/`vi.md`. */
export interface RawCodingProblem extends Record<string, unknown> {
    /** Raw `# title` field. */
    title?: string
    /** Raw `# difficulty` field. */
    difficulty?: string
    /** Raw `# domain` field. */
    domain?: string
    /** Raw `# orderIndex` field. */
    orderIndex?: string
    /** Raw `# enabled` field. */
    enabled?: string
    /** Raw `# timeLimitMs` field. */
    timeLimitMs?: string
    /** Raw `# memoryLimitKb` field. */
    memoryLimitKb?: string
    /** Raw `# statement` field. */
    statement?: string
    /** Raw `# hint` field. */
    hint?: string
    /** Raw `# tags` items. */
    tags?: Array<RawCodingProblemTag>
    /** Raw `# starterCodes` per-language items. */
    starterCodes?: Array<RawLangCodeItem>
    /** Raw `# solutions` per-language items. */
    solutions?: Array<RawLangCodeItem>
    /** Raw `# example` IO items (public samples). */
    example?: Array<RawIoItem>
    /** Raw `# testcases` IO items (hidden judging cases). */
    testcases?: Array<RawIoItem>
}
