import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    FlashcardDeckReadService,
} from "./flashcard-deck.service"
import {
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
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Minimal stand-in for the Elasticsearch client surface the service touches:
 * a single `get` call against a per-locale index.
 */
interface ElasticsearchClientMock {
    /** Programmed per-test: resolves a `{ _source }` document or rejects 404. */
    get: jest.Mock
}

describe("FlashcardDeckReadService",
    () => {
        let module: TestingModule
        let service: FlashcardDeckReadService
        let entityManager: EntityManagerMock
        let elasticsearchClient: ElasticsearchClientMock
        let elasticsearchService: jest.Mocked<
            Pick<ElasticsearchService, "indicateName">
        >

        const courseId = "course-1"
        const flashcardDeckId = "deck-1"

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // ES client stub: only `get` is used by the single-deck read
            elasticsearchClient = {
                get: jest.fn(),
            }

            // ES service stub: resolves the per-locale index name + exposes the client
            elasticsearchService = {
                indicateName: jest.fn(() => "flashcard-decks-en"),
                client: elasticsearchClient,
            } as unknown as jest.Mocked<Pick<ElasticsearchService, "indicateName">>

            module = await Test.createTestingModule({
                providers: [
                    FlashcardDeckReadService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: ElasticsearchService,
                        useValue: elasticsearchService,
                    },
                    {
                        // localization is exercised in the resolver's own spec; here we
                        // only assert the read wiring, so a no-op transform is enough
                        provide: FlashcardDeckResolverService,
                        useValue: {
                            transform: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<FlashcardDeckReadService>(FlashcardDeckReadService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("listByCourse",
            () => {
                it("loads the full deck graph for a course in display order",
                    async () => {
                        const decks = [
                            {
                                id: flashcardDeckId,
                            },
                        ] as Array<FlashcardDeckEntity>
                        entityManager.find.mockResolvedValueOnce(decks)

                        const result = await service.listByCourse(courseId)

                        expect(result).toBe(decks)
                        // queries scoped to the course, ordered by orderIndex, with the full graph
                        expect(entityManager.find).toHaveBeenCalledWith(
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
                                    contents: true,
                                    modules: true,
                                    translations: true,
                                },
                                order: {
                                    sortIndex: "ASC",
                                },
                            },
                        )
                    })

                it("adds the linked-contents filter when a contentId is supplied",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])

                        await service.listByCourse(courseId,
                            Locale.En,
                            "content-9")

                        // the optional topical filter narrows to decks linked to the content
                        const where = entityManager.find.mock.calls[0][1].where as {
                            contents?: {
                                id: string
                            }
                        }
                        expect(where.contents).toEqual({
                            id: "content-9",
                        })
                    })
            })

        describe("getById",
            () => {
                it("returns the deck document sourced from the per-locale ES index",
                    async () => {
                        const deck = {
                            id: flashcardDeckId,
                        } as FlashcardDeckEntity
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: deck,
                        })

                        const result = await service.getById(flashcardDeckId,
                            Locale.En)

                        expect(result).toBe(deck)
                        // resolves the index name for the requested entity + locale
                        expect(elasticsearchService.indicateName).toHaveBeenCalledWith({
                            entity: FlashcardDeckEntity.name,
                            locale: Locale.En,
                        })
                        // fetches by deck id used as the ES `_id`
                        expect(elasticsearchClient.get).toHaveBeenCalledWith({
                            index: "flashcard-decks-en",
                            id: flashcardDeckId,
                        })
                    })

                it("defaults to the English locale when none is given",
                    async () => {
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: {
                                id: flashcardDeckId,
                            },
                        })

                        await service.getById(flashcardDeckId)

                        expect(elasticsearchService.indicateName).toHaveBeenCalledWith({
                            entity: FlashcardDeckEntity.name,
                            locale: Locale.En,
                        })
                    })

                it("throws FlashcardDeckNotFoundException when the document has no _source",
                    async () => {
                        // a hit with an empty body is treated as a missing deck
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: undefined,
                        })

                        await expect(
                            service.getById(flashcardDeckId),
                        ).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)
                    })

                it("maps an ES 404 (rejected get) to FlashcardDeckNotFoundException",
                    async () => {
                        // a missing doc/index surfaces as a thrown error from the client
                        elasticsearchClient.get.mockRejectedValueOnce(
                            new Error("404"),
                        )

                        await expect(
                            service.getById(flashcardDeckId),
                        ).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)
                    })
            })

        describe("drawRandomCard",
            () => {
                /** Builds a deck (as served by the ES single-deck read) with the given cards. */
                const deckWithCards = (
                    cards: Array<Partial<FlashcardCardEntity>>,
                ): FlashcardDeckEntity =>
                    ({
                        id: flashcardDeckId,
                        cards,
                    }) as unknown as FlashcardDeckEntity

                afterEach(() => {
                    // restore any Math.random spy so the uniform pick stays unbiased across tests
                    jest.restoreAllMocks()
                })

                it("draws only from cards that have a model answer (gradable pool)",
                    async () => {
                        // legacy card with a null answer must be excluded from the draw
                        const gradable = {
                            id: "card-gradable",
                            answer: "the model answer",
                        }
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: deckWithCards([
                                {
                                    id: "card-legacy",
                                    answer: null,
                                },
                                gradable,
                            ]),
                        })
                        // force the pick onto the first element of the filtered pool
                        jest.spyOn(Math, "random").mockReturnValue(0)

                        const result = await service.drawRandomCard({
                            flashcardDeckId,
                            locale: Locale.En,
                        })

                        // the legacy answerless card is filtered out, so index 0 is the gradable one
                        expect(result.id).toBe("card-gradable")
                    })

                it("picks uniformly across the gradable pool (random maps to an index)",
                    async () => {
                        const cards = [
                            {
                                id: "card-0",
                                answer: "a",
                            },
                            {
                                id: "card-1",
                                answer: "b",
                            },
                            {
                                id: "card-2",
                                answer: "c",
                            },
                        ]
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: deckWithCards(cards),
                        })
                        // 0.5 * 3 = 1.5 → floor 1 → the middle card
                        jest.spyOn(Math, "random").mockReturnValue(0.5)

                        const result = await service.drawRandomCard({
                            flashcardDeckId,
                            locale: Locale.En,
                        })

                        expect(result.id).toBe("card-1")
                    })

                it("throws FlashcardDeckNoGradableCardsException when no card has an answer",
                    async () => {
                        // every card predates the Q&A format → empty gradable pool
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: deckWithCards([
                                {
                                    id: "card-legacy-1",
                                    answer: null,
                                },
                                {
                                    id: "card-legacy-2",
                                    answer: "",
                                },
                            ]),
                        })

                        await expect(
                            service.drawRandomCard({
                                flashcardDeckId,
                                locale: Locale.En,
                            }),
                        ).rejects.toBeInstanceOf(FlashcardDeckNoGradableCardsException)
                    })

                it("propagates FlashcardDeckNotFoundException from the underlying deck read",
                    async () => {
                        // a missing deck surfaces through getById and must not be swallowed
                        elasticsearchClient.get.mockRejectedValueOnce(
                            new Error("404"),
                        )

                        await expect(
                            service.drawRandomCard({
                                flashcardDeckId,
                                locale: Locale.En,
                            }),
                        ).rejects.toBeInstanceOf(FlashcardDeckNotFoundException)
                    })
            })
    })
