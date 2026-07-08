import {
    Injectable,
} from "@nestjs/common"
import {
    UserFlashcardCourseStatsProjectionService,
    UserFlashcardStatsProjectionService,
    UserService,
} from "@modules/bussiness"
import type {
    ComputeMyFlashcardReviewStatsParams,
    MyFlashcardReviewStatsResultData,
} from "./types"

/** Trailing window (VN-calendar days) shown in the daily-activity chart. */
const DAILY_ACTIVITY_DAYS = 90

/**
 * Reads the viewer's flashcard review ("Học thẻ") stats for one course — a
 * daily-activity series + a per-deck practice footprint — mirrors
 * `MyFlashcardQuizStatsService`, minus the `byTag` breakdown (review sessions
 * carry no per-card correctness breakdown).
 *
 * DAILY ACTIVITY is read from the CDC-fed `user_flashcard_stats` projection
 * ({@link UserFlashcardStatsProjectionService.getDailyActivity}, kept fresh by
 * the existing `flashcard_review_events` listener). Rationale (thầy
 * 2026-07-09: "sao phải compute mà k process với cdc?"): the old
 * cards-per-SESSION trend was near-constant (a session reviews the whole deck)
 * and re-aggregated live on every read — the platform convention for a
 * hot/read-repeated activity series is a CDC projection, and the review events
 * already stream through one. It is GLOBAL per-user (a habit signal, matching
 * the streak).
 *
 * BY-DECK is read from the SAME `UserFlashcardCourseStatsProjectionService`
 * `MyFlashcardQuizStatsService` reads (shared enrollment-keyed projection,
 * course-scoped, CDC on both `flashcard_quiz_sessions` and
 * `flashcard_review_sessions`) — no live scan/fold at read time (per
 * `.claude/be/rules/cqrs-no-inline-aggregate.md`).
 */
@Injectable()
export class MyFlashcardReviewStatsService {
    constructor(
        private readonly userService: UserService,
        private readonly userFlashcardStatsProjectionService: UserFlashcardStatsProjectionService,
        private readonly userFlashcardCourseStatsProjectionService: UserFlashcardCourseStatsProjectionService,
    ) {}

    /**
     * Read the viewer's flashcard review stats for one course.
     *
     * @param params - {@link ComputeMyFlashcardReviewStatsParams}
     * @returns the daily-activity series + per-deck footprint.
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
        // startFlashcardReviewSession draws against, so the per-deck footprint
        // is scoped to the caller's own enrollment (which already implies the
        // course).
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        // daily activity: point-read the CDC projection (global per-user), NOT
        // a live session scan — see the class doc.
        const dailyActivity = await this.userFlashcardStatsProjectionService.getDailyActivity({
            userId,
            days: DAILY_ACTIVITY_DAYS,
        })

        // per-deck footprint + due/mastery: point-read the shared
        // enrollment-keyed course-stats projection, NOT a live session scan —
        // see the class doc.
        const { reviewByDeck, dueToday, dueForecast, masteryBreakdown } =
            await this.userFlashcardCourseStatsProjectionService.getStats({
                enrollmentId: enrollment.id,
            })

        return {
            dailyActivity,
            byDeck: reviewByDeck,
            dueToday,
            dueForecast,
            masteryBreakdown,
        }
    }
}
