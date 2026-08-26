import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    Document,
} from "@langchain/core/documents"
import {
    CourseRagRetrievalService,
} from "./course-rag-retrieval.service"

// only externals are stubbed at module level; assemble/dedupe/degrade are pure logic
// exercised through the public method
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromExistingCollection: jest.fn(),
        },
    }))

jest.mock("@modules/platform/env/config",
    () => ({
        envConfig: () => ({
            services: {
                contentRag: {
                    collection: "content_rag",
                    retrievalTopK: 4,
                },
            },
        }),
    }))

// break the heavy import chain the SUT pulls (langchain -> ai -> cache -> config that
// reads the real env at module load) -- we only need the injected instances, not the modules
jest.mock("@modules/integrations/langchain/embedding-model.service",
    () => ({
        EmbeddingModelService: class {
        },
    }))

jest.mock("@modules/databases/qdrant/qdrant.decorators",
    () => ({
        InjectQdrantClient: () => () => undefined,
    }))

/** Build a minimal Document with content + optional contentId metadata. */
const doc = (
    pageContent: string,
): Document =>
    ({
        pageContent,
        metadata: {
        },
    }) as Document

describe("CourseRagRetrievalService",
    () => {
        let service: CourseRagRetrievalService
        let qdrantClient: Record<string, unknown>
        let embeddingModelService: {
            getViaBalancer: jest.Mock
        }
        const fromExistingCollection = QdrantVectorStore.fromExistingCollection as unknown as jest.Mock

        beforeEach(() => {
            qdrantClient = {
            }
            embeddingModelService = {
                getViaBalancer: jest.fn().mockResolvedValue({
                }),
            }
            service = new CourseRagRetrievalService(
                qdrantClient as never,
                embeddingModelService as never,
                {
                    log: jest.fn(),
                } as never,
            )
            fromExistingCollection.mockReset()
        })

        it("returns an empty excerpt without touching the index for a blank query",
            async () => {
                const result = await service.retrieveContentExcerpt({
                    contentId: "c-1",
                    query: "   ",
                })

                expect(result.excerpt).toBe("")
                expect(result.retrievedChunks).toBe(0)
                expect(fromExistingCollection).not.toHaveBeenCalled()
                expect(embeddingModelService.getViaBalancer).not.toHaveBeenCalled()
            })

        it("searches FILTERED to metadata.contentId and assembles the hits",
            async () => {
                const similaritySearch = jest.fn().mockResolvedValue([
                    doc("AAAA"),
                    doc("BBBB"),
                    doc("CCCC"),
                ])
                fromExistingCollection.mockResolvedValue({
                    similaritySearch,
                })

                const result = await service.retrieveContentExcerpt({
                    contentId: "c-42",
                    query: "  how does X work  ",
                })

                // trimmed query + env top-k + payload filter on metadata.contentId
                expect(similaritySearch).toHaveBeenCalledWith(
                    "how does X work",
                    4,
                    {
                        must: [
                            {
                                key: "metadata.contentId",
                                match: {
                                    value: "c-42",
                                },
                            },
                        ],
                    },
                )
                expect(result.excerpt).toBe("AAAA\n\nBBBB\n\nCCCC")
                expect(result.retrievedChunks).toBe(3)
                // built from the existing collection (no rebuild) with the shared embedder
                expect(embeddingModelService.getViaBalancer).toHaveBeenCalledTimes(1)
                expect(fromExistingCollection.mock.calls[0][1]).toMatchObject({
                    collectionName: "content_rag",
                    client: qdrantClient,
                })
            })

        it("honours an explicit topK override",
            async () => {
                const similaritySearch = jest.fn().mockResolvedValue([])
                fromExistingCollection.mockResolvedValue({
                    similaritySearch,
                })

                await service.retrieveContentExcerpt({
                    contentId: "c-1",
                    query: "q",
                    topK: 9,
                })

                expect(similaritySearch.mock.calls[0][1]).toBe(9)
            })

        it("de-dupes identical chunk text in the excerpt",
            async () => {
                const similaritySearch = jest.fn().mockResolvedValue([
                    doc("SAME"),
                    doc("SAME"),
                    doc("OTHER"),
                ])
                fromExistingCollection.mockResolvedValue({
                    similaritySearch,
                })

                const result = await service.retrieveContentExcerpt({
                    contentId: "c-1",
                    query: "q",
                })

                // duplicate chunk text appears once; retrievedChunks counts the raw hits
                expect(result.excerpt).toBe("SAME\n\nOTHER")
                expect(result.retrievedChunks).toBe(3)
            })

        it("degrades to an empty excerpt when the collection is missing / search throws",
            async () => {
                fromExistingCollection.mockRejectedValue(new Error("collection not found"))

                const result = await service.retrieveContentExcerpt({
                    contentId: "c-1",
                    query: "q",
                })

                // caller falls back to whole-body stuffing -- retrieval never blackholes chat
                expect(result.excerpt).toBe("")
                expect(result.retrievedChunks).toBe(0)
            })

        it("degrades to an empty excerpt when the embedder is unavailable",
            async () => {
                embeddingModelService.getViaBalancer.mockRejectedValue(new Error("no embedder"))

                const result = await service.retrieveContentExcerpt({
                    contentId: "c-1",
                    query: "q",
                })

                expect(result.excerpt).toBe("")
                expect(result.retrievedChunks).toBe(0)
                // never reached the vector store
                expect(fromExistingCollection).not.toHaveBeenCalled()
            })

        it("returns empty structured results for a blank course search",
            async () => {
                const result = await service.searchCourse({
                    courseId: "course-1",
                    query: "   ",
                })

                expect(result).toEqual({
                    hits: []
                })
                expect(fromExistingCollection).not.toHaveBeenCalled()
            })

        it("collapses course search chunks to the best score per source",
            async () => {
                const similaritySearchWithScore = jest.fn().mockResolvedValue([
                    {
                        pageContent: "low", metadata: {
                            contentId: "content-1", kind: "content", lang: "en"
                        }
                    },
                    {
                        pageContent: "best", metadata: {
                            contentId: "content-1", kind: "content", lang: "en"
                        }
                    },
                    {
                        pageContent: "other", metadata: {
                            contentId: "content-2"
                        }
                    },
                    {
                        pageContent: "ignored", metadata: {
                        }
                    },
                ].map((document, index) => [document,
                    [0.2,
                        0.9,
                        0.5,
                        0.8][index]]))
                fromExistingCollection.mockResolvedValue({
                    similaritySearchWithScore
                })

                const result = await service.searchCourse({
                    courseId: "course-1",
                    query: "hooks",
                    kinds: ["content"],
                    topK: 2,
                })

                expect(result.hits).toEqual([
                    expect.objectContaining({
                        contentId: "content-1", score: 0.9, snippet: "best"
                    }),
                    expect.objectContaining({
                        contentId: "content-2", score: 0.5, kind: "content"
                    }),
                ])
                expect(similaritySearchWithScore).toHaveBeenCalledWith("hooks",
                    8,
                    {
                        must: [
                            {
                                key: "metadata.courseId", match: {
                                    value: "course-1"
                                }
                            },
                            {
                                key: "metadata.kind", match: {
                                    any: ["content"]
                                }
                            },
                        ],
                    })
            })

        // ── retrieveCourseExcerpt - excludeContentIds (must_not) ─────────────────
        // The app-wide chat's premium-exclusion path: a non-enrolled viewer's
        // whole-course BASE grounding passes `excludeContentIds` so the RAG never
        // surfaces a locked lesson's chunks.
        describe("retrieveCourseExcerpt",
            () => {
                it("filters on metadata.courseId only when no exclusion is given (unchanged shape)",
                    async () => {
                        const similaritySearch = jest.fn().mockResolvedValue([
                            doc("AAAA"),
                        ])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        await service.retrieveCourseExcerpt({
                            courseId: "course-1",
                            query: "what does this course cover",
                        })

                        expect(similaritySearch).toHaveBeenCalledWith(
                            "what does this course cover",
                            4,
                            {
                                must: [
                                    {
                                        key: "metadata.courseId",
                                        match: {
                                            value: "course-1",
                                        },
                                    },
                                ],
                            },
                        )
                    })

                it("adds a must_not on metadata.contentId when excludeContentIds is given",
                    async () => {
                        const similaritySearch = jest.fn().mockResolvedValue([
                            doc("FREE-CHUNK"),
                        ])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        await service.retrieveCourseExcerpt({
                            courseId: "course-1",
                            query: "what does this course cover",
                            excludeContentIds: [
                                "premium-1",
                                "premium-2",
                            ],
                        })

                        expect(similaritySearch).toHaveBeenCalledWith(
                            "what does this course cover",
                            4,
                            {
                                must: [
                                    {
                                        key: "metadata.courseId",
                                        match: {
                                            value: "course-1",
                                        },
                                    },
                                ],
                                must_not: [
                                    {
                                        key: "metadata.contentId",
                                        match: {
                                            any: [
                                                "premium-1",
                                                "premium-2",
                                            ],
                                        },
                                    },
                                ],
                            },
                        )
                    })

                it("omits must_not when excludeContentIds is an empty array",
                    async () => {
                        const similaritySearch = jest.fn().mockResolvedValue([])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        await service.retrieveCourseExcerpt({
                            courseId: "course-1",
                            query: "q",
                            excludeContentIds: [],
                        })

                        const filter = similaritySearch.mock.calls[0][2]
                        expect(filter.must_not).toBeUndefined()
                    })

                it("keeps source ids empty when a hit has no content id metadata",
                    async () => {
                        const similaritySearch = jest.fn().mockResolvedValue([
                            doc("course-only chunk"),
                        ])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        const result = await service.retrieveCourseExcerpt({
                            courseId: "course-1",
                            query: "q",
                        })

                        expect(result.retrievedChunks).toBe(1)
                        expect(result.matchedContentIds).toEqual([])
                    })
            })
    })
