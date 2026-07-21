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
    S3ReadService,
} from "@modules/s3"
import {
    ContentRagRetrievalService,
} from "@modules/rag"
import {
    UserService,
} from "../user"
import {
    Locale,
} from "@modules/databases"
import {
    ContentNotFoundException,
    PremiumContentAiAccessDeniedException,
} from "@modules/exceptions"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"

// Control the hybrid stuff-vs-RAG threshold deterministically while keeping the
// REST of the real env config intact — the `@modules/rag` barrel transitively
// loads cache/ai modules that read other env fields at module-init, so a bare
// stub would crash boot. Spread the real config and override only the threshold.
// NOTE: the factory is hoisted above module init → inline the literal (no outer const).
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

        /** A short lesson body (≤ threshold) → whole-body stuff path. */
        const smallBody = "A database index speeds up lookups."

        /** A long lesson body (> threshold) → RAG retrieval path. */
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
            // default: not premium → entitlement never consulted; program per-test
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
                        provide: ContentRagRetrievalService,
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

                // small lesson → no retrieval round-trip
                expect(contentRagRetrievalService.retrieveContentExcerpt)
                    .not.toHaveBeenCalled()
                const system = messages[0] as SystemMessage
                expect(system).toBeInstanceOf(SystemMessage)
                expect(system.content).toContain(smallBody)
                // ordered: system → (no history) → question
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
                // empty retrieval → never degrade below stuffing the whole body
                expect(system.content).toContain(largeBody)
            })

        it("caps replayed history at the last MAX_HISTORY_MESSAGES turns",
            async () => {
                // 105 short prior turns; the window caps at MAX_HISTORY_MESSAGES
                // (100) — the turns are tiny so all 100 also fit the char budget.
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

        // ── ENTITLEMENT PER SCOPE — the security surface ────────────────────────
        // A content-AI answer must never surface material the viewer is not
        // entitled to. Each non-content scope has its own gate; these lock the
        // enrolled/not-enrolled behaviour so a future refactor can't silently
        // re-open the leak.
        describe("entitlement per scope",
            () => {
                const taskId = "task-1"
                const foundationId = "foundation-1"
                const courseId = "course-9"

                /** A milestone-task row joined to its owning course (task→course gate). */
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
                        // ...and refused BEFORE retrieval → no capstone brief pulled
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

                it("COURSE · not enrolled → NO course RAG fetched (premium-safe)",
                    async () => {
                        userService.checkEnrollment.mockResolvedValueOnce(false)

                        await service.prepareMessages({
                            userId,
                            courseId,
                            question: "What does this course cover?",
                            locale: Locale.En,
                        })

                        expect(userService.checkEnrollment)
                            .toHaveBeenCalledWith(userId,
                                courseId)
                        expect(contentRagRetrievalService.retrieveCourseExcerpt)
                            .not.toHaveBeenCalled()
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

                        // foundation is a global library → NO enrollment check at all
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
    })
