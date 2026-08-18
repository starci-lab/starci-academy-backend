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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    FlashcardDeckEntity,
} from "@modules/databases/postgresql/primary/entities/flashcard-deck.entity"
import {
    FoundationEntity,
} from "@modules/databases/postgresql/primary/entities/foundation.entity"
import {
    MilestoneTaskEntity,
} from "@modules/databases/postgresql/primary/entities/milestone-task.entity"
import {
    MilestoneEntity,
} from "@modules/databases/postgresql/primary/entities/milestone.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    CacheKey,
} from "@modules/integrations/cache/enums/cache-key"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    AutocompleteGlobalSearchService,
} from "./autocomplete-global-search.service"
import {
    ChallengeGlobalSearchService,
} from "./entities/challenge.service"
import {
    ContentGlobalSearchService,
} from "./entities/content.service"
import {
    CourseGlobalSearchService,
} from "./entities/course.service"
import {
    FlashcardDeckGlobalSearchService,
} from "./entities/flashcard-deck.service"
import {
    FoundationGlobalSearchService,
} from "./entities/foundation.service"
import {
    MilestoneTaskGlobalSearchService,
} from "./entities/milestone-task.service"
import {
    MilestoneGlobalSearchService,
} from "./entities/milestone.service"
import {
    ModuleGlobalSearchService,
} from "./entities/module.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params the cache mock receives from the service. */
interface CacheGetParams {
    key: CacheKey
    args?: Array<unknown>
}

/**
 * Build a minimal viewer stand-in carrying only the id the service reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("AutocompleteGlobalSearchService",
    () => {
        let module: TestingModule
        let service: AutocompleteGlobalSearchService
        let entityManager: EntityManagerMock
        let winstonService: { log: jest.Mock }
        let cacheGet: jest.Mock
        let cacheSet: jest.Mock
        /** Per-entity search mocks, keyed by the entity class name they cover. */
        let searches: Record<string, jest.Mock>
        /** Parent-index cache contents, keyed by `<entityName>:<id>`. */
        let parentIndex: Map<string, unknown>
        /** Cached enrolled-course id set, or undefined to force a cache miss. */
        let enrolledCache: Array<string> | undefined

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            winstonService = {
                log: jest.fn(),
            }
            parentIndex = new Map()
            enrolledCache = undefined

            cacheGet = jest.fn(async (
                {
                    key,
                    args,
                }: CacheGetParams,
            ) => {
                if (key === CacheKey.ParentIndex) {
                    return parentIndex.get(`${String(args?.[0])}:${String(args?.[1])}`)
                }
                return enrolledCache
            })
            cacheSet = jest.fn()

            searches = {
                [CourseEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [ModuleEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [ChallengeEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [ContentEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [FlashcardDeckEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [MilestoneEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [MilestoneTaskEntity.name]: jest.fn().mockResolvedValue([
                ]),
                [FoundationEntity.name]: jest.fn().mockResolvedValue([
                ]),
            }

            module = await Test.createTestingModule({
                providers: [
                    AutocompleteGlobalSearchService,
                    {
                        provide: CourseGlobalSearchService,
                        useValue: {
                            execute: searches[CourseEntity.name],
                        },
                    },
                    {
                        provide: ModuleGlobalSearchService,
                        useValue: {
                            execute: searches[ModuleEntity.name],
                        },
                    },
                    {
                        provide: ChallengeGlobalSearchService,
                        useValue: {
                            execute: searches[ChallengeEntity.name],
                        },
                    },
                    {
                        provide: ContentGlobalSearchService,
                        useValue: {
                            execute: searches[ContentEntity.name],
                        },
                    },
                    {
                        provide: FlashcardDeckGlobalSearchService,
                        useValue: {
                            execute: searches[FlashcardDeckEntity.name],
                        },
                    },
                    {
                        provide: MilestoneGlobalSearchService,
                        useValue: {
                            execute: searches[MilestoneEntity.name],
                        },
                    },
                    {
                        provide: MilestoneTaskGlobalSearchService,
                        useValue: {
                            execute: searches[MilestoneTaskEntity.name],
                        },
                    },
                    {
                        provide: FoundationGlobalSearchService,
                        useValue: {
                            execute: searches[FoundationEntity.name],
                        },
                    },
                    {
                        provide: CacheService,
                        useValue: {
                            get: cacheGet,
                            set: cacheSet,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<AutocompleteGlobalSearchService>(AutocompleteGlobalSearchService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("returns empty buckets for a whitespace-only term without querying any index",
            async () => {
                const result = await service.execute({
                    request: {
                        query: "   ",
                    },
                    locale: Locale.En,
                })

                expect(result).toEqual({
                    courses: [
                    ],
                    modules: [
                    ],
                    challenges: [
                    ],
                    contents: [
                    ],
                    flashcardDecks: [
                    ],
                    milestones: [
                    ],
                    milestoneTasks: [
                    ],
                    foundations: [
                    ],
                })
                for (const search of Object.values(searches)) {
                    expect(search).not.toHaveBeenCalled()
                }
                expect(cacheGet).not.toHaveBeenCalled()
                expect(entityManager.find).not.toHaveBeenCalled()
            })

        it("returns empty buckets when the request carries no query at all",
            async () => {
                const result = await service.execute({
                    request: {
                        query: undefined as unknown as string,
                    },
                    locale: Locale.En,
                })

                expect(result.courses).toEqual([
                ])
                for (const search of Object.values(searches)) {
                    expect(search).not.toHaveBeenCalled()
                }
            })

        it("fans out to every indexed kind with the default size and English locale",
            async () => {
                await service.execute({
                    request: {
                        query: "  react  ",
                    },
                    locale: undefined,
                })

                for (const search of Object.values(searches)) {
                    expect(search).toHaveBeenCalledWith({
                        // the term is trimmed before it reaches the indexes
                        term: "react",
                        size: 5,
                        locale: Locale.En,
                    })
                }
            })

        it("searches only the requested kinds, honouring the requested size and locale",
            async () => {
                await service.execute({
                    request: {
                        query: "react",
                        entities: [
                            CourseEntity.name,
                        ],
                        size: 3,
                    },
                    locale: Locale.Vi,
                })

                expect(searches[CourseEntity.name]).toHaveBeenCalledWith({
                    term: "react",
                    size: 3,
                    locale: Locale.Vi,
                })
                // the seven unselected kinds are never queried
                for (const [
                    name,
                    search,
                ] of Object.entries(searches)) {
                    if (name !== CourseEntity.name) {
                        expect(search).not.toHaveBeenCalled()
                    }
                }
            })

        it("skips the course index when the filter asks for another kind",
            async () => {
                await service.execute({
                    request: {
                        query: "react",
                        entities: [
                            ModuleEntity.name,
                        ],
                    },
                    locale: Locale.En,
                })

                expect(searches[ModuleEntity.name]).toHaveBeenCalled()
                // the course index is left alone, so its bucket comes back empty
                expect(searches[CourseEntity.name]).not.toHaveBeenCalled()
            })

        it("falls back to every kind when the entity filter is an empty list",
            async () => {
                await service.execute({
                    request: {
                        query: "react",
                        entities: [
                        ],
                    },
                    locale: Locale.En,
                })

                for (const search of Object.values(searches)) {
                    expect(search).toHaveBeenCalled()
                }
            })

        it("hydrates each hit with its cached ancestor chain and a server-built route",
            async () => {
                searches[ChallengeEntity.name].mockResolvedValueOnce([
                    {
                        id: "challenge-1",
                        displayId: "ch-1",
                        title: "Closures",
                        texts: [
                            "a <em>clo</em>sure",
                        ],
                    },
                ])
                searches[MilestoneEntity.name].mockResolvedValueOnce([
                    {
                        id: "milestone-1",
                        displayId: "ms-1",
                        title: "Ship it",
                        texts: [
                        ],
                    },
                ])
                searches[ModuleEntity.name].mockResolvedValueOnce([
                    {
                        id: "module-orphan",
                        displayId: "mod-x",
                        title: "Uncached",
                        texts: [
                        ],
                    },
                ])
                parentIndex.set(`${ChallengeEntity.name}:challenge-1`,
                    {
                        challenge: {
                            id: "challenge-1",
                            displayId: "ch-1",
                        },
                        content: {
                            id: "content-1",
                            displayId: "ct-1",
                        },
                        module: {
                            id: "module-1",
                            displayId: "mod-1",
                        },
                        course: {
                            id: "course-1",
                            displayId: "fullstack",
                        },
                    })
                parentIndex.set(`${MilestoneEntity.name}:milestone-1`,
                    {
                        course: {
                            id: "course-1",
                            displayId: "fullstack",
                        },
                        task: {
                            id: "task-1",
                            displayId: "tk-1",
                        },
                    })

                const result = await service.execute({
                    request: {
                        query: "closures",
                    },
                    locale: Locale.En,
                })

                // the full challenge chain is copied level by level
                expect(result.challenges[0].parentPath).toEqual({
                    course: {
                        id: "course-1",
                        displayId: "fullstack",
                    },
                    module: {
                        id: "module-1",
                        displayId: "mod-1",
                    },
                    content: {
                        id: "content-1",
                        displayId: "ct-1",
                    },
                    challenge: {
                        id: "challenge-1",
                        displayId: "ch-1",
                    },
                    task: undefined,
                })
                expect(result.challenges[0].path).toBe(
                    "/courses/fullstack/learn/content/modules/module-1/contents/content-1/challenges/challenge-1",
                )
                // a milestone chain carries only course + first task
                expect(result.milestones[0].parentPath).toEqual({
                    course: {
                        id: "course-1",
                        displayId: "fullstack",
                    },
                    module: undefined,
                    content: undefined,
                    challenge: undefined,
                    task: {
                        id: "task-1",
                        displayId: "tk-1",
                    },
                })
                expect(result.milestones[0].path).toBe(
                    "/courses/fullstack/learn/personal-project/tasks/task-1",
                )
                // a cache miss leaves the path unset so the client renders a non-link
                expect(result.modules[0].parentPath).toBeUndefined()
                expect(result.modules[0].path).toBeNull()
            })

        it("leaves a hit unroutable when its cached ancestor chain has lost the course level",
            async () => {
                searches[ModuleEntity.name].mockResolvedValueOnce([
                    {
                        id: "module-1",
                        displayId: "mod-1",
                        title: "Basics",
                        texts: [
                        ],
                    },
                ])
                // a stale entry written by an older indexer format: module but no course
                parentIndex.set(`${ModuleEntity.name}:module-1`,
                    {
                        module: {
                            id: "module-1",
                            displayId: "mod-1",
                        },
                    })

                const result = await service.execute({
                    request: {
                        query: "basics",
                    },
                    locale: Locale.En,
                })

                expect(result.modules[0].parentPath).toEqual({
                    course: undefined,
                    module: {
                        id: "module-1",
                        displayId: "mod-1",
                    },
                    content: undefined,
                    challenge: undefined,
                    task: undefined,
                })
                // no course slug -> no course-scoped route can be built
                expect(result.modules[0].path).toBeNull()
            })

        it("dedupes hits sharing an id and display id, keeping the richest snippet set",
            async () => {
                searches[FoundationEntity.name].mockResolvedValueOnce([
                    {
                        id: "f-1",
                        displayId: "one",
                        title: "First seen",
                        texts: [
                            "a",
                        ],
                    },
                    {
                        // more highlight fragments -> wins the slot
                        id: "f-1",
                        displayId: "one",
                        title: "Richer",
                        texts: [
                            "a",
                            "b",
                        ],
                    },
                    {
                        // fewer fragments than the incumbent -> discarded
                        id: "f-1",
                        displayId: "one",
                        title: "Poorer",
                        texts: [
                            "c",
                        ],
                    },
                    {
                        id: "f-2",
                        displayId: "two",
                        title: "No texts",
                        texts: undefined,
                    },
                    {
                        // both sides count as zero fragments -> the incumbent stays
                        id: "f-2",
                        displayId: "two",
                        title: "Also no texts",
                        texts: undefined,
                    },
                    {
                        // same id but a different display id -> a distinct hit
                        id: "f-2",
                        displayId: "two-b",
                        title: "Different slug",
                        texts: [
                            "d",
                        ],
                    },
                ])

                const result = await service.execute({
                    request: {
                        query: "f",
                    },
                    locale: Locale.En,
                })

                expect(result.foundations.map((foundation) => [
                    foundation.id,
                    foundation.displayId,
                    foundation.title,
                ])).toEqual([
                    [
                        "f-1",
                        "one",
                        "Richer",
                    ],
                    [
                        "f-2",
                        "two",
                        "No texts",
                    ],
                    [
                        "f-2",
                        "two-b",
                        "Different slug",
                    ],
                ])
            })

        it("flags a course free only when neither a base price nor a phase price is charged",
            async () => {
                searches[CourseEntity.name].mockResolvedValueOnce([
                    {
                        id: "course-free",
                        displayId: "free",
                        title: "Free",
                        texts: [
                        ],
                    },
                    {
                        id: "course-base-priced",
                        displayId: "base",
                        title: "Base priced",
                        texts: [
                        ],
                    },
                    {
                        id: "course-phase-priced",
                        displayId: "phase",
                        title: "Phase priced",
                        texts: [
                        ],
                    },
                    {
                        id: "course-unknown",
                        displayId: "unknown",
                        title: "Row missing",
                        texts: [
                        ],
                    },
                ])
                enrolledCache = [
                    "course-base-priced",
                ]
                entityManager.find.mockImplementation(async (entity: unknown) => {
                    if (entity === CourseEntity) {
                        return [
                            {
                                // zero base price AND a zero-priced phase -> free
                                id: "course-free",
                                originalPrice: 0,
                                pricingPhases: [
                                    {
                                        id: "phase-1",
                                        price: 0,
                                    },
                                ],
                            },
                            {
                                // a paid base price is enough to make it not free
                                id: "course-base-priced",
                                originalPrice: 100_000,
                                pricingPhases: undefined,
                            },
                            {
                                // no base price, but a priced phase -> still not free
                                id: "course-phase-priced",
                                originalPrice: null,
                                pricingPhases: [
                                    {
                                        id: "phase-2",
                                        price: 500_000,
                                    },
                                ],
                            },
                        ]
                    }
                    return [
                    ]
                })

                const result = await service.execute({
                    request: {
                        query: "course",
                    },
                    locale: Locale.En,
                    user: fakeUser("user-1"),
                })

                expect(result.courses.map((course) => [
                    course.id,
                    course.isFree,
                    course.isEnrolled,
                ])).toEqual([
                    [
                        "course-free",
                        true,
                        false,
                    ],
                    [
                        "course-base-priced",
                        false,
                        // the cached enrolled set drives isEnrolled
                        true,
                    ],
                    [
                        "course-phase-priced",
                        false,
                        false,
                    ],
                    [
                        // no pricing row came back -> not free by default
                        "course-unknown",
                        false,
                        false,
                    ],
                ])
                // no lesson matched -> the premium lookup is skipped entirely
                expect(entityManager.find).toHaveBeenCalledTimes(1)
            })

        it("rebuilds and caches the enrolled-course set on a cache miss, dropping courseless rows",
            async () => {
                searches[CourseEntity.name].mockResolvedValueOnce([
                    {
                        id: "course-1",
                        displayId: "one",
                        title: "One",
                        texts: [
                        ],
                    },
                ])
                // cache miss -> the service must rebuild from the enrollment table
                enrolledCache = undefined
                entityManager.find.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return [
                            {
                                id: "enrollment-1",
                                course: {
                                    id: "course-1",
                                },
                            },
                            {
                                // a row whose course relation is gone must not poison the set
                                id: "enrollment-2",
                                course: undefined,
                            },
                        ]
                    }
                    return [
                    ]
                })

                const result = await service.execute({
                    request: {
                        query: "course",
                    },
                    locale: Locale.En,
                    user: fakeUser("user-1"),
                })

                // only really-enrolled rows for this user are read
                expect(entityManager.find).toHaveBeenCalledWith(
                    EnrollmentEntity,
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                            isEnrolled: true,
                        },
                    }),
                )
                // the rebuilt set is written back, with the courseless row dropped
                expect(cacheSet).toHaveBeenCalledWith({
                    key: CacheKey.UserEnrolledCourses,
                    args: [
                        "user-1",
                    ],
                    cacheResult: [
                        "course-1",
                    ],
                })
                expect(result.courses[0].isEnrolled).toBe(true)
            })

        it("treats a guest as never enrolled and skips the enrollment read entirely",
            async () => {
                searches[ContentEntity.name].mockResolvedValueOnce([
                    {
                        id: "content-premium",
                        displayId: "prem",
                        title: "Premium lesson",
                        texts: [
                        ],
                    },
                    {
                        id: "content-open",
                        displayId: "open",
                        title: "Open lesson",
                        texts: [
                        ],
                    },
                    {
                        id: "content-unknown",
                        displayId: "unknown",
                        title: "Row missing",
                        texts: [
                        ],
                    },
                ])
                entityManager.find.mockImplementation(async (entity: unknown) => {
                    if (entity === ContentEntity) {
                        return [
                            {
                                id: "content-premium",
                                isPremium: true,
                            },
                            {
                                id: "content-open",
                                isPremium: undefined,
                            },
                        ]
                    }
                    return [
                    ]
                })

                const result = await service.execute({
                    request: {
                        query: "lesson",
                    },
                    locale: Locale.En,
                    user: undefined,
                })

                // guests skip both the enrolled-set cache read and the enrollment table
                expect(cacheGet).not.toHaveBeenCalledWith(
                    expect.objectContaining({
                        key: CacheKey.UserEnrolledCourses,
                    }),
                )
                // no course matched -> only the content premium query runs
                expect(entityManager.find).toHaveBeenCalledTimes(1)
                expect(entityManager.find).toHaveBeenCalledWith(
                    ContentEntity,
                    expect.objectContaining({
                        select: {
                            id: true,
                            isPremium: true,
                        },
                    }),
                )
                expect(result.contents.map((content) => [
                    content.id,
                    content.isPremium,
                ])).toEqual([
                    [
                        "content-premium",
                        true,
                    ],
                    [
                        "content-open",
                        false,
                    ],
                    [
                        "content-unknown",
                        false,
                    ],
                ])
            })

        it("returns the buckets unenriched and logs when state-flag enrichment fails",
            async () => {
                searches[CourseEntity.name].mockResolvedValueOnce([
                    {
                        id: "course-1",
                        displayId: "one",
                        title: "One",
                        texts: [
                        ],
                    },
                ])
                entityManager.find.mockRejectedValue(new Error("connection lost"))

                const result = await service.execute({
                    request: {
                        query: "course",
                    },
                    locale: Locale.En,
                    user: fakeUser("user-1"),
                })

                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.BestEffortOperationFailed,
                    {
                        op: "global-search.attach-state-flags",
                        userId: "user-1",
                        error: "connection lost",
                    },
                )
                // search still answers -- the hit is returned WITHOUT the state fields
                expect(result.courses).toHaveLength(1)
                expect(result.courses[0].id).toBe("course-1")
                expect(result.courses[0].isEnrolled).toBeUndefined()
                expect(result.courses[0].isFree).toBeUndefined()
            })

        it("stringifies a non-Error enrichment failure and reports no user id for a guest",
            async () => {
                searches[ContentEntity.name].mockResolvedValueOnce([
                    {
                        id: "content-1",
                        displayId: "one",
                        title: "One",
                        texts: [
                        ],
                    },
                ])
                entityManager.find.mockRejectedValue("qdrant exploded")

                const result = await service.execute({
                    request: {
                        query: "lesson",
                    },
                    locale: Locale.En,
                    user: undefined,
                })

                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.BestEffortOperationFailed,
                    {
                        op: "global-search.attach-state-flags",
                        userId: undefined,
                        error: "qdrant exploded",
                    },
                )
                expect(result.contents).toHaveLength(1)
                expect(result.contents[0].isPremium).toBeUndefined()
            })
    })
