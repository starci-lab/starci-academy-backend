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
    ContentNotFoundException,
} from "@modules/platform/exceptions/errors/courses/content-not-found"
import {
    PremiumContentAiAccessDeniedException,
} from "@modules/platform/exceptions/errors/courses/premium-content-ai-access-denied"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"

// Control the hybrid stuff-vs-RAG threshold deterministically while keeping the
// REST of the real env config intact -- the `@modules/rag` barrel transitively
// loads cache/ai modules that read other env fields at module-init, so a bare
// stub would crash boot. Spread the real config and override only the threshold.
// NOTE: the factory is hoisted above module init -> inline the literal (no outer const).
jest.mock("@modules/env",
    () => {
        const actual = jest.requireActual("@modules/env")
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
        }
        let userService: {
            checkEnrollment: jest.Mock
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
                content: jest.fn(() => `contents/${contentId}/en.json`),
            }
            // default: not premium -> entitlement never consulted; program per-test
            userService = {
                checkEnrollment: jest.fn().mockResolvedValue(false),
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
            })
    })
