import {
    RawInterviewQuestionCommonFields,
    RawInterviewQuestionRef,
} from "../../shared"

/** Re-exported for callers that only need the shared ref shape. */
export type {
    RawInterviewQuestionRef,
}

/**
 * A behavioral bank META document (`mock-interview-eq/{bank}/vi.md`) — questions
 * live in `questions/` folders. Unlike the technical bank file this has NO
 * `# moduleRefs` (the behavioral bank is global, never scoped to a course/module).
 */
export interface RawInterviewQuestionEqBank {
    /** Pure display-ordering index (falls back to the bank's folder ordinal). */
    sortIndex?: number
    /** Bank title — NOT persisted (no bank entity); read only for authoring context. */
    title?: string
    /** Bank description — NOT persisted. */
    description?: string
    /** Bank difficulty — NOT persisted. */
    difficulty?: string
    /** Index signature so the markdown->JSON extractor generic is satisfied. */
    [key: string]: unknown
}

/**
 * A single behavioral question document
 * (`mock-interview-eq/{bank}/questions/{index}-{slug}/vi.md`). Extends the fields
 * shared with the technical family, replacing `diagram`/`givenCodes` with the
 * behavioral-only `competency`/`ownershipSignal`.
 */
export interface RawInterviewQuestionEq extends RawInterviewQuestionCommonFields {
    /** EQ competency being probed — conflict/ownership/leadership/communication/growth. */
    competency?: string
    /** Grading note that forces the AI to score the "I" vs "we" ownership signal. */
    ownershipSignal?: string
}

/** Input for {@link InterviewQuestionEqIdFactoryService.generate}. There is no course to
 * anchor on (the behavioral bank is global) — the id hashes the bank + question ordinals only.
 */
export interface GenerateInterviewQuestionEqIdParams {
    /** Zero-based bank folder under `mock-interview-eq/{bankIndex}`. */
    bankIndex: number
    /** Zero-based question folder under `mock-interview-eq/{bank}/questions/{questionIndex}`. */
    questionIndex: number
}
