import type {
    SubmissionType,
} from "../../../../enums"

/** Params for slicing markdown from a heading until the next same-level `#` heading. */
export interface ExtractBlockParams {
    /** Heading text without hashes, e.g. `"References"`. */
    key: string
    /** Full markdown document. */
    markdown: string
    /** Number of `#` characters for the target heading (default `1`). */
    numHashs?: number
}

/** Trimmed body under the requested heading, or `""` if missing. */
export type ExtractBlockResult = string

/** Params for parsing numbered `##` step sections. */
export interface ExtractStepsParams {
    markdown: string
    /** Heading depth for steps (default `2`). */
    numHashs?: number
}

/** One numbered step block under a challenge-style section. */
export interface MarkdownStep {
    /** Display order from the `## N.` heading. */
    orderIndex: number
    /** Step title. */
    title: string
    /** Step body. */
    body: string
}

export type ExtractStepsResult = Array<MarkdownStep>

/** Params for parsing `- Alias: url` lines. */
export interface ExtractReferencesParams {
    markdown: string
}

/** Parsed external link row from a bullet list. */
export interface MarkdownReference {
    alias: string
    url: string
    orderIndex: number
}

export type ExtractReferencesResult = Array<MarkdownReference>

/** Params for parsing `## (Type) Title` submission headings. */
export interface ExtractSubmissionsParams {
    markdown: string
}

/** Parsed submission slot from challenge markdown. */
export interface MarkdownSubmission {
    /** Submission type. */
    type: SubmissionType
    /** Submission title. */
    title: string
    /** Submission description. */
    description: string
    /** Submission order index. */
    orderIndex: number
    /** Submission prompts. */
    prompts: Array<MarkdownSubmissionPrompt>
}

export type ExtractSubmissionsResult = Array<MarkdownSubmission>

/** One rubric block parsed from `### N. Title (Xpts)` under a submission `##` block. */
export interface MarkdownSubmissionPrompt {
    /** Zero-based order: `N` from `### N.` minus one. */
    orderIndex: number
    score: number
    title: string
    /** Body under the heading until the next `###` or end of block. */
    text: string
}

/** One top-level `- item` bullet line. */
export interface MarkdownBulletListItem {
    /** Plain text lines from top-level `- item` bullets (no `- ` prefix). */
    text: string
    /** Index from the `-` bullet prefix. */
    orderIndex: number
}
/** Plain text lines from top-level `- item` bullets (no `- ` prefix). */
export type ExtractBulletListItemsResult = Array<MarkdownBulletListItem>

/** Params for parsing `# Q&A` → `## N. Question` blocks. */
export interface ExtractQnaItemsParams {
    /** Full course or module markdown; `Q&A` is found via {@link ExtractBlockParams.key}. */
    markdown: string
}

/** One FAQ pair under `# Q&A`. */
export interface MarkdownQnaItem {
    /** 1-based index from the `## N.` heading. */
    orderIndex: number
    question: string
    answer: string
}

export type ExtractQnaItemsResult = Array<MarkdownQnaItem>
