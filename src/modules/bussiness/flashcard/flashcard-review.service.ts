import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardCardEntity,
    FlashcardDeckEntity,
    FlashcardDeckResolverService,
    FlashcardReviewEventEntity,
    InjectPrimaryPostgreSQLEntityManager,
    Locale,
    UserFlashcardReviewEntity,
} from "@modules/databases"
import {
    FlashcardCardNotFoundException,
} from "@modules/exceptions"
import type {
    ApplySm2Params,
    ApplySm2Result,
    DueCardIdRow,
    DueFlashcard,
    DueFlashcardsResult,
    FlashcardNextIntervals,
    ListDueFlashcardsParams,
    ReviewFlashcardParams,
    ReviewFlashcardResult,
} from "./types/flashcard-review"

/** Default SM-2 scheduling state for a card the viewer has never reviewed. */
const NEW_CARD_STATE: Omit<ApplySm2Params, "grade"> = {
    prevEase: 2.5,
    prevInterval: 0,
    prevRepetitions: 0,
}

/** SM-2 grade value for "Again" (a lapse → reset). */
const GRADE_AGAIN = 0

/** Lower bound the SM-2 easiness factor may never drop below. */
const EASE_FLOOR = 1.3

/**
 * Spaced-repetition (SM-2) read + write for flashcards. {@link listDue} serves
 * the viewer's due-card queue (no review row yet OR past its `dueAt`) across all
 * decks — enrollment is NOT required, so trial viewers can review too; {@link review}
 * applies an SM-2 grade and upserts the per-(user, card) review row.
 */
@Injectable()
export class FlashcardReviewService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly flashcardDeckResolver: FlashcardDeckResolverService,
    ) {}

    /**
     * List the viewer's due flashcards. A card is due when it has no review row
     * yet OR its review `dueAt <= now()`, and its deck belongs to a course the
     * viewer is enrolled in. Returns the total due count plus the first `limit`
     * cards, localized to the request locale.
     *
     * @param params - {@link ListDueFlashcardsParams}
     * @returns the due count + first page of localized cards.
     */
    async listDue(
        {
            userId,
            limit,
            locale,
        }: ListDueFlashcardsParams,
    ): Promise<DueFlashcardsResult> {
        // build the shared "due cards" query: card → deck, and either no review row
        // exists for this user or it is past due. Enrollment is NOT required — trial
        // (non-enrolled) viewers can review flashcards too, so there is no enrollment join.
        const baseQuery = this.entityManager
            .createQueryBuilder(FlashcardCardEntity,
                "card")
            .innerJoin(FlashcardDeckEntity,
                "deck",
                "deck.id = card.flashcard_deck_id")
            .leftJoin(
                UserFlashcardReviewEntity,
                "review",
                "review.flashcard_card_id = card.id AND review.user_id = :userId",
                {
                    userId,
                },
            )
            .where("(review.id IS NULL OR review.due_at <= now())")

        // total due count (full, independent of the page limit)
        const dueCount = await baseQuery.clone().getCount()

        // first page of due card ids — stable order (new cards first via NULLS
        // FIRST on due_at, then oldest-due, tie-broken by id)
        const rows = await baseQuery
            .clone()
            .select("card.id",
                "card_id")
            // carry the prior review state so we can preview each grade's interval
            .addSelect("review.ease",
                "review_ease")
            .addSelect("review.intervalDays",
                "review_interval_days")
            .addSelect("review.repetitions",
                "review_repetitions")
            .orderBy("review.due_at",
                "ASC",
                "NULLS FIRST")
            .addOrderBy("card.id",
                "ASC")
            .limit(limit)
            .getRawMany<DueCardIdRow>()

        const cardIds = rows.map((row) => row.card_id)
        // map each due card to its prior SM-2 state (defaults for a brand-new card)
        const priorByCardId = new Map<string, Omit<ApplySm2Params, "grade">>()
        for (const row of rows) {
            priorByCardId.set(row.card_id,
                {
                    prevEase: row.review_ease ?? NEW_CARD_STATE.prevEase,
                    prevInterval: row.review_interval_days ?? NEW_CARD_STATE.prevInterval,
                    prevRepetitions: row.review_repetitions ?? NEW_CARD_STATE.prevRepetitions,
                })
        }
        if (cardIds.length === 0) {
            return {
                dueCount,
                cards: [],
            }
        }

        // load the full card graph (deck + both their translations) for the page
        const cards = await this.entityManager.find(
            FlashcardCardEntity,
            {
                where: {
                    id: In(cardIds),
                },
                relations: {
                    deck: {
                        translations: true,
                    },
                    translations: true,
                },
            },
        )
        // localize each card via its deck (the deck resolver localizes the deck
        // title AND recurses into the card front/back). Localize once per distinct
        // deck so a shared deck is not transformed twice.
        const localizedDeckTitleById = new Map<string, string>()
        const cardById = new Map<string, FlashcardCardEntity>()
        for (const card of cards) {
            const deck = card.deck
            if (deck && !localizedDeckTitleById.has(deck.id)) {
                // clone-free in-place localize: load just THIS card under the deck so
                // the resolver localizes both the deck title and the card text
                deck.cards = [
                    card,
                ]
                this.flashcardDeckResolver.transform(
                    deck,
                    locale,
                    deck.defaultLocale ?? Locale.En,
                )
                localizedDeckTitleById.set(deck.id,
                    deck.title)
            }
            cardById.set(card.id,
                card)
        }

        // preserve the due-order page ordering (find does not guarantee it)
        const localized: Array<DueFlashcard> = cardIds
            .map((id) => cardById.get(id))
            .filter((card): card is FlashcardCardEntity => Boolean(card))
            .map((card) => ({
                cardId: card.id,
                deckTitle: card.deck
                    ? (localizedDeckTitleById.get(card.deck.id) ?? card.deck.title)
                    : "",
                front: card.question,
                back: card.answer ?? "",
                nextIntervals: this.previewIntervals(
                    priorByCardId.get(card.id) ?? NEW_CARD_STATE,
                ),
            }))
        return {
            dueCount,
            cards: localized,
        }
    }

    /**
     * Apply an SM-2 grade to a card for a user and upsert the review row.
     *
     * SM-2: on Again (0) reset repetitions to 0 and interval to 1 day; otherwise
     * repetitions++, ease = max(1.3, ease + (0.1 - (3-grade)*(0.08+(3-grade)*0.02))),
     * interval = rep==1 ? 1 : rep==2 ? 6 : round(prevInterval * ease).
     * `dueAt` = now + interval days.
     *
     * @param params - {@link ReviewFlashcardParams}
     * @returns the next due date.
     * @throws FlashcardCardNotFoundException when the card does not exist.
     */
    async review(
        {
            userId,
            cardId,
            grade,
        }: ReviewFlashcardParams,
    ): Promise<ReviewFlashcardResult> {
        return this.entityManager.transaction(async (manager) => {
            // the card must exist (FK target) — a typed 404 otherwise
            const cardExists = await manager.findOne(
                FlashcardCardEntity,
                {
                    where: {
                        id: cardId,
                    },
                    select: {
                        id: true,
                    },
                },
            )
            if (!cardExists) {
                throw new FlashcardCardNotFoundException({
                    flashcardCardId: cardId,
                })
            }

            // read the prior review state (defaults for a brand-new card)
            const existing = await manager.findOne(
                UserFlashcardReviewEntity,
                {
                    where: {
                        userId,
                        flashcardCardId: cardId,
                    },
                },
            )
            const prevEase = existing?.ease ?? 2.5
            const prevInterval = existing?.intervalDays ?? 0
            const prevRepetitions = existing?.repetitions ?? 0

            // apply SM-2
            const next = this.applySm2({
                grade,
                prevEase,
                prevInterval,
                prevRepetitions,
            })

            const now = new Date()
            const dueAt = new Date(now.getTime() + next.intervalDays * 24 * 60 * 60 * 1000)

            // upsert the per-(user, card) review row
            if (existing) {
                await manager.update(
                    UserFlashcardReviewEntity,
                    {
                        id: existing.id,
                    },
                    {
                        ease: next.ease,
                        intervalDays: next.intervalDays,
                        repetitions: next.repetitions,
                        dueAt,
                        lastReviewedAt: now,
                    },
                )
            } else {
                const review = manager.create(
                    UserFlashcardReviewEntity,
                    {
                        userId,
                        flashcardCardId: cardId,
                        ease: next.ease,
                        intervalDays: next.intervalDays,
                        repetitions: next.repetitions,
                        dueAt,
                        lastReviewedAt: now,
                    },
                )
                await manager.save(review)
            }

            // append to the immutable review-event log so history-based stats
            // (streak / retention / total) can be projected from it
            await manager.save(
                manager.create(
                    FlashcardReviewEventEntity,
                    {
                        userId,
                        flashcardCardId: cardId,
                        grade,
                        reviewedAt: now,
                    },
                ),
            )

            return {
                dueAt,
            }
        })
    }

    /**
     * Preview the interval (in days) each SM-2 grade would schedule from a card's
     * current state, WITHOUT persisting — powers the rating buttons so the learner
     * sees the consequence of each choice. Same arithmetic as {@link review}.
     *
     * @param prior - the card's current ease / interval / repetitions.
     * @returns the per-grade next interval in days.
     */
    previewIntervals(
        prior: Omit<ApplySm2Params, "grade">,
    ): FlashcardNextIntervals {
        const intervalForGrade = (grade: number): number =>
            this.applySm2({
                grade,
                ...prior,
            }).intervalDays
        return {
            again: intervalForGrade(0),
            hard: intervalForGrade(1),
            good: intervalForGrade(2),
            easy: intervalForGrade(3),
        }
    }

    /**
     * The pure SM-2 update over the prior scheduling state.
     *
     * @param params - the grade and prior ease/interval/repetitions.
     * @returns the next ease / interval / repetitions.
     */
    private applySm2(
        {
            grade,
            prevEase,
            prevInterval,
            prevRepetitions,
        }: ApplySm2Params,
    ): ApplySm2Result {
        // Again: a lapse → restart the repetition count and re-show tomorrow.
        // Ease is left untouched on a lapse (classic SM-2 only adjusts ease on recall).
        if (grade === GRADE_AGAIN) {
            return {
                ease: prevEase,
                intervalDays: 1,
                repetitions: 0,
            }
        }
        // successful recall: bump repetitions and recompute ease
        const repetitions = prevRepetitions + 1
        const delta = 0.1 - (3 - grade) * (0.08 + (3 - grade) * 0.02)
        const ease = Math.max(EASE_FLOOR,
            prevEase + delta)
        // interval schedule: 1d → 6d → round(prevInterval * ease)
        const intervalDays = repetitions === 1
            ? 1
            : repetitions === 2
                ? 6
                : Math.round(prevInterval * ease)
        return {
            ease,
            intervalDays,
            repetitions,
        }
    }
}
