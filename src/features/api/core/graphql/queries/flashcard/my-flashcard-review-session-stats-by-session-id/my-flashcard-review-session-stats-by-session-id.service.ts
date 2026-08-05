import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
    IsNull,
    Not,
} from "typeorm"
import {
    FlashcardCardEntity,
    FlashcardDueReviewSessionEntity,
    FlashcardReviewEventEntity,
    FlashcardReviewSessionEntity,
    InjectPrimaryPostgreSQLEntityManager,
    UserFlashcardReviewEntity,
} from "@modules/databases"
import type {
    ComputeFirstReviewXpParams,
    ComputeWeakTagsParams,
    FindMyFlashcardReviewSessionStatsBySessionIdParams,
    FindNextDueAtParams,
    FlashcardReviewSessionWeakTag,
    MyFlashcardReviewSessionStatsBySessionIdResultData,
} from "./types"

/** XP granted per FIRST-EVER review of a card — mirrors `FLASHCARD_FIRST_REVIEW_XP` in `flashcard-review.service.ts`. */
const FLASHCARD_FIRST_REVIEW_XP = 2

/** How many weak-tag rows the recap surfaces (top-N most forgotten). */
const WEAK_TAG_LIMIT = 5

/**
 * Computes the per-session recap for ONE flashcard review session — resolved by
 * its id alone (either kind: single-deck "Học thẻ" review, or the cross-deck
 * due-review batch), owner-scoped via the session's enrollment, REGARDLESS of
 * status (a completed/abandoned session still resolves so a stale link shows
 * the real recap instead of silently starting a fresh session — the FE
 * resume-check reads `status` off this result).
 *
 * This is a per-viewer SINGLE-SESSION edge read (a recap fired once when a
 * session ends), bounded to that one session's handful of events/cards — the
 * same "per-viewer single-row edge check" exemption `MyMockInterviewAttemptBySessionService`
 * relies on (see `.claude/be/rules/cqrs-no-inline-aggregate.md`'s exception
 * list). It is NOT a hot/repeated dashboard aggregate, so it does not warrant a
 * CDC projection.
 */
@Injectable()
export class MyFlashcardReviewSessionStatsBySessionIdService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
    ) {}

    /**
     * Resolve + aggregate the recap for one review session.
     *
     * @param params - {@link FindMyFlashcardReviewSessionStatsBySessionIdParams}
     * @returns the computed recap, or `null` when the id is not found / not
     * owned by the caller (in EITHER session table).
     *
     * @example
     * await service.find({ userId, sessionId })
     */
    async find(
        {
            userId,
            sessionId,
        }: FindMyFlashcardReviewSessionStatsBySessionIdParams,
    ): Promise<MyFlashcardReviewSessionStatsBySessionIdResultData | null> {
        // Resolve the session in EITHER table (deck-review first, then the
        // cross-deck due-review batch), owner-scoped via enrollment.user — the
        // same two-table seam MyFlashcardReviewSessionBySessionIdResolver uses.
        // We read the entity directly (not the bussiness `findById` services)
        // because those drop `status`/`reviewedCount` from their result DTOs,
        // which this recap needs for the degraded fallback.
        const deckSession = await this.entityManager.findOne(
            FlashcardReviewSessionEntity,
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
        const dueSession = deckSession
            ? null
            : await this.entityManager.findOne(
                FlashcardDueReviewSessionEntity,
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

        const session = deckSession ?? dueSession
        if (!session) {
            return null
        }

        // Every event graded within this session, oldest-first (so the first
        // event per card, and the min/max timestamps, fall out of order).
        const events = await this.entityManager.find(
            FlashcardReviewEventEntity,
            {
                where: {
                    sessionId,
                    userId,
                },
                order: {
                    reviewedAt: "ASC",
                },
            },
        )

        // Per-grade tally (0=Again, 1=Hard, 2=Good, 3=Easy).
        const gradeCounts = {
            again: 0,
            hard: 0,
            good: 0,
            easy: 0,
        }
        for (const event of events) {
            switch (event.grade) {
            case 0:
                gradeCounts.again += 1
                break
            case 1:
                gradeCounts.hard += 1
                break
            case 2:
                gradeCounts.good += 1
                break
            case 3:
                gradeCounts.easy += 1
                break
            default:
                break
            }
        }

        // Degraded fallback: a legacy/untracked session has no events carrying
        // its id → trust the session entity's own reviewedCount snapshot so the
        // FE still renders the count-only recap.
        const reviewedCount = events.length > 0
            ? events.length
            : session.reviewedCount

        // Wall-clock span — needs at least two events to be meaningful.
        const durationSeconds = events.length >= 2
            ? Math.max(
                0,
                Math.round(
                    (events[events.length - 1].reviewedAt.getTime()
                        - events[0].reviewedAt.getTime()) / 1000,
                ),
            )
            : null

        const xpEarned = await this.computeFirstReviewXp({
            userId,
            sessionId,
            events,
        })

        const nextDueAt = await this.findNextDueAt({
            userId,
            cardIds: session.cardIds,
        })

        const weakTags = await this.computeWeakTags({
            events,
        })

        return {
            sessionId: session.id,
            status: session.status,
            reviewedCount,
            gradeCounts,
            durationSeconds,
            xpEarned,
            nextDueAt,
            weakTags,
        }
    }

    /**
     * XP granted by this session = `FLASHCARD_FIRST_REVIEW_XP` × the number of
     * cards whose FIRST-EVER review (across all of the user's events) happened
     * inside this session — mirroring the grant condition in
     * `flashcard-review.service.ts` (XP fires only on a card's absolute first
     * review). Typically 0 for a due-review of already-seen cards.
     */
    private async computeFirstReviewXp(
        {
            userId,
            sessionId,
            events,
        }: ComputeFirstReviewXpParams,
    ): Promise<number> {
        const cardIds = Array.from(new Set(events.map((event) => event.flashcardCardId)))
        if (cardIds.length === 0) {
            return 0
        }

        // Pull every event the user has for these cards, oldest-first, then keep
        // the earliest per card in JS — a card counts as a first-review of THIS
        // session iff its globally-earliest event carries this sessionId.
        const cardEvents = await this.entityManager.find(
            FlashcardReviewEventEntity,
            {
                where: {
                    userId,
                    flashcardCardId: In(cardIds),
                },
                order: {
                    reviewedAt: "ASC",
                },
            },
        )

        const earliestSessionByCard = new Map<string, string | null>()
        for (const event of cardEvents) {
            if (!earliestSessionByCard.has(event.flashcardCardId)) {
                earliestSessionByCard.set(event.flashcardCardId,
                    event.sessionId)
            }
        }

        let firstReviewCount = 0
        for (const earliestSessionId of earliestSessionByCard.values()) {
            if (earliestSessionId === sessionId) {
                firstReviewCount += 1
            }
        }

        return firstReviewCount * FLASHCARD_FIRST_REVIEW_XP
    }

    /**
     * Earliest upcoming `dueAt` among the session's DRAWN cards (the full
     * snapshotted set, not just the graded ones), or null when none is
     * scheduled.
     */
    private async findNextDueAt(
        {
            userId,
            cardIds,
        }: FindNextDueAtParams,
    ): Promise<Date | null> {
        if (cardIds.length === 0) {
            return null
        }

        const soonest = await this.entityManager.findOne(
            UserFlashcardReviewEntity,
            {
                where: {
                    userId,
                    flashcardCardId: In(cardIds),
                    dueAt: Not(IsNull()),
                },
                order: {
                    dueAt: "ASC",
                },
            },
        )

        return soonest?.dueAt ?? null
    }

    /**
     * Group this session's "Again" (grade 0) events by their card's `tags`,
     * counting one occurrence per event (a card forgotten twice contributes its
     * tags twice), then return the top {@link WEAK_TAG_LIMIT} tags
     * most-forgotten first.
     */
    private async computeWeakTags(
        {
            events,
        }: ComputeWeakTagsParams,
    ): Promise<Array<FlashcardReviewSessionWeakTag>> {
        const againEvents = events.filter((event) => event.grade === 0)
        if (againEvents.length === 0) {
            return []
        }

        const againCardIds = Array.from(new Set(againEvents.map((event) => event.flashcardCardId)))
        const cards = await this.entityManager.find(
            FlashcardCardEntity,
            {
                where: {
                    id: In(againCardIds),
                },
                select: {
                    id: true,
                    tags: true,
                },
            },
        )
        const tagsByCard = new Map<string, Array<string>>(
            cards.map((card) => [
                card.id,
                card.tags ?? [],
            ]),
        )

        const forgotCountByTag = new Map<string, number>()
        for (const event of againEvents) {
            const tags = tagsByCard.get(event.flashcardCardId) ?? []
            for (const tag of tags) {
                forgotCountByTag.set(tag,
                    (forgotCountByTag.get(tag) ?? 0) + 1)
            }
        }

        return Array.from(forgotCountByTag.entries())
            .map(([tag, forgotCount]) => ({
                tag,
                forgotCount,
            }))
            .sort((a, b) => b.forgotCount - a.forgotCount)
            .slice(0,
                WEAK_TAG_LIMIT)
    }
}
