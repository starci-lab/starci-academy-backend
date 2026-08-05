import {
    Injectable,
} from "@nestjs/common"
import {
    UserFlashcardCourseStatsProjectionService,
} from "@modules/bussiness/projections/user-flashcard-course-stats/user-flashcard-course-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import type {
    ComputeMyFlashcardQuizStatsParams,
    MyFlashcardQuizStatsResultData,
} from "./types/my-flashcard-quiz-stats"

/** Fewer completed quiz sessions than this = "insufficient data" (mirrors `MIN_ATTEMPTS_FOR_STATS` on Mock Interview). */
const MIN_SESSIONS_FOR_STATS = 3

@Injectable()
/**
 * Reads the viewer's flashcard quick-quiz stats for one course --
 * the coverage-vs-target hero + weak-topic map that `FlashcardQuizStats`
 * renders (`stats-canonical-fold` -- 1 hero + 1 zone). The heavy scan/fold over
 * `flashcard_quiz_sessions` + `flashcard_cards` runs ONLY in
 * `UserFlashcardCourseStatsProjectionService.recompute` (CQRS projection, CDC
 * on `flashcard_quiz_sessions`/`flashcard_review_sessions`) -- this service is
 * a pure point-read (TTL lazy-refresh), never re-scans/folds inline (per
 * `.claude/be/rules/cqrs-no-inline-aggregate.md`).
 */
export class MyFlashcardQuizStatsService {
    constructor(
        private readonly userService: UserService,
        private readonly userFlashcardCourseStatsProjectionService: UserFlashcardCourseStatsProjectionService,
    ) {}

    /**
     * Read the viewer's flashcard quick-quiz stats for one course.
     *
     * @param params - {@link ComputeMyFlashcardQuizStatsParams}
     * @returns the insufficient-data gate, per-tag coverage, and concept coverage.
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
            byTag: stats.quizByTag,
            conceptCoverage: stats.conceptCoverage,
        }
    }
}
