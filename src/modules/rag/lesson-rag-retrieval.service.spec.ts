import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    Document,
} from "@langchain/core/documents"
import {
    LessonRagRetrievalService,
} from "./lesson-rag-retrieval.service"

// only externals are stubbed at module level; assemble/dedupe/degrade are pure logic
// exercised through the public method
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromExistingCollection: jest.fn(),
        },
    }))

jest.mock("@modules/env",
    () => ({
        envConfig: () => ({
            services: {
                lessonRag: {
                    collection: "lesson_rag",
                    retrievalTopK: 4,
                },
            },
        }),
    }))

// break the heavy barrel imports the SUT pulls (langchain → ai → cache → config that
// reads the real env at module load) — we only need the injected instances, not the modules
jest.mock("@modules/langchain",
    () => ({
        EmbeddingModelService: class {
        },
    }))

jest.mock("@modules/databases",
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

describe("LessonRagRetrievalService",
    () => {
        let service: LessonRagRetrievalService
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
            service = new LessonRagRetrievalService(
                qdrantClient as never,
                embeddingModelService as never,
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
                    collectionName: "lesson_rag",
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

                // caller falls back to whole-body stuffing — retrieval never blackholes chat
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
    })
