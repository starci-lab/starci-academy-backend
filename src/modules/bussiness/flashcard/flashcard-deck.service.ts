import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    FlashcardCardEntity,
    FlashcardDeckEntity,
    FlashcardDeckResolverService,
    Locale,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    FlashcardDeckNoGradableCardsException,
    FlashcardDeckNotFoundException,
} from "@modules/exceptions"
import type {
    DrawRandomInterviewCardParams,
} from "./types/draw-interview-card"

/**
 * Read access to seeded flashcard decks. Loads the full deck graph (cards →
 * translations) eagerly so GraphQL can serve it without per-field
 * resolvers. The single-deck read is served from Elasticsearch (the ES sync
 * builder embeds the same full graph); the by-course list stays on Postgres.
 */
@Injectable()
export class FlashcardDeckReadService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
        private readonly elasticsearchService: ElasticsearchService,
        private readonly flashcardDeckResolver: FlashcardDeckResolverService,
    ) { }

    /**
     * Lists decks owned by a course, in display order. When `contentId` is
     * given, only decks linked to that content (many-to-many) are returned.
     *
     * @param courseId - Owning course id.
     * @param locale - Locale to localize deck/card text into.
     * @param contentId - Optional content id to filter linked decks.
     * @returns Decks with their cards and contents, localized to `locale`.
     */
    async listByCourse(
        courseId: string,
        locale: Locale = Locale.En,
        contentId?: string,
    ): Promise<Array<FlashcardDeckEntity>> {
        // load the full deck graph so the GraphQL object type serializes directly
        const decks = await this.entityManager.find(
            FlashcardDeckEntity,
            {
                where: {
                    course: {
                        id: courseId,
                    },
                    // optional topical filter on the linked-contents join
                    ...(contentId
                        ? {
                            contents: {
                                id: contentId,
                            },
                        }
                        : {
                        }),
                },
                relations: {
                    cards: {
                        translations: true,
                    },
                    contents: true,
                    modules: true,
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
        return decks
    }

    /**
     * Loads a single deck by id with its full card graph, served from the
     * per-locale Elasticsearch index (the ES sync builder embeds the same
     * cards → translations → contents graph the study modes need).
     *
     * @param flashcardDeckId - Deck id (also the ES document `_id`).
     * @param locale - Locale index to read from.
     * @returns The deck with cards and translations.
     */
    async getById(
        flashcardDeckId: string,
        locale: Locale = Locale.En,
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
            return document._source
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
     * Draws one random gradable card from a deck for the voice-interview mode.
     * Picks the card server-side so the client never sees the deck's other
     * questions up front, and never receives the model answer — grading reloads
     * the answer by id, so the draw can safely hide it.
     *
     * @param params - Deck id + locale to draw and localize the card in.
     * @returns A random card whose `answer` is present (gradable).
     * @throws FlashcardDeckNotFoundException when the deck is absent.
     * @throws FlashcardDeckNoGradableCardsException when no card has a model answer.
     */
    async drawRandomCard(
        {
            flashcardDeckId,
            locale,
        }: DrawRandomInterviewCardParams,
    ): Promise<FlashcardCardEntity> {
        // reuse the localized single-deck read (throws a typed 404 when missing)
        const deck = await this.getById(
            flashcardDeckId,
            locale,
        )
        // only cards with a model answer can be graded — legacy cards predating
        // the Q&A format carry a null answer and must be excluded from the draw
        const gradable = (deck.cards ?? []).filter(
            (card) => Boolean(card.answer),
        )
        // an empty pool means the deck is not interview-ready → typed error, not a crash
        if (gradable.length === 0) {
            throw new FlashcardDeckNoGradableCardsException({
                flashcardDeckId,
            })
        }
        // uniform random pick across the gradable pool
        const index = Math.floor(Math.random() * gradable.length)
        return gradable[index]
    }
}
