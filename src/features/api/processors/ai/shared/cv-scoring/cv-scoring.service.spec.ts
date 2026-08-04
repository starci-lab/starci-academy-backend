import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    AiCeilSurface,
    AiModelCategory,
    AiModelTask,
    Locale,
    ModelProvider,
} from "@modules/databases"
import {
    AiInvokeService,
} from "@modules/ai"
import {
    CvRagRetrievalService,
} from "@modules/rag"
import {
    CvScoringService,
} from "./cv-scoring.service"

/** A valid STRICT-JSON scoring reply the AI mock returns by default. */
const VALID_SCORE_REPLY = JSON.stringify({
    shortFeedback: "Solid mid-level CV.",
    score: 78,
    items: [
        {
            severity: "medium",
            section: "impact",
            message: "Bullets could quantify outcomes more.",
            suggestion: "Add metrics to the top 2 bullets.",
        },
    ],
})

describe("CvScoringService",
    () => {
        let module: TestingModule
        let service: CvScoringService
        let aiInvokeService: jest.Mocked<Pick<AiInvokeService, "run">>
        let cvRagRetrievalService: jest.Mocked<Pick<CvRagRetrievalService, "retrieveCvContext">>

        beforeEach(async () => {
            // AI mock — happy path returns a valid STRICT-JSON scoring reply
            aiInvokeService = {
                run: jest.fn().mockResolvedValue({
                    text: VALID_SCORE_REPLY,
                    model: "gpt-4o",
                    provider: "openai",
                    attempts: 1,
                    cost: 1,
                }),
            } as unknown as jest.Mocked<Pick<AiInvokeService, "run">>

            // RAG mock — happy path returns an advisory rubric excerpt
            cvRagRetrievalService = {
                retrieveCvContext: jest.fn().mockResolvedValue({
                    excerpt: "RUBRIC-EXCERPT",
                    retrievedChunks: 2,
                }),
            } as unknown as jest.Mocked<Pick<CvRagRetrievalService, "retrieveCvContext">>

            module = await Test.createTestingModule({
                providers: [
                    CvScoringService,
                    {
                        provide: AiInvokeService,
                        useValue: aiInvokeService,
                    },
                    {
                        provide: CvRagRetrievalService,
                        useValue: cvRagRetrievalService,
                    },
                ],
            }).compile()

            service = module.get<CvScoringService>(CvScoringService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("score",
            () => {
                it("happy path: parses the AI reply into a clamped 0-100 score + structured feedback",
                    async () => {
                        const result = await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                        })

                        // score parsed straight through from the valid reply
                        expect(result.score).toBe(78)
                        // feedback structured per the parser's shape (templateLevel echoed, items mapped)
                        expect(result.feedback).toEqual(
                            expect.objectContaining({
                                shortFeedback: "Solid mid-level CV.",
                                templateLevel: "mid",
                                items: expect.arrayContaining([
                                    expect.objectContaining({
                                        severity: "medium",
                                        section: "impact",
                                    }),
                                ]),
                            }),
                        )
                    })

                it("invokes the AI on the CVGenerating task at the Balanced floor / Grading surface",
                    async () => {
                        await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                        })

                        expect(aiInvokeService.run).toHaveBeenCalledTimes(1)
                        expect(aiInvokeService.run).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                floor: AiModelCategory.Medium,
                                surface: AiCeilSurface.Grading,
                                task: AiModelTask.CVGenerating,
                            }),
                        )
                    })

                it("clamps an out-of-range HIGH score (140) down to the 0-100 ceiling",
                    async () => {
                        aiInvokeService.run.mockResolvedValueOnce({
                            text: JSON.stringify({
                                shortFeedback: "Too high.",
                                score: 140,
                                items: [],
                            }),
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            attempts: 1,
                            cost: 1,
                        })

                        const result = await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                        })

                        expect(result.score).toBe(100)
                    })

                it("clamps an out-of-range LOW score (-5) up to the 0-100 floor",
                    async () => {
                        aiInvokeService.run.mockResolvedValueOnce({
                            text: JSON.stringify({
                                shortFeedback: "Too low.",
                                score: -5,
                                items: [],
                            }),
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            attempts: 1,
                            cost: 1,
                        })

                        const result = await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                        })

                        expect(result.score).toBe(0)
                    })

                it("source-agnostic: grades a CV supplied only via structuredData",
                    async () => {
                        const result = await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                                skillGroups: [],
                            },
                        })

                        expect(result.score).toBe(78)
                        // the structured JSON block is what actually reached the human prompt
                        const humanContent = String(
                            aiInvokeService.run.mock.calls[0][0].messages[1].content,
                        )
                        expect(humanContent).toContain("Structured CV (JSON)")
                    })

                it("source-agnostic: grades a CV supplied only via cvText",
                    async () => {
                        const result = await service.score({
                            userId: "user-1",
                            cvText: "Jane Doe — Senior Engineer with 8 years of experience.",
                        })

                        expect(result.score).toBe(78)
                        const humanContent = String(
                            aiInvokeService.run.mock.calls[0][0].messages[1].content,
                        )
                        expect(humanContent).toContain("CV text")
                    })

                it("throws when neither structuredData nor cvText is provided",
                    async () => {
                        await expect(
                            service.score({
                                userId: "user-1",
                            }),
                        ).rejects.toThrow(
                            "CV scoring requires either structuredData or cvText.",
                        )

                        // never reached the AI — content build fails first
                        expect(aiInvokeService.run).not.toHaveBeenCalled()
                    })

                it("degrades RAG best-effort: a rubric retrieval failure does NOT throw and scoring still proceeds",
                    async () => {
                        cvRagRetrievalService.retrieveCvContext.mockRejectedValueOnce(
                            new Error("Qdrant unreachable"),
                        )

                        const result = await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                        })

                        // scoring still completes against the inline rubric alone
                        expect(result.score).toBe(78)
                        expect(aiInvokeService.run).toHaveBeenCalledTimes(1)
                        // no advisory rubric context leaked into the prompt when retrieval failed
                        const systemContent = String(
                            aiInvokeService.run.mock.calls[0][0].messages[0].content,
                        )
                        expect(systemContent).not.toContain("Reference rubric")
                    })

                it("propagates an AI invoke failure (not best-effort — scoring itself fails)",
                    async () => {
                        aiInvokeService.run.mockRejectedValueOnce(new Error("LLM exploded"))

                        await expect(
                            service.score({
                                userId: "user-1",
                                structuredData: {
                                    fullName: "Jane Doe",
                                },
                            }),
                        ).rejects.toThrow("LLM exploded")
                    })

                it("propagates a parse failure when the AI reply is not valid JSON",
                    async () => {
                        aiInvokeService.run.mockResolvedValueOnce({
                            text: "not json at all",
                            model: "gpt-4o",
                            provider: ModelProvider.OpenAI,
                            attempts: 1,
                            cost: 1,
                        })

                        await expect(
                            service.score({
                                userId: "user-1",
                                structuredData: {
                                    fullName: "Jane Doe",
                                },
                            }),
                        ).rejects.toThrow(/Failed to parse CV model output JSON/)
                    })

                it("writes feedback in the requested locale's target language instruction",
                    async () => {
                        await service.score({
                            userId: "user-1",
                            structuredData: {
                                fullName: "Jane Doe",
                            },
                            locale: Locale.Vi,
                        })

                        const systemContent = String(
                            aiInvokeService.run.mock.calls[0][0].messages[0].content,
                        )
                        expect(systemContent).toContain("Vietnamese")
                    })
            })
    })
