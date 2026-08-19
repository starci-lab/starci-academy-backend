// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    QueryBus,
} from "@nestjs/cqrs"
import {
    ChallengeProgressService,
} from "@modules/bussiness/progress/challenge.service"
import {
    PersonalProjectProgressService,
} from "@modules/bussiness/progress/personal-project.service"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ChallengeProgressStatus,
} from "@modules/integrations/cache/types/cache-results/challenge-submission-progress"
import {
    EnrollmentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/enrollment-not-found"
import {
    UserNotFoundException,
} from "@modules/platform/exceptions/errors/users/user"
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
    CourseQuery,
} from "../../courses/course/course.query"
import {
    MilestonesQuery,
} from "../../milestones/milestones/milestones.query"
import {
    MyCourseOutlineHandler,
} from "./my-course-outline.handler"
import {
    MyCourseOutlineQuery,
} from "./my-course-outline.query"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * Build a minimal viewer stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("MyCourseOutlineHandler",
    () => {
        let module: TestingModule
        let handler: MyCourseOutlineHandler
        let entityManager: EntityManagerMock
        let queryBus: { execute: jest.Mock }
        let challengeProgressService: { getProgress: jest.Mock }
        let personalProjectProgressService: { getProgress: jest.Mock }
        let winstonService: { log: jest.Mock }

        /**
         * Program the two query-bus reads the handler performs: the S3-sourced
         * course tree, then the ES-sourced milestone tree.
         *
         * @param course - The course entity the `CourseQuery` resolves to.
         * @param milestones - The milestone rows the `MilestonesQuery` resolves to.
         */
        const stubTrees = (
            course: unknown,
            milestones: Array<unknown>,
        ): void => {
            queryBus.execute.mockImplementation(async (query: unknown) => {
                if (query instanceof CourseQuery) {
                    return course
                }
                return {
                    data: milestones,
                }
            })
        }

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            queryBus = {
                execute: jest.fn(),
            }
            challengeProgressService = {
                getProgress: jest.fn().mockResolvedValue({
                    completionTasks: [
                    ],
                }),
            }
            personalProjectProgressService = {
                getProgress: jest.fn().mockResolvedValue({
                    completionTasks: [
                    ],
                    currentTask: null,
                }),
            }
            winstonService = {
                log: jest.fn(),
            }

            module = await Test.createTestingModule({
                providers: [
                    MyCourseOutlineHandler,
                    {
                        provide: QueryBus,
                        useValue: queryBus,
                    },
                    {
                        provide: ChallengeProgressService,
                        useValue: challengeProgressService,
                    },
                    {
                        provide: PersonalProjectProgressService,
                        useValue: personalProjectProgressService,
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

            handler = module.get<MyCourseOutlineHandler>(MyCourseOutlineHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when the viewer is missing, before touching the database",
            async () => {
                await expect(
                    handler.execute(
                        new MyCourseOutlineQuery({
                            request: {
                                courseId: "course-1",
                            },
                            user: undefined,
                            locale: Locale.En,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(queryBus.execute).not.toHaveBeenCalled()
            })

        it("throws and WARN-logs when neither an enrollment nor the course resolves",
            async () => {
                // no enrollment, and the preview course lookup misses too
                entityManager.findOne.mockResolvedValue(null)

                await expect(
                    handler.execute(
                        new MyCourseOutlineQuery({
                            request: {
                                courseId: "course-missing",
                            },
                            user: fakeUser("user-1"),
                            locale: Locale.Vi,
                        }),
                    ),
                ).rejects.toBeInstanceOf(EnrollmentNotFoundException)

                // both lookups ran, and the failure is recorded against the viewer
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    EnrollmentEntity,
                    expect.objectContaining({
                        where: {
                            user: {
                                id: "user-1",
                            },
                            course: {
                                id: "course-missing",
                            },
                        },
                    }),
                )
                expect(entityManager.findOne).toHaveBeenCalledWith(
                    CourseEntity,
                    expect.objectContaining({
                        where: {
                            id: "course-missing",
                        },
                    }),
                )
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RequestHandlingFailed,
                    expect.objectContaining({
                        op: "my-course-outline.resolve",
                        userId: "user-1",
                        meta: {
                            courseId: "course-missing",
                        },
                    }),
                )
                // the course tree is never read for an unresolvable course
                expect(queryBus.execute).not.toHaveBeenCalled()
            })

        it("serves a non-enrolled viewer a read-only preview: no progress reads, everything unread",
            async () => {
                // no enrollment; the course itself resolves -> preview path
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return null
                    }
                    return {
                        id: "course-1",
                        displayId: "fullstack",
                    }
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        modules: [
                            {
                                id: "module-1",
                                title: "Basics",
                                sortIndex: 0,
                                orderIndex: 1,
                                isPremium: false,
                                contents: [
                                    {
                                        id: "lesson-1",
                                        displayId: "intro",
                                        title: "Intro",
                                        minutesRead: 4,
                                        difficulty: "beginner",
                                        isPremium: false,
                                        sortIndex: 0,
                                        challenges: [
                                        ],
                                    },
                                    {
                                        // premium lesson stays flagged so the client locks it
                                        id: "lesson-2",
                                        displayId: "advanced",
                                        title: "Advanced",
                                        minutesRead: 9,
                                        difficulty: null,
                                        isPremium: true,
                                        sortIndex: 1,
                                        challenges: [
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    [
                    ],
                )

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: Locale.En,
                    }),
                )

                // enrollment-scoped reads are all skipped for a preview viewer
                expect(challengeProgressService.getProgress).not.toHaveBeenCalled()
                expect(personalProjectProgressService.getProgress).not.toHaveBeenCalled()
                expect(entityManager.find).not.toHaveBeenCalled()

                expect(result.course).toEqual({
                    id: "course-1",
                    title: "Fullstack",
                    displayId: "fullstack",
                })
                expect(result.modules[0].lessons.map((lesson) => [
                    lesson.id,
                    lesson.isRead,
                    lesson.isPremium,
                    lesson.difficulty,
                ])).toEqual([
                    [
                        "lesson-1",
                        false,
                        false,
                        "beginner",
                    ],
                    [
                        "lesson-2",
                        false,
                        true,
                        null,
                    ],
                ])
                // 0/2 lessons read, no challenges + no tasks -> those dimensions count as full
                expect(result.progress).toEqual({
                    lessonsRead: 0,
                    lessonsTotal: 2,
                    challengesCompleted: 0,
                    challengesTotal: 0,
                    tasksCompleted: 0,
                    tasksTotal: 0,
                    completionPercent: 67,
                })
                // both resume pointers land on the first unread lesson
                expect(result.currentTask).toEqual({
                    kind: "lesson",
                    id: "lesson-1",
                    milestoneId: null,
                })
                expect(result.nextContentTask).toEqual({
                    kind: "lesson",
                    id: "lesson-1",
                    milestoneId: null,
                })
            })

        it("defaults the tree locale to English when the request carries none",
            async () => {
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return null
                    }
                    return {
                        id: "course-1",
                        displayId: "fullstack",
                    }
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        // undefined modules must not blow up the mapper
                        modules: undefined,
                    },
                    [
                    ],
                )

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: undefined,
                    }),
                )

                const courseQuery = queryBus.execute.mock.calls
                    .map(([query]) => query)
                    .find((query) => query instanceof CourseQuery) as CourseQuery
                const milestonesQuery = queryBus.execute.mock.calls
                    .map(([query]) => query)
                    .find((query) => query instanceof MilestonesQuery) as MilestonesQuery

                expect(courseQuery.params.locale).toBe(Locale.En)
                expect(courseQuery.params.request).toEqual({
                    id: "course-1",
                    displayId: "fullstack",
                })
                expect(milestonesQuery.params.locale).toBe(Locale.En)
                expect(milestonesQuery.params.request).toEqual({
                    courseId: "course-1",
                })
                // an empty tree scores a full 100 -- every dimension is vacuously done
                expect(result.modules).toEqual([
                ])
                expect(result.progress.completionPercent).toBe(100)
                expect(result.currentTask).toBeNull()
                expect(result.nextContentTask).toBeNull()
            })

        it("overlays enrollment progress, sorts every level by sort index and resumes at the capstone task",
            async () => {
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return {
                            id: "enrollment-1",
                            course: {
                                displayId: "fullstack",
                            },
                        }
                    }
                    return null
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        modules: [
                            {
                                // deliberately out of order -- the mapper must re-sort
                                id: "module-2",
                                title: "Second",
                                sortIndex: 1,
                                orderIndex: 2,
                                isPremium: true,
                                contents: undefined,
                            },
                            {
                                id: "module-1",
                                title: "First",
                                sortIndex: 0,
                                orderIndex: 1,
                                isPremium: false,
                                contents: [
                                    {
                                        id: "lesson-2",
                                        displayId: "b",
                                        title: "B",
                                        minutesRead: 3,
                                        difficulty: "advanced",
                                        isPremium: false,
                                        sortIndex: 1,
                                        challenges: undefined,
                                    },
                                    {
                                        id: "lesson-1",
                                        displayId: "a",
                                        title: "A",
                                        minutesRead: 2,
                                        difficulty: "beginner",
                                        isPremium: false,
                                        sortIndex: 0,
                                        challenges: [
                                            {
                                                id: "challenge-2",
                                                title: "Ch2",
                                                difficulty: "hard",
                                                score: 50,
                                                sortIndex: 1,
                                            },
                                            {
                                                id: "challenge-1",
                                                title: "Ch1",
                                                difficulty: "easy",
                                                score: 10,
                                                sortIndex: 0,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    [
                        {
                            id: "milestone-2",
                            title: "M2",
                            sortIndex: 1,
                            orderIndex: 2,
                            tasks: undefined,
                        },
                        {
                            id: "milestone-1",
                            title: "M1",
                            sortIndex: 0,
                            orderIndex: 1,
                            tasks: [
                                {
                                    id: "task-2",
                                    title: "T2",
                                    type: null,
                                    maxScore: 30,
                                    sortIndex: 1,
                                },
                                {
                                    id: "task-1",
                                    title: "T1",
                                    type: "github",
                                    maxScore: 20,
                                    sortIndex: 0,
                                },
                            ],
                        },
                    ],
                )
                challengeProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                        {
                            id: "challenge-1",
                            lastScore: 10,
                            maxScore: 10,
                            completed: true,
                            status: ChallengeProgressStatus.Completed,
                            numAttempts: 1,
                        },
                    ],
                })
                personalProjectProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                        {
                            id: "task-1",
                            lastScore: 20,
                            maxScore: 20,
                            completed: true,
                            numAttempts: 1,
                        },
                    ],
                    currentTask: {
                        id: "task-2",
                        lastScore: 0,
                        maxScore: 30,
                        completed: false,
                        numAttempts: 0,
                    },
                })
                // only lesson-1 is flagged read
                entityManager.find.mockResolvedValueOnce([
                    {
                        contentId: "lesson-1",
                        isRead: true,
                    },
                    {
                        contentId: "lesson-2",
                        isRead: false,
                    },
                ])

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: Locale.En,
                    }),
                )

                // both progress services are scoped by the enrollment, not the user
                expect(challengeProgressService.getProgress).toHaveBeenCalledWith({
                    enrollmentId: "enrollment-1",
                    courseId: "course-1",
                })
                expect(personalProjectProgressService.getProgress).toHaveBeenCalledWith({
                    enrollmentId: "enrollment-1",
                    courseId: "course-1",
                })
                // read flags are keyed by enrollment id, scoped to this course
                expect(entityManager.find).toHaveBeenCalledWith(
                    UserContentEntity,
                    expect.objectContaining({
                        where: {
                            enrollment: {
                                id: "enrollment-1",
                            },
                            content: {
                                module: {
                                    course: {
                                        id: "course-1",
                                    },
                                },
                            },
                        },
                    }),
                )

                // modules, lessons, challenges and tasks all come back sort-index ordered
                expect(result.modules.map((item) => item.id)).toEqual([
                    "module-1",
                    "module-2",
                ])
                expect(result.modules[0].lessons.map((lesson) => lesson.id)).toEqual([
                    "lesson-1",
                    "lesson-2",
                ])
                expect(result.modules[1].lessons).toEqual([
                ])
                expect(result.modules[0].lessons[0].challenges).toEqual([
                    {
                        id: "challenge-1",
                        title: "Ch1",
                        difficulty: "easy",
                        maxScore: 10,
                        status: ChallengeProgressStatus.Completed,
                        lastScore: 10,
                        completed: true,
                    },
                    {
                        // no progress row -> the notStarted defaults
                        id: "challenge-2",
                        title: "Ch2",
                        difficulty: "hard",
                        maxScore: 50,
                        status: "notStarted",
                        lastScore: 0,
                        completed: false,
                    },
                ])
                expect(result.modules[0].lessons[1].challenges).toEqual([
                ])
                expect(result.milestones.map((item) => item.id)).toEqual([
                    "milestone-1",
                    "milestone-2",
                ])
                expect(result.milestones[0].tasks).toEqual([
                    {
                        id: "task-1",
                        title: "T1",
                        type: "github",
                        maxScore: 20,
                        completed: true,
                        lastScore: 20,
                        numAttempts: 1,
                    },
                    {
                        // untouched task -> nullable type passed through, zeroed progress
                        id: "task-2",
                        title: "T2",
                        type: null,
                        maxScore: 30,
                        completed: false,
                        lastScore: 0,
                        numAttempts: 0,
                    },
                ])
                expect(result.milestones[1].tasks).toEqual([
                ])

                // 1/2 lessons, 1/2 challenges, 1/2 tasks -> equal-weight 50%
                expect(result.progress).toEqual({
                    lessonsRead: 1,
                    lessonsTotal: 2,
                    challengesCompleted: 1,
                    challengesTotal: 2,
                    tasksCompleted: 1,
                    tasksTotal: 2,
                    completionPercent: 50,
                })
                // the capstone pointer wins, carrying its owning milestone
                expect(result.currentTask).toEqual({
                    kind: "milestoneTask",
                    id: "task-2",
                    milestoneId: "milestone-1",
                })
                // content resume never points at the capstone -- it picks the unread lesson
                expect(result.nextContentTask).toEqual({
                    kind: "lesson",
                    id: "lesson-2",
                    milestoneId: null,
                })
            })

        it("nulls the milestone id when the current capstone task belongs to no loaded milestone",
            async () => {
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return {
                            id: "enrollment-1",
                            course: {
                                displayId: "fullstack",
                            },
                        }
                    }
                    return null
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        modules: [
                        ],
                    },
                    [
                        {
                            id: "milestone-1",
                            title: "M1",
                            sortIndex: 0,
                            orderIndex: 1,
                            // no tasks loaded -> the owner search finds nothing
                            tasks: undefined,
                        },
                    ],
                )
                personalProjectProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                    ],
                    currentTask: {
                        id: "orphan-task",
                        lastScore: 0,
                        maxScore: 10,
                        completed: false,
                        numAttempts: 0,
                    },
                })

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: Locale.En,
                    }),
                )

                expect(result.currentTask).toEqual({
                    kind: "milestoneTask",
                    id: "orphan-task",
                    milestoneId: null,
                })
            })

        it("falls back to the first uncompleted challenge once every lesson is read",
            async () => {
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return {
                            id: "enrollment-1",
                            course: {
                                displayId: "fullstack",
                            },
                        }
                    }
                    return null
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        modules: [
                            {
                                id: "module-1",
                                title: "First",
                                sortIndex: 0,
                                orderIndex: 1,
                                isPremium: false,
                                contents: [
                                    {
                                        id: "lesson-1",
                                        displayId: "a",
                                        title: "A",
                                        minutesRead: 2,
                                        difficulty: "beginner",
                                        isPremium: false,
                                        sortIndex: 0,
                                        challenges: [
                                            {
                                                id: "challenge-1",
                                                title: "Ch1",
                                                difficulty: "easy",
                                                score: 10,
                                                sortIndex: 0,
                                            },
                                            {
                                                id: "challenge-2",
                                                title: "Ch2",
                                                difficulty: "hard",
                                                score: 50,
                                                sortIndex: 1,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    [
                    ],
                )
                challengeProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                        {
                            id: "challenge-1",
                            lastScore: 10,
                            maxScore: 10,
                            completed: true,
                            status: ChallengeProgressStatus.Completed,
                            numAttempts: 1,
                        },
                    ],
                })
                entityManager.find.mockResolvedValueOnce([
                    {
                        contentId: "lesson-1",
                        isRead: true,
                    },
                ])

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: Locale.En,
                    }),
                )

                // no capstone pointer and no unread lesson -> currentTask exhausts to null
                expect(result.currentTask).toBeNull()
                // content resume moves on to the first challenge still not completed
                expect(result.nextContentTask).toEqual({
                    kind: "challenge",
                    id: "challenge-2",
                    milestoneId: null,
                })
            })

        it("returns no resume pointer at all when every lesson and challenge is done",
            async () => {
                entityManager.findOne.mockImplementation(async (entity: unknown) => {
                    if (entity === EnrollmentEntity) {
                        return {
                            id: "enrollment-1",
                            course: {
                                displayId: "fullstack",
                            },
                        }
                    }
                    return null
                })
                stubTrees(
                    {
                        id: "course-1",
                        title: "Fullstack",
                        displayId: "fullstack",
                        modules: [
                            {
                                id: "module-1",
                                title: "First",
                                sortIndex: 0,
                                orderIndex: 1,
                                isPremium: false,
                                contents: [
                                    {
                                        id: "lesson-1",
                                        displayId: "a",
                                        title: "A",
                                        minutesRead: 2,
                                        difficulty: "beginner",
                                        isPremium: false,
                                        sortIndex: 0,
                                        challenges: [
                                            {
                                                id: "challenge-1",
                                                title: "Ch1",
                                                difficulty: "easy",
                                                score: 10,
                                                sortIndex: 0,
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    [
                        {
                            id: "milestone-1",
                            title: "M1",
                            sortIndex: 0,
                            orderIndex: 1,
                            tasks: [
                                {
                                    id: "task-1",
                                    title: "T1",
                                    type: "github",
                                    maxScore: 20,
                                    sortIndex: 0,
                                },
                            ],
                        },
                    ],
                )
                challengeProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                        {
                            id: "challenge-1",
                            lastScore: 10,
                            maxScore: 10,
                            completed: true,
                            status: ChallengeProgressStatus.Completed,
                            numAttempts: 1,
                        },
                    ],
                })
                personalProjectProgressService.getProgress.mockResolvedValueOnce({
                    completionTasks: [
                        {
                            id: "task-1",
                            lastScore: 20,
                            maxScore: 20,
                            completed: true,
                            numAttempts: 1,
                        },
                    ],
                    currentTask: null,
                })
                entityManager.find.mockResolvedValueOnce([
                    {
                        contentId: "lesson-1",
                        isRead: true,
                    },
                ])

                const result = await handler.execute(
                    new MyCourseOutlineQuery({
                        request: {
                            courseId: "course-1",
                        },
                        user: fakeUser("user-1"),
                        locale: Locale.En,
                    }),
                )

                expect(result.progress.completionPercent).toBe(100)
                expect(result.currentTask).toBeNull()
                expect(result.nextContentTask).toBeNull()
            })
    })
