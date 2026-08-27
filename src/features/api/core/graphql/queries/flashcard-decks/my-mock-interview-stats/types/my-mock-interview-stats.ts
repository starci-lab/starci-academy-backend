/** Params for {@link import("../my-mock-interview-stats.service").MyMockInterviewStatsService.compute}. */
export interface ComputeMyMockInterviewStatsParams {
    /** Viewer whose stats are being aggregated. */
    userId: string
    /** Course to scope the aggregation to (resolves the same enrollment `startMockInterviewSession` draws against). */
    courseId: string
}

/** One point on the overall-score trend line, oldest-of-the-recent-window first. */
export interface MockInterviewStatsTrendPointData {
    /** The attempt's overall score, 0-100. */
    overallScore: number
}

/** One `design`-phase breakdown entry, aggregated across every scanned attempt that carries it. */
export interface MockInterviewStatsBreakdownItemData {
    /** The phase literal (design) this entry aggregates. */
    key: string
    /** Average score across every attempt carrying this key. */
    avgScore: number
    /** Average max across every attempt carrying this key (design phase maxes vary per session). */
    avgMax: number
    /** Count of attempts where this key's score/max ratio fell below the weak threshold. */
    weakCount: number
    /** Total attempts carrying this key. */
    attemptCount: number
}

/** How many sessions of each top-level mode the scanned window contains. */
export interface MockInterviewStatsModeSplitData {
    /** Completed `mode="qna"` attempts in the scanned window. */
    qnaCount: number
    /** Completed `mode="design"` (or null-mode legacy) attempts in the scanned window. */
    designCount: number
}

/** The viewer's aggregated mock-interview stats for one course. */
export interface MyMockInterviewStatsResultData {
    /**
     * True when the scanned window has fewer than the minimum attempts
     * required for a trustworthy aggregate -- every other field is empty/zero
     * when this is true (HONEST gate: never show a trend/breakdown derived
     * from too small a sample).
     */
    insufficientData: boolean
    /** Mode of the comparable latest-attempt cohort. */
    comparisonMode: string | null
    /** Level of the comparable latest-attempt cohort. */
    comparisonLevel: string | null
    /** Rubric version of the comparable latest-attempt cohort. */
    comparisonRubricVersion: string | null
    /** Mode split across the scanned window. */
    modeSplit: MockInterviewStatsModeSplitData
    /** Overall-score trend across the most recent attempts (bounded, oldest of the window first). */
    trend: Array<MockInterviewStatsTrendPointData>
    /** Per-phase aggregate, `mode="design"` attempts only. */
    byPhase: Array<MockInterviewStatsBreakdownItemData>
}
