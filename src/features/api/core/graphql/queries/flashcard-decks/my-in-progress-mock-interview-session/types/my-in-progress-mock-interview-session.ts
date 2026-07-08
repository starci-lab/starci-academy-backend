/** One drawn flashcard-card seed question, read back for a resumable session. */
export interface MyInProgressMockInterviewSeedQuestion {
    /** The seed `flashcard_cards.id` (or `interview_questions.id` for a bank-sourced draw). */
    cardId: string
    /** The cognitive frame this ONE question is asked in ("theory" | "reasoning" | "scenario"). */
    kind: string
    /** Short title/snippet identifying the seed topic. */
    title: string
}

/** One synced transcript turn, read back for a resumable session. */
export interface MyInProgressMockInterviewSessionTurn {
    /** Who spoke this turn — "interviewer" or "candidate". */
    role: string
    /** Which of the 5 canonical interview phases this turn belongs to (mode="design" only). */
    phase: string
    /** The turn's Markdown content. */
    content: string
    /** 0-based index of the question this turn belongs to (mode="qna" only). */
    questionIndex?: number
    /** Set to "code" on an interviewer turn whose given code was seeded into the editable code tool. */
    artifactHint?: string
}

/** Params for {@link import("../my-in-progress-mock-interview-session.service").MyInProgressMockInterviewSessionService.find}. */
export interface FindMyInProgressMockInterviewSessionParams {
    /** Viewer whose in-flight session is being looked up. */
    userId: string
    /** Course to scope the lookup to (resolves the same enrollment `startMockInterviewSession` draws against). */
    courseId: string
}

/**
 * The learner's most recent RESUMABLE mock-interview session for one course —
 * "resume mock interview session" (2026-07-08). Null when there is none (no
 * draw was ever left in-flight, the last draw already graded/was abandoned,
 * or the last sync is older than the resume window).
 */
export interface MyInProgressMockInterviewSessionResult {
    /** Id of the persisted session draw — pass to `syncMockInterviewSessionTurns` / `gradeMockInterviewSession`. */
    sessionId: string
    /** The drawn prompt's id. */
    promptId: string
    /** The drawn prompt's localized title. */
    promptTitle: string
    /** Seniority level the draw was requested at, or null. */
    level: string | null
    /** The drawn prompt's difficulty tier. */
    difficulty: string
    /** Where the drawn prompt came from — "capstone" | "classic" | "flashcard" | "interview-bank". */
    source: string
    /** The top-level flow this session runs ("qna" | "design"). */
    mode: string | null
    /** The drawn flashcard-card seed questions, in ask order. Empty for mode="design". */
    seedQuestions: Array<MyInProgressMockInterviewSeedQuestion>
    /** The synced transcript so far, or null when no sync has happened yet. */
    turns: Array<MyInProgressMockInterviewSessionTurn> | null
    /** 0-based index of the "qna"-mode question the learner was on at the last sync. */
    questionIndex: number
    /** 0-based index of the "design"-mode phase the learner was on at the last sync. */
    phaseIndex: number
    /** When this session was last synced/updated. */
    updatedAt: Date
}
