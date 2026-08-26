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
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    FlashcardDeckResolverService,
} from "@modules/databases/postgresql/primary/resolvers/flashcard-deck-resolver.service"
import {
    ElasticsearchService,
} from "@modules/integrations/elasticsearch/elasticsearch.service"
import {
    FlashcardDeckNotFoundException,
} from "@modules/platform/exceptions/errors/flashcard/flashcard-deck-not-found"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    FlashcardReviewService,
} from "./flashcard-review.service"
import {
    UserService,
} from "../user/user.service"

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
                    {
                        // SM-2 preview is only reached when a userId is passed, which none
                        // of these cases do; a no-op stub satisfies the constructor.
                        provide: FlashcardReviewService,
                        useValue: {
                            previewIntervals: jest.fn(),
                        },
                    },
                    {
                        // premium-card gating calls checkEnrollment only when a userId is
                        // passed; these cases never do, so a no-op stub is enough.
                        provide: UserService,
                        useValue: {
                            checkEnrollment: jest.fn(),
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
                                    translations: true,
                                },
                                order: {
                                    sortIndex: "ASC",
                                },
                            },
                        )
                    })

                it("returns an empty collection when the course has no decks",
                    async () => {
                        entityManager.find.mockResolvedValueOnce([])

                        await expect(service.listByCourse(courseId)).resolves.toEqual([])
                        expect(entityManager.find).toHaveBeenCalledTimes(1)
                    })

                it("propagates database failures while listing course decks",
                    async () => {
                        const failure = new Error("database unavailable")
                        entityManager.find.mockRejectedValueOnce(failure)

                        await expect(service.listByCourse(courseId)).rejects.toBe(failure)
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
                it("locks premium card answers for an unauthenticated course-list viewer",
                    async () => {
                        const card = {
                            id: "card-1",
                            isPremium: true,
                            answer: "hidden answer",
                            explanation: "hidden explanation",
                        }
                        const deck = {
                            id: flashcardDeckId,
                            cards: [card],
                            defaultLocale: Locale.En,
                        } as unknown as FlashcardDeckEntity
                        entityManager.find.mockResolvedValueOnce([deck])
                        const transform = module.get(FlashcardDeckResolverService).transform as jest.Mock
                        const checkEnrollment = module.get(UserService).checkEnrollment as jest.Mock

                        await expect(service.listByCourse(courseId,
                            Locale.En)).resolves.toEqual([deck])
                        expect(transform).toHaveBeenCalledWith(deck,
                            Locale.En,
                            Locale.En)
                        expect(checkEnrollment).not.toHaveBeenCalled()
                        expect(card.answer).toBeNull()
                        expect(card.explanation).toBeNull()
                    })
                it("annotates viewer deck statistics and preserves entitled premium answers",
                    async () => {
                        const card = {
                            id: "card-1",
                            isPremium: true,
                            answer: "visible answer",
                            explanation: "visible explanation",
                        }
                        const deck = {
                            id: flashcardDeckId,
                            cards: [card],
                            defaultLocale: undefined,
                        } as unknown as FlashcardDeckEntity
                        entityManager.find.mockResolvedValueOnce([deck])
                        const queryBuilder = entityManager.createQueryBuilder()
                        queryBuilder.getRawMany.mockResolvedValueOnce([{
                            deck_id: flashcardDeckId,
                            due_count: "2",
                            mastered_count: "3",
                        }])
                        const checkEnrollment = module.get(UserService).checkEnrollment as jest.Mock
                        checkEnrollment.mockResolvedValueOnce(true)

                        await service.listByCourse(courseId,
                            Locale.En,
                            "user-1")

                        expect(deck.dueCount).toBe(2)
                        expect(deck.masteredCount).toBe(3)
                        expect(card.answer).toBe("visible answer")
                        expect(card.explanation).toBe("visible explanation")
                        expect(checkEnrollment).toHaveBeenCalledWith("user-1",
                            courseId)
                    })
                it("defaults viewer statistics when the aggregate returns no row",
                    async () => {
                        const card = {
                            id: "card-1",
                            isPremium: true,
                            answer: "hidden",
                            explanation: "hidden details",
                        }
                        const deck = {
                            id: flashcardDeckId,
                            cards: [card],
                            defaultLocale: Locale.En,
                        } as unknown as FlashcardDeckEntity
                        entityManager.find.mockResolvedValueOnce([deck])
                        const checkEnrollment = module.get(UserService).checkEnrollment as jest.Mock
                        checkEnrollment.mockResolvedValueOnce(false)

                        await service.listByCourse(courseId,
                            Locale.En,
                            "user-1")

                        expect(deck.dueCount).toBe(0)
                        expect(deck.masteredCount).toBe(0)
                        expect(card.answer).toBeNull()
                        expect(card.explanation).toBeNull()
                    })
                it("computes next intervals from prior reviews and locks a premium ES card",
                    async () => {
                        const card = {
                            id: "card-1",
                            isPremium: true,
                            answer: "secret",
                            explanation: "secret details",
                        }
                        elasticsearchClient.get.mockResolvedValueOnce({
                            _source: {
                                id: flashcardDeckId,
                                courseId,
                                cards: [card],
                            },
                        })
                        entityManager.find.mockResolvedValueOnce([{
                            ease: null,
                            intervalDays: null,
                            repetitions: null,
                            flashcardCard: {
                                id: "card-1",
                            },
                        }])
                        const previewIntervals = module.get(FlashcardReviewService).previewIntervals as jest.Mock
                        previewIntervals.mockReturnValueOnce({
                            again: 1,
                            hard: 2,
                            good: 3,
                            easy: 4,
                        })
                        const checkEnrollment = module.get(UserService).checkEnrollment as jest.Mock
                        checkEnrollment.mockResolvedValueOnce(false)

                        const result = await service.getById(flashcardDeckId,
                            Locale.En,
                            "user-1")

                        expect(previewIntervals).toHaveBeenCalledWith({
                            prevEase: 2.5,
                            prevInterval: 0,
                            prevRepetitions: 0,
                        })
                        expect(result.cards[0].nextIntervals).toEqual({
                            again: 1,
                            hard: 2,
                            good: 3,
                            easy: 4,
                        })
                        expect(card.answer).toBeNull()
                        expect(card.explanation).toBeNull()
                    })

                it("keeps free cards visible while locking only premium cards for anonymous viewers",
                    async () => {
                        const freeCard = {
                            id: "free-card",
                            isPremium: false,
                            answer: "free answer",
                            explanation: "free explanation",
                        }
                        const premiumCard = {
                            id: "premium-card",
                            isPremium: true,
                            answer: "premium answer",
                            explanation: "premium explanation",
                        }
                        const deck = {
                            id: flashcardDeckId,
                            defaultLocale: Locale.En,
                            cards: [freeCard,
                                premiumCard],
                        }
                        entityManager.find.mockResolvedValueOnce([deck])

                        const result = await service.listByCourse(courseId,
                            Locale.En)

                        expect(result[0].cards).toEqual([
                            expect.objectContaining({
                                id: "free-card",
                                answer: "free answer",
                            }),
                            expect.objectContaining({
                                id: "premium-card",
                                answer: null,
                                explanation: null,
                            }),
                        ])
                    })
            })
    })
