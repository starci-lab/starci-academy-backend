import {
    Injectable,
} from "@nestjs/common"
import {
    UserFlashcardCourseStatsProjectionService,
    UserService,
} from "@modules/bussiness"
import type {
    ComputeMyFlashcardReviewStatsParams,
    MyFlashcardReviewStatsResultData,
} from "./types"

@Injectable()
/**
 * Reads the viewer's flashcard review stats for one course -- the
 * memory-health hero (mature/young retention) + weak-topic map that
 * `FlashcardReviewStats` renders (`stats-canonical-fold` -- 1 hero + 1 zone).
 *
 * Outcome aggregates (leech-focus / weak-tag / deck-retention) are read from
 * the SAME `UserFlashcardCourseStatsProjectionService` `MyFlashcardQuizStatsService`
 * reads (shared enrollment-keyed projection, course-scoped, CDC on both
 * `flashcard_quiz_sessions` and `flashcard_review_sessions`) -- no live
 * scan/fold at read time (per `.claude/be/rules/cqrs-no-inline-aggregate.md`).
 */
export class MyFlashcardReviewStatsService {
    constructor(
        private readonly userService: UserService,
        private readonly userFlashcardCourseStatsProjectionService: UserFlashcardCourseStatsProjectionService,
    ) {}

    /**
     * Read the viewer's flashcard review stats for one course.
     *
     * @param params - {@link ComputeMyFlashcardReviewStatsParams}
     * @returns the memory-health aggregates + weak-topic map.
     *
     * @example
     * await service.compute({ userId, courseId })
     */
    async compute(
        {
            userId,
            courseId,
        }: ComputeMyFlashcardReviewStatsParams,
    ): Promise<MyFlashcardReviewStatsResultData> {
        // resolve (or lazily create) the SAME trial enrollment
        // startFlashcardReviewSession draws against, so the read is scoped to
        // the caller's own enrollment (which already implies the course).
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        // outcome aggregates (leech-focus / weak-tag / deck-retention): point-read
        // the shared enrollment-keyed course-stats projection, NOT a live session
        // scan -- see the class doc.
        const {
            leechFocus,
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            deckRetention,
        } = await this.userFlashcardCourseStatsProjectionService.getStats({
            enrollmentId: enrollment.id,
        })

        return {
            leechFocus,
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            deckRetention,
        }
    }
}
