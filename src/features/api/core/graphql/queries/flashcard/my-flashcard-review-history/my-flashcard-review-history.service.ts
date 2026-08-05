import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    FlashcardReviewSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserService,
} from "@modules/bussiness"
import type {
    FindMyFlashcardReviewHistoryParams,
    MyFlashcardReviewHistoryResultData,
} from "./types"

@Injectable()
/**
 * Reads back the viewer's completed flashcard review sessions for
 * one course, newest first, so the recap/history surface can list past runs
 * without re-deriving anything -- mirrors `MyFlashcardQuizHistoryService`'s
 * structure (plain query service, no CQRS command bus), minus the
 * mode/level/coverage/weakTags snapshot fields (cloze-quiz-only concepts).
 */
export class MyFlashcardReviewHistoryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Lists a page of the viewer's completed flashcard review sessions for
     * one course (across every deck in it), newest first.
     *
     * @param params - {@link FindMyFlashcardReviewHistoryParams}
     * @returns the page of sessions + the total count for pagination.
     *
     * @example
     * await service.list({ userId, courseId, limit: 10, offset: 0 })
     */
    async list(
        {
            userId,
            courseId,
            limit,
            offset,
        }: FindMyFlashcardReviewHistoryParams,
    ): Promise<MyFlashcardReviewHistoryResultData> {
        // resolve (or lazily create) the SAME trial enrollment
        // startFlashcardReviewSession/reviewFlashcard draw against, so the
        // lookup is scoped to the caller's own enrollment (which already
        // implies the course -- a review session's deck always belongs to
        // this enrollment's course).
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const [
            sessions,
            totalCount,
        ] = await this.entityManager.findAndCount(
            FlashcardReviewSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    status: "completed",
                },
                relations: {
                    deck: true,
                },
                // newest completed session first -- matches the history's "recent attempts" framing
                order: {
                    updatedAt: "DESC",
                },
                take: limit,
                skip: offset,
            },
        )

        return {
            totalCount,
            items: sessions.map((session) => ({
                id: session.id,
                updatedAt: session.updatedAt,
                deckId: session.deckId,
                deckTitle: session.deck?.title ?? "",
                cardCount: session.cardIds.length,
                reviewedCount: session.reviewedCount,
                xpEarned: session.xpEarned,
            })),
        }
    }
}
