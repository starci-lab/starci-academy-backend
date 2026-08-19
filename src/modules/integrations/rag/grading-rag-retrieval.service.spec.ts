import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import type {
    Document,
} from "@langchain/core/documents"
import type {
    EmbeddingsInterface,
} from "@langchain/core/embeddings"
import {
    GradingRetrievalService,
} from "./grading-rag-retrieval.service"

// the vector store is the only external dependency we stub at module level; everything else
// (dedup / budget / round-robin / degrade) is pure logic exercised through the public method
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromDocuments: jest.fn(),
        },
    }))

/** Build a minimal Document with a content string and optional source metadata. */
const doc = (
    pageContent: string,
    source?: string,
): Document =>
    ({
        pageContent,
        metadata: source
            ? {
                source,
            }
            : {
            },
    }) as Document

describe("GradingRetrievalService",
    () => {
        let service: GradingRetrievalService
        let qdrantClient: {
            deleteCollection: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        let embeddingModelService: {
            get: jest.Mock
        }
        const embeddingModel = {
        } as EmbeddingsInterface
        const fromDocuments = QdrantVectorStore.fromDocuments as unknown as jest.Mock

        beforeEach(() => {
            qdrantClient = {
                deleteCollection: jest.fn().mockResolvedValue(undefined),
            }
            winstonService = {
                log: jest.fn(),
            }
            embeddingModelService = {
                get: jest.fn().mockReturnValue(embeddingModel),
            }
            service = new GradingRetrievalService(
                qdrantClient as never,
                embeddingModelService as never,
                winstonService as never,
            )
            fromDocuments.mockReset()
        })

        it("returns an empty excerpt and touches nothing when there are no chunks",
            async () => {
                const result = await service.retrieveSourceExcerpt({
                    runKey: "sub-1-3",
                    chunks: [],
                    criteria: [
                        {
                            body: "anything",
                        },
                    ],
                    embeddingModel,
                    maxChars: 1000,
                    jobId: "job-1",
                })

                expect(result.excerpt).toBe("")
                expect(result.retrievedChunks).toBe(0)
                expect(result.degraded).toBe(false)
                // no vector store built and no collection deleted on the empty fast-path
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.deleteCollection).not.toHaveBeenCalled()
            })

        it("feeds budget-bounded raw chunks (no vector store) when there are no criteria",
            async () => {
                const result = await service.retrieveSourceExcerpt({
                    runKey: "sub-1-3",
                    chunks: [
                        doc("AAAA"),
                        doc("BBBB"),
                    ],
                    criteria: [],
                    embeddingModel,
                    // budget only fits the first chunk + nothing more -> truncated
                    maxChars: 4,
                    jobId: "job-1",
                })

                expect(result.degraded).toBe(false)
                expect(result.excerpt).toBe("AAAA")
                expect(result.truncated).toBe(true)
                // no criteria -> no Qdrant work at all
                expect(fromDocuments).not.toHaveBeenCalled()
            })

        it("retrieves per criterion, de-dupes overlaps, and merges round-robin",
            async () => {
                const docA = doc(
                    "AAAA",
                    "a.ts",
                )
                const docB = doc(
                    "BBBB",
                    "b.ts",
                )
                const docC = doc(
                    "CCCC",
                    "c.ts",
                )
                // criterion 1 -> [A, B]; criterion 2 -> [B, C] (B overlaps and must appear once)
                const similaritySearch = jest.fn(async (query: string) =>
                    query === "q1"
                        ? [
                            docA,
                            docB,
                        ]
                        : [
                            docB,
                            docC,
                        ])
                fromDocuments.mockResolvedValue({
                    similaritySearch,
                })

                const result = await service.retrieveSourceExcerpt({
                    runKey: "sub-1-3",
                    chunks: [
                        docA,
                        docB,
                        docC,
                    ],
                    criteria: [
                        {
                            body: "q1",
                        },
                        {
                            body: "q2",
                        },
                    ],
                    embeddingModel,
                    maxChars: 1000,
                    jobId: "job-1",
                })

                // round-robin rank-0 (A, B) then rank-1 (B dup->skip, C) -> A, B, C exactly once
                expect(result.excerpt).toBe("AAAA\n\nBBBB\n\nCCCC")
                expect(result.retrievedChunks).toBe(3)
                expect(winstonService.log.mock.calls).not.toContainEqual([
                    expect.anything(),
                    expect.objectContaining({
                        success: false,
                    }),
                ])
                expect(result.degraded).toBe(false)
                // collection is namespaced by runKey and dropped (start + finally cleanup)
                expect(fromDocuments.mock.calls[0][2]).toMatchObject({
                    collectionName: "grading-sub-1-3",
                })
                expect(qdrantClient.deleteCollection).toHaveBeenCalledWith("grading-sub-1-3")
            })

        it("degrades to raw chunks (and still cleans up) when the vector store fails",
            async () => {
                fromDocuments.mockRejectedValue(new Error("qdrant down"))

                const result = await service.retrieveSourceExcerpt({
                    runKey: "sub-9-1",
                    chunks: [
                        doc("AAAA"),
                        doc("BBBB"),
                    ],
                    criteria: [
                        {
                            body: "q1",
                        },
                    ],
                    embeddingModel,
                    maxChars: 1000,
                    jobId: "job-9",
                })

                // grading still gets the source rather than the job blackholing
                expect(result.degraded).toBe(true)
                expect(result.excerpt).toBe("AAAA\n\nBBBB")
                // the per-run collection is still dropped in the finally block
                expect(qdrantClient.deleteCollection).toHaveBeenCalledWith("grading-sub-9-1")
                // the degradation is surfaced in logs
                expect(winstonService.log).toHaveBeenCalled()
            })
    })
