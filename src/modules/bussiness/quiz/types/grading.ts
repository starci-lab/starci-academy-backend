/** One answer submitted by the learner for a Test-mode card. */
export interface QuizTestAnswer {
    /** Id of the card being answered. */
    quizCardId: string
    /** Id of the option the learner selected. */
    selectedOptionId: string
}

/** Params for grading a whole Test-mode submission of a deck. */
export interface GradeQuizTestParams {
    /** Id of the learner submitting the test. */
    userId: string
    /** Id of the deck being tested. */
    quizDeckId: string
    /** The learner's answers, one per attempted card. */
    answers: Array<QuizTestAnswer>
}

/** Grading outcome for one card in a Test submission. */
export interface QuizTestCardResult {
    /** Id of the graded card. */
    quizCardId: string
    /** Option the learner selected. */
    selectedOptionId: string
    /** Id of the correct option for this card. */
    correctOptionId: string | null
    /** Whether the selected option matched the correct one. */
    correct: boolean
}

/** Aggregate result of grading a Test submission. */
export interface GradeQuizTestResult {
    /** Id of the graded deck. */
    quizDeckId: string
    /** Number of answers graded. */
    total: number
    /** Number of correct answers. */
    correct: number
    /** Percentage correct (0-100, rounded). */
    scorePercent: number
    /** Per-card grading breakdown. */
    results: Array<QuizTestCardResult>
}
