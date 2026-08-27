import type {
    ClozeQuizPublicItem, ClozeQuizSelection
} from "@modules/bussiness/flashcard/cloze/cloze-contract"

/** Ownership scope for the current-session lookup. */
export interface FindMyInProgressFlashcardQuizSessionParams {
    userId: string
    courseId: string
}

/** Service result that never exposes a legacy row as playable. */
export type MyInProgressFlashcardQuizSessionResultData = {
    kind: "ACTIVE_V1"
    sessionId: string
    contractVersion: 1
    items: Array<ClozeQuizPublicItem>
    currentIndex: number
    answerState: Array<ClozeQuizSelection>
    answerVersion: number
    status: "in_progress"
    updatedAt: Date
    createdAt: Date
} | {
    kind: "RECOVER_TO_SETUP"
    reason: string
}
