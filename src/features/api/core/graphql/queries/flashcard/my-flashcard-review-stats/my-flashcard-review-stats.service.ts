import {
    Injectable,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    UserFlashcardCourseStatsProjectionService,
} from "@modules/bussiness/projections/user-flashcard-course-stats/user-flashcard-course-stats-projection.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import type {
    ComputeMyFlashcardReviewStatsParams,
    MyFlashcardReviewStatsResultData,
} from "./types/my-flashcard-review-stats"

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
        @InjectPrimaryPostgreSQLEntityManager() private readonly entityManager: EntityManager,
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
            locale,
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

        const deckIds = [...new Set([
            ...deckRetention.map((item) => item.deckId),
            ...leechFocus.map((item) => item.deckId),
        ])]
        const cardIds = [...new Set(leechFocus.map((item) => item.cardId))]
        const deckRows: Array<{ id: string; value: string }> = deckIds.length === 0 ? [] : await this.entityManager.query(
            `SELECT flashcard_deck_id AS id, value
               FROM flashcard_deck_translations
              WHERE locale = $1
                AND field = 'title'
                AND flashcard_deck_id = ANY($2::uuid[])`,
            [locale,
                deckIds],
        )
        const cardRows: Array<{ id: string; value: string }> = cardIds.length === 0 ? [] : await this.entityManager.query(
            `SELECT flashcard_card_id AS id, value
               FROM flashcard_card_translations
              WHERE locale = $1
                AND field = 'question'
                AND flashcard_card_id = ANY($2::uuid[])`,
            [locale,
                cardIds],
        )
        const deckTitleById = new Map(deckRows.map((row) => [row.id,
            row.value]))
        const cardQuestionById = new Map(cardRows.map((row) => [row.id,
            row.value]))

        return {
            leechFocus: leechFocus.map((item) => ({
                ...item,
                question: cardQuestionById.get(item.cardId) ?? item.question,
                deckTitle: deckTitleById.get(item.deckId) ?? item.deckTitle,
            })),
            weakTags,
            matureRetention,
            youngRetention,
            reviewedTotal,
            courseRetention,
            deckRetention: deckRetention.map((item) => ({
                ...item,
                deckTitle: deckTitleById.get(item.deckId) ?? item.deckTitle,
            })),
        }
    }
}
