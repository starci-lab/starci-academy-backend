import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    FlashcardQuizSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases"
import {
    UserService,
} from "@modules/bussiness"
import type {
    FindMyFlashcardQuizHistoryParams,
    MyFlashcardQuizHistoryResultData,
} from "./types"

/**
 * Reads back the viewer's completed flashcard quick-quiz ("Hỏi nhanh")
 * sessions, newest first, so the recap/history surface can list past runs
 * with the outcome each one already snapshotted at completion time (mode,
 * level, coverage, xpEarned, weakTags) — no re-derivation from `results` or a
 * join to `xp_histories`. Mirrors `MyMockInterviewAttemptsService`'s
 * structure (plain query service, no CQRS command bus).
 */
@Injectable()
export class MyFlashcardQuizHistoryService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly userService: UserService,
    ) {}

    /**
     * Lists a page of the viewer's completed flashcard quick-quiz sessions
     * for one course, newest first.
     *
     * @param params - {@link FindMyFlashcardQuizHistoryParams}
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
        }: FindMyFlashcardQuizHistoryParams,
    ): Promise<MyFlashcardQuizHistoryResultData> {
        // resolve (or lazily create) the SAME trial enrollment
        // startFlashcardQuizSession draws against, so the lookup is scoped to
        // the caller's own enrollment.
        const enrollment = await this.userService.resolveOrCreateTrialEnrollment(
            userId,
            courseId,
        )

        const [
            sessions,
            totalCount,
        ] = await this.entityManager.findAndCount(
            FlashcardQuizSessionEntity,
            {
                where: {
                    enrollment: {
                        id: enrollment.id,
                    },
                    status: "completed",
                },
                // newest completed session first — matches the history's "recent attempts" framing
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
                mode: session.mode,
                level: session.level,
                cardCount: session.cardIds.length,
                correctCount: (session.results ?? []).filter((result) => result.totalBlanks > 0 && result.correctBlanks >= result.totalBlanks).length,
                coverage: session.coverage,
                xpEarned: session.xpEarned,
                weakTags: session.weakTags ?? [],
            })),
        }
    }
}
