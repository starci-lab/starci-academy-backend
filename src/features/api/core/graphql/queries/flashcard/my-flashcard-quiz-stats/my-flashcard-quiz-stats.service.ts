import {
    Injectable,
} from "@nestjs/common"
import {
    UserFlashcardCourseStatsProjectionService,
    UserService,
} from "@modules/bussiness"
import type {
    ComputeMyFlashcardQuizStatsParams,
    MyFlashcardQuizStatsResultData,
} from "./types"

/** Fewer completed quiz sessions than this = "insufficient data" (mirrors `MIN_ATTEMPTS_FOR_STATS` on Mock Interview). */
const MIN_SESSIONS_FOR_STATS = 3

/**
 * Reads the viewer's flashcard quick-quiz ("Hỏi nhanh") stats for one course —
 * a trend line (coverage/XP over recent sessions), a per-tag coverage
 * breakdown, and a per-deck practice footprint. The heavy scan/fold over
 * `flashcard_quiz_sessions` + `flashcard_cards` runs ONLY in
 * `UserFlashcardCourseStatsProjectionService.recompute` (CQRS projection, CDC
 * on `flashcard_quiz_sessions`/`flashcard_review_sessions`) — this service is
 * a pure point-read (TTL lazy-refresh), never re-scans/folds inline (per
 * `.claude/be/rules/cqrs-no-inline-aggregate.md`).
 */
@Injectable()
export class MyFlashcardQuizStatsService {
    constructor(
        private readonly userService: UserService,
        private readonly userFlashcardCourseStatsProjectionService: UserFlashcardCourseStatsProjectionService,
    ) {}

    /**
     * Read the viewer's flashcard quick-quiz stats for one course.
     *
     * @param params - {@link ComputeMyFlashcardQuizStatsParams}
     * @returns the trend line, per-tag coverage, and per-deck footprint.
     *
     * @example
     * await service.compute({ userId, courseId })
     */
    async compute(
        {
            userId,
            courseId,
        }: ComputeMyFlashcardQuizStatsParams,
    ): Promise<MyFlashcardQuizStatsResultData> {
        // resolve (or lazily create) the SAME trial enrollment
        // startFlashcardQuizSession draws against, so the read is scoped to
        // the caller's own enrollment.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const stats = await this.userFlashcardCourseStatsProjectionService.getStats({
            enrollmentId: enrollment.id,
        })

        return {
            insufficientData: stats.completedSessionCount < MIN_SESSIONS_FOR_STATS,
            trend: stats.quizTrend,
            byTag: stats.quizByTag,
            byDeck: stats.quizByDeck,
            weakTagLinks: stats.weakTagLinks,
            hardCards: stats.quizHardCards,
            completedSessionCount: stats.completedSessionCount,
        }
    }
}
