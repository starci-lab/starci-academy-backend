import {
    QdrantVectorStore
} from "@langchain/qdrant"
import {
    CvRagRetrievalService
} from "./cv-rag-retrieval.service"
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromExistingCollection: jest.fn()
        }
    }))
describe("CvRagRetrievalService",
    () => {
        const factory = QdrantVectorStore.fromExistingCollection as unknown as jest.Mock
        const embedder = {
            getViaBalancer: jest.fn().mockResolvedValue({
            })
        }
        const service = new CvRagRetrievalService({
        } as never,
embedder as never,
{
    log: jest.fn()
} as never)
        beforeEach(() => { jest.clearAllMocks(); factory.mockReset() })
        it("short-circuits blank or unscoped requests",
            async () => {
                await expect(service.retrieveCvContext({
                    query: " ", kinds: ["rubric"]
                })).resolves.toEqual({
                    excerpt: "", retrievedChunks: 0
                })
                await expect(service.retrieveCvContext({
                    query: "q", kinds: []
                })).resolves.toEqual({
                    excerpt: "", retrievedChunks: 0
                })
            })
        it("filters requested kinds and assembles hits",
            async () => {
                const search = jest.fn().mockResolvedValue([{
                    pageContent: "rubric"
                },
                {
                    pageContent: "sample"
                }])
                factory.mockResolvedValue({
                    similaritySearch: search
                })
                await expect(service.retrieveCvContext({
                    query: "  improve  ", kinds: ["rubric",
                        "sample"], topK: 2
                })).resolves.toMatchObject({
                    excerpt: "rubric\n\nsample", retrievedChunks: 2
                })
                expect(search).toHaveBeenCalledWith("improve",
                    2,
                    expect.objectContaining({
                        must: expect.any(Array)
                    }))
            })
    })
