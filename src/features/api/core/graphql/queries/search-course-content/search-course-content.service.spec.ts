import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ChallengeEntity,
} from "@modules/databases/postgresql/primary/entities/challenge.entity"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    TranslationResolverService,
} from "@modules/databases/postgresql/primary/resolvers/translation.service"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import type {
    SearchCourseHit,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    SearchCourseContentService,
} from "./search-course-content.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Shape of one row in an entity's `translations` collection. */
interface TranslationRow {
    field: string
    locale: Locale
    value: string
}

/** Rows each batch-load query resolves to, keyed by the entity it loads. */
interface StubbedRows {
    contents?: Array<unknown>
    challenges?: Array<unknown>
    decks?: Array<unknown>
    tasks?: Array<unknown>
}

/**
 * Build a single translation row for the given field/locale.
 *
 * @param locale - Locale the value is written in.
 * @param value - The translated title.
 * @returns a `title` translation row shaped like the loaded relation.
 */
const titleIn = (
    locale: Locale,
    value: string,
): TranslationRow => ({
    field: "title",
    locale,
    value,
})

/**
 * Build a RAG hit carrying the fields the service reads.
 *
 * @param overrides - Per-case hit fields (kind / id / lang / score / snippet).
 * @returns a `SearchCourseHit` stand-in.
 */
const makeHit = (
    overrides: Partial<SearchCourseHit> & Pick<SearchCourseHit, "contentId" | "kind">,
): SearchCourseHit => ({
    lang: Locale.En,
    score: 0.9,
    snippet: "snippet",
    ...overrides,
})

/**
 * Assert a batch load ran for `entity` with exactly the given id list.
 *
 * @param find - The entity-manager `find` mock.
 * @param entity - The entity class expected to be loaded.
 * @param ids - The ids expected inside the `In(...)` filter.
 */
const expectLoadedIds = (
    find: jest.Mock,
    entity: unknown,
    ids: Array<string>,
): void => {
    const call = find.mock.calls.find((args) => args[0] === entity)
    expect(call).toBeDefined()
    expect((call?.[1] as { where: { id: { value: Array<string> } } }).where.id.value)
        .toEqual(ids)
}

describe("SearchCourseContentService",
    () => {
        let module: TestingModule
        let service: SearchCourseContentService
        let entityManager: EntityManagerMock
        let searchCourse: jest.Mock

        /**
         * Program the batch loads per entity class. The four loaders run inside one
         * `Promise.all` and the empty-id ones never reach the manager at all, so
         * resolving by entity is the only stable way to stub them.
         *
         * @param rows - Rows to resolve for each entity kind (missing kinds -> empty).
         */
        const stubRows = (
            rows: StubbedRows,
        ): void => {
            entityManager.find.mockImplementation(async (entity: unknown) => {
                if (entity === ContentEntity) {
                    return rows.contents ?? []
                }
                if (entity === ChallengeEntity) {
                    return rows.challenges ?? []
                }
                if (entity === FlashcardDeckEntity) {
                    return rows.decks ?? []
                }
                return rows.tasks ?? []
            })
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            searchCourse = jest.fn().mockResolvedValue({
                hits: [
                ],
            })

            module = await Test.createTestingModule({
                providers: [
                    SearchCourseContentService,
                    // pure array picker (no I/O) -> exercise the real fallback chain
                    TranslationResolverService,
                    {
                        provide: CourseRagRetrievalService,
                        useValue: {
                            searchCourse,
                        },
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<SearchCourseContentService>(SearchCourseContentService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("forwards the course scope, query and kind filter, and joins nothing when RAG misses",
            async () => {
                const results = await service.search({
                    courseId: "course-1",
                    query: "closures",
                    kinds: [
                        "challenge",
                    ],
                })

                expect(searchCourse).toHaveBeenCalledWith({
                    courseId: "course-1",
                    query: "closures",
                    kinds: [
                        "challenge",
                    ],
                })
                // no hits -> the four entity joins are skipped entirely
                expect(results).toEqual([
                ])
                expect(entityManager.find).not.toHaveBeenCalled()
            })

        it("groups `code` hits under their parent lesson and skips the unmatched kinds' queries",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "content-1",
                            kind: "content",
                            snippet: "lesson body",
                            score: 0.81,
                        }),
                        makeHit({
                            contentId: "content-1",
                            kind: "code",
                            snippet: "const a = 1",
                            score: 0.72,
                        }),
                    ],
                })
                stubRows({
                    contents: [
                        {
                            id: "content-1",
                            title: "Closures",
                            defaultLocale: Locale.En,
                            translations: [
                                titleIn(Locale.En,
                                    "Closures EN"),
                            ],
                            module: {
                                id: "module-1",
                                title: "Basics",
                                defaultLocale: Locale.En,
                                translations: [
                                    titleIn(Locale.En,
                                        "Basics EN"),
                                ],
                            },
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "closures",
                })

                // only the content lookup runs -- the other three kinds short-circuit
                expect(entityManager.find).toHaveBeenCalledTimes(1)
                // the code chunk shares the lesson id, so both land in ONE lookup
                expectLoadedIds(entityManager.find,
                    ContentEntity,
                    [
                        "content-1",
                        "content-1",
                    ])
                expect(results).toEqual([
                    {
                        kind: "content",
                        title: "Closures EN",
                        breadcrumb: "Basics EN",
                        moduleId: "module-1",
                        contentId: "content-1",
                        deckId: null,
                        taskId: null,
                        snippet: "lesson body",
                        score: 0.81,
                    },
                    {
                        kind: "content",
                        title: "Closures EN",
                        breadcrumb: "Basics EN",
                        moduleId: "module-1",
                        contentId: "content-1",
                        deckId: null,
                        taskId: null,
                        snippet: "const a = 1",
                        score: 0.72,
                    },
                ])
            })

        it("resolves a challenge hit in the chunk's locale with its module breadcrumb",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "challenge-1",
                            kind: "challenge",
                            lang: Locale.Vi,
                        }),
                    ],
                })
                stubRows({
                    challenges: [
                        {
                            id: "challenge-1",
                            title: "Fallback title",
                            defaultLocale: Locale.En,
                            translations: [
                                titleIn(Locale.Vi,
                                    "Bao dong VI"),
                            ],
                            content: {
                                id: "content-9",
                                module: {
                                    id: "module-9",
                                    title: "Module fallback",
                                    defaultLocale: Locale.En,
                                    translations: [
                                        titleIn(Locale.Vi,
                                            "Co ban VI"),
                                    ],
                                },
                            },
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "bao dong",
                })

                expectLoadedIds(entityManager.find,
                    ChallengeEntity,
                    [
                        "challenge-1",
                    ])
                // a `vi` chunk surfaces the vi title + vi breadcrumb, not the en columns
                expect(results).toEqual([
                    {
                        kind: "challenge",
                        title: "Bao dong VI",
                        breadcrumb: "Co ban VI",
                        moduleId: "module-9",
                        contentId: "content-9",
                        deckId: null,
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                ])
            })

        it("falls back to the entity title and nulls the breadcrumb when a challenge has no module",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "challenge-2",
                            kind: "challenge",
                        }),
                        makeHit({
                            contentId: "challenge-3",
                            kind: "challenge",
                        }),
                    ],
                })
                stubRows({
                    challenges: [
                        {
                            // content loaded but detached from any module
                            id: "challenge-2",
                            title: "Orphan challenge",
                            defaultLocale: null,
                            translations: [
                            ],
                            content: {
                                id: "content-2",
                                module: null,
                            },
                        },
                        {
                            // challenge whose content relation vanished entirely
                            id: "challenge-3",
                            title: "Detached challenge",
                            defaultLocale: null,
                            translations: [
                            ],
                            content: null,
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "orphan",
                })

                expect(results).toEqual([
                    {
                        kind: "challenge",
                        title: "Orphan challenge",
                        breadcrumb: null,
                        moduleId: null,
                        contentId: "content-2",
                        deckId: null,
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                    {
                        kind: "challenge",
                        title: "Detached challenge",
                        breadcrumb: null,
                        moduleId: null,
                        contentId: null,
                        deckId: null,
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                ])
            })

        it("resolves flashcard deck hits, falling back to the deck column without translations",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "deck-1",
                            kind: "flashcard",
                        }),
                        makeHit({
                            contentId: "deck-2",
                            kind: "flashcard",
                        }),
                    ],
                })
                stubRows({
                    decks: [
                        {
                            id: "deck-1",
                            title: "Deck fallback",
                            defaultLocale: Locale.En,
                            translations: [
                                titleIn(Locale.En,
                                    "Deck EN"),
                            ],
                        },
                        {
                            id: "deck-2",
                            title: "Untranslated deck",
                            defaultLocale: null,
                            translations: [
                            ],
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "deck",
                })

                expectLoadedIds(entityManager.find,
                    FlashcardDeckEntity,
                    [
                        "deck-1",
                        "deck-2",
                    ])
                // decks have no natural parent -> breadcrumb stays null, deckId carries the jump
                expect(results).toEqual([
                    {
                        kind: "flashcard",
                        title: "Deck EN",
                        breadcrumb: null,
                        moduleId: null,
                        contentId: null,
                        deckId: "deck-1",
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                    {
                        kind: "flashcard",
                        title: "Untranslated deck",
                        breadcrumb: null,
                        moduleId: null,
                        contentId: null,
                        deckId: "deck-2",
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                ])
            })

        it("resolves milestone task hits with their milestone breadcrumb, or null when detached",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "task-1",
                            kind: "milestone",
                        }),
                        makeHit({
                            contentId: "task-2",
                            kind: "milestone",
                        }),
                        makeHit({
                            contentId: "task-3",
                            kind: "milestone",
                        }),
                    ],
                })
                stubRows({
                    tasks: [
                        {
                            id: "task-1",
                            title: "Task fallback",
                            defaultLocale: Locale.En,
                            translations: [
                                titleIn(Locale.En,
                                    "Task EN"),
                            ],
                            milestone: {
                                id: "milestone-1",
                                title: "Milestone fallback",
                                defaultLocale: Locale.En,
                                translations: [
                                    titleIn(Locale.En,
                                        "Milestone EN"),
                                ],
                            },
                        },
                        {
                            // no translations anywhere -> both titles fall back to the columns
                            id: "task-2",
                            title: "Raw task",
                            defaultLocale: null,
                            translations: [
                            ],
                            milestone: {
                                id: "milestone-2",
                                title: "Raw milestone",
                                defaultLocale: null,
                                translations: [
                                ],
                            },
                        },
                        {
                            id: "task-3",
                            title: "Detached task",
                            defaultLocale: Locale.En,
                            translations: [
                            ],
                            milestone: null,
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "task",
                })

                expectLoadedIds(entityManager.find,
                    MilestoneTaskEntity,
                    [
                        "task-1",
                        "task-2",
                        "task-3",
                    ])
                expect(results.map((item) => [
                    item.kind,
                    item.title,
                    item.breadcrumb,
                    item.taskId,
                ])).toEqual([
                    [
                        "milestone",
                        "Task EN",
                        "Milestone EN",
                        "task-1",
                    ],
                    [
                        "milestone",
                        "Raw task",
                        "Raw milestone",
                        "task-2",
                    ],
                    [
                        "milestone",
                        "Detached task",
                        null,
                        "task-3",
                    ],
                ])
            })

        it("drops hits whose source row vanished since indexing, for every kind",
            async () => {
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "gone-content",
                            kind: "content",
                        }),
                        makeHit({
                            contentId: "gone-challenge",
                            kind: "challenge",
                        }),
                        makeHit({
                            contentId: "gone-deck",
                            kind: "flashcard",
                        }),
                        makeHit({
                            contentId: "gone-task",
                            kind: "milestone",
                        }),
                        makeHit({
                            contentId: "content-alive",
                            kind: "content",
                        }),
                    ],
                })
                // only the surviving lesson comes back; the other three lookups are
                // empty (their rows were deleted after indexing)
                stubRows({
                    contents: [
                        {
                            id: "content-alive",
                            title: "Still here",
                            defaultLocale: null,
                            translations: [
                            ],
                            module: null,
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "anything",
                })

                // all four kinds were queried, four stale chunks silently dropped
                expect(entityManager.find).toHaveBeenCalledTimes(4)
                expect(results).toEqual([
                    {
                        kind: "content",
                        title: "Still here",
                        breadcrumb: null,
                        moduleId: null,
                        contentId: "content-alive",
                        deckId: null,
                        taskId: null,
                        snippet: "snippet",
                        score: 0.9,
                    },
                ])
            })

        it("truncates the snippet to 280 characters and preserves the raw score",
            async () => {
                const longSnippet = "x".repeat(400)
                searchCourse.mockResolvedValueOnce({
                    hits: [
                        makeHit({
                            contentId: "content-long",
                            kind: "content",
                            snippet: longSnippet,
                            score: 0.4242,
                        }),
                    ],
                })
                stubRows({
                    contents: [
                        {
                            id: "content-long",
                            title: "Long lesson",
                            defaultLocale: Locale.En,
                            translations: [
                            ],
                            module: {
                                id: "module-long",
                                title: "Module raw",
                                defaultLocale: null,
                                translations: [
                                ],
                            },
                        },
                    ],
                })

                const results = await service.search({
                    courseId: "course-1",
                    query: "long",
                })

                expect(results[0].snippet).toHaveLength(280)
                expect(results[0].snippet).toBe(longSnippet.slice(0,
                    280))
                expect(results[0].score).toBe(0.4242)
                // module without translations falls back to its own title column
                expect(results[0].breadcrumb).toBe("Module raw")
                expect(results[0].title).toBe("Long lesson")
            })
    })
