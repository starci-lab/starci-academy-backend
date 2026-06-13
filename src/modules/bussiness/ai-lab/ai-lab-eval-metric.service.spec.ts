import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    AiLabEvalMetricService,
} from "./ai-lab-eval-metric.service"
import {
    DEFAULT_EMBEDDING_THRESHOLD,
} from "./constants"

describe("AiLabEvalMetricService",
    () => {
        let module: TestingModule
        let service: AiLabEvalMetricService
        let embedQuery: jest.Mock
        let embeddingModelService: jest.Mocked<Pick<EmbeddingModelService, "get">>

        beforeEach(async () => {
            // a single embedQuery jest fn the embedding model hands back per call
            embedQuery = jest.fn()

            // EmbeddingModelService.get returns an object exposing embedQuery
            embeddingModelService = {
                get: jest.fn(() => ({
                    embedQuery,
                })),
            } as unknown as jest.Mocked<Pick<EmbeddingModelService, "get">>

            module = await Test.createTestingModule({
                providers: [
                    AiLabEvalMetricService,
                    {
                        provide: EmbeddingModelService,
                        useValue: embeddingModelService,
                    },
                ],
            }).compile()

            service = module.get<AiLabEvalMetricService>(AiLabEvalMetricService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("exactMatch",
            () => {
                it("passes on a trimmed, case-insensitive match",
                    () => {
                        // surrounding whitespace + casing must not break an otherwise exact match
                        const result = service.exactMatch({
                            actualOutput: "  Hello World  ",
                            expectedOutput: "hello world",
                        })

                        expect(result.passed).toBe(true)
                        expect(result.score).toBe(1)
                    })

                it("fails when the outputs differ",
                    () => {
                        const result = service.exactMatch({
                            actualOutput: "foo",
                            expectedOutput: "bar",
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBe(0)
                    })

                it("fails (unscoreable) when no expected output is set",
                    () => {
                        // a null expected value means the case cannot be scored on exact match
                        const result = service.exactMatch({
                            actualOutput: "anything",
                            expectedOutput: null,
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBe(0)
                    })
            })

        describe("containsMatch",
            () => {
                it("passes only when every required substring is present",
                    () => {
                        const result = service.containsMatch({
                            actualOutput: "the quick brown fox",
                            expectedContains: [
                                "quick",
                                "fox",
                            ],
                        })

                        expect(result.passed).toBe(true)
                        expect(result.score).toBe(1)
                    })

                it("returns a partial score when only some substrings are present",
                    () => {
                        // one of two substrings present → half score, not a pass
                        const result = service.containsMatch({
                            actualOutput: "the quick brown fox",
                            expectedContains: [
                                "quick",
                                "lazy",
                            ],
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBe(0.5)
                    })

                it("matches substrings case-insensitively",
                    () => {
                        const result = service.containsMatch({
                            actualOutput: "ERROR: timeout",
                            expectedContains: [
                                "error",
                            ],
                        })

                        expect(result.passed).toBe(true)
                    })

                it("fails (unscoreable) when there are no required substrings",
                    () => {
                        const result = service.containsMatch({
                            actualOutput: "anything",
                            expectedContains: null,
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBe(0)
                    })
            })

        describe("citationPresent",
            () => {
                it("detects a markdown link",
                    () => {
                        // a markdown link counts as a citation
                        expect(
                            service.citationPresent({
                                actualOutput: "see [the docs](https://example.com)",
                            }),
                        ).toBe(true)
                    })

                it("detects a bare URL",
                    () => {
                        expect(
                            service.citationPresent({
                                actualOutput: "source: https://example.com/page",
                            }),
                        ).toBe(true)
                    })

                it("returns false when no citation is present",
                    () => {
                        expect(
                            service.citationPresent({
                                actualOutput: "no sources here",
                            }),
                        ).toBe(false)
                    })
            })

        describe("embeddingMatch",
            () => {
                it("passes when cosine similarity clears the case threshold",
                    async () => {
                        // identical unit vectors → cosine similarity of exactly 1
                        embedQuery
                            .mockResolvedValueOnce([
                                1,
                                0,
                            ])
                            .mockResolvedValueOnce([
                                1,
                                0,
                            ])

                        const result = await service.embeddingMatch({
                            actualOutput: "answer",
                            expectedOutput: "answer",
                            embeddingThreshold: 0.9,
                        })

                        expect(result.passed).toBe(true)
                        expect(result.score).toBeCloseTo(1)
                    })

                it("fails when similarity is below the threshold",
                    async () => {
                        // orthogonal vectors → cosine similarity of 0
                        embedQuery
                            .mockResolvedValueOnce([
                                1,
                                0,
                            ])
                            .mockResolvedValueOnce([
                                0,
                                1,
                            ])

                        const result = await service.embeddingMatch({
                            actualOutput: "answer",
                            expectedOutput: "different",
                            embeddingThreshold: 0.5,
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBeCloseTo(0)
                    })

                it("falls back to the default threshold when the case pins none",
                    async () => {
                        // similarity ~0.83 clears the default 0.8 threshold but would fail a higher one
                        embedQuery
                            .mockResolvedValueOnce([
                                1,
                                0.7,
                            ])
                            .mockResolvedValueOnce([
                                1,
                                0,
                            ])

                        const result = await service.embeddingMatch({
                            actualOutput: "answer",
                            expectedOutput: "near answer",
                            embeddingThreshold: null,
                        })

                        // sanity-check the default the service applied is the exported constant
                        expect(DEFAULT_EMBEDDING_THRESHOLD).toBe(0.8)
                        expect(result.passed).toBe(true)
                    })

                it("fails (unscoreable) when no expected output is set",
                    async () => {
                        const result = await service.embeddingMatch({
                            actualOutput: "answer",
                            expectedOutput: null,
                            embeddingThreshold: 0.5,
                        })

                        expect(result.passed).toBe(false)
                        expect(result.score).toBe(0)
                        // no expected text → the embedding model must not even be called
                        expect(embedQuery).not.toHaveBeenCalled()
                    })
            })
    })
