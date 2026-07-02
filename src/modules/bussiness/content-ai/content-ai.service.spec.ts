import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ForbiddenException,
} from "@nestjs/common"
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

        it("caps replayed history to the last MAX_HISTORY_MESSAGES turns",
            async () => {
                // 12 prior turns; only the last 8 should be replayed
                const history = Array.from({
                    length: 12,
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

                // messages = system + 8 history + question = 10
                expect(messages).toHaveLength(10)
                const replayed = messages.slice(1,
                    -1)
                expect(replayed).toHaveLength(8)
                // oldest replayed is turn-4 (12 - 8), newest is turn-11
                expect((replayed[0] as HumanMessage | AIMessage).content)
                    .toBe("turn-4")
                expect((replayed[7] as HumanMessage | AIMessage).content)
                    .toBe("turn-11")
                // assistant turns map to AIMessage, user turns to HumanMessage
                expect(replayed[0]).toBeInstanceOf(HumanMessage)
                expect(replayed[1]).toBeInstanceOf(AIMessage)
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
                ).rejects.toBeInstanceOf(ForbiddenException)
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
    })
