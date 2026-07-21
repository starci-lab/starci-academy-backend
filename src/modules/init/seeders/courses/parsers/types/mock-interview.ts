/** Ordinals locating `courses/{course}/mock-interview/` on the course mount. */
export interface ParseMockInterviewBankManyParams {
    /** The relative path of the course. */
    courseRelativePath: string
    /** The index of the course. */
    courseIndex: number
    /** The owning course id (FK target). */
    courseId: string
}

/** One `# tags` / `# rubric` / `# followUps` / `# hints` / `# keywords` scalar list item. */
export interface RawMockInterviewListItem {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The item text. */
    value?: string
    /** Index signature so `MergeJsonResult` recognizes this as mergeable (attaches `translations`). */
    [key: string]: unknown
}

/** One `# langs` item (`## N` → `### lang` / `### givenCode`). */
export interface RawMockInterviewLang {
    /** Zero-based ordinal. */
    orderIndex: number
    /** Programming language of this variant (or `agnostic`). */
    lang?: string
    /** GIVEN code snippet for this language. */
    givenCode?: string
    /** Index signature so `MergeJsonResult` recognizes this as mergeable (attaches `translations`). */
    [key: string]: unknown
}

/**
 * One `# checklist` checkpoint (`## N` → `### text` / `### dimension` / `### critical` /
 * `### scoreBand`). English-only in both locales, so it carries no `translations`.
 */
export interface RawMockInterviewChecklistItem {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The checkpoint statement. */
    text?: string
    /** `technical` | `problemSolving` | `communication` | `testing`. */
    dimension?: string
    /** Whether missing this point should sink the answer. */
    critical?: boolean
    /** Points this checkpoint is worth; a question's checkpoints sum to 100. */
    scoreBand?: number
    /** Index signature so `MergeJsonResult` recognizes this as mergeable. */
    [key: string]: unknown
}

/**
 * One per-language body document (`<question>/bodies/{index}-{lang}/{en,vi}.md`) for a
 * code question — carries that stack's `prompt` + `givenCode` + `idealAnswer` (mirrors
 * lesson content `bodies/`; the parent question holds the shared rubric/tags/followUps).
 */
export interface RawMockInterviewBody {
    /** Programming language of this body (`typescript`|`java`|`csharp`|`go`). */
    lang?: string
    /** This stack's concrete prompt framing. */
    prompt?: string
    /** GIVEN code snippet for this language. */
    givenCode?: string
    /** This stack's ground-truth answer outline. */
    idealAnswer?: string
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** A bank META document (`<N>-bank/{en,vi}.md`) — questions live in `questions/` folders. */
export interface RawMockInterviewBank {
    /** Bank title (display-only, not persisted — no bank entity). */
    title?: string
    /** Bank description (display-only, not persisted — no bank entity). */
    description?: string
    /** Referenced module `displayId`s — resolves to `MockInterviewEntity.moduleId` (first match). */
    moduleRefs?: Array<RawMockInterviewListItem>
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** A single question document (`<bank>/questions/{index}-{slug}/{en,vi}.md`). */
export interface RawMockInterviewQuestion {
    /** `technical` | `behavioral`. */
    family?: string
    /** Cognitive frame — see `interview-answer.md` §2 for the 11-kind enum. */
    kind?: string
    /** `junior` | `middle` | `senior`. */
    tier?: string
    /** The interview question prompt (Markdown). */
    prompt?: string
    /** Authored ground-truth answer outline (technical only). */
    idealAnswer?: string
    /** Reasoning points that earn credit. */
    rubric?: Array<RawMockInterviewListItem>
    /** Coverage checkpoints — succeeds `rubric` as the grading anchor. */
    checklist?: Array<RawMockInterviewChecklistItem>
    /** Probe questions the interviewer may ask next. */
    followUps?: Array<RawMockInterviewListItem>
    /** Progressive hints. */
    hints?: Array<RawMockInterviewListItem>
    /** Coverage keywords (English-only, never translated). */
    keywords?: Array<RawMockInterviewListItem>
    /** Optional GIVEN diagram (mermaid). */
    diagram?: string
    /** Single-language GIVEN code (mutually exclusive with `# langs`). */
    givenCode?: string
    /** Language of `givenCode`. */
    givenLang?: string
    /** Per-language `givenCode` variants (mutually exclusive with `# givenCode`/`# givenLang`). */
    langs?: Array<RawMockInterviewLang>
    /** EQ competency (behavioral only). */
    competency?: string
    /** Grading note forcing the "I" vs "we" ownership check (behavioral only). */
    ownershipSignal?: string
    /** Free-form topic tags (English-only, never translated). */
    tags?: Array<RawMockInterviewListItem>
    /** Whether this question is premium (`# isPremium`), false by default. */
    isPremium?: boolean
    /** Display/draw order within the bank — falls back to the question folder ordinal. */
    sortIndex?: number
    /** Index signature so the markdown→JSON extractor generic is satisfied. */
    [key: string]: unknown
}
