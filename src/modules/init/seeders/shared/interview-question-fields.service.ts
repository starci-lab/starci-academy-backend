import {
    Injectable,
} from "@nestjs/common"
import {
    CoerceMdScalarService,
} from "./extracts/coerce-md-scalar.service"

/** A single indexed-value item (`## N` sibling under an array-shaped section). */
export interface RawInterviewQuestionRef {
    /** Zero-based ordinal. */
    orderIndex: number
    /** The leaf value for this item. */
    value?: string
}

/**
 * Fields shared by BOTH mock-interview question families (technical + behavioral) --
 * the common subset of `# field` headings every question document carries regardless
 * of where it's mounted (`courses/{c}/mock-interview/` vs `mock-interview-eq/`).
 * Family-specific fields (`diagram`/`givenCodes` for technical; `competency`/
 * `ownershipSignal` for behavioral) are declared on top of this by each caller.
 */
export interface RawInterviewQuestionCommonFields {
    /** Pure display-ordering index (falls back to the question's folder ordinal). */
    sortIndex?: number
    /** Premium gate (`# isPremium`), false by default. */
    isPremium?: boolean
    /** `technical` | `behavioral`. */
    family?: string
    /** junior | middle | senior. */
    tier?: string
    /** Cognitive frame. */
    kind?: string
    /** Topic/technology tags (`# tags / ## N`). */
    tags?: Array<RawInterviewQuestionRef>
    /** The interview question prompt (Markdown, may contain inline code). */
    prompt?: string
    /** Reasoning points that earn credit (`# rubric / ## N`), each optionally `[category] ...`. */
    rubric?: Array<RawInterviewQuestionRef>
    /** Probe questions the interviewer may ask next (`# followUps / ## N`). */
    followUps?: Array<RawInterviewQuestionRef>
    /** Progressive hints (`# hints / ## N`). */
    hints?: Array<RawInterviewQuestionRef>
    /** Authored model answer/outline -- a `:::muted` sectioned leaf, stored verbatim. */
    idealAnswer?: string
    /** Raw `:::chip` leaf -- parsed into `Array<string>` by {@link InterviewQuestionFieldsService}. */
    keywords?: string
    /** Index signature so the markdown->JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/** The common column values parsed off {@link RawInterviewQuestionCommonFields}. */
export interface ParsedInterviewQuestionCommonFields {
    family: string
    kind: string
    tier: string | null
    prompt: string
    idealAnswer: string | null
    rubric: Array<string> | null
    followUps: Array<string> | null
    hints: Array<string> | null
    keywords: Array<string> | null
    tags: Array<string> | null
    sortIndex: number
    isPremium: boolean
    /** Always `"vi"` -- mock-interview questions are genuinely single-locale. */
    defaultLocale: string
}

@Injectable()
/**
 * Parses the `# field` headings shared by every mock-interview question document
 * (technical `courses/{c}/mock-interview/...` and behavioral `mock-interview-eq/...`)
 * into their common {@link MockInterviewEntity} column values. Family-specific
 * fields (technical `diagram`/`givenCode`/`langs`, behavioral `competency`/`ownershipSignal`)
 * are parsed separately by each caller.
 */
export class InterviewQuestionFieldsService {
    constructor(
        private readonly coerceMdScalarService: CoerceMdScalarService,
    ) { }

    /**
     * Parses the fields common to every mock-interview question family.
     *
     * @param raw - The extracted question document.
     * @param defaultFamily - Fallback `family` when `# family` is absent (each
     * caller's tree only ever authors one family, so this is just a safety net).
     * @param fallbackSortIndex - The question's folder ordinal, used when `# sortIndex`
     * is absent or not a finite number.
     */
    parseCommonFields(
        raw: RawInterviewQuestionCommonFields,
        defaultFamily: string,
        fallbackSortIndex: number,
    ): ParsedInterviewQuestionCommonFields {
        return {
            family: this.coerceMdScalarService.toRequiredString(raw.family,
                defaultFamily),
            kind: this.coerceMdScalarService.toRequiredString(raw.kind,
                ""),
            tier: this.coerceMdScalarService.toNullableStringColumn(raw.tier),
            prompt: this.coerceMdScalarService.toRequiredString(raw.prompt,
                ""),
            // `# idealAnswer` is a `:::muted`-sectioned leaf -- stored VERBATIM, the FE
            // renderer handles the directive; never strip/reshape it here
            idealAnswer: this.coerceMdScalarService.toNullableStringColumn(raw.idealAnswer),
            rubric: this.mapIndexedValues(raw.rubric),
            followUps: this.mapIndexedValues(raw.followUps),
            hints: this.mapIndexedValues(raw.hints),
            keywords: this.parseChipKeywords(raw.keywords),
            tags: this.mapIndexedValues(raw.tags),
            sortIndex: this.toSortIndex(raw.sortIndex,
                fallbackSortIndex),
            isPremium: this.coerceMdScalarService.toRequiredBoolean(raw.isPremium,
                false),
            defaultLocale: "vi",
        }
    }

    /**
     * Resolves the `# sortIndex` mount value (pure display order), falling back to
     * the supplied `fallback` (the entity's folder ordinal) when missing or not a
     * finite number.
     */
    private toSortIndex(raw: unknown, fallback: number): number {
        const value = typeof raw === "string" ? Number(raw.trim()) : Number(raw)
        return Number.isFinite(value) ? value : fallback
    }

    /**
     * Maps an ordered indexed-value section (`# tags/rubric/followUps/hints / ## N`) to
     * a trimmed jsonb string array, or `null` when the section is absent or every item
     * is blank.
     */
    private mapIndexedValues(items: Array<RawInterviewQuestionRef> | undefined): Array<string> | null {
        if (!items) {
            return null
        }
        const values = items
            .map((item) => (item.value ?? "").trim())
            .filter((value) => value.length > 0)
        return values.length > 0 ? values : null
    }

    /**
     * Parses the `# keywords` `:::chip` leaf into a jsonb string array: strips the
     * opening `:::chip` marker and the trailing `:::` marker, trims each remaining
     * line, and drops blank lines.
     */
    private parseChipKeywords(raw: string | undefined): Array<string> | null {
        const asString = this.coerceMdScalarService.toNullableString(raw)
        if (!asString) {
            return null
        }
        let lines = asString.split("\n").map((line) => line.trim())
        if (lines[0]?.toLowerCase() === ":::chip") {
            lines = lines.slice(1)
        }
        if (lines[lines.length - 1] === ":::") {
            lines = lines.slice(0,
                -1)
        }
        const values = lines.map((line) => line.trim()).filter((line) => line.length > 0)
        return values.length > 0 ? values : null
    }
}
