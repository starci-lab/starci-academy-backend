import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    AIMessage,
    HumanMessage,
    SystemMessage,
} from "@langchain/core/messages"
import {
    ContentAiService,
} from "./content-ai.service"
import {
    S3NameResolverService,
} from "@modules/integrations/s3/s3-name-resolver.service"
import {
    S3ReadService,
} from "@modules/integrations/s3/s3-read.service"
import {
    CourseRagRetrievalService,
} from "@modules/integrations/rag/course-rag-retrieval.service"
import {
    UserService,
} from "../user/user.service"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ContentAiSessionTitleTooLongException,
} from "@modules/platform/exceptions/errors/courses/content-ai-session-title-too-long"
import {
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    PremiumContentAiAccessDeniedException,
} from "@modules/platform/exceptions/errors/courses/premium-content-ai-access-denied"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

// Control the hybrid stuff-vs-RAG threshold deterministically while keeping the
// REST of the real env config intact -- rag/cache/ai modules read other env
// fields at module-init, so a bare stub would crash boot. Spread the real
// config and override only the threshold.
// NOTE: the factory is hoisted above module init -> inline the literal (no outer const).
jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual("@modules/platform/env/config")
        return {
            ...actual,
            envConfig: () => {
                const config = actual.envConfig()
                return {
                    ...config,
                    services: {
                        ...config.services,
                        contentRag: {
                            ...config.services.contentRag,
                            stuffCharThreshold: 100,
                        },
                    },
                }
            },
        }
    })

/** The stuff-vs-RAG char threshold (must match the mocked envConfig above). */
const STUFF_THRESHOLD = 100

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

describe("ContentAiService",
    () => {
        let module: TestingModule
        let service: ContentAiService
        let entityManager: EntityManagerMock
        let s3ReadService: {
            json: jest.Mock
        }
        let s3NameResolverService: {
            content: jest.Mock
            repo: jest.Mock
        }
        let userService: {
            checkEnrollment: jest.Mock
            getUserByKeycloakId: jest.Mock
        }
        let contentRagRetrievalService: {
            retrieveContentExcerpt: jest.Mock
            retrieveCourseExcerpt: jest.Mock
        }

        const userId = "user-1"
        const contentId = "content-1"

        /** A short lesson body (<= threshold) -> whole-body stuff path. */
        const smallBody = "A database index speeds up lookups."

        /** A long lesson body (> threshold) -> RAG retrieval path. */
        const largeBody = "x".repeat(STUFF_THRESHOLD + 200)

        /** Standard prepareMessages params for the happy path. */
        const baseParams = {
            userId,
            contentId,
            question: "What is an index?",
            locale: Locale.En,
        }

        /** Build a MinIO content snapshot with the given scalar body. */
        const makeContent = (
            body: string,
            isPremium = false,
        ) => ({
            id: contentId,
            isPremium,
            body,
            bodies: [],
        })

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            s3ReadService = {
                json: jest.fn().mockResolvedValue(makeContent(smallBody)),
            }
            s3NameResolverService = {
                content: jest.fn((id: string,
                    locale: string) => `contents/${id}/${locale}.json`),
                repo: jest.fn((repoName: string,
                    dir: string) => `repo/${repoName}/${dir}.json`),
            }
            // default: not premium -> entitlement never consulted; program per-test
            userService = {
                checkEnrollment: jest.fn().mockResolvedValue(false),
                getUserByKeycloakId: jest.fn().mockResolvedValue(null),
            }
            contentRagRetrievalService = {
                retrieveContentExcerpt: jest.fn().mockResolvedValue({
                    excerpt: "",
                }),
                retrieveCourseExcerpt: jest.fn().mockResolvedValue({
                    excerpt: "",
                }),
            }
            // default DB row: non-premium content, owning course resolved
            entityManager.findOne.mockResolvedValue({
                id: contentId,
                isPremium: false,
                module: {
                    id: "module-1",
                    course: {
                        id: "course-1",
                    },
                },
            })

            module = await Test.createTestingModule({
                providers: [
                    ContentAiService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: S3ReadService,
                        useValue: s3ReadService,
                    },
                    {
                        provide: S3NameResolverService,
                        useValue: s3NameResolverService,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: CourseRagRetrievalService,
                        useValue: contentRagRetrievalService,
                    },
                ],
            }).compile()

            service = module.get<ContentAiService>(ContentAiService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("stuffs the WHOLE body into the system prompt (RAG not called) when body ≤ threshold",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(makeContent(smallBody))

                const { messages } = await service.prepareMessages(baseParams)

                // small lesson -> no retrieval round-trip
                expect(contentRagRetrievalService.retrieveContentExcerpt)
                    .not.toHaveBeenCalled()
                const system = messages[0] as SystemMessage
                expect(system).toBeInstanceOf(SystemMessage)
                expect(system.content).toContain(smallBody)
                // ordered: system -> (no history) -> question
                const last = messages[messages.length - 1] as HumanMessage
                expect(last).toBeInstanceOf(HumanMessage)
                expect(last.content).toBe(baseParams.question)
            })

        it("calls retrieveContentExcerpt(contentId) and grounds on its excerpt when body > threshold",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(makeContent(largeBody))
                contentRagRetrievalService.retrieveContentExcerpt
                    .mockResolvedValueOnce({
                        excerpt: "RELEVANT-CHUNK-ABOUT-INDEXES",
                    })

                const { messages } = await service.prepareMessages(baseParams)

                expect(contentRagRetrievalService.retrieveContentExcerpt)
                    .toHaveBeenCalledWith({
                        contentId,
                        query: baseParams.question,
                    })
                const system = messages[0] as SystemMessage
                // the retrieved excerpt is the grounding, not the whole large body
                expect(system.content).toContain("RELEVANT-CHUNK-ABOUT-INDEXES")
                expect(system.content).not.toContain(largeBody)
            })

        it("falls back to the WHOLE body when retrieval returns an empty excerpt",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(makeContent(largeBody))
                contentRagRetrievalService.retrieveContentExcerpt
                    .mockResolvedValueOnce({
                        excerpt: "   ",
                    })

                const { messages } = await service.prepareMessages(baseParams)

                expect(contentRagRetrievalService.retrieveContentExcerpt)
                    .toHaveBeenCalled()
                const system = messages[0] as SystemMessage
                // empty retrieval -> never degrade below stuffing the whole body
                expect(system.content).toContain(largeBody)
            })

        it("caps replayed history at the last MAX_HISTORY_MESSAGES turns",
            async () => {
                // 105 short prior turns; the window caps at MAX_HISTORY_MESSAGES
                // (100) -- the turns are tiny so all 100 also fit the char budget.
                const history = Array.from({
                    length: 105,
                },
                (_unused, index) => ({
                    role: index % 2 === 0
                        ? "user"
                        : "assistant",
                    content: `turn-${index}`,
                }))

                const { messages } = await service.prepareMessages({
                    ...baseParams,
                    history,
                })

                // messages = system + 100 history + question = 102
                expect(messages).toHaveLength(102)
                const replayed = messages.slice(1,
                    -1)
                expect(replayed).toHaveLength(100)
                // oldest replayed is turn-5 (105 - 100), newest is turn-104
                expect((replayed[0] as HumanMessage | AIMessage).content)
                    .toBe("turn-5")
                expect((replayed[99] as HumanMessage | AIMessage).content)
                    .toBe("turn-104")
                // assistant turns map to AIMessage, user turns to HumanMessage
                // (turn-5 = odd index = assistant, turn-104 = even = user)
                expect(replayed[0]).toBeInstanceOf(AIMessage)
                expect(replayed[99]).toBeInstanceOf(HumanMessage)
            })

        it("blocks premium content when the learner is not entitled",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(makeContent(smallBody,
                    true))
                entityManager.findOne.mockResolvedValueOnce({
                    id: contentId,
                    isPremium: true,
                    module: {
                        id: "module-1",
                        course: {
                            id: "course-1",
                        },
                    },
                })
                userService.checkEnrollment.mockResolvedValueOnce(false)

                await expect(
                    service.prepareMessages(baseParams),
                ).rejects.toBeInstanceOf(PremiumContentAiAccessDeniedException)
                // never reach grounding when the gate trips
                expect(contentRagRetrievalService.retrieveContentExcerpt)
                    .not.toHaveBeenCalled()
            })

        it("allows premium content when the learner is entitled",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(makeContent(smallBody,
                    true))
                entityManager.findOne.mockResolvedValueOnce({
                    id: contentId,
                    isPremium: true,
                    module: {
                        id: "module-1",
                        course: {
                            id: "course-1",
                        },
                    },
                })
                userService.checkEnrollment.mockResolvedValueOnce(true)

                const { messages } = await service.prepareMessages(baseParams)

                expect(userService.checkEnrollment)
                    .toHaveBeenCalledWith(userId,
                        "course-1")
                expect(messages[0]).toBeInstanceOf(SystemMessage)
            })

        it("throws ContentNotFoundException when the body snapshot is missing",
            async () => {
                s3ReadService.json.mockResolvedValueOnce(null)

                await expect(
                    service.prepareMessages(baseParams),
                ).rejects.toBeInstanceOf(ContentNotFoundException)
            })

        // ── ENTITLEMENT PER SCOPE -- the security surface ────────────────────────
        // A content-AI answer must never surface material the viewer is not
        // entitled to. Each non-content scope has its own gate; these lock the
        // enrolled/not-enrolled behaviour so a future refactor can't silently
        // re-open the leak.
        describe("entitlement per scope",
            () => {
                const taskId = "task-1"
                const foundationId = "foundation-1"
                const courseId = "course-9"

                /** A milestone-task row joined to its owning course (task->course gate). */
                const taskRow = {
                    id: taskId,
                    milestone: {
                        id: "milestone-1",
                        course: {
                            id: courseId,
                        },
                    },
                }

                it("TASK · not enrolled → NO capstone material fetched (no leak)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(taskRow)
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        const { messages } = await service.prepareMessages({
                            userId,
                            taskId,
                            question: "What does this task need?",
                            locale: Locale.En,
                        })

                        // gate resolved the owning course...
                        expect(userService.checkEnrollment)
                            .toHaveBeenCalledWith(userId,
                                courseId)
                        // ...and refused BEFORE retrieval -> no capstone brief pulled
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                        const system = messages[0] as SystemMessage
                        expect(system.content).toContain("TASK MATERIAL")
                    })

                it("TASK · enrolled → grounds on the task's own material",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(taskRow)
                        userService.checkEnrollment.mockResolvedValueOnce(true)
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "TASK-BRIEF-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            taskId,
                            question: "What does this task need?",
                            locale: Locale.En,
                        })

                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId: taskId,
                                query: "What does this task need?",
                            })
                        expect((messages[0] as SystemMessage).content)
                            .toContain("TASK-BRIEF-CHUNK")
                    })

                it("CHALLENGE · not enrolled → NO brief/test-cases fetched (no leak)",
                    async () => {
                        // challenge -> content -> module -> course row
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "challenge-1",
                            content: {
                                id: "content-1",
                                module: {
                                    id: "module-1",
                                    course: {
                                        id: courseId,
                                    },
                                },
                            },
                        })
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        const { messages } = await service.prepareMessages({
                            userId,
                            challengeId: "challenge-1",
                            question: "What does this challenge want?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment)
                            .toHaveBeenCalledWith(userId,
                                courseId)
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                        expect((messages[0] as SystemMessage).content)
                            .toContain("CHALLENGE MATERIAL")
                    })

                it("QUIZ · not enrolled → NO answers fetched (no leak)",
                    async () => {
                        // quiz deck -> course (direct course_id)
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "deck-1",
                            course: {
                                id: courseId,
                            },
                        })
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        const { messages } = await service.prepareMessages({
                            userId,
                            quizId: "deck-1",
                            question: "Why is A correct?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment)
                            .toHaveBeenCalledWith(userId,
                                courseId)
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                        expect((messages[0] as SystemMessage).content)
                            .toContain("QUIZ MATERIAL")
                    })

                it("COURSE · not enrolled → grounds on course RAG with PREMIUM content EXCLUDED (no leak)",
                    async () => {
                        userService.checkEnrollment.mockResolvedValueOnce(false)
                        entityManager.find.mockResolvedValueOnce([
                            {
                                id: "premium-1",
                            },
                            {
                                id: "premium-2",
                            },
                        ])
                        contentRagRetrievalService.retrieveCourseExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "FREE-COURSE-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            courseId,
                            question: "What does this course cover?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment)
                            .toHaveBeenCalledWith(userId,
                                courseId)
                        // never the binary block anymore -- the RAG call itself
                        // excludes every premium lesson id of the course
                        expect(contentRagRetrievalService.retrieveCourseExcerpt)
                            .toHaveBeenCalledWith({
                                courseId,
                                query: "What does this course cover?",
                                excludeContentIds: [
                                    "premium-1",
                                    "premium-2",
                                ],
                            })
                        expect((messages[0] as SystemMessage).content)
                            .toContain("FREE-COURSE-CHUNK")
                    })

                it("COURSE · enrolled → grounds on course-wide RAG",
                    async () => {
                        userService.checkEnrollment.mockResolvedValueOnce(true)
                        contentRagRetrievalService.retrieveCourseExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "COURSE-WIDE-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            courseId,
                            question: "What does this course cover?",
                            locale: Locale.En,
                        })

                        expect(contentRagRetrievalService.retrieveCourseExcerpt)
                            .toHaveBeenCalledWith({
                                courseId,
                                query: "What does this course cover?",
                            })
                        expect((messages[0] as SystemMessage).content)
                            .toContain("COURSE-WIDE-CHUNK")
                    })

                it("FOUNDATION · global library → grounds WITHOUT an enrollment gate",
                    async () => {
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "FOUNDATION-DOC-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            foundationId,
                            question: "Explain this concept",
                            locale: Locale.En,
                        })

                        // foundation is a global library -> NO enrollment check at all
                        expect(userService.checkEnrollment)
                            .not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId: foundationId,
                                query: "Explain this concept",
                            })
                        expect((messages[0] as SystemMessage).content)
                            .toContain("FOUNDATION-DOC-CHUNK")
                    })
            })

        // ── SESSION PERSISTENCE PER SCOPE -- the anchor + ownership surface ───────
        // The session-per-scope model persists task/foundation/course conversations
        // alongside content ones. These lock (1) which anchor column each scope
        // writes, (2) that a foundation session keys off the raw USER (no
        // enrollment), and (3) that a turn only persists under a session the caller
        // OWNS -- the security invariant that stops writing into someone else's chat.
        describe("session persistence per scope",
            () => {
                const taskId = "task-1"
                const foundationId = "foundation-1"
                const courseId = "course-9"
                const enrollmentId = "enr-1"
                const sessionId = "session-1"

                /** A milestone-task row joined to its owning course (task->course anchor). */
                const taskRow = {
                    id: taskId,
                    milestone: {
                        id: "milestone-1",
                        course: {
                            id: courseId,
                        },
                    },
                }

                /** `insert` is not part of the shared mock -- wire it per test. */
                let insert: jest.Mock
                beforeEach(() => {
                    insert = jest.fn().mockResolvedValue({
                    })
                    ;(entityManager as unknown as { insert: jest.Mock }).insert = insert
                })

                it("createSession CONTENT → anchors on origin_content_id + enrollment",
                    async () => {
                        // resolveEnrollmentId: content -> owning course, then enrollment row
                        entityManager.findOne.mockResolvedValueOnce({
                            id: contentId,
                            module: {
                                id: "module-1",
                                course: {
                                    id: "course-1",
                                },
                            },
                        })
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            scope: "content",
                            contentId,
                        })

                        expect(entityManager.save).toHaveBeenCalled()
                        const created = entityManager.create.mock.calls[0][1]
                        expect(created).toMatchObject({
                            scope: "content",
                            enrollmentId,
                            originContentId: contentId,
                        })
                        // a plain (non-selection) session is NOT born-archived
                        expect(created.archivedAt).toBeNull()
                    })

                it("createSession · archived flag → BORN-ARCHIVED (archived_at stamped)",
                    async () => {
                        // foundation scope keeps the case free of DB lookups
                        await service.createSession({
                            userId,
                            scope: "foundation",
                            foundationId,
                            archived: true,
                        })

                        const created = entityManager.create.mock.calls[0][1]
                        expect(created.archivedAt).toBeInstanceOf(Date)
                    })

                it("createSession TASK → resolves task→course→enrollment, anchors on origin_task_id",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(taskRow)
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            scope: "task",
                            taskId,
                        })

                        const created = entityManager.create.mock.calls[0][1]
                        expect(created).toMatchObject({
                            scope: "task",
                            enrollmentId,
                            originTaskId: taskId,
                        })
                    })

                it("createSession TASK · not enrolled → null, NO row created",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(taskRow)
                        // no enrollment row for this (user, course)
                        entityManager.query.mockResolvedValueOnce([])

                        const id = await service.createSession({
                            userId,
                            scope: "task",
                            taskId,
                        })

                        expect(id).toBeNull()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("createSession FOUNDATION → GLOBAL: anchors on the USER, no enrollment lookup",
                    async () => {
                        const id = await service.createSession({
                            userId,
                            scope: "foundation",
                            foundationId,
                        })

                        // global doc -> never resolves an enrollment
                        expect(entityManager.query).not.toHaveBeenCalled()
                        expect(id).not.toBeNull()
                        const created = entityManager.create.mock.calls[0][1]
                        expect(created).toMatchObject({
                            scope: "foundation",
                            userId,
                            originFoundationId: foundationId,
                        })
                        expect(created.enrollmentId).toBeUndefined()
                    })

                it("createSession COURSE · not enrolled → null, NO row created",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        const id = await service.createSession({
                            userId,
                            scope: "course",
                            courseId,
                        })

                        expect(id).toBeNull()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("saveTurn FOUNDATION → owned via USER: writes user_id, null enrollment + content",
                    async () => {
                        entityManager.query
                            // resolveOwnedSession -> owned via user (no enrollment)
                            .mockResolvedValueOnce([
                                {
                                    enrollmentId: null,
                                    userId,
                                },
                            ])
                            // auto-title UPDATE
                            .mockResolvedValueOnce([])

                        await service.saveTurn({
                            userId,
                            sessionId,
                            question: "Explain this",
                            answer: "Here is the explanation.",
                        })

                        expect(insert).toHaveBeenCalled()
                        const rows = insert.mock.calls[0][1] as Array<Record<string, unknown>>
                        expect(rows[0]).toMatchObject({
                            sessionId,
                            userId,
                            enrollmentId: null,
                            contentId: null,
                            role: "user",
                        })
                        expect(rows[1]).toMatchObject({
                            role: "assistant",
                        })
                    })

                it("saveTurn · session NOT owned → no insert (cannot write into another's chat)",
                    async () => {
                        // resolveOwnedSession -> no owned row
                        entityManager.query.mockResolvedValueOnce([])

                        await service.saveTurn({
                            userId,
                            sessionId: "someone-elses-session",
                            question: "q",
                            answer: "a",
                        })

                        expect(insert).not.toHaveBeenCalled()
                    })
            })

        // ── SCOPE-AWARE HISTORY LISTING -- the reload/re-open surface ─────────────
        // Listing must fetch only the CURRENT scope's conversations, keyed off the
        // right owner: a task lists by (enrollment, origin_task_id); a GLOBAL
        // foundation lists by (user_id, origin_foundation_id) with NO enrollment.
        // These lock the owner/anchor params so a refactor can't cross the streams.
        describe("scope-aware listing",
            () => {
                const taskId = "task-1"
                const foundationId = "foundation-1"
                const courseId = "course-9"
                const enrollmentId = "enr-1"

                const taskRow = {
                    id: taskId,
                    milestone: {
                        id: "milestone-1",
                        course: {
                            id: courseId,
                        },
                    },
                }

                it("TASK → lists keyed on (enrollment_id, scope='task', origin_task_id)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(taskRow)
                        entityManager.query
                            // resolveEnrollmentByCourse
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            // the list query
                            .mockResolvedValueOnce([])

                        await service.sessions({
                            userId,
                            scope: "task",
                            taskId,
                        })

                        // the SECOND query is the list; its params carry the owner +
                        // scope + task anchor
                        const listCall = entityManager.query.mock.calls[1]
                        const [
                            sql,
                            params,
                        ] = listCall
                        expect(sql).toContain("s.enrollment_id = $1")
                        expect(sql).toContain("s.scope = $2")
                        expect(sql).toContain("s.origin_task_id = $3")
                        expect(params.slice(0,
                            3)).toEqual([
                            enrollmentId,
                            "task",
                            taskId,
                        ])
                    })

                it("FOUNDATION → lists keyed on the USER (no enrollment), scope='foundation'",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        await service.sessions({
                            userId,
                            scope: "foundation",
                            foundationId,
                        })

                        // global doc -> NO enrollment lookup, single (list) query
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("s.user_id = $1")
                        expect(sql).toContain("s.origin_foundation_id = $3")
                        expect(params.slice(0,
                            3)).toEqual([
                            userId,
                            "foundation",
                            foundationId,
                        ])
                    })

                it("COURSE · not enrolled → empty list, no leak",
                    async () => {
                        // resolveEnrollmentByCourse -> no enrollment
                        entityManager.query.mockResolvedValueOnce([])

                        const list = await service.sessions({
                            userId,
                            scope: "course",
                            courseId,
                        })

                        expect(list).toEqual([])
                        // never ran the list query (bailed at the owner resolve)
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })
            })

        // ── ADDITIVE BASE GROUNDING -- the app-wide layered-context surface ───────
        // A question layers a course-wide BASE under whichever page grounding
        // applies (content/task/challenge/quiz), and a truly anchorless request
        // (no page, no course) is the "global" app-wide chat -- never throws.
        describe("additive BASE grounding (app-wide chat)",
            () => {
                it("CONTENT · additive BASE layers course-wide RAG UNDER the lesson's own material",
                    async () => {
                        userService.checkEnrollment.mockResolvedValueOnce(true)
                        contentRagRetrievalService.retrieveCourseExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "COURSE-WIDE-BASE-CHUNK",
                            })

                        const { messages } = await service.prepareMessages(baseParams)

                        const system = messages[0] as SystemMessage
                        // the additive BASE section, ahead of the page section...
                        expect(system.content).toContain("=== COURSE KNOWLEDGE (retrieved) ===")
                        expect(system.content).toContain("COURSE-WIDE-BASE-CHUNK")
                        // ...AND the lesson's own page grounding, unchanged
                        expect(system.content).toContain("=== LESSON CONTENT ===")
                        expect(system.content).toContain(smallBody)
                        expect(contentRagRetrievalService.retrieveCourseExcerpt)
                            .toHaveBeenCalledWith({
                                courseId: "course-1",
                                query: baseParams.question,
                            })
                    })

                it("GLOBAL · fully anchorless (no anchor, no course) → general tutor, no base section, never throws",
                    async () => {
                        const { messages } = await service.prepareMessages({
                            userId,
                            question: "How do I reverse a linked list?",
                            locale: Locale.En,
                        })

                        // no course to resolve -> no entitlement / RAG machinery touched at all
                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveCourseExcerpt).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveContentExcerpt).not.toHaveBeenCalled()

                        const system = messages[0] as SystemMessage
                        expect(system.content).not.toContain("=== COURSE KNOWLEDGE (retrieved) ===")
                        expect(system.content).toContain("general, sharp programming tutor")
                        const last = messages[messages.length - 1] as HumanMessage
                        expect(last.content).toBe("How do I reverse a linked list?")
                    })

                it("CHALLENGE · enrolled → grounds on the challenge's own material",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "challenge-1",
                            content: {
                                id: contentId,
                                module: {
                                    id: "module-1",
                                    course: {
                                        id: "course-9",
                                    },
                                },
                            },
                        })
                        userService.checkEnrollment.mockResolvedValue(true)
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "CHALLENGE-BRIEF-CHUNK",
                            })
                        contentRagRetrievalService.retrieveCourseExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "COURSE-BASE-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            challengeId: "challenge-1",
                            question: "What does this challenge want?",
                            locale: Locale.En,
                        })

                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId: "challenge-1",
                                query: "What does this challenge want?",
                            })
                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).toContain("CHALLENGE-BRIEF-CHUNK")
                        // the course-wide BASE layers UNDER the challenge's own material
                        expect(system).toContain("COURSE-BASE-CHUNK")
                        expect(system.indexOf("COURSE-BASE-CHUNK"))
                            .toBeLessThan(system.indexOf("CHALLENGE-BRIEF-CHUNK"))
                    })

                it("QUIZ · enrolled → grounds on the deck's own question/answer material",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "deck-1",
                            course: {
                                id: "course-9",
                            },
                        })
                        userService.checkEnrollment.mockResolvedValue(true)
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "QUIZ-QA-CHUNK",
                            })

                        const { messages } = await service.prepareMessages({
                            userId,
                            quizId: "deck-1",
                            question: "Why is A correct?",
                            locale: Locale.En,
                        })

                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId: "deck-1",
                                query: "Why is A correct?",
                            })
                        expect((messages[0] as SystemMessage).content)
                            .toContain("QUIZ-QA-CHUNK")
                    })

                it("TASK · unknown owning course → refuses without ever asking about enrollment",
                    async () => {
                        // the task row (or its milestone->course join) does not resolve
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const { messages } = await service.prepareMessages({
                            userId,
                            taskId: "ghost-task",
                            question: "What is this?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                        // ...and with no course there is no BASE layer either
                        expect((messages[0] as SystemMessage).content)
                            .not.toContain("=== COURSE KNOWLEDGE (retrieved) ===")
                    })

                it("CHALLENGE · unknown owning course → refuses without an enrollment check",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.prepareMessages({
                            userId,
                            challengeId: "ghost-challenge",
                            question: "What is this?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                    })

                it("QUIZ · unknown owning course → refuses without an enrollment check",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await service.prepareMessages({
                            userId,
                            quizId: "ghost-deck",
                            question: "What is this?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                    })

                it("CONTENT · premium flag falls back to the MinIO snapshot when the DB row is gone",
                    async () => {
                        s3ReadService.json.mockResolvedValueOnce(makeContent(smallBody,
                            true))
                        // no live row -> the snapshot's own isPremium decides, and with
                        // no owning course the viewer can never be entitled
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(
                            service.prepareMessages(baseParams),
                        ).rejects.toBeInstanceOf(PremiumContentAiAccessDeniedException)
                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                    })

                it("CONTENT · unknown owning course → no BASE layer and no enrollment check",
                    async () => {
                        // a non-premium lesson whose module/course join does not resolve
                        entityManager.findOne.mockResolvedValueOnce({
                            id: contentId,
                            isPremium: false,
                            module: null,
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect(userService.checkEnrollment).not.toHaveBeenCalled()
                        expect(contentRagRetrievalService.retrieveCourseExcerpt)
                            .not.toHaveBeenCalled()
                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).not.toContain("=== COURSE KNOWLEDGE (retrieved) ===")
                        expect(system).toContain(smallBody)
                    })

                it("pins the reply language to Vietnamese for a vi request",
                    async () => {
                        const { messages } = await service.prepareMessages({
                            ...baseParams,
                            locale: Locale.Vi,
                        })

                        expect((messages[0] as SystemMessage).content)
                            .toContain("Reply in Vietnamese")
                        expect(s3NameResolverService.content)
                            .toHaveBeenCalledWith(contentId,
                                Locale.Vi)
                    })
            })

        // ── HISTORY WINDOW -- the rolling TOKEN budget, not a flat turn count ─────
        describe("rolling history budget",
            () => {
                it("drops the oldest turns once the char budget is spent, keeping the newest",
                    async () => {
                        // budget = 24000 - prompt - question - 3000 reserve; two 11k
                        // turns already overrun it, so only the newest survives
                        const history = [
                            {
                                role: "user",
                                content: `old-${"o".repeat(20_000)}`,
                            },
                            {
                                role: "assistant",
                                content: `mid-${"m".repeat(20_000)}`,
                            },
                            {
                                role: "user",
                                content: "newest-turn",
                            },
                        ]

                        const { messages } = await service.prepareMessages({
                            ...baseParams,
                            history,
                        })

                        // system + 1 replayed turn + question
                        expect(messages).toHaveLength(3)
                        expect((messages[1] as HumanMessage).content).toBe("newest-turn")
                    })

                it("replays nothing when the grounding alone consumes the whole input budget",
                    async () => {
                        // a lesson body far past the 24k input budget leaves zero room
                        s3ReadService.json.mockResolvedValueOnce(
                            makeContent("z".repeat(30_000)),
                        )
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "y".repeat(30_000),
                            })

                        const { messages } = await service.prepareMessages({
                            ...baseParams,
                            history: [
                                {
                                    role: "user",
                                    content: "any prior turn",
                                },
                            ],
                        })

                        expect(messages).toHaveLength(2)
                        expect(messages[1]).toBeInstanceOf(HumanMessage)
                    })
            })

        // ── FULL-SOURCE GROUNDING -- the sandbox lesson code path ────────────────
        describe("sandbox lesson code grounding",
            () => {
                /** A sandbox content snapshot pointing at a repo file map in MinIO. */
                const sandboxContent = (
                    body: string,
                    overrides: Record<string, unknown> = {
                    },
                ) => ({
                    id: contentId,
                    isPremium: false,
                    body,
                    bodies: [],
                    isSandbox: true,
                    githubBaseUrl: "https://github.com/org/demo-repo",
                    githubDir: "frontend",
                    ...overrides,
                })

                /** Route the single S3 mock by key: lesson snapshot vs repo file map. */
                const s3Returns = (
                    content: unknown,
                    files: unknown,
                ) => {
                    s3ReadService.json.mockImplementation(async (
                        args: {
                            key: string
                        },
                    ) => args.key.startsWith("repo/")
                        ? files
                        : content)
                }

                it("stuffs the whole body AND every repo file when the lesson fits",
                    async () => {
                        s3Returns(sandboxContent(smallBody),
                            {
                                "/src/App.tsx": {
                                    code: "export const App = () => null",
                                },
                                "/src/util.ts": {
                                    code: "export const sum = (a, b) => a + b",
                                },
                            })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect(s3NameResolverService.repo)
                            .toHaveBeenCalledWith("demo-repo",
                                "frontend")
                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).toContain("=== LESSON CODE (full source) ===")
                        expect(system).toContain("// /src/App.tsx")
                        expect(system).toContain("export const sum = (a, b) => a + b")
                        expect(system).toContain(smallBody)
                        // the whole lesson fit -> no retrieval round-trip
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                    })

                it("skips lockfiles, minified artifacts, sourcemaps, vendored and empty files",
                    async () => {
                        s3Returns(sandboxContent(smallBody),
                            {
                                "package-lock.json": {
                                    code: "LOCKFILE-NOISE",
                                },
                                "yarn.lock": {
                                    code: "YARN-NOISE",
                                },
                                "dist/app.min.js": {
                                    code: "MINIFIED-NOISE",
                                },
                                "dist/app.js.map": {
                                    code: "SOURCEMAP-NOISE",
                                },
                                "node_modules/left-pad/index.js": {
                                    code: "VENDORED-NOISE",
                                },
                                "/src/blank.ts": {
                                    code: "   \n",
                                },
                                "/src/missing.ts": {
                                },
                                "/src/App.tsx": {
                                    code: "REAL-SOURCE",
                                },
                            })

                        const { messages } = await service.prepareMessages(baseParams)

                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).toContain("REAL-SOURCE")
                        for (const noise of [
                            "LOCKFILE-NOISE",
                            "YARN-NOISE",
                            "MINIFIED-NOISE",
                            "SOURCEMAP-NOISE",
                            "VENDORED-NOISE",
                        ]) {
                            expect(system).not.toContain(noise)
                        }
                        expect(system).not.toContain("/src/blank.ts")
                        expect(system).not.toContain("/src/missing.ts")
                    })

                it("RAG-retrieves instead of stuffing once body + code outgrow the context window",
                    async () => {
                        s3Returns(sandboxContent(smallBody),
                            {
                                "/src/huge.ts": {
                                    code: "q".repeat(30_000),
                                },
                            })
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "RELEVANT-CODE-CHUNK",
                            })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .toHaveBeenCalledWith({
                                contentId,
                                query: baseParams.question,
                            })
                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).toContain("RELEVANT-CODE-CHUNK")
                        expect(system).not.toContain("q".repeat(30_000))
                    })

                it("truncates the stuffed lesson to the budget when retrieval also misses",
                    async () => {
                        s3Returns(sandboxContent(smallBody),
                            {
                                "/src/huge.ts": {
                                    code: "q".repeat(30_000),
                                },
                            })
                        contentRagRetrievalService.retrieveContentExcerpt
                            .mockResolvedValueOnce({
                                excerpt: "   ",
                            })

                        const { messages } = await service.prepareMessages(baseParams)

                        const system = (messages[0] as SystemMessage).content as string
                        // never degrades below body-only: the head of the stuffed lesson
                        // survives, capped at the 24k budget
                        expect(system).toContain(smallBody)
                        expect(system).toContain("=== LESSON CODE (full source) ===")
                        expect(system).not.toContain("q".repeat(30_000))
                    })

                it("degrades to body-only when the repo file map is missing from MinIO",
                    async () => {
                        s3Returns(sandboxContent(smallBody),
                            null)

                        const { messages } = await service.prepareMessages(baseParams)

                        const system = (messages[0] as SystemMessage).content as string
                        expect(system).toContain(smallBody)
                        expect(system).not.toContain("=== LESSON CODE (full source) ===")
                    })

                it("degrades to body-only when the repo read throws",
                    async () => {
                        s3ReadService.json.mockImplementation(async (
                            args: {
                                key: string
                            },
                        ) => {
                            if (args.key.startsWith("repo/")) {
                                throw new Error("MinIO unavailable")
                            }
                            return sandboxContent(smallBody)
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect((messages[0] as SystemMessage).content).toContain(smallBody)
                    })

                it("never reads a repo for a lesson missing its base URL or directory",
                    async () => {
                        s3Returns(sandboxContent(smallBody,
                            {
                                githubBaseUrl: null,
                            }),
                        {
                        })

                        await service.prepareMessages(baseParams)
                        expect(s3NameResolverService.repo).not.toHaveBeenCalled()

                        s3Returns(sandboxContent(smallBody,
                            {
                                githubDir: null,
                            }),
                        {
                        })

                        await service.prepareMessages(baseParams)
                        expect(s3NameResolverService.repo).not.toHaveBeenCalled()
                    })

                it("never reads a repo when the base URL has no trailing repo segment",
                    async () => {
                        s3Returns(sandboxContent(smallBody,
                            {
                                githubBaseUrl: "https://github.com/org/",
                            }),
                        {
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect(s3NameResolverService.repo).not.toHaveBeenCalled()
                        expect((messages[0] as SystemMessage).content).toContain(smallBody)
                    })
            })

        // ── V2 BODY RESOLUTION -- snapshot content keeps `body` empty ────────────
        describe("lesson body resolution",
            () => {
                it("prefers the locale translation of the first non-empty V2 bucket",
                    async () => {
                        s3ReadService.json.mockResolvedValueOnce({
                            id: contentId,
                            isPremium: false,
                            body: "",
                            bodies: [
                                {
                                    body: "bucket default markdown",
                                    translations: [
                                        {
                                            locale: Locale.Vi,
                                            body: "ban dich tieng viet",
                                        },
                                    ],
                                },
                            ],
                        })

                        const { messages } = await service.prepareMessages({
                            ...baseParams,
                            locale: Locale.Vi,
                        })

                        expect((messages[0] as SystemMessage).content)
                            .toContain("ban dich tieng viet")
                    })

                it("falls back to the bucket's own markdown when the locale has no translation",
                    async () => {
                        s3ReadService.json.mockResolvedValueOnce({
                            id: contentId,
                            isPremium: false,
                            body: "  ",
                            bodies: [
                                {
                                    body: "bucket default markdown",
                                },
                            ],
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect((messages[0] as SystemMessage).content)
                            .toContain("bucket default markdown")
                    })

                it("walks past an empty bucket to the first one carrying markdown",
                    async () => {
                        s3ReadService.json.mockResolvedValueOnce({
                            id: contentId,
                            isPremium: false,
                            body: "",
                            bodies: [
                                {
                                    body: "   ",
                                    translations: [],
                                },
                                {
                                    body: "second bucket markdown",
                                },
                            ],
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        expect((messages[0] as SystemMessage).content)
                            .toContain("second bucket markdown")
                    })

                it("grounds on nothing (rather than throwing) when the snapshot has no body at all",
                    async () => {
                        s3ReadService.json.mockResolvedValueOnce({
                            id: contentId,
                            isPremium: false,
                            body: "",
                        })

                        const { messages } = await service.prepareMessages(baseParams)

                        // the lesson section is still rendered, just empty
                        expect((messages[0] as SystemMessage).content)
                            .toContain("=== LESSON CONTENT ===")
                        expect(contentRagRetrievalService.retrieveContentExcerpt)
                            .not.toHaveBeenCalled()
                    })
            })

        describe("resolveUserIdByKeycloakId",
            () => {
                it("resolves the real user id behind a Keycloak subject",
                    async () => {
                        userService.getUserByKeycloakId.mockResolvedValueOnce({
                            id: "user-uuid",
                        })

                        await expect(service.resolveUserIdByKeycloakId("kc-sub"))
                            .resolves.toBe("user-uuid")
                        expect(userService.getUserByKeycloakId)
                            .toHaveBeenCalledWith("kc-sub")
                    })

                it("returns null when no user matches the subject",
                    async () => {
                        userService.getUserByKeycloakId.mockResolvedValueOnce(null)

                        await expect(service.resolveUserIdByKeycloakId("kc-ghost"))
                            .resolves.toBeNull()
                    })
            })

        // ── SESSION CREATION -- scope derivation + per-scope anchoring ───────────
        describe("createSession scope derivation and anchoring",
            () => {
                const enrollmentId = "enr-1"

                it("derives every scope from the anchor priority when none is pinned",
                    async () => {
                        // no anchor at all -> the app-wide global chat
                        const id = await service.createSession({
                            userId,
                        })

                        expect(id).not.toBeNull()
                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "global",
                            userId,
                        })
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("derives the CONTENT scope from a content anchor",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            contentId,
                        })

                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "content",
                            enrollmentId,
                            originContentId: contentId,
                        })
                    })

                it("derives the CHALLENGE scope and anchors on origin_challenge_id",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "challenge-1",
                            content: {
                                module: {
                                    course: {
                                        id: "course-9",
                                    },
                                },
                            },
                        })
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            challengeId: "challenge-1",
                        })

                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "challenge",
                            enrollmentId,
                            originChallengeId: "challenge-1",
                        })
                    })

                it("derives the QUIZ scope and anchors on origin_quiz_id",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "deck-1",
                            course: {
                                id: "course-9",
                            },
                        })
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            quizId: "deck-1",
                        })

                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "quiz",
                            enrollmentId,
                            originQuizId: "deck-1",
                        })
                    })

                it("derives the COURSE scope and anchors on the enrollment alone",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            courseId: "course-9",
                        })

                        const created = entityManager.create.mock.calls[0][1]
                        expect(created).toMatchObject({
                            scope: "course",
                            enrollmentId,
                        })
                        expect(created.originContentId).toBeUndefined()
                    })

                it("derives the FOUNDATION scope from a foundation anchor",
                    async () => {
                        await service.createSession({
                            userId,
                            foundationId: "foundation-1",
                        })

                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "foundation",
                            originFoundationId: "foundation-1",
                        })
                    })

                // one case row per scope: the row is the argument list, so a scope is a
                // single-element tuple -- a second element would be an argument the case
                // never receives.
                it.each([
                    [
                        "content",
                    ],
                    [
                        "challenge",
                    ],
                    [
                        "quiz",
                    ],
                    [
                        "task",
                    ],
                    [
                        "course",
                    ],
                    [
                        "foundation",
                    ],
                ] as const)("refuses to create a %s session with no anchor id",
                    async (scope) => {
                        const id = await service.createSession({
                            userId,
                            scope,
                        })

                        expect(id).toBeNull()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("derives the TASK scope and anchors on origin_task_id",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "task-1",
                            milestone: {
                                course: {
                                    id: "course-9",
                                },
                            },
                        })
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])

                        await service.createSession({
                            userId,
                            taskId: "task-1",
                        })

                        expect(entityManager.create.mock.calls[0][1]).toMatchObject({
                            scope: "task",
                            enrollmentId,
                            originTaskId: "task-1",
                        })
                    })

                it("refuses a TASK session whose owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(service.createSession({
                            userId,
                            taskId: "ghost",
                        })).resolves.toBeNull()
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("refuses a CONTENT session when the learner has no enrollment row",
                    async () => {
                        // resolveEnrollmentId: content row resolves, enrollment does not
                        entityManager.query.mockResolvedValueOnce([])

                        const id = await service.createSession({
                            userId,
                            contentId,
                        })

                        expect(id).toBeNull()
                        expect(entityManager.save).not.toHaveBeenCalled()
                    })

                it("refuses a CONTENT session when the content has no owning course",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: contentId,
                            module: null,
                        })

                        const id = await service.createSession({
                            userId,
                            contentId,
                        })

                        expect(id).toBeNull()
                        // bailed before ever querying for an enrollment
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("refuses a CHALLENGE session whose owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(service.createSession({
                            userId,
                            challengeId: "ghost",
                        })).resolves.toBeNull()
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("refuses a QUIZ session whose owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        await expect(service.createSession({
                            userId,
                            quizId: "ghost",
                        })).resolves.toBeNull()
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })
            })

        // ── SCOPED LISTING -- owner/anchor predicates + paging + search ──────────
        describe("scoped listing predicates",
            () => {
                const enrollmentId = "enr-1"

                it("clamps an oversized page request and a negative offset",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        await service.sessions({
                            userId,
                            scope: "global",
                            limit: 999,
                            offset: -5,
                        })

                        const params = entityManager.query.mock.calls[0][1]
                        // ...owner, scope, includeArchived, LIMIT, OFFSET
                        expect(params[params.length - 2]).toBe(50)
                        expect(params[params.length - 1]).toBe(0)
                    })

                it("raises a zero page size to one and defaults an omitted page size to twenty",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            scope: "global",
                            limit: 0,
                        })
                        expect(entityManager.query.mock.calls[0][1].at(-2)).toBe(1)

                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            scope: "global",
                        })
                        expect(entityManager.query.mock.calls[1][1].at(-2)).toBe(20)
                    })

                it("GLOBAL → keys off the raw user with no anchor column at all",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: "s-1",
                                title: "Chung",
                                updatedAt: new Date("2026-08-19T00:00:00.000Z"),
                                messageCount: 4,
                                snippet: null,
                            },
                        ])

                        const list = await service.sessions({
                            userId,
                            scope: "global",
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("s.user_id = $1")
                        expect(sql).not.toContain("origin_")
                        expect(params.slice(0,
                            2)).toEqual([
                            userId,
                            "global",
                        ])
                        expect(list).toEqual([
                            {
                                id: "s-1",
                                title: "Chung",
                                updatedAt: new Date("2026-08-19T00:00:00.000Z"),
                                messageCount: 4,
                                scope: "global",
                                originContentId: null,
                                originContentTitle: null,
                                snippet: null,
                            },
                        ])
                    })

                it("CHALLENGE → keys off (enrollment, scope, origin_challenge_id)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "challenge-1",
                            content: {
                                module: {
                                    course: {
                                        id: "course-9",
                                    },
                                },
                            },
                        })
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            .mockResolvedValueOnce([])

                        await service.sessions({
                            userId,
                            challengeId: "challenge-1",
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[1]
                        expect(sql).toContain("s.origin_challenge_id = $3")
                        expect(params.slice(0,
                            3)).toEqual([
                            enrollmentId,
                            "challenge",
                            "challenge-1",
                        ])
                    })

                it("QUIZ → keys off (enrollment, scope, origin_quiz_id)",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "deck-1",
                            course: {
                                id: "course-9",
                            },
                        })
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            .mockResolvedValueOnce([])

                        await service.sessions({
                            userId,
                            quizId: "deck-1",
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[1]
                        expect(sql).toContain("s.origin_quiz_id = $3")
                        expect(params[2]).toBe("deck-1")
                    })

                it("narrows a scoped list by title/message text and reuses the pattern for the snippet",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: "s-1",
                                title: null,
                                updatedAt: new Date(),
                                messageCount: 2,
                                snippet: "matched message",
                            },
                        ])

                        const list = await service.sessions({
                            userId,
                            scope: "global",
                            search: "  kafka  ",
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[0]
                        expect(sql).toContain("s.title ILIKE $3")
                        expect(sql).toContain("m3.message ILIKE $3")
                        expect(params[2]).toBe("%kafka%")
                        expect(list[0].snippet).toBe("matched message")
                    })

                it("hides archived rows on a plain list and includes them on request",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            scope: "global",
                        })
                        const plain = entityManager.query.mock.calls[0]
                        expect(plain[0]).toContain("OR s.archived_at IS NULL")
                        expect(plain[1][2]).toBe(false)

                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            scope: "global",
                            includeArchived: true,
                        })
                        expect(entityManager.query.mock.calls[1][1][2]).toBe(true)
                    })

                it.each([
                    [
                        "task",
                    ],
                    [
                        "challenge",
                    ],
                    [
                        "quiz",
                    ],
                    [
                        "course",
                    ],
                    [
                        "foundation",
                    ],
                ] as const)("returns an empty %s list when its anchor id is missing",
                    async (scope) => {
                        const list = await service.sessions({
                            userId,
                            scope,
                        })

                        expect(list).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("derives the listing scope from each anchor, falling through to the global chat",
                    async () => {
                        // TASK anchor -> task list (course + enrollment resolve first)
                        entityManager.findOne.mockResolvedValueOnce({
                            id: "task-1",
                            milestone: {
                                course: {
                                    id: "course-9",
                                },
                            },
                        })
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            .mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            taskId: "task-1",
                        })
                        expect(entityManager.query.mock.calls[1][1][1]).toBe("task")

                        // FOUNDATION anchor -> user-owned foundation list
                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            foundationId: "foundation-1",
                        })
                        expect(entityManager.query.mock.calls[2][1][1]).toBe("foundation")

                        // COURSE anchor -> enrollment-owned course list
                        entityManager.query.mockResolvedValueOnce([
                            {
                                id: enrollmentId,
                            },
                        ])
                            .mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                            courseId: "course-9",
                        })
                        expect(entityManager.query.mock.calls[4][1][1]).toBe("course")

                        // no anchor at all -> the app-wide global list
                        entityManager.query.mockResolvedValueOnce([])
                        await service.sessions({
                            userId,
                        })
                        expect(entityManager.query.mock.calls[5][1][1]).toBe("global")
                    })

                it("returns an empty TASK list when the owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const list = await service.sessions({
                            userId,
                            scope: "task",
                            taskId: "ghost",
                        })

                        expect(list).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("returns an empty CHALLENGE list when the owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const list = await service.sessions({
                            userId,
                            scope: "challenge",
                            challengeId: "ghost",
                        })

                        expect(list).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("returns an empty QUIZ list when the owning course cannot be resolved",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(null)

                        const list = await service.sessions({
                            userId,
                            scope: "quiz",
                            quizId: "ghost",
                        })

                        expect(list).toEqual([])
                    })
            })

        // ── CONTENT-SCOPE LISTING + SEARCH ───────────────────────────────────────
        describe("content-scope listing and search",
            () => {
                const enrollmentId = "enr-1"

                it("returns an empty list when no content anchor is supplied",
                    async () => {
                        const list = await service.sessions({
                            userId,
                            scope: "content",
                        })

                        expect(list).toEqual([])
                        expect(entityManager.query).not.toHaveBeenCalled()
                    })

                it("lists this content's conversations keyed on (enrollment, origin_content_id)",
                    async () => {
                        const updatedAt = new Date("2026-08-19T00:00:00.000Z")
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    id: "s-1",
                                    title: "Indexes",
                                    updatedAt,
                                    messageCount: 6,
                                },
                            ])

                        const list = await service.sessions({
                            userId,
                            contentId,
                            includeArchived: true,
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[1]
                        expect(sql).toContain("s.enrollment_id = $1 AND s.origin_content_id = $2")
                        expect(params).toEqual([
                            enrollmentId,
                            contentId,
                            20,
                            0,
                            true,
                        ])
                        expect(list).toEqual([
                            {
                                id: "s-1",
                                title: "Indexes",
                                updatedAt,
                                messageCount: 6,
                                scope: "content",
                                originContentId: contentId,
                                originContentTitle: null,
                                snippet: null,
                            },
                        ])
                    })

                it("returns an empty list when the learner has no enrollment for the content",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        const list = await service.sessions({
                            userId,
                            contentId,
                        })

                        expect(list).toEqual([])
                        // bailed before the list query
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })

                it("searches ACROSS the course (including archived rows) when a query is given",
                    async () => {
                        const updatedAt = new Date("2026-08-19T00:00:00.000Z")
                        entityManager.query
                            .mockResolvedValueOnce([
                                {
                                    id: enrollmentId,
                                },
                            ])
                            .mockResolvedValueOnce([
                                {
                                    id: "s-9",
                                    title: null,
                                    updatedAt,
                                    messageCount: 3,
                                    originContentId: "other-content",
                                    originContentTitle: "Nginx basics",
                                    snippet: "about nginx",
                                },
                            ])

                        const list = await service.sessions({
                            userId,
                            contentId,
                            search: "  nginx ",
                        })

                        const [
                            sql,
                            params,
                        ] = entityManager.query.mock.calls[1]
                        // search deliberately carries NO archived_at filter
                        expect(sql).not.toContain("archived_at")
                        expect(params).toEqual([
                            enrollmentId,
                            "%nginx%",
                            20,
                            0,
                        ])
                        expect(list[0]).toMatchObject({
                            scope: "content",
                            originContentId: "other-content",
                            originContentTitle: "Nginx basics",
                            snippet: "about nginx",
                        })
                    })

                it("returns nothing from a search when the learner has no enrollment",
                    async () => {
                        entityManager.query.mockResolvedValueOnce([])

                        const list = await service.sessions({
                            userId,
                            contentId,
                            search: "nginx",
                        })

                        expect(list).toEqual([])
                        expect(entityManager.query).toHaveBeenCalledTimes(1)
                    })
            })

        // ── OWNERSHIP-GUARDED SESSION WRITES ─────────────────────────────────────
        describe("ownership-guarded session operations",
            () => {
                const sessionId = "session-1"

                /** Program `resolveOwnedSession` to answer "owned by this learner". */
                const owned = () => entityManager.query.mockResolvedValueOnce([
                    {
                        enrollmentId: "enr-1",
                        userId: null,
                    },
                ])

                /** Program `resolveOwnedSession` to answer "not yours". */
                const notOwned = () => entityManager.query.mockResolvedValueOnce([])

                describe("loadSessionMessages",
                    () => {
                        it("rebuilds the thread oldest-first for a session the learner owns",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([
                                    {
                                        role: "user",
                                        message: "q1",
                                    },
                                    {
                                        role: "assistant",
                                        message: "a1",
                                    },
                                ])

                                await expect(service.loadSessionMessages({
                                    userId,
                                    sessionId,
                                })).resolves.toEqual([
                                    {
                                        role: "user",
                                        content: "q1",
                                    },
                                    {
                                        role: "assistant",
                                        content: "a1",
                                    },
                                ])
                                expect(entityManager.query.mock.calls[1][0])
                                    .toContain("ORDER BY created_at ASC")
                            })

                        it("returns nothing for a session the learner does not own",
                            async () => {
                                notOwned()

                                await expect(service.loadSessionMessages({
                                    userId,
                                    sessionId,
                                })).resolves.toEqual([])
                                expect(entityManager.query).toHaveBeenCalledTimes(1)
                            })
                    })

                describe("saveTurn",
                    () => {
                        let insert: jest.Mock
                        beforeEach(() => {
                            insert = jest.fn().mockResolvedValue({
                            })
                            ;(entityManager as unknown as { insert: jest.Mock }).insert = insert
                        })

                        it("records the grounding content on a content-scope turn and auto-titles the session",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.saveTurn({
                                    userId,
                                    sessionId,
                                    contentId,
                                    question: "  What is an index?  ",
                                    answer: "  It speeds up lookups.  ",
                                })

                                const rows = insert.mock.calls[0][1] as Array<Record<string, unknown>>
                                expect(rows[0]).toMatchObject({
                                    sessionId,
                                    enrollmentId: "enr-1",
                                    contentId,
                                    role: "user",
                                    message: "  What is an index?  ",
                                })
                                // the answer is trimmed before it is stored
                                expect(rows[1].message).toBe("It speeds up lookups.")
                                const [
                                    sql,
                                    params,
                                ] = entityManager.query.mock.calls[1]
                                expect(sql).toContain("COALESCE(title, $2)")
                                expect(params).toEqual([
                                    sessionId,
                                    "What is an index?",
                                    userId,
                                ])
                            })

                        it("truncates a very long first question when auto-titling",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.saveTurn({
                                    userId,
                                    sessionId,
                                    question: "w".repeat(300),
                                    answer: "a",
                                })

                                expect(entityManager.query.mock.calls[1][1][1])
                                    .toHaveLength(120)
                            })

                        it("is a no-op for a blank question",
                            async () => {
                                await service.saveTurn({
                                    userId,
                                    sessionId,
                                    question: "   ",
                                    answer: "an answer",
                                })

                                expect(insert).not.toHaveBeenCalled()
                                expect(entityManager.query).not.toHaveBeenCalled()
                            })

                        it("is a no-op for a blank answer",
                            async () => {
                                await service.saveTurn({
                                    userId,
                                    sessionId,
                                    question: "a question",
                                    answer: "  \n ",
                                })

                                expect(insert).not.toHaveBeenCalled()
                                expect(entityManager.query).not.toHaveBeenCalled()
                            })
                    })

                describe("deleteSession",
                    () => {
                        it("carries the owner predicate in the DELETE itself",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.deleteSession({
                                    userId,
                                    sessionId,
                                })

                                const [
                                    sql,
                                    params,
                                ] = entityManager.query.mock.calls[1]
                                expect(sql).toContain("DELETE FROM content_ai_sessions")
                                expect(sql).toContain("e.user_id = $2")
                                expect(params).toEqual([
                                    sessionId,
                                    userId,
                                ])
                            })

                        it("does not delete a session the learner does not own",
                            async () => {
                                notOwned()

                                await service.deleteSession({
                                    userId,
                                    sessionId,
                                })

                                expect(entityManager.query).toHaveBeenCalledTimes(1)
                            })
                    })

                describe("renameContentAiSession",
                    () => {
                        it("overwrites the title outright for an owned session",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.renameContentAiSession({
                                    userId,
                                    sessionId,
                                    title: "  Indexing deep dive  ",
                                })

                                const [
                                    sql,
                                    params,
                                ] = entityManager.query.mock.calls[1]
                                expect(sql).toContain("SET title = $2")
                                expect(sql).not.toContain("COALESCE")
                                expect(params).toEqual([
                                    sessionId,
                                    "Indexing deep dive",
                                    userId,
                                ])
                            })

                        it("resets a blank title to NULL so auto-titling resumes",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.renameContentAiSession({
                                    userId,
                                    sessionId,
                                    title: "   ",
                                })

                                expect(entityManager.query.mock.calls[1][1][1]).toBeNull()
                            })

                        it("rejects a title past the column limit before touching the database",
                            async () => {
                                const error = await service.renameContentAiSession({
                                    userId,
                                    sessionId,
                                    title: "t".repeat(201),
                                }).catch((thrown: unknown) => thrown)

                                expect(error)
                                    .toBeInstanceOf(ContentAiSessionTitleTooLongException)
                                expect((error as ContentAiSessionTitleTooLongException).metadata)
                                    .toMatchObject({
                                        length: 201,
                                        max: 200,
                                    })
                                expect(entityManager.query).not.toHaveBeenCalled()
                            })

                        it("accepts a title exactly at the column limit (boundary)",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.renameContentAiSession({
                                    userId,
                                    sessionId,
                                    title: "t".repeat(200),
                                })

                                expect(entityManager.query.mock.calls[1][1][1])
                                    .toHaveLength(200)
                            })

                        it("does not rename a session the learner does not own",
                            async () => {
                                notOwned()

                                await service.renameContentAiSession({
                                    userId,
                                    sessionId,
                                    title: "Nope",
                                })

                                expect(entityManager.query).toHaveBeenCalledTimes(1)
                            })
                    })

                describe("setContentAiSessionArchived",
                    () => {
                        it("stamps archived_at when archiving",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.setContentAiSessionArchived({
                                    userId,
                                    sessionId,
                                    archived: true,
                                })

                                expect(entityManager.query.mock.calls[1][0])
                                    .toContain("SET archived_at = now()")
                            })

                        it("clears archived_at when unarchiving",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.setContentAiSessionArchived({
                                    userId,
                                    sessionId,
                                    archived: false,
                                })

                                expect(entityManager.query.mock.calls[1][0])
                                    .toContain("SET archived_at = NULL")
                            })

                        it("does not archive a session the learner does not own",
                            async () => {
                                notOwned()

                                await service.setContentAiSessionArchived({
                                    userId,
                                    sessionId,
                                    archived: true,
                                })

                                expect(entityManager.query).toHaveBeenCalledTimes(1)
                            })
                    })

                describe("touchSession",
                    () => {
                        it("bumps recency for an owned session",
                            async () => {
                                owned()
                                entityManager.query.mockResolvedValueOnce([])

                                await service.touchSession({
                                    userId,
                                    sessionId,
                                })

                                const [
                                    sql,
                                    params,
                                ] = entityManager.query.mock.calls[1]
                                expect(sql).toContain("SET updated_at = now()")
                                expect(params).toEqual([
                                    sessionId,
                                    userId,
                                ])
                            })

                        it("does not bump a session the learner does not own",
                            async () => {
                                notOwned()

                                await service.touchSession({
                                    userId,
                                    sessionId,
                                })

                                expect(entityManager.query).toHaveBeenCalledTimes(1)
                            })
                    })
            })
    })
