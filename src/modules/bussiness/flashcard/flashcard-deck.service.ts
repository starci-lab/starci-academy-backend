import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    FlashcardDeckEntity,
    Locale,
} from "@modules/databases"
import {
    ElasticsearchService,
} from "@modules/elasticsearch"
import {
    FlashcardDeckNotFoundException,
} from "@modules/exceptions"

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
    ) { }

    /**
     * Lists decks owned by a course, in display order. When `contentId` is
     * given, only decks linked to that content (many-to-many) are returned.
     *
     * @param courseId - Owning course id.
     * @param contentId - Optional content id to filter linked decks.
     * @returns Decks with their cards, contents, and translations.
     */
    async listByCourse(
        courseId: string,
        contentId?: string,
    ): Promise<Array<FlashcardDeckEntity>> {
        // load the full deck graph so the GraphQL object type serializes directly
        return this.entityManager.find(
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
                    translations: true,
                },
                order: {
                    orderIndex: "ASC",
                },
            },
        )
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
}
