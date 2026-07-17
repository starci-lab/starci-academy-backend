/** Params for {@link import("../my-mock-interview-stats.service").MyMockInterviewStatsService.compute}. */
export interface ComputeMyMockInterviewStatsParams {
    /** Viewer whose stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startMockInterviewSession` draws against). */
    courseId: string
}

/** One point on the overall-score trend line, oldest-of-the-recent-window first. */
export interface MockInterviewStatsTrendPointData {
    /** When the attempt behind this point was graded. */
    completedAt: Date
    /** The attempt's overall score, 0-100. */
    overallScore: number
    /** The attempt's mode ("qna" | "design") — null-mode legacy attempts read as "design". */
    mode: string
    /** The attempt's coarse verdict band ("pass" | "borderline" | "fail"). */
    verdict: string
}

/**
 * One breakdown axis entry — either a `design` canonical phase or a `qna`
 * cognitive kind, aggregated across every scanned attempt that carries it.
 * `qna` breakdown groups by `questionReviews[].kind` (theory/reasoning/
 * scenario), NEVER by `phaseScores[].phase` — that field is a positional
 * label ("Câu 1", "Câu 2"...) that carries no meaning across different
 * sessions (question 1 of one session is a different topic than question 1
 * of another), so aggregating by it would silently produce nonsense.
 */
export interface MockInterviewStatsBreakdownItemData {
    /** The phase literal (design) or kind literal (qna) this entry aggregates. */
    key: string
    /** Average score across every attempt carrying this key. */
    avgScore: number
    /** Average max across every attempt carrying this key (design phase maxes vary per session; qna max is always 100). */
    avgMax: number
    /** Count of attempts where this key's score/max ratio fell below the weak threshold. */
    weakCount: number
    /** Total attempts carrying this key. */
    attemptCount: number
}

/**
 * The single weakest breakdown entry across BOTH axes (`byPhase` ∪ `byKind`),
 * when it qualifies (lowest score/max ratio AND weak often enough to be a
 * real pattern, not one bad day) — drives the "what to improve" callout.
 * Null when no entry qualifies (not enough weak occurrences yet, or no
 * breakdown data at all).
 */
export interface MockInterviewStatsWeakestData {
    /** The weak phase/kind literal. */
    key: string
    /** Which axis this key belongs to — drives the FE's i18n lookup (`mockInterview.phase.*` vs `mockInterview.kind.*` vs `mockInterview.attribute.*`). */
    axis: "phase" | "kind" | "attribute"
    /** Average score across every attempt carrying this key. */
    avgScore: number
    /** Average max across every attempt carrying this key. */
    avgMax: number
    /** Count of attempts where this key fell below the weak threshold. */
    weakCount: number
    /**
     * Best-effort matched course content (lesson) id to deep-link "study
     * this" to — resolved from the MOST RECENT attempt where this key was
     * weak (its `matchedContentIds[0]` for a phase, or its matching
     * `questionReviews[].matchedContentId` for a kind). Null when no
     * confident match exists — the FE must fall back to a generic course
     * link, never invent one.
     */
    matchedContentId: string | null
}

/** One normalized-and-tallied recurring gap across the viewer's scanned attempts, most-frequent first. */
export interface MockInterviewStatsRecurringGapData {
    /** Display text for this recurring gap (most-recently-seen original casing). */
    text: string
    /** How many scanned attempts recorded this (normalized) gap. */
    count: number
}

/** How many sessions of each top-level mode the scanned window contains. */
export interface MockInterviewStatsModeSplitData {
    /** Completed `mode="qna"` attempts in the scanned window. */
    qnaCount: number
    /** Completed `mode="design"` (or null-mode legacy) attempts in the scanned window. */
    designCount: number
}

/** How many scanned attempts landed in each coarse verdict band. */
export interface MockInterviewStatsVerdictCountsData {
    /** Attempts graded "pass". */
    pass: number
    /** Attempts graded "borderline". */
    borderline: number
    /** Attempts graded "fail". */
    fail: number
}

/** The viewer's aggregated mock-interview stats for one course. */
export interface MyMockInterviewStatsResultData {
    /**
     * True when the scanned window has fewer than the minimum attempts
     * required for a trustworthy aggregate — every other field is empty/zero
     * when this is true (HONEST gate: never show a trend/breakdown derived
     * from too small a sample).
     */
    insufficientData: boolean
    /** Mode split across the scanned window. */
    modeSplit: MockInterviewStatsModeSplitData
    /** Overall-score trend across the most recent attempts (bounded, oldest of the window first). */
    trend: Array<MockInterviewStatsTrendPointData>
    /** Per-phase aggregate, `mode="design"` attempts only. */
    byPhase: Array<MockInterviewStatsBreakdownItemData>
    /** Per-kind aggregate, `mode="qna"` attempts only (grouped by `questionReviews[].kind`, never by positional `phaseScores[].phase`). */
    byKind: Array<MockInterviewStatsBreakdownItemData>
    /** Per-attribute aggregate (communication/structuredThinking/tradeoffAwareness), across every attempt regardless of mode. */
    byAttribute: Array<MockInterviewStatsBreakdownItemData>
    /** Per-seniority-level aggregate (junior/middle/senior), across every attempt regardless of mode. */
    byLevel: Array<MockInterviewStatsBreakdownItemData>
    /** Per-drawn-language aggregate — `mode="qna"` code questions only, grouped by the language the question was drawn in; low-sample languages are dropped. */
    byLanguage: Array<MockInterviewStatsBreakdownItemData>
    /** Top recurring gaps across every scanned attempt's `gaps[]`, most-frequent first; only gaps seen at least twice qualify. */
    recurringGaps: Array<MockInterviewStatsRecurringGapData>
    /** The single weakest phase/kind/attribute across all three axes, when it qualifies; null otherwise. */
    weakest: MockInterviewStatsWeakestData | null
    /** Tally of the viewer's scanned attempts by coarse verdict band. */
    verdictCounts: MockInterviewStatsVerdictCountsData
}
