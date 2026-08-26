import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FlashcardReviewEventEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-review-event.entity"
import {
    UserFlashcardReviewEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-review.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    FlashcardCardNotFoundException,
} from "@modules/platform/exceptions/errors/flashcard/flashcard-card-not-found"
import {
    FLAT_POINTS,
} from "@features/api/processors/ai/shared/xp/points-config"
import {
    writeXpHistory,
} from "@features/api/processors/ai/shared/xp/write-xp-history"
import {
    UserService,
} from "../user/user.service"
import type {
    ApplySm2Params,
    ApplySm2Result,
    DueCardIdRow,
    DueFlashcard,
    DueFlashcardsResult,
    FlashcardNextIntervals,
    ListDueFlashcardsParams,
    ListFlashcardsByIdsParams,
    ReviewFlashcardParams,
    ReviewFlashcardResult,
} from "./types/flashcard-review"

/** Default SM-2 scheduling state for a card the viewer has never reviewed. */
export const NEW_CARD_STATE: Omit<ApplySm2Params, "grade"> = {
    prevEase: 2.5,
    prevInterval: 0,
    prevRepetitions: 0,
}

/** SM-2 grade value for "Again" (a lapse -> reset). */
const GRADE_AGAIN = 0

/**
 * Per-course weighted XP granted the FIRST time a user ever grades a given card
 * (mirrors `mark-as-readed`'s `LESSON_READ_XP`). Repeat reviews grant nothing --
 * the reward is for turning up a NEW card, not for re-drilling a known one.
 */
const FLASHCARD_FIRST_REVIEW_XP = 2

/** Lower bound the SM-2 easiness factor may never drop below. */
const EASE_FLOOR = 1.3

/**
 * Max NEW (never-reviewed) cards offered per "due today" batch. Caps the
 * headline so a fresh viewer sees a manageable batch (overdue reviews + this
 * many new) instead of the entire never-reviewed backlog (the "449" bug). The
 * batch refills as new cards get reviewed and leave the new pool.
 */
const DAILY_NEW_LIMIT = 20

@Injectable()
/**
 * Spaced-repetition (SM-2) read + write for flashcards. {@link listDue} serves
 * the viewer's due-card queue (no review row yet OR past its `dueAt`) across all
 * decks -- enrollment is NOT required, so trial viewers can review too; {@link review}
 * applies an SM-2 grade and upserts the per-(user, card) review row.
 */
export class FlashcardReviewService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly flashcardDeckResolver: FlashcardDeckResolverService,
        private readonly userService: UserService,
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
            courseId,
            limit,
            locale,
        }: ListDueFlashcardsParams,
    ): Promise<DueFlashcardsResult> {
        // On a COURSE page, the review row is keyed by ENROLLMENT (the anchor for
        // per-course progress going forward) -- resolve the viewer's enrollment id for
        // this course READ-ONLY (no trial create on a read; a viewer with no enrollment
        // simply has no review rows -> every card reads as NEW). The DASHBOARD (global)
        // queue spans every course, so it keeps keying the review by user_id (a single
        // enrollment id does not exist across courses).
        const enrollmentId = await this.resolveEnrollmentId(userId,
            courseId)

        // shared scaffold: card -> deck SCOPED TO THE COURSE (the due count on
        // a course page must reflect only that course's decks, not every deck
        // system-wide), with the per-viewer review row left-joined. Enrollment is NOT
        // required -- trial viewers review flashcards too. The review join keys by
        // enrollment_id on a course page (and by user_id on the global dashboard queue).
        const base = () => {
            const reviewJoin = courseId
                ? "review.flashcard_card_id = card.id AND review.enrollment_id = :enrollmentId"
                : "review.flashcard_card_id = card.id AND review.user_id = :userId"
            const qb = this.entityManager
                .createQueryBuilder(FlashcardCardEntity,
                    "card")
                .innerJoin(FlashcardDeckEntity,
                    "deck",
                    "deck.id = card.flashcard_deck_id")
                .leftJoin(
                    UserFlashcardReviewEntity,
                    "review",
                    reviewJoin,
                    {
                        userId,
                        enrollmentId,
                    },
                )
            // scope to one course on a course page; omit -> global queue (dashboard)
            if (courseId) {
                qb.andWhere("deck.course_id = :courseId",
                    {
                        courseId,
                    })
            }
            return qb
        }

        // Split "due" into its two semantically-different buckets instead of lumping
        // never-reviewed cards into "due today" (that made a fresh viewer see the
        // whole backlog as due -- the "449" bug).
        //  - overdue REVIEW = already learned once, now past dueAt
        //  - NEW = never reviewed; capped to DAILY_NEW_LIMIT for "today"
        const OVERDUE = "review.id IS NOT NULL AND review.due_at <= now()"
        const NEW = "review.id IS NULL"
        const dueReviewCount = await base().andWhere(OVERDUE).getCount()
        const newTotalCount = await base().andWhere(NEW).getCount()
        const newCount = Math.min(newTotalCount,
            DAILY_NEW_LIMIT)
        const dueCount = dueReviewCount + newCount

        // page: overdue first (oldest-due first), then fill the rest with today's
        // capped new batch -- so reviews never starve behind new cards.
        const SELECT_COLS = (qb: ReturnType<typeof base>) => qb
            .select("card.id",
                "card_id")
            .addSelect("review.ease",
                "review_ease")
            .addSelect("review.intervalDays",
                "review_interval_days")
            .addSelect("review.repetitions",
                "review_repetitions")
        const overdueRows = await SELECT_COLS(base().andWhere(OVERDUE))
            .orderBy("review.due_at",
                "ASC")
            .addOrderBy("card.id",
                "ASC")
            .limit(limit)
            .getRawMany<DueCardIdRow>()
        const newSlots = Math.min(newCount,
            Math.max(0,
                limit - overdueRows.length))
        const newRows = newSlots > 0
            ? await SELECT_COLS(base().andWhere(NEW))
                .orderBy("card.id",
                    "ASC")
                .limit(newSlots)
                .getRawMany<DueCardIdRow>()
            : []
        const rows = [
            ...overdueRows,
            ...newRows,
        ]

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
                dueReviewCount,
                newCount,
                newTotalCount,
                cards: [],
            }
        }

        // load + localize the page's cards (deck + both their translations),
        // localizing once per distinct deck.
        const {
            localizedDeckTitleById,
            cardById,
        } = await this.loadAndLocalizeCards(cardIds,
            locale)

        // Gate premium answers behind enrollment, mirroring the content paywall's
        // isEntitled/lockPremiumContent pair (`content.handler.ts:174-184`) -- this
        // is the enforcement `FlashcardCardEntity.isPremium`'s own doc claims exists
        // but never did (see `.artifacts/states/flashcard/findings.md` #1). The
        // GLOBAL (cross-course) queue can mix cards from many courses, so entitlement
        // is resolved per the CARD'S OWN course (`card.deck.courseId`), not the
        // request's optional `courseId` -- cached per distinct course id so a shared
        // course is only checked once.
        const entitledByCourseId = await this.resolveEntitlementByCourseId(
            [...cardById.values()],
            userId,
        )

        // preserve the due-order page ordering (find does not guarantee it)
        const localized = this.mapToDueFlashcards(
            cardIds,
            cardById,
            localizedDeckTitleById,
            priorByCardId,
            entitledByCourseId,
        )
        return {
            dueCount,
            dueReviewCount,
            newCount,
            newTotalCount,
            cards: localized,
        }
    }

    /**
     * List flashcards by an EXACT set of ids, regardless of current due status --
     * unlike {@link listDue}, a card graded (and so no longer "due") since the
     * batch was drawn is NOT dropped. Rehydrates a resumable due-review batch to
     * its ORIGINAL draw: a `DueReviewSession`'s persisted `cardIds` intersected
     * against a fresh `listDue` call shrinks every time a card in it gets graded
     * (its `dueAt` moves to the future) -- a small/near-finished batch easily hits
     * zero overlap on the very next visit, silently discarding a legitimately
     * in-progress session and starting a new one (PO 2026-07-11: due review
     * must not silently open a new session). Output order matches `cardIds` (a card id that no
     * longer exists is simply dropped, not errored).
     *
     * @param params - {@link ListFlashcardsByIdsParams}
     * @returns the requested cards, localized, in `cardIds` order.
     */
    async listByIds(
        {
            userId,
            courseId,
            cardIds,
            locale,
        }: ListFlashcardsByIdsParams,
    ): Promise<Array<DueFlashcard>> {
        if (cardIds.length === 0) {
            return []
        }

        // same enrollment-vs-user review-row keying as `listDue` (course page ->
        // enrollment; no course context -> user-wide).
        const enrollmentId = await this.resolveEnrollmentId(userId,
            courseId)

        // a course-scoped call with NO resolved enrollment has no course-scoped
        // review rows to find (mirrors `listDue`'s raw-SQL `review.enrollment_id
        // = :enrollmentId` with a null param -- always zero rows) -- skip the
        // query rather than pass `undefined` into the `where`, which TypeORM
        // reads as "no filter on this field" and would match every OTHER
        // user's enrollment-scoped reviews instead of none.
        const reviews = courseId && !enrollmentId
            ? []
            : await this.entityManager.find(
                UserFlashcardReviewEntity,
                {
                    where: courseId
                        ? {
                            flashcardCard: {
                                id: In(cardIds),
                            },
                            enrollment: {
                                id: enrollmentId as string,
                            },
                        }
                        : {
                            flashcardCard: {
                                id: In(cardIds),
                            },
                            user: {
                                id: userId,
                            },
                        },
                    select: {
                        ease: true,
                        intervalDays: true,
                        repetitions: true,
                        flashcardCard: {
                            id: true,
                        },
                    },
                    relations: {
                        flashcardCard: true,
                    },
                },
            )
        const priorByCardId = new Map<string, Omit<ApplySm2Params, "grade">>()
        for (const review of reviews) {
            priorByCardId.set(review.flashcardCard.id,
                {
                    prevEase: review.ease ?? NEW_CARD_STATE.prevEase,
                    prevInterval: review.intervalDays ?? NEW_CARD_STATE.prevInterval,
                    prevRepetitions: review.repetitions ?? NEW_CARD_STATE.prevRepetitions,
                })
        }

        // load + localize exactly like `listDue`'s tail (deck + translations,
        // localize once per distinct deck).
        const {
            localizedDeckTitleById,
            cardById,
        } = await this.loadAndLocalizeCards(cardIds,
            locale)

        // Gate premium answers behind enrollment -- same rationale as `listDue`
        // (see the comment there); this batch can likewise mix cards drawn from
        // several courses (a resumed cross-course due-review batch).
        const entitledByCourseId = await this.resolveEntitlementByCourseId(
            [...cardById.values()],
            userId,
        )

        return this.mapToDueFlashcards(
            cardIds,
            cardById,
            localizedDeckTitleById,
            priorByCardId,
            entitledByCourseId,
        )
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
            sessionId,
        }: ReviewFlashcardParams,
    ): Promise<ReviewFlashcardResult> {
        return this.entityManager.transaction(async (manager) => {
            // the card must exist (FK target) -- a typed 404 otherwise. Load its deck
            // so we can derive the course (card -> deck -> course) and key the review
            // row by enrollment (user x course) -- the anchor going forward.
            const cardExists = await manager.findOne(
                FlashcardCardEntity,
                {
                    where: {
                        id: cardId,
                    },
                    relations: {
                        deck: true,
                    },
                },
            )
            if (!cardExists) {
                throw new FlashcardCardNotFoundException({
                    flashcardCardId: cardId,
                })
            }

            // resolve-or-create the trial enrollment for this user x course; set it on
            // the row going forward (we still set user_id during the re-key transition).
            // A deck without a course (global deck) leaves enrollment unset.
            const courseId = cardExists.deck?.courseId ?? null
            const enrollment = courseId
                ? await this.userService.resolveOrCreateTrialEnrollment(
                    userId,
                    courseId,
                )
                : null

            // read the prior review state (defaults for a brand-new card)
            const existing = await manager.findOne(
                UserFlashcardReviewEntity,
                {
                    where: {
                        // userId is a real column; flashcardCardId is a @RelationId
                        // (virtual, not queryable) -- filter through the relation
                        userId,
                        flashcardCard: {
                            id: cardId,
                        },
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

            // upsert the per-(user, card) review row. XP is granted ONLY on the
            // first-ever review of this card by this user -- the `!existing` branch
            // (no prior review row). Repeat reviews grant 0.
            let xpEarned = 0
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
                        // backfill enrollment on a pre-existing row that predates the re-key
                        ...(enrollment && !existing.enrollmentId
                            ? {
                                enrollment: {
                                    id: enrollment.id,
                                },
                            }
                            : {
                            }),
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
                        ...(enrollment
                            ? {
                                enrollment,
                            }
                            : {
                            }),
                    },
                )
                await manager.save(review)

                // grant the flat first-review XP + Coin in the SAME tx. Idempotent on
                // (source, refId) -- the review-row id is the stable ref, so a retry
                // of this exact grade never double-credits. A global deck with no
                // course leaves courseId null (still a valid course-agnostic grant).
                await writeXpHistory({
                    entityManager: manager,
                    userId,
                    courseId,
                    source: XpSource.FlashcardFirstReview,
                    amount: FLASHCARD_FIRST_REVIEW_XP,
                    points: FLAT_POINTS.flashcardFirstReview,
                    refId: review.id,
                })
                xpEarned = FLASHCARD_FIRST_REVIEW_XP
            }

            // append to the immutable review-event log so history-based stats
            // (streak / retention / total / per-session) can be projected from it.
            // `sessionId` attributes the grade to the client's current review session
            // (null when the client threaded none -> an untracked grade).
            await manager.save(
                manager.create(
                    FlashcardReviewEventEntity,
                    {
                        userId,
                        flashcardCardId: cardId,
                        grade,
                        reviewedAt: now,
                        sessionId: sessionId ?? null,
                    },
                ),
            )

            return {
                dueAt,
                xpEarned,
            }
        })
    }

    /**
     * Preview the interval (in days) each SM-2 grade would schedule from a card's
     * current state, WITHOUT persisting -- powers the rating buttons so the learner
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
     * Resolves, once per DISTINCT owning course, whether the viewer is entitled to
     * read premium cards from that course -- mirrors `ContentHandler.isEntitled`
     * (`content.handler.ts:283-300`). A batch of cards (due queue or an id-based
     * rehydrate) can span several courses, so this is checked per course rather
     * than once for the whole batch; `UserService.checkEnrollment` is backed by a
     * single per-user cached set, so repeat calls for the same user are cheap.
     *
     * @param cards - The loaded cards (each card's `deck.courseId` identifies its course).
     * @param userId - Active user id.
     * @returns Entitlement keyed by course id -- only courses that actually own a
     *   premium card in this batch are checked.
     */
    private async resolveEntitlementByCourseId(
        cards: Array<FlashcardCardEntity>,
        userId: string,
    ): Promise<Map<string, boolean>> {
        const entitledByCourseId = new Map<string, boolean>()
        for (const card of cards) {
            if (!card.isPremium) {
                continue
            }
            const courseId = card.deck?.courseId
            if (!courseId || entitledByCourseId.has(courseId)) {
                continue
            }
            entitledByCourseId.set(
                courseId,
                await this.userService.checkEnrollment(
                    userId,
                    courseId,
                ),
            )
        }
        return entitledByCourseId
    }

    /**
     * Resolve the viewer's enrollment id for `courseId`, READ-ONLY (no trial
     * create on a read -- a viewer with no enrollment simply has no
     * course-scoped review rows). Shared by {@link listDue} and {@link listByIds},
     * which key a course-page review row by enrollment and a course-less
     * (global/dashboard) call by `userId` instead.
     *
     * @param userId - Active user id.
     * @param courseId - The course page's course id, or `null`/`undefined` for the global queue.
     * @returns The resolved enrollment id, or `null` when there is no course context
     *   or no matching enrollment.
     */
    private async resolveEnrollmentId(
        userId: string,
        courseId: string | null | undefined,
    ): Promise<string | null> {
        if (!courseId) {
            return null
        }
        const enrollment = await this.entityManager.findOne(
            EnrollmentEntity,
            {
                where: {
                    user: {
                        id: userId,
                    },
                    course: {
                        id: courseId,
                    },
                },
                select: {
                    id: true,
                },
            },
        )
        return enrollment?.id ?? null
    }

    /**
     * Load the full card graph (deck + both their translations) for `cardIds`
     * and localize each card via its deck, once per distinct deck so a shared
     * deck is not transformed twice. Shared by {@link listDue} and
     * {@link listByIds}.
     *
     * @param cardIds - The ids to load.
     * @param locale - The request locale to localize into.
     * @returns The loaded cards, keyed by id, plus each distinct deck's localized title.
     */
    private async loadAndLocalizeCards(
        cardIds: Array<string>,
        locale: Locale,
    ): Promise<{
        localizedDeckTitleById: Map<string, string>
        cardById: Map<string, FlashcardCardEntity>
    }> {
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
        // Group first, then localize every card in a deck in one resolver pass.
        // Localizing only the first encountered card made later cards from the
        // same deck silently retain the default language in a localized session.
        const localizedDeckTitleById = new Map<string, string>()
        const cardById = new Map<string, FlashcardCardEntity>()
        const cardsByDeckId = new Map<string, Array<FlashcardCardEntity>>()
        for (const card of cards) {
            const deck = card.deck
            if (deck) {
                const groupedCards = cardsByDeckId.get(deck.id) ?? []
                groupedCards.push(card)
                cardsByDeckId.set(deck.id,
                    groupedCards)
            }
            cardById.set(card.id,
                card)
        }
        for (const groupedCards of cardsByDeckId.values()) {
            const deck = groupedCards[0]?.deck
            if (!deck) {
                continue
            }
            deck.cards = groupedCards
            this.flashcardDeckResolver.transform(
                deck,
                locale,
                deck.defaultLocale ?? Locale.En,
            )
            localizedDeckTitleById.set(deck.id,
                deck.title)
        }
        return {
            localizedDeckTitleById,
            cardById,
        }
    }

    /**
     * Map loaded + localized cards to the response shape, in `cardIds` order
     * (a card id that no longer exists is simply dropped, not errored). Shared
     * by {@link listDue} and {@link listByIds}.
     *
     * @param cardIds - The ids to map, in the order the caller wants back.
     * @param cardById - Loaded cards from {@link loadAndLocalizeCards}.
     * @param localizedDeckTitleById - Localized deck titles from {@link loadAndLocalizeCards}.
     * @param priorByCardId - Each card's prior SM-2 state, for the next-interval preview.
     * @param entitledByCourseId - Per-course premium entitlement from {@link resolveEntitlementByCourseId}.
     * @returns The cards, localized, in `cardIds` order.
     */
    private mapToDueFlashcards(
        cardIds: Array<string>,
        cardById: Map<string, FlashcardCardEntity>,
        localizedDeckTitleById: Map<string, string>,
        priorByCardId: Map<string, Omit<ApplySm2Params, "grade">>,
        entitledByCourseId: Map<string, boolean>,
    ): Array<DueFlashcard> {
        return cardIds
            .map((id) => cardById.get(id))
            .filter((card): card is FlashcardCardEntity => Boolean(card))
            .map((card) => {
                const answerAvailable = this.isEntitledToCard(card,
                    entitledByCourseId) && (card.answer?.trim().length ?? 0) > 0
                return {
                    cardId: card.id,
                    deckTitle: card.deck
                        ? (localizedDeckTitleById.get(card.deck.id) ?? card.deck.title)
                        : "",
                    front: card.question,
                    back: answerAvailable ? (card.answer ?? "") : "",
                    answerAvailable,
                    level: card.level ?? null,
                    tags: card.tags ?? [],
                    nextIntervals: this.previewIntervals(
                        priorByCardId.get(card.id) ?? NEW_CARD_STATE,
                    ),
                }
            })
    }

    /**
     * Whether the viewer may read THIS card's answer: true for a free card, or a
     * premium card whose owning course is entitled per
     * {@link resolveEntitlementByCourseId}. A premium card whose course could not
     * be resolved (no deck loaded) fails closed (not entitled) rather than leaking.
     *
     * @param card - The card being served.
     * @param entitledByCourseId - Per-course entitlement from {@link resolveEntitlementByCourseId}.
     */
    private isEntitledToCard(
        card: FlashcardCardEntity,
        entitledByCourseId: Map<string, boolean>,
    ): boolean {
        if (!card.isPremium) {
            return true
        }
        const courseId = card.deck?.courseId
        return Boolean(courseId && entitledByCourseId.get(courseId))
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
        // Again: a lapse -> restart the repetition count and re-show tomorrow.
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
        // interval schedule: 1d -> 6d -> round(prevInterval * ease)
        let intervalDays: number
        if (repetitions === 1) {
            intervalDays = 1
        } else if (repetitions === 2) {
            intervalDays = 6
        } else {
            intervalDays = Math.round(prevInterval * ease)
        }
        return {
            ease,
            intervalDays,
            repetitions,
        }
    }
}
