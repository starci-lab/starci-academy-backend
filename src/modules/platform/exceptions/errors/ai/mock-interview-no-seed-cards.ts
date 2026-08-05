import type {
    AbstractExceptionMetadata,
} from "../abstract"
import {
    AbstractException,
} from "../abstract"

/** Metadata for the mock-interview no-seed-cards exception. */
export interface MockInterviewNoSeedCardsExceptionMetadata extends AbstractExceptionMetadata {
    /** Course that has zero flashcard cards seeded -- cannot run a Q&A-kind (theory/reasoning/scenario) session. */
    courseId: string
}

/**
 * Thrown by `MockInterviewSessionDrawService.draw` when a Q&A-kind
 * (theory/reasoning/scenario) session is requested for a course that has
 * ZERO flashcard cards seeded at all -- there is nothing to widen the pool to
 * (unlike a thin reached/level pool, which always falls through to "any
 * module at any level"). This should be rare in practice (every course today
 * ships 150 flashcard cards), but a course with no flashcard decks yet must
 * fail clearly rather than silently draw an empty session.
 */
export class MockInterviewNoSeedCardsException extends AbstractException {
    constructor({
        courseId,
        originalError,
    }: MockInterviewNoSeedCardsExceptionMetadata) {
        super(
            `Course ${courseId} has no flashcard cards seeded — cannot draw a Q&A-kind mock-interview session. Khóa học này chưa có bộ thẻ để phỏng vấn theo kiểu này.`, // vn-ok: vi-locale string emitted to clients
            "MOCK_INTERVIEW_NO_SEED_CARDS_EXCEPTION",
            {
                courseId,
                originalError,
            },
        )
    }
}
