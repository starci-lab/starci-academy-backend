/**
 * Client-measured behavioural telemetry for a coding submission, used to
 * estimate the likelihood the solution was pasted from an AI tool rather than
 * authored in the editor. All fields are optional (older clients omit them).
 */
export interface CodingClientTelemetry {
    /** Number of paste events into the editor during the attempt. */
    pasteCount?: number
    /** Largest single paste size in characters. */
    pasteSizeMax?: number
    /** Total keystrokes recorded in the editor. */
    keystrokeCount?: number
    /** Number of times the editor tab lost focus (possible AI-tab switching). */
    tabBlurCount?: number
    /** Elapsed time from opening the problem to submitting, in milliseconds. */
    timeOpenToSubmitMs?: number
}

/** Params for evaluating a submission's cheat likelihood. */
export interface EvaluateCodingTelemetryParams {
    /** The client-measured telemetry (may be undefined when not supplied). */
    telemetry?: CodingClientTelemetry
    /** Final submitted source length, used to normalise typing/paste ratios. */
    codeLength: number
}

/** Result of a cheat-likelihood evaluation. */
export interface EvaluateCodingTelemetryResult {
    /** Aggregate suspicion score in the range 0–100 (higher = more suspicious). */
    suspicionScore: number
    /** Whether the score crosses the review threshold. */
    flagged: boolean
    /** Human-readable reasons contributing to the score (for reviewer context). */
    reasons: Array<string>
}
