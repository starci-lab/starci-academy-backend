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
import type {
    FindMyFlashcardQuizSessionBySessionIdParams,
    MyFlashcardQuizSessionBySessionIdResultData,
} from "./types"

@Injectable()
/**
 * Resolves the recap for ONE flashcard quick-quiz ("Hỏi nhanh") session by its
 * id alone, owner-scoped via the session's enrollment.user, REGARDLESS of
 * status (a completed/abandoned/in_progress session all resolve — so a stale
 * link opened after the quiz ended shows the real recap instead of dead-ending
 * to a fresh setup; the FE resume-check reads `status` off this result).
 *
 * Reads the `FlashcardQuizSessionEntity` row DIRECTLY (not via
 * `FlashcardQuizSessionService`, which has no read-by-id method and whose
 * write-path DTOs drop the snapshotted fields) — everything the recap needs
 * (coverage, xpEarned, weakTags, results) is already persisted on the row at
 * completion time, so this is a pure single-row read with NO recompute. This is
 * a per-viewer SINGLE-SESSION edge read, the same "per-viewer single-row edge
 * check" exemption `MyFlashcardReviewSessionStatsBySessionIdService` relies on
 * (see `.claude/be/rules/cqrs-no-inline-aggregate.md`) — not a hot dashboard
 * aggregate, so no CDC projection is warranted.
 */
export class MyFlashcardQuizSessionBySessionIdService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Resolve the recap for one quiz session.
     *
     * @param params - {@link FindMyFlashcardQuizSessionBySessionIdParams}
     * @returns the resolved recap, or `null` when the id is not found / not
     * owned by the caller.
     *
     * @example
     * await service.find({ userId, sessionId })
     */
    async find(
        {
            userId,
            sessionId,
        }: FindMyFlashcardQuizSessionBySessionIdParams,
    ): Promise<MyFlashcardQuizSessionBySessionIdResultData | null> {
        // Resolve the session by id, owner-scoped via enrollment.user, with NO
        // status filter (completed/abandoned/in_progress all resolve).
        const session = await this.entityManager.findOne(
            FlashcardQuizSessionEntity,
            {
                where: {
                    id: sessionId,
                    enrollment: {
                        user: {
                            id: userId,
                        },
                    },
                },
            },
        )

        if (!session) {
            return null
        }

        const cardIds = session.cardIds ?? []
        const results = session.results ?? []
        const weakTags = session.weakTags ?? []

        // Count answered cards where EVERY cloze blank was correct.
        const fullyCorrectCount = results.filter(
            (result) => result.correctBlanks === result.totalBlanks,
        ).length

        // Wall-clock span from the row's own timestamps — null when the row was
        // never updated after creation (createdAt === updatedAt).
        const spanMs = session.updatedAt.getTime() - session.createdAt.getTime()
        const durationSeconds = spanMs > 0
            ? Math.round(spanMs / 1000)
            : null

        return {
            sessionId: session.id,
            status: session.status,
            mode: session.mode,
            level: session.level,
            coverage: session.coverage,
            xpEarned: session.xpEarned,
            cardCount: cardIds.length,
            answeredCount: results.length,
            fullyCorrectCount,
            durationSeconds,
            weakTags: weakTags.map((weakTag) => ({
                tag: weakTag.tag,
                coverage: weakTag.coverage,
                moduleId: weakTag.moduleId ?? null,
                contentId: weakTag.contentId ?? null,
            })),
            results: results.map((result) => ({
                cardId: result.cardId,
                correctBlanks: result.correctBlanks,
                totalBlanks: result.totalBlanks,
            })),
        }
    }
}
