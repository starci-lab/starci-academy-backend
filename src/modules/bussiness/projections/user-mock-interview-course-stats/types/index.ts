import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one enrollment's mock-interview-course-stats projection row. */
export interface RecomputeUserMockInterviewCourseStatsParams {
    /** The enrollment (user × course) whose mock-interview stats to rebuild. */
    enrollmentId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Params for reading one enrollment's mock-interview-course stats. */
export interface UserMockInterviewCourseStatsParams {
    /** The enrollment whose mock-interview stats to read. */
    enrollmentId: string
}

/** One point on the overall-score trend line, oldest-of-the-recent-window first. */
export interface MockInterviewCourseStatsTrendPointData {
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
 */
export interface MockInterviewCourseStatsBreakdownItemData {
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
 * when it qualifies. Null when no entry qualifies.
 */
export interface MockInterviewCourseStatsWeakestData {
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
     * this" to. Null when no confident match exists.
     */
    matchedContentId: string | null
}

/**
 * One normalized-and-tallied recurring gap — `attempt.gaps[]` entries across
 * the scanned window, trimmed+lowercased for tallying so "Trade-off" and
 * "trade-off " count as the same recurring pattern; `text` keeps the
 * MOST-RECENTLY-SEEN casing (attempts are scanned newest-first) for display.
 */
export interface MockInterviewCourseStatsRecurringGapData {
    /** Display text for this recurring gap (most-recently-seen original casing). */
    text: string
    /** How many scanned attempts recorded this (normalized) gap. */
    count: number
}

/** How many sessions of each top-level mode the scanned window contains. */
export interface MockInterviewCourseStatsModeSplitData {
    /** Completed `mode="qna"` attempts in the scanned window. */
    qnaCount: number
    /** Completed `mode="design"` (or null-mode legacy) attempts in the scanned window. */
    designCount: number
}

/** How many scanned attempts landed in each coarse verdict band. */
export interface MockInterviewCourseStatsVerdictCountsData {
    /** Attempts graded "pass". */
    pass: number
    /** Attempts graded "borderline". */
    borderline: number
    /** Attempts graded "fail". */
    fail: number
}

/**
 * The full mock-interview-course-stats aggregate for one enrollment — mirrors
 * `MyMockInterviewStatsResultData` field-for-field so the read side is a pure
 * point-read (no re-deriving anything, including `insufficientData`, at read
 * time).
 */
export interface UserMockInterviewCourseStatsResult {
    /**
     * True when the scanned window has fewer than the minimum attempts
     * required for a trustworthy aggregate — every other field is empty/zero
     * when this is true (HONEST gate).
     */
    insufficientData: boolean
    /** Mode split across the scanned window. */
    modeSplit: MockInterviewCourseStatsModeSplitData
    /** Overall-score trend across the most recent attempts (bounded, oldest of the window first). */
    trend: Array<MockInterviewCourseStatsTrendPointData>
    /** Per-phase aggregate, `mode="design"` attempts only. */
    byPhase: Array<MockInterviewCourseStatsBreakdownItemData>
    /** Per-kind aggregate, `mode="qna"` attempts only. */
    byKind: Array<MockInterviewCourseStatsBreakdownItemData>
    /** Per-attribute aggregate (communication/structuredThinking/tradeoffAwareness), across EVERY attempt regardless of mode. */
    byAttribute: Array<MockInterviewCourseStatsBreakdownItemData>
    /** Per-seniority-level aggregate (junior/middle/senior), across EVERY attempt regardless of mode — `attempt.level` is null-skipped (no "any level" bucket). */
    byLevel: Array<MockInterviewCourseStatsBreakdownItemData>
    /**
     * Per-drawn-language aggregate — `mode="qna"` CODE questions only (those
     * whose seed carried `givenCodes`), scored per question and grouped by
     * the language the question was drawn in. Entries below the service's
     * min-sample guard (a language drawn once ever is noise, not a
     * comparison) are dropped.
     */
    byLanguage: Array<MockInterviewCourseStatsBreakdownItemData>
    /** Top recurring gaps across every scanned attempt's `gaps[]`, worst (most-frequent) first; only gaps seen ≥2 times qualify. */
    recurringGaps: Array<MockInterviewCourseStatsRecurringGapData>
    /** The single weakest phase/kind/attribute across all three axes, when it qualifies; null otherwise. */
    weakest: MockInterviewCourseStatsWeakestData | null
    /** Tally of `attempt.verdict` across the scanned window. */
    verdictCounts: MockInterviewCourseStatsVerdictCountsData
}

/**
 * CDC row from `mock_interview_attempts` — a new graded attempt carries
 * `enrollment_id` directly, no join needed to derive the recompute target.
 */
export interface MockInterviewAttemptCdcRow {
    /** The enrollment this attempt belongs to. */
    enrollment_id?: string
}
