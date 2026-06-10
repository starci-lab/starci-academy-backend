import {
    Injectable,
} from "@nestjs/common"
import {
    EntityManager,
} from "typeorm"
import {
    InjectPrimaryPostgreSQLEntityManager,
    FlashcardDeckEntity,
} from "@modules/databases"
import {
    QuizDeckNotFoundException,
} from "@modules/exceptions"

/**
 * Read access to seeded quiz decks. Loads the full deck graph (cards →
 * translations) eagerly so GraphQL can serve it without per-field
 * resolvers.
 */
@Injectable()
export class QuizDeckReadService {
    constructor(
        @InjectPrimaryPostgreSQLEntityManager()
        private readonly entityManager: EntityManager,
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
     * Loads a single deck by id with its full card graph.
     *
     * @param quizDeckId - Deck id.
     * @returns The deck with cards and translations.
     */
    async getById(quizDeckId: string): Promise<FlashcardDeckEntity> {
        // fetch the deck plus every nested relation needed for study modes
        const deck = await this.entityManager.findOne(
            FlashcardDeckEntity,
            {
                where: {
                    id: quizDeckId,
                },
                relations: {
                    cards: {
                        translations: true,
                    },
                    contents: true,
                    translations: true,
                },
                order: {
                    cards: {
                        orderIndex: "ASC",
                    },
                },
            },
        )
        // a missing deck is a typed 404 so callers can branch on the code
        if (!deck) {
            throw new QuizDeckNotFoundException({
                quizDeckId,
            })
        }
        return deck
    }
}
