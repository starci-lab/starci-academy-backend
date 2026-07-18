import type {
    EntityManager,
} from "typeorm"

/** Params for recomputing one enrollment's flashcard-course-stats projection row. */
export interface RecomputeUserFlashcardCourseStatsParams {
    /** The enrollment (user × course) whose flashcard stats to rebuild. */
    enrollmentId: string
    /** Caller's transaction manager (inline write path); omit for the read path. */
    entityManager?: EntityManager
}

/** Params for reading one enrollment's flashcard-course stats. */
export interface UserFlashcardCourseStatsParams {
    /** The enrollment whose flashcard stats to read. */
    enrollmentId: string
}

/** One point on the quick-quiz coverage/XP trend line, oldest-of-the-recent-window first. */
export interface FlashcardQuizTrendPointData {
    /** When the session behind this point completed. */
    completedAt: Date
    /** The session's coverage, 0..1 (0 when never snapshotted). */
    coverage: number
    /** XP granted for the session. */
    xpEarned: number
}

/** One technology tag's aggregate quiz coverage across the scanned sessions. */
export interface FlashcardQuizTagStatData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** Aggregate coverage for this tag across every scanned session's cards carrying it, 0..1. */
    coverage: number
}

/** One "hard" quiz card — a card the learner keeps under-answering (lowest per-card coverage), the quiz analogue of a review leech. */
export interface FlashcardQuizHardCardData {
    /** The card id (deep-link target). */
    cardId: string
    /** The card's question text (default-locale snapshot). */
    question: string
    /** Times this card was answered across the scanned quiz sessions (sample size). */
    attempts: number
    /** Times this card was answered with at least one blank wrong (coverage < 1). */
    wrongCount: number
    /** Aggregate coverage for this card = ΣcorrectBlanks / ΣtotalBlanks across attempts, 0..1 (ranking key). */
    coverage: number
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
}

/** One tag's most-recent weak-spot occurrence, carrying a study deep-link back to its source module/content. */
export interface FlashcardQuizWeakTagLinkData {
    /** The technology tag (e.g. "NestJS", "Redis"). */
    tag: string
    /** This tag's coverage on its most recent occurrence across the scanned sessions, 0..1. */
    coverage: number
    /** The single module this tag's cards map back to; null when the deck-to-module mapping was ambiguous. */
    moduleId: string | null
    /** The single content (lesson) this tag's cards map back to; null when the deck-to-content mapping was ambiguous. */
    contentId: string | null
}

/** One deck's aggregate quiz practice footprint across the scanned sessions. */
export interface FlashcardDeckStatData {
    /** The deck this aggregate is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Distinct scanned sessions that touched this deck (a deck answered twice in one session still counts once). */
    sessionCount: number
    /** Total card-answers (not unique cards) touching this deck across the scanned sessions. */
    cardsAnswered: number
    /** This deck's total card count. */
    totalCards: number
}

/** One deck's aggregate review footprint across the scanned sessions. */
export interface FlashcardReviewDeckStatData {
    /** The deck this aggregate is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Completed review sessions scanned for this deck. */
    sessionCount: number
    /** Total cards graded across every scanned session for this deck. */
    cardsReviewed: number
    /** This deck's current total card count. */
    totalCards: number
}

/** One day's forecasted due-card count, in the trailing 7-day-forward window. */
export interface FlashcardDueForecastPointData {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Cards due that day (0 = nothing due). */
    count: number
}

/** One "leech" card — a card the learner keeps grading Again (forgetting), most-forgotten first. */
export interface FlashcardLeechCardData {
    /** The card id (open it in the reviewer). */
    cardId: string
    /** The card's question text (default-locale snapshot — the reviewer re-localizes on open). */
    question: string
    /** How many times this card was graded Again (grade 0) across the scanned event window. */
    forgotCount: number
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
}

/** The single weakest technology tag by review retention (lowest recalled/total), or null when none qualifies. */
export interface FlashcardWeakReviewTagData {
    /** The technology tag (e.g. "NestJS"). */
    tag: string
    /** Retention for this tag = graded Good/Easy (>=2) / total graded, 0..100. */
    retention: number
    /** Total graded reviews of cards carrying this tag (sample size). */
    reviewCount: number
}

/**
 * One tag's full review-retention breakdown, worst-first — the un-truncated
 * sibling of {@link FlashcardWeakReviewTagData} (thầy 2026-07-17 stats-insight
 * redesign: "bỏ LIMIT 1" so the whole per-tag ranking is visible, not just the
 * single worst tag).
 */
export interface FlashcardWeakTagData {
    /** The technology tag (e.g. "NestJS"). */
    tag: string
    /** Retention for this tag = graded Good/Easy (>=2) / total graded, 0..100. */
    retention: number
    /** Distinct cards (not reviews) carrying this tag that were graded at least once. */
    cardCount: number
}

/** One deck's REVIEW retention (recalled/total), the outcome analogue of the footprint `reviewByDeck`. */
export interface FlashcardDeckRetentionData {
    /** The deck this retention is scoped to. */
    deckId: string
    /** The deck's title. */
    deckTitle: string
    /** Retention = graded Good/Easy (>=2) / total graded for this deck's cards, 0..100. */
    retention: number
    /** Total graded reviews for this deck's cards (sample size). */
    reviewCount: number
}

/** One VN-day's review retention — powers the "đang cải thiện?" trend line. */
export interface FlashcardRetentionTrendPointData {
    /** The VN-calendar day (`YYYY-MM-DD`). */
    date: string
    /** Retention that day = recalled/total, 0..100. */
    retention: number
    /** Reviews graded that day (sample size; 0 = no reviews, retention 0). */
    reviewCount: number
}

/**
 * A "leech FOCUS" card — the reason-tagged sibling of {@link FlashcardLeechCardData}
 * (thầy 2026-07-17: "9 thẻ ăn 30% lần Quên → viết lại"). Two distinct failure
 * shapes get a different fix: `lapsed` (the learner once recalled it fine,
 * then forgot — SUSPEND/rewrite the card) vs `stuckHard` (never forgets
 * outright, but never firms up to Good/Easy either — the CARD is probably
 * worded ambiguously).
 */
export interface FlashcardLeechFocusCardData {
    /** The card id (open it in the reviewer). */
    cardId: string
    /** The card's question text (default-locale snapshot). */
    question: string
    /** Owning deck id (deep-link target). */
    deckId: string
    /** Owning deck title (default-locale snapshot). */
    deckTitle: string
    /** Times this card exhibited its `reason` (Again-after-a-prior-recall count, or repeated-Hard count). */
    lapseCount: number
    /** `"lapsed"` = forgot after once recalling it; `"stuckHard"` = repeatedly graded Hard, never Again but never firms up either. */
    reason: "lapsed" | "stuckHard"
}

/**
 * Cards about to go overdue in the near term — the "sẽ quên" headline (thầy
 * 2026-07-17: "12 thẻ sẽ tuột trước Thứ 5"). `byDay` is the SAME 7-day-forward
 * series as {@link FlashcardDueForecastPointData} (no extra query); `count` is
 * just its first-2-days sum, the number worth a headline.
 */
export interface FlashcardForgetSoonData {
    /** Cards due within the next 2 days — the headline "sẽ quên sớm" count. */
    count: number
    /** How many days forward `byDay` covers. */
    horizonDays: number
    /** Per-VN-day due-card counts across the forward window (same series as `dueForecast`). */
    byDay: Array<FlashcardDueForecastPointData>
}

/** The single hour-of-day (VN time) with the best review retention, or null when no hour has enough samples. */
export interface FlashcardBestReviewHourData {
    /** Hour of day, 0..23 (VN local time). */
    hour: number
    /** Retention during this hour = recalled/total, 0..100. */
    retention: number
}

/** Completed quiz sessions bucketed by the `level` filter chosen at setup. */
export interface FlashcardDifficultyMixData {
    /** Sessions drawn with the Junior filter. */
    junior: number
    /** Sessions drawn with the Middle filter. */
    middle: number
    /** Sessions drawn with the Senior filter (Staff sessions fold in here too — the FE only has 3 buckets). */
    senior: number
}

/** How many of the course's technology tags the learner has attempted at least once, vs how many exist. */
export interface FlashcardConceptCoverageData {
    /** Distinct tags touched by at least one scanned quiz session's cards. */
    covered: number
    /** Distinct tags across every card in this course's decks. */
    total: number
}

/** The enrollment's card-maturity breakdown, by `repetitions` on `user_flashcard_reviews`. */
export interface FlashcardMasteryBreakdownData {
    /** Cards with `repetitions >= 2` — considered mastered. */
    mastered: number
    /** Cards reviewed at least once but not yet mastered (`repetitions` 0 or 1). */
    learning: number
    /** Cards in the course's decks never yet reviewed. */
    new: number
}

/**
 * The enrollment's card-maturity LADDER, by `interval_days` on
 * `user_flashcard_reviews` (thầy 2026-07-17 stats-insight redesign: "chỉ 8%
 * chín = tiến độ THẬT" — a coarser, interval-based cut than
 * {@link FlashcardMasteryBreakdownData}'s `repetitions`-based one).
 */
export interface FlashcardMaturityLadderData {
    /** `interval_days < 1`, OR never reviewed — freshly seen, not yet spaced out. */
    learning: number
    /** `1 <= interval_days <= 21` — spacing out, not yet long-term. */
    young: number
    /** `interval_days > 21` — committed to long-term memory. */
    mature: number
}

/**
 * The full flashcard-course-stats aggregate for one enrollment — shared by
 * BOTH the quick-quiz (`quizTrend`/`quizByTag`/`quizByDeck`) and review
 * (`reviewByDeck`/`dueToday`/`dueForecast`/`masteryBreakdown`) recap surfaces.
 */
export interface UserFlashcardCourseStatsResult {
    /** Quick-quiz coverage/XP trend across the most recent sessions (bounded, oldest of the window first). */
    quizTrend: Array<FlashcardQuizTrendPointData>
    /** Per-tag aggregate quiz coverage across the scanned sessions, ranked by coverage descending. */
    quizByTag: Array<FlashcardQuizTagStatData>
    /** Per-deck aggregate quiz practice footprint across the scanned sessions. */
    quizByDeck: Array<FlashcardDeckStatData>
    /** Weakest tags with a study deep-link, each tag's MOST RECENT occurrence, ranked coverage ascending. */
    weakTagLinks: Array<FlashcardQuizWeakTagLinkData>
    /** Cards the learner keeps under-answering in quizzes (lowest coverage), hardest first, bounded — the "câu hay sai" diagnosis. */
    quizHardCards: Array<FlashcardQuizHardCardData>
    /** Completed quiz sessions scanned (bounded by the service's session-scan cap) — drives the insufficient-data gate. */
    completedSessionCount: number
    /** Completed quiz sessions bucketed by their `level` filter (Staff folds into `senior`). */
    difficultyMix: FlashcardDifficultyMixData
    /** Distinct tags attempted vs distinct tags existing in this course, or null when the course has no tag data at all. */
    conceptCoverage: FlashcardConceptCoverageData | null
    /** Per-deck aggregate review footprint across the scanned sessions. */
    reviewByDeck: Array<FlashcardReviewDeckStatData>
    /** Cards due for review right now (`due_at <= now()`), scoped to this enrollment. */
    dueToday: number
    /** Cards due per VN-day across the next 7 days (zero-filled, tomorrow first). */
    dueForecast: Array<FlashcardDueForecastPointData>
    /** The enrollment's card-maturity breakdown (mastered / learning / new). */
    masteryBreakdown: FlashcardMasteryBreakdownData
    /** The enrollment's card-maturity LADDER (learning / young / mature), by `interval_days`. */
    maturityLadder: FlashcardMaturityLadderData
    /** Cards due within the next 2 days, out of the 7-day `dueForecast` window — the "sẽ quên sớm" headline. */
    forgetSoon: FlashcardForgetSoonData
    /** Cards the learner keeps forgetting (grade Again), most-forgotten first, bounded — the "cần ôn lại" hero. */
    leechCards: Array<FlashcardLeechCardData>
    /** Reason-tagged leech cards (lapsed vs stuck-on-Hard), worst first, bounded — the "viết lại" fix-list. */
    leechFocus: Array<FlashcardLeechFocusCardData>
    /** The single weakest tag by review retention, or null when none has enough samples. */
    weakReviewTag: FlashcardWeakReviewTagData | null
    /** EVERY tag's review retention, worst first (un-truncated sibling of `weakReviewTag`). */
    weakTags: Array<FlashcardWeakTagData>
    /** Review retention for cards with `interval_days >= 21` (recall on already-committed cards). */
    matureRetention: number
    /** Review retention for cards with `interval_days < 21` (recall while still spacing a card out). */
    youngRetention: number
    /**
     * Graded review events for THIS COURSE only (= mature + young totals of the
     * same split that feeds {@link matureRetention}). The course-scoped sibling of
     * the per-USER lifetime `totalReviewed` — the "Thống kê" tab is course-scoped,
     * so its empty-state floor must count THIS course's reviews, not the learner's
     * lifetime across every course (2026-07-17: a learner with reviews elsewhere but
     * none here used to clear the lifetime floor and get a hero built from foreign
     * numbers).
     */
    reviewedTotal: number
    /**
     * Review retention for THIS COURSE only (recalled/total over the same
     * course-scoped events {@link reviewedTotal} counts) — what the memory-health
     * hero must show, instead of the per-USER lifetime `retentionRate` that blends
     * every course together.
     */
    courseRetention: number
    /** The hour-of-day (VN time) with the best review retention, or null when no hour has enough samples. */
    bestReviewHour: FlashcardBestReviewHourData | null
    /** Per-deck review RETENTION (outcome), weakest first — the outcome analogue of `reviewByDeck` footprint. */
    deckRetention: Array<FlashcardDeckRetentionData>
    /** Per-VN-day review retention across the trailing window — the "đang cải thiện?" trend. */
    retentionTrend: Array<FlashcardRetentionTrendPointData>
}

/**
 * CDC row from either `flashcard_quiz_sessions` or `flashcard_review_sessions`
 * — both carry `enrollment_id` directly, no join needed to derive the
 * recompute target.
 */
export interface FlashcardCourseStatsSourceCdcRow {
    /** The enrollment this session row belongs to. */
    enrollment_id?: string
}
