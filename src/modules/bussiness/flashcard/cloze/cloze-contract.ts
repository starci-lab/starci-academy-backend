export const FLASHCARD_CLOZE_CONTRACT_VERSION = 1 as const

/** One canonical, normalized blank occurrence parsed from authored cloze text. */
export interface ParsedClozeBlank {
    blankId: string
    clozeIndex: number
    occurrence: number
    answer: string
    hint?: string
}

/** Parser output that preserves malformed fragments as literal text. */
export interface ParsedClozeCard {
    text: string
    blanks: Array<ParsedClozeBlank>
}

/** Public blank metadata required to render one drop target. */
export interface ClozeQuizBlank {
    blankId: string
    hint?: string
}

/** One opaque single-use word-bank token; its label is presentation-only. */
export interface ClozeQuizToken {
    tokenId: string
    label: string
}

/** Immutable server snapshot for one eligible card, including the hidden answer key. */
export interface ClozeQuizItemSnapshot {
    cardId: string
    question: string
    clozeText: string
    blanks: Array<ClozeQuizBlank>
    tokens: Array<ClozeQuizToken>
    answerKey: Record<string, string>
}

/** Safe client projection of a quiz item with the hidden answer key removed. */
export type ClozeQuizPublicItem = Omit<ClozeQuizItemSnapshot, "answerKey">

/** One session-bound assignment from a blank to an opaque token. */
export interface ClozeQuizSelection {
    blankId: string
    tokenId: string
}

/** Persisted authoritative result produced by server-side grading. */
export interface ClozeQuizScoreSnapshot {
    correctBlanks: number
    totalBlanks: number
    scorePercent: number
    xpEarned: number
    dailyCapReached: boolean
    completedAt: string
    readiness: {
        currentAvg: number
        threshold: number
        unlocked: boolean
    }
}

/** Remove hidden answer keys before a persisted session crosses the API boundary. */
export function toPublicQuizItems(
    items: Array<ClozeQuizItemSnapshot>,
): Array<ClozeQuizPublicItem> {
    return items.map((item) => ({
        cardId: item.cardId,
        question: item.question,
        clozeText: item.clozeText,
        blanks: item.blanks,
        tokens: item.tokens,
    }))
}
