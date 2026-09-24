import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
    In,
} from "typeorm"
import {
    FlashcardCardEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-card.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    UserFlashcardReviewEntity,
} from "@modules/databases/postgresql/primary/entities/user-flashcard-review.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    InjectPrimaryPostgreSQLEntityManager,
} from "@modules/databases/postgresql/primary/primary.decorators"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    FlashcardDeckNotFoundException,
} from "@modules/platform/exceptions/errors/flashcard/flashcard-deck-not-found"
import type {
    DeckStatRow,
} from "./types/flashcard-deck"
import type {
    ApplySm2Params,
} from "./types/flashcard-review"
import {
    FlashcardReviewService,
    NEW_CARD_STATE,
} from "./flashcard-review.service"
import {
    EffectiveLearnerAccessService,
} from "../pro-subscription/effective-learner-access.service"

/** SM-2 repetition count at/above which a card is considered "mastered". */
const MASTERED_REPETITIONS = 2

@Injectable()
/**
 * Read access to seeded flashcard decks. Loads the full deck graph (cards ->
 * translations) eagerly so GraphQL can serve it without per-field
 * resolvers. The single-deck read is served from Elasticsearch (the ES sync
 * builder embeds the same full graph); the by-course list stays on Postgres.
 */
export class FlashcardDeckReadService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
        private readonly flashcardDeckResolver: FlashcardDeckResolverService,
        private readonly flashcardReviewService: FlashcardReviewService,
        private readonly effectiveLearnerAccessService: EffectiveLearnerAccessService,
    ) { }

    /**
     * Lists decks owned by a course, in display order.
     *
     * @param courseId - Owning course id.
     * @param locale - Locale to localize deck/card text into.
     * @param userId - Optional viewer id; when given, each deck is annotated with
     *   the viewer's `dueCount` + `masteredCount`.
     * @returns Decks with their cards, localized to `locale`.
     */
    async listByCourse(
        courseId: string,
        locale: Locale = Locale.En,
        userId?: string,
    ): Promise<Array<FlashcardDeckEntity>> {
        // load the full deck graph so the GraphQL object type serializes directly
        const decks = await this.entityManager.find(
            FlashcardDeckEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                },
                relations: {
                    cards: {
                        translations: true,
                    },
                    translations: true,
                },
                order: {
                    sortIndex: "ASC",
                },
            },
        )
        // localize each deck (title/description) + its cards into the requested locale,
        // mirroring the per-locale documents the single-deck ES read already serves
        for (const deck of decks) {
            this.flashcardDeckResolver.transform(
                deck,
                locale,
                deck.defaultLocale ?? Locale.En,
            )
        }
        // annotate per-viewer due / mastered counts when a viewer is known
        if (userId && decks.length > 0) {
            await this.annotateViewerStats(decks,
                userId)
        }
        // Gate premium answers behind enrollment, mirroring the content paywall's
        // isEntitled/lockPremiumContent pair (`content.handler.ts:174-184`) -- this
        // is the enforcement `FlashcardCardEntity.isPremium`'s own doc claims
        // exists but never did (see `.artifacts/states/flashcard/findings.md` #1).
        // Every deck here belongs to the SAME `courseId` (the query scope), so one
        // enrollment check covers the whole page.
        const entitled = await this.isEntitled(courseId,
            userId)
        if (!entitled) {
            for (const deck of decks) {
                for (const card of deck.cards ?? []) {
                    if (card.isPremium) {
                        this.lockPremiumCard(card)
                    }
                }
            }
        }
        return decks
    }

    /**
     * Whether the viewer may read a premium card's answer/explanation: true for a
     * free card, or for a viewer enrolled in the card's owning course. Mirrors
     * `ContentHandler.isEntitled` (`content.handler.ts:283-300`).
     *
     * @param courseId - Owning course id of the card(s) being gated.
     * @param userId - Active user id, when authenticated.
     */
    private async isEntitled(
        courseId?: string,
        userId?: string,
    ): Promise<boolean> {
        if (!userId || !courseId) {
            return false
        }
        return await this.effectiveLearnerAccessService.hasCourseAccess(
            userId,
            courseId,
        )
    }

    /**
     * Withholds a premium card's answer/explanation in place, mirroring
     * `ContentHandler.lockPremiumContent` (`content.handler.ts:309-352`) -- the
     * question and metadata stay visible (the card is still browsable / listable),
     * only the "back" content a non-entitled viewer must not see is nulled out.
     *
     * @param card - Card to lock (mutated in place).
     */
    private lockPremiumCard(
        card: FlashcardCardEntity,
    ): void {
        card.answer = null
        card.explanation = null
    }

    /**
     * Annotate each deck (in place) with the viewer's `dueCount` (cards with no
     * review row yet OR past due) and `masteredCount` (repetitions >= 2), in one
     * grouped query across the given decks.
     *
     * @param decks - The decks to annotate (mutated in place).
     * @param userId - The viewer whose review state is aggregated.
     */
    private async annotateViewerStats(
        decks: Array<FlashcardDeckEntity>,
        userId: string,
    ): Promise<void> {
        const deckIds = decks.map((deck) => deck.id)
        const rows = await this.entityManager
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
            .select("deck.id",
                "deck_id")
            .addSelect("COUNT(*) FILTER (WHERE review.id IS NULL OR review.due_at <= now())",
                "due_count")
            .addSelect(`COUNT(*) FILTER (WHERE review.repetitions >= ${MASTERED_REPETITIONS})`,
                "mastered_count")
            .where("deck.id IN (:...deckIds)",
                {
                    deckIds,
                })
            .groupBy("deck.id")
            .getRawMany<DeckStatRow>()

        const statByDeckId = new Map<string, DeckStatRow>()
        for (const row of rows) {
            statByDeckId.set(row.deck_id,
                row)
        }
        for (const deck of decks) {
            const stat = statByDeckId.get(deck.id)
            deck.dueCount = stat ? Number(stat.due_count) : 0
            deck.masteredCount = stat ? Number(stat.mastered_count) : 0
        }
    }

    /**
     * Loads a single deck by id with its full card graph, served from the
     * per-locale Elasticsearch index (the ES sync builder embeds the same
     * cards -> translations -> contents graph the study modes need).
     *
     * @param flashcardDeckId - Deck id (also the ES document `_id`).
     * @param locale - Locale index to read from.
     * @param userId - Optional viewer id; when given, each card is annotated
     *   with the viewer's `nextIntervals` (SM-2 preview for the rating bar).
     * @returns The deck with cards and translations.
     */
    async getById(
        flashcardDeckId: string,
        locale: Locale = Locale.En,
        userId?: string,
    ): Promise<FlashcardDeckEntity> {
        const index = this.elasticsearchService.indicateName({
            entity: FlashcardDeckEntity.name,
            locale,
        })
        try {
            // documents are indexed with the deck id as the ES `_id`, so a direct get is enough
            const document = await this.elasticsearchService.client.get<FlashcardDeckEntity>({
                index,
                id: flashcardDeckId,
            })
            // a missing deck is a typed 404 so callers can branch on the code
            if (!document._source) {
                throw new FlashcardDeckNotFoundException({
                    flashcardDeckId,
                })
            }
            const deck = document._source
            if (userId && deck.cards?.length > 0) {
                await this.annotateNextIntervals(deck.cards,
                    userId)
            }
            // Gate premium answers behind enrollment -- same paywall this deck's
            // cards claim to mirror but never enforced (Finding #1). `deck.courseId`
            // (a `@RelationId` field, populated at index time and stored in the ES
            // mapping -- `flashcard-deck.mapping.ts:22-25`) identifies the owning
            // course without a second DB round-trip.
            const entitled = await this.isEntitled(deck.courseId,
                userId)
            if (!entitled) {
                for (const card of deck.cards ?? []) {
                    if (card.isPremium) {
                        this.lockPremiumCard(card)
                    }
                }
            }
            return deck
        } catch (error) {
            if (error instanceof FlashcardDeckNotFoundException) {
                throw error
            }
            throw new FlashcardDeckNotFoundException({
                flashcardDeckId,
            })
        }
    }

    /**
     * Annotate each card (in place) with the viewer's `nextIntervals` -- the
     * SM-2 preview (days per grade) computed from the viewer's current review
     * state, without persisting. Mirrors {@link annotateViewerStats}'s
     * always-`user_id` keying (this ES-backed read has no course/enrollment
     * context to key by enrollment instead).
     *
     * @param cards - The deck's cards to annotate (mutated in place).
     * @param userId - The viewer whose review state is read.
     */
    private async annotateNextIntervals(
        cards: Array<FlashcardCardEntity>,
        userId: string,
    ): Promise<void> {
        const reviews = await this.entityManager.find(
            UserFlashcardReviewEntity,
            {
                where: {
                    flashcardCard: {
                        id: In(cards.map((card) => card.id)),
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
        for (const card of cards) {
            card.nextIntervals = this.flashcardReviewService.previewIntervals(
                priorByCardId.get(card.id) ?? NEW_CARD_STATE,
            )
        }
    }
}
