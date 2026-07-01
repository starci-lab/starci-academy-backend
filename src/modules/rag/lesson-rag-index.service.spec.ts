import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    LessonRagIndexService,
} from "./lesson-rag-index.service"

// external deps stubbed at module level; everything else (enumerate / collect /
// chunk decision / non-fatal skip) is pure logic exercised through build()
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromDocuments: jest.fn(),
        },
    }))

// cut the heavy embedding/ai/cache import chain pulled in transitively by the
// SUT's `@modules/langchain` barrel — we construct the service manually, so the
// real EmbeddingModelService class is never needed
jest.mock("@modules/langchain",
    () => ({
        EmbeddingModelService: class {
        },
    }))

// pin only the lesson-rag knobs; keep the rest of env real so other modules
// (cache config etc.) still read their defaults
jest.mock("@modules/env",
    () => {
        const actual = jest.requireActual("@modules/env")
        return {
            ...actual,
            envConfig: () => {
                const real = actual.envConfig()
                return {
                    ...real,
                    services: {
                        ...real.services,
                        lessonRag: {
                            collection: "lesson_rag",
                            // big chunk size so each source doc stays one chunk
                            chunkSize: 100000,
                            chunkOverlap: 0,
                        },
                    },
                }
            },
        }
    })

describe("LessonRagIndexService",
    () => {
        let service: LessonRagIndexService
        let qdrantClient: {
            deleteCollection: jest.Mock
        }
        let entityManager: {
            find: jest.Mock
        }
        let embeddingModelService: {
            getViaBalancer: jest.Mock
        }
        let s3ReadService: {
            json: jest.Mock
        }
        let s3NameResolverService: {
            content: jest.Mock
            repo: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        const embeddingModel = {
        }
        const fromDocuments = QdrantVectorStore.fromDocuments as unknown as jest.Mock

        /** A fake content row joined to a course; sandbox flag drives code collection. */
        const content = (
            id: string,
            isSandbox = false,
        ) =>
            ({
                id,
                isSandbox,
                githubBaseUrl: isSandbox
                    ? "https://github.com/org/repo-" + id
                    : null,
                githubDir: isSandbox
                    ? "frontend"
                    : null,
                module: {
                    id: "m1",
                    course: {
                        id: "course-1",
                    },
                },
            })

        beforeEach(() => {
            qdrantClient = {
                deleteCollection: jest.fn().mockResolvedValue(undefined),
            }
            entityManager = {
                find: jest.fn(),
            }
            embeddingModelService = {
                getViaBalancer: jest.fn().mockResolvedValue(embeddingModel),
            }
            s3ReadService = {
                json: jest.fn(),
            }
            s3NameResolverService = {
                content: jest.fn((id: string,
                    locale: string) => `contents/${id}/${locale}.json`),
                repo: jest.fn((repoName: string,
                    dir: string) => `repo/${repoName}/${dir}.json`),
            }
            winstonService = {
                log: jest.fn(),
            }
            service = new LessonRagIndexService(
                qdrantClient as never,
                entityManager as never,
                embeddingModelService as never,
                s3ReadService as never,
                s3NameResolverService as never,
                winstonService as never,
            )
            fromDocuments.mockReset()
            fromDocuments.mockResolvedValue(undefined)
        })

        it("enumerates contents, reads body+code from MinIO, and upserts into lesson_rag with contentId payload",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1",
                        true),
                ])
                // body for vi + en, then the sandbox code file map
                s3ReadService.json
                    .mockResolvedValueOnce({
                        body: "Vietnamese lesson body",
                    })
                    .mockResolvedValueOnce({
                        body: "English lesson body",
                    })
                    .mockResolvedValueOnce({
                        "/src/App.tsx": {
                            code: "export const App = () => null",
                        },
                    })

                const result = await service.build()

                // 2 body docs + 1 code doc → 3 chunks (chunkSize huge → 1 chunk each)
                expect(result.indexed).toBe(3)
                // drop-then-rebuild
                expect(qdrantClient.deleteCollection).toHaveBeenCalledWith("lesson_rag")
                expect(fromDocuments).toHaveBeenCalledTimes(1)

                const [
                    chunks,
                    model,
                    opts,
                ] = fromDocuments.mock.calls[0]
                expect(model).toBe(embeddingModel)
                expect(opts).toMatchObject({
                    collectionName: "lesson_rag",
                    client: qdrantClient,
                })
                // every chunk carries the contentId payload for retrieval-time filtering
                for (const c of chunks) {
                    expect(c.metadata.contentId).toBe("c1")
                    expect(c.metadata.courseId).toBe("course-1")
                }
                // a code chunk + content chunks both present
                const kinds = chunks.map((c: { metadata: { kind: string } }) => c.metadata.kind)
                expect(kinds).toContain("content")
                expect(kinds).toContain("code")
                // sandbox code keyed by repo name = last segment of githubBaseUrl
                expect(s3NameResolverService.repo).toHaveBeenCalledWith("repo-c1",
                    "frontend")
            })

        it("skips a content whose MinIO read yields nothing (missing) without aborting the build",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("bad"),
                    content("good"),
                ])
                // bad: every body read returns null (object missing from MinIO) → skipped
                // good: vi body present, en null
                s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                    if (args.key === "contents/good/vi.json") {
                        return {
                            body: "Good lesson",
                        }
                    }
                    return null
                })

                const result = await service.build()

                // the missing content contributes nothing; the good one is still indexed
                expect(result.indexed).toBe(1)
                expect(fromDocuments).toHaveBeenCalledTimes(1)
                const [
                    chunks,
                ] = fromDocuments.mock.calls[0]
                expect(chunks).toHaveLength(1)
                expect(chunks[0].metadata.contentId).toBe("good")
            })

        it("skips a content whose MinIO read THROWS without aborting the build",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("boom"),
                    content("good"),
                ])
                // boom: the body read THROWS (MinIO/network error) → caught + skipped
                // good: vi body present, en null → 1 chunk
                s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                    if (args.key.startsWith("contents/boom/")) {
                        throw new Error("MinIO read failed")
                    }
                    if (args.key === "contents/good/vi.json") {
                        return {
                            body: "Good lesson",
                        }
                    }
                    return null
                })

                const result = await service.build()

                // the throwing content is skipped; the good one is still indexed (build not aborted)
                expect(result.indexed).toBe(1)
                expect(fromDocuments).toHaveBeenCalledTimes(1)
                const [
                    chunks,
                ] = fromDocuments.mock.calls[0]
                expect(chunks).toHaveLength(1)
                expect(chunks[0].metadata.contentId).toBe("good")
            })

        it("survives a transient deleteCollection failure (first build, collection absent)",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValueOnce({
                    body: "Lesson body",
                })
                    .mockResolvedValue(null)
                // collection not present yet → deleteCollection rejects; build must not throw
                qdrantClient.deleteCollection.mockRejectedValue(new Error("not found"))

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(fromDocuments).toHaveBeenCalledTimes(1)
            })

        it("does NOT upsert when the catalog is empty",
            async () => {
                entityManager.find.mockResolvedValue([])

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.deleteCollection).not.toHaveBeenCalled()
                // still records the no-op step
                expect(winstonService.log).toHaveBeenCalled()
            })

        it("does NOT upsert when contents exist but every MinIO read yields nothing",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValue(null)

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
            })
    })
