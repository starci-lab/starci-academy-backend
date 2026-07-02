import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    LessonRagIndexService,
} from "./lesson-rag-index.service"

// external deps stubbed at module level; everything else (enumerate / collect /
// diff-against-existing-hashes / chunk decision / non-fatal skip) is pure logic
// exercised through build()
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
            scroll: jest.Mock
            delete: jest.Mock
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
                // default: no `lesson_rag` collection yet (first build) — the diff
                // baseline is empty, every content is treated as new
                scroll: jest.fn().mockRejectedValue(new Error("not found")),
                delete: jest.fn().mockResolvedValue(undefined),
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

        it("enumerates contents, reads body+code from MinIO, and upserts into lesson_rag with contentId+sourceHash payload",
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
                // a new content is "dirty" — its (empty, first-build) stale points are
                // cleared before the fresh chunks are upserted
                expect(qdrantClient.delete).toHaveBeenCalledWith("lesson_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "contentId",
                                    match: {
                                        value: "c1",
                                    },
                                },
                            ],
                        },
                    }))
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
                // every chunk carries the contentId + sourceHash payload — the hash is
                // what makes the NEXT run able to skip this content when unchanged
                for (const c of chunks) {
                    expect(c.metadata.contentId).toBe("c1")
                    expect(c.metadata.courseId).toBe("course-1")
                    expect(typeof c.metadata.sourceHash).toBe("string")
                    expect(c.metadata.sourceHash.length).toBeGreaterThan(0)
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

        it("survives a transient scroll failure when loading the diff baseline (first build, collection absent)",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValueOnce({
                    body: "Lesson body",
                })
                    .mockResolvedValue(null)
                qdrantClient.scroll.mockRejectedValue(new Error("collection not found"))

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
                expect(qdrantClient.delete).not.toHaveBeenCalled()
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

        it("skips re-embedding a content whose source is unchanged since the last index (diff-aware)",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValueOnce({
                    body: "Stable lesson body",
                })
                    .mockResolvedValue(null)

                // first run: nothing indexed yet → embeds + records whatever sourceHash
                // the service computed for this exact source text
                const first = await service.build()
                expect(first.indexed).toBe(1)
                const sourceHash = fromDocuments.mock.calls[0][0][0].metadata.sourceHash as string
                expect(typeof sourceHash).toBe("string")

                // second run: the collection now reports that same hash for c1, and the
                // MinIO source text has not changed → the content must be skipped entirely
                fromDocuments.mockClear()
                qdrantClient.delete.mockClear()
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                contentId: "c1",
                                sourceHash,
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const second = await service.build()

                expect(second.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.delete).not.toHaveBeenCalled()
            })

        it("deletes the stale points and re-embeds a content whose source changed since the last index",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValueOnce({
                    body: "Updated lesson body",
                })
                    .mockResolvedValue(null)
                // the collection reports a marker hash that will never match the real
                // sha1 of the current source text → treated as changed
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                contentId: "c1",
                                sourceHash: "stale-hash-from-a-previous-version",
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(qdrantClient.delete).toHaveBeenCalledWith("lesson_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "contentId",
                                    match: {
                                        value: "c1",
                                    },
                                },
                            ],
                        },
                    }))
                expect(fromDocuments).toHaveBeenCalledTimes(1)
                const [
                    chunks,
                ] = fromDocuments.mock.calls[0]
                expect(chunks[0].metadata.sourceHash).not.toBe("stale-hash-from-a-previous-version")
            })

        it("deletes points for content no longer enumerated (deleted/renamed) even when nothing else changed",
            async () => {
                // the DB no longer has "gone" — it was deleted/renamed since the last index
                entityManager.find.mockResolvedValue([])
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                contentId: "gone",
                                sourceHash: "whatever",
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.delete).toHaveBeenCalledWith("lesson_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "contentId",
                                    match: {
                                        value: "gone",
                                    },
                                },
                            ],
                        },
                    }))
            })

        it("paginates through the diff baseline via scroll's next_page_offset",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("c1"),
                ])
                s3ReadService.json.mockResolvedValue(null)
                qdrantClient.scroll
                    .mockResolvedValueOnce({
                        points: [
                            {
                                payload: {
                                    contentId: "page1-content",
                                    sourceHash: "h1",
                                },
                            },
                        ],
                        next_page_offset: "cursor-2",
                    })
                    .mockResolvedValueOnce({
                        points: [
                            {
                                payload: {
                                    contentId: "page2-content",
                                    sourceHash: "h2",
                                },
                            },
                        ],
                        next_page_offset: null,
                    })

                await service.build()

                expect(qdrantClient.scroll).toHaveBeenCalledTimes(2)
                expect(qdrantClient.scroll.mock.calls[1][1]).toMatchObject({
                    offset: "cursor-2",
                })
                // both pages' contentIds are no longer enumerated in the DB → both stale
                expect(qdrantClient.delete).toHaveBeenCalledWith("lesson_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "contentId",
                                    match: {
                                        value: "page1-content",
                                    },
                                },
                            ],
                        },
                    }))
                expect(qdrantClient.delete).toHaveBeenCalledWith("lesson_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "contentId",
                                    match: {
                                        value: "page2-content",
                                    },
                                },
                            ],
                        },
                    }))
            })
    })
