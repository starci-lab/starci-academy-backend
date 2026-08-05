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
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
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
    })
