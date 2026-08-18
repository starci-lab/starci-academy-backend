import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    AiModelCategory,
} from "@modules/databases/postgresql/primary/enums/ai-model-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    ContentRagIndexService,
} from "./content-rag-index.service"

/** The parts of a translation-resolver request the fake resolver keys off. */
interface ResolveTranslationCall {
    /** The entity field being resolved (`title`, `description`, `value`, ...). */
    field: string
    /** The locale the caller asked for. */
    locale: string
}

/**
 * The `services.contentRag` knobs the build reads, mutated per test. Lives
 * outside the `jest.mock` factory (hence the `mock` prefix jest requires) so a
 * test can flip a corpus toggle without re-mocking the whole env tree.
 */
const mockContentRagOverrides = {
    collection: "content_rag",
    // big chunk size so each source doc stays one chunk
    chunkSize: 100000,
    chunkOverlap: 0,
    indexChallenges: false,
    indexFlashcards: false,
    indexMilestoneTasks: false,
    indexFoundations: false,
}

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
// SUT -- we construct the service manually, so the real EmbeddingModelService
// class is never needed
jest.mock("@modules/integrations/langchain/embedding-model.service",
    () => ({
        EmbeddingModelService: class {
        },
    }))

// pin only the lesson-rag knobs; keep the rest of env real so other modules
// (cache config etc.) still read their defaults
jest.mock("@modules/platform/env/config",
    () => {
        const actual = jest.requireActual("@modules/platform/env/config")
        return {
            ...actual,
            envConfig: () => {
                const real = actual.envConfig()
                return {
                    ...real,
                    services: {
                        ...real.services,
                        contentRag: {
                            ...real.services.contentRag,
                            ...mockContentRagOverrides,
                        },
                    },
                }
            },
        }
    })

describe("ContentRagIndexService",
    () => {
        let service: ContentRagIndexService
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
            challenge: jest.Mock
            milestoneTask: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        let translationResolver: {
            resolve: jest.Mock
        }
        const embeddingModel = {
        }
        const fromDocuments = QdrantVectorStore.fromDocuments as unknown as jest.Mock
        const addDocuments = jest.fn()

        /**
         * Route `entityManager.find` by the entity class it is handed, so a test can
         * seed the challenge / deck / task / foundation corpora independently of the
         * lesson-content one (the build issues one `find` per enabled kind).
         */
        const rowsByEntity = (
            rows: Record<string, Array<unknown>>,
        ) => {
            entityManager.find.mockImplementation(async (
                entity: {
                    name: string
                },
            ) => rows[entity.name] ?? [])
        }

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
            // every corpus toggle starts OFF; a test opts its kind in explicitly
            mockContentRagOverrides.indexChallenges = false
            mockContentRagOverrides.indexFlashcards = false
            mockContentRagOverrides.indexMilestoneTasks = false
            mockContentRagOverrides.indexFoundations = false
            mockContentRagOverrides.chunkSize = 100000
            mockContentRagOverrides.chunkOverlap = 0
            qdrantClient = {
                // default: no `content_rag` collection yet (first build) -- the diff
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
                challenge: jest.fn((id: string,
                    locale: string) => `challenges/${id}/${locale}.json`),
                milestoneTask: jest.fn((id: string,
                    locale: string) => `milestone-tasks/${id}/${locale}.json`),
            }
            winstonService = {
                log: jest.fn(),
            }
            // foundation indexing (collectFoundationDocs) resolves EAV translations
            // through this; the content/code test path never hits it, so an unstubbed
            // resolve is fine (foundation docs fall back to base columns anyway).
            translationResolver = {
                resolve: jest.fn(),
            }
            service = new ContentRagIndexService(
                qdrantClient as never,
                entityManager as never,
                embeddingModelService as never,
                s3ReadService as never,
                s3NameResolverService as never,
                winstonService as never,
                translationResolver as never,
            )
            fromDocuments.mockReset()
            addDocuments.mockReset().mockResolvedValue(undefined)
            fromDocuments.mockResolvedValue({
                addDocuments,
            })
        })

        it("enumerates contents, reads body+code from MinIO, and upserts into content_rag with contentId+sourceHash payload",
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

                // 2 body docs + 1 code doc -> 3 chunks (chunkSize huge -> 1 chunk each)
                expect(result.indexed).toBe(3)
                // a BRAND-NEW content on a first build has nothing indexed yet -> its
                // delete is SKIPPED (the dirtyPreviouslyIndexedIds optimization avoids a
                // wasted full-collection scan per new row; only previously-indexed
                // changed content gets its stale points cleared before re-insert)
                expect(qdrantClient.delete).not.toHaveBeenCalled()
                expect(fromDocuments).toHaveBeenCalledTimes(1)

                const [
                    chunks,
                    model,
                    opts,
                ] = fromDocuments.mock.calls[0]
                expect(model).toBe(embeddingModel)
                expect(opts).toMatchObject({
                    collectionName: "content_rag",
                    client: qdrantClient,
                })
                // every chunk carries the contentId + sourceHash payload -- the hash is
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
                // bad: every body read returns null (object missing from MinIO) -> skipped
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
                // boom: the body read THROWS (MinIO/network error) -> caught + skipped
                // good: vi body present, en null -> 1 chunk
                // a raw MinIO/network failure that propagates unwrapped from the S3 client
                const minioReadError = new Error("MinIO read failed")
                s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                    if (args.key.startsWith("contents/boom/")) {
                        throw minioReadError
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
                // the SAME source text on both runs -- the diff must recognise it
                s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/c1/vi.json"
                    ? {
                        body: "Stable lesson body",
                    }
                    : null)

                // first run: nothing indexed yet -> embeds + records whatever sourceHash
                // the service computed for this exact source text
                const first = await service.build()
                expect(first.indexed).toBe(1)
                const sourceHash = fromDocuments.mock.calls[0][0][0].metadata.sourceHash as string
                expect(typeof sourceHash).toBe("string")

                // second run: the collection now reports that same hash for c1, and the
                // MinIO source text has not changed -> the content must be skipped entirely
                fromDocuments.mockClear()
                qdrantClient.delete.mockClear()
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    contentId: "c1",
                                    sourceHash,
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const second = await service.build()

                expect(second.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.delete).not.toHaveBeenCalled()
                // the skip is counted, not silently dropped
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.content.unchanged",
                        meta: {
                            unchanged: 1,
                        },
                    }),
                )
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
                // sha1 of the current source text -> treated as changed
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    contentId: "c1",
                                    sourceHash: "stale-hash-from-a-previous-version",
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(qdrantClient.delete).toHaveBeenCalledWith("content_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "metadata.contentId",
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
                // the DB no longer has "gone" -- it was deleted/renamed since the last index
                entityManager.find.mockResolvedValue([])
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    contentId: "gone",
                                    sourceHash: "whatever",
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.delete).toHaveBeenCalledWith("content_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "metadata.contentId",
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
                                    metadata: {
                                        contentId: "page1-content",
                                        sourceHash: "h1",
                                    },
                                },
                            },
                        ],
                        next_page_offset: "cursor-2",
                    })
                    .mockResolvedValueOnce({
                        points: [
                            {
                                payload: {
                                    metadata: {
                                        contentId: "page2-content",
                                        sourceHash: "h2",
                                    },
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
                // both pages' contentIds are no longer enumerated in the DB -> both stale
                expect(qdrantClient.delete).toHaveBeenCalledWith("content_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "metadata.contentId",
                                    match: {
                                        value: "page1-content",
                                    },
                                },
                            ],
                        },
                    }))
                expect(qdrantClient.delete).toHaveBeenCalledWith("content_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "metadata.contentId",
                                    match: {
                                        value: "page2-content",
                                    },
                                },
                            ],
                        },
                    }))
            })

        it("keeps the corpus embedding on the local lane",
            async () => {
                entityManager.find.mockResolvedValue([])

                await service.build()

                expect(embeddingModelService.getViaBalancer).toHaveBeenCalledWith(
                    AiModelCategory.EmbeddingLocal,
                )
            })

        it("ignores diff markers whose payload carries no usable contentId/sourceHash pair",
            async () => {
                entityManager.find.mockResolvedValue([])
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        // no payload at all
                        {
                        },
                        // metadata present but the hash is missing
                        {
                            payload: {
                                metadata: {
                                    contentId: "no-hash",
                                },
                            },
                        },
                        // non-string marker values are not markers
                        {
                            payload: {
                                metadata: {
                                    contentId: 7,
                                    sourceHash: "h",
                                },
                            },
                        },
                        {
                            payload: {
                                metadata: {
                                    contentId: "real",
                                    sourceHash: "first-wins",
                                },
                            },
                        },
                        // duplicate id -- the first marker for an id wins
                        {
                            payload: {
                                metadata: {
                                    contentId: "real",
                                    sourceHash: "second-loses",
                                },
                            },
                        },
                    ],
                    // an absent cursor ends the scan just like an explicit null
                    next_page_offset: undefined,
                })

                await service.build()

                expect(qdrantClient.scroll).toHaveBeenCalledTimes(1)
                const deletedIds = qdrantClient.delete.mock.calls.map(
                    (call) => call[1].filter.must[0].match.value,
                )
                expect(deletedIds).toEqual([
                    "real",
                ])
            })

        it("does not fail the build when clearing a stale content's points fails",
            async () => {
                entityManager.find.mockResolvedValue([])
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    contentId: "gone",
                                    sourceHash: "h",
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })
                qdrantClient.delete.mockRejectedValue(new Error("Not found: Collection `content_rag`"))

                await expect(service.build()).resolves.toEqual({
                    indexed: 0,
                })
            })

        it("clears every vanished content even when they outnumber the delete worker pool",
            async () => {
                entityManager.find.mockResolvedValue([])
                qdrantClient.scroll.mockResolvedValue({
                    points: Array.from({
                        length: 45,
                    },
                    (
                        _value,
                        index,
                    ) => ({
                        payload: {
                            metadata: {
                                contentId: `gone-${index}`,
                                sourceHash: "h",
                            },
                        },
                    })),
                    next_page_offset: null,
                })

                await service.build()

                expect(qdrantClient.delete).toHaveBeenCalledTimes(45)
                const deletedIds = qdrantClient.delete.mock.calls.map(
                    (call) => call[1].filter.must[0].match.value,
                )
                expect(new Set(deletedIds).size).toBe(45)
            })

        it("records a non-Error item failure as its stringified value",
            async () => {
                entityManager.find.mockResolvedValue([
                    content("boom"),
                ])
                s3ReadService.json.mockRejectedValue("minio transport closed")

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.content.item-skipped",
                        referenceId: "boom",
                        error: "minio transport closed",
                    }),
                )
            })

        it("indexes a content with no owning course under an empty courseId",
            async () => {
                entityManager.find.mockResolvedValue([
                    {
                        id: "orphan",
                        isSandbox: false,
                        githubBaseUrl: null,
                        githubDir: null,
                        module: null,
                    },
                ])
                s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/orphan/vi.json"
                    ? {
                        body: "Standalone lesson",
                    }
                    : null)

                await service.build()

                expect(fromDocuments.mock.calls[0][0][0].metadata.courseId).toBe("")
            })

        it("emits a scan-progress heartbeat every fiftieth item",
            async () => {
                const contents = Array.from({
                    length: 50,
                },
                (
                    _value,
                    index,
                ) => content(`c${index}`))
                entityManager.find.mockResolvedValue(contents)
                s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key.endsWith("/vi.json")
                    ? {
                        body: `Lesson ${args.key}`,
                    }
                    : null)

                const result = await service.build()

                expect(result.indexed).toBe(50)
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.content.scan-progress",
                        count: 50,
                        meta: {
                            total: 50,
                            changedSoFar: 50,
                        },
                    }),
                )
            })

        it("embeds in bounded batches instead of one call over the whole corpus",
            async () => {
                // small chunks so a single lesson body splits into 500 chunks: one
                // fromDocuments round of 200 plus two addDocuments rounds
                mockContentRagOverrides.chunkSize = 50
                entityManager.find.mockResolvedValue([
                    content("big"),
                ])
                s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/big/vi.json"
                    ? {
                        body: "0123456789".repeat(2_500),
                    }
                    : null)

                const result = await service.build()

                expect(result.indexed).toBe(500)
                expect(fromDocuments).toHaveBeenCalledTimes(1)
                expect(fromDocuments.mock.calls[0][0]).toHaveLength(200)
                expect(addDocuments).toHaveBeenCalledTimes(2)
                expect(addDocuments.mock.calls[0][0]).toHaveLength(200)
                expect(addDocuments.mock.calls[1][0]).toHaveLength(100)
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.content.batch-embedded",
                        count: 500,
                    }),
                )
            })

        describe("lesson body resolution",
            () => {
                it("falls back to the SCHEMA V2 bodies buckets, preferring the locale translation",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            content("v2"),
                        ])
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key.startsWith("contents/v2/")
                            ? {
                                body: "",
                                bodies: [
                                    {
                                        body: "bucket default body",
                                        translations: [
                                            {
                                                locale: Locale.Vi,
                                                body: "than bai viet",
                                            },
                                        ],
                                    },
                                ],
                            }
                            : null)

                        await service.build()

                        const docs = fromDocuments.mock.calls[0][0]
                        expect(docs.map((doc: { pageContent: string }) => doc.pageContent)).toEqual([
                            // vi has a translation; en falls back to the bucket's own body
                            "than bai viet",
                            "bucket default body",
                        ])
                    })

                it("walks past empty buckets and buckets with no translations at all",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            content("v2"),
                        ])
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/v2/vi.json"
                            ? {
                                body: "   ",
                                bodies: [
                                    {
                                        body: "   ",
                                    },
                                    {
                                        body: "second bucket wins",
                                    },
                                ],
                            }
                            : null)

                        await service.build()

                        expect(fromDocuments.mock.calls[0][0][0].pageContent).toBe("second bucket wins")
                    })

                it("skips a content whose snapshot has neither a body nor any bucket",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            content("blank"),
                        ])
                        s3ReadService.json.mockResolvedValue({
                            body: "",
                        })

                        const result = await service.build()

                        expect(result.indexed).toBe(0)
                        expect(fromDocuments).not.toHaveBeenCalled()
                    })
            })

        describe("sandbox code collection",
            () => {
                it("skips a sandbox lesson whose repo URL has no trailing segment",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "sb",
                                isSandbox: true,
                                githubBaseUrl: "https://github.com/org/",
                                githubDir: "frontend",
                                module: {
                                    course: {
                                        id: "course-1",
                                    },
                                },
                            },
                        ])
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/sb/vi.json"
                            ? {
                                body: "Lesson",
                            }
                            : null)

                        const result = await service.build()

                        // only the body doc: the repo file map was never read
                        expect(result.indexed).toBe(1)
                        expect(s3NameResolverService.repo).not.toHaveBeenCalled()
                    })

                it("skips a sandbox lesson that declares no github directory",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                id: "sb",
                                isSandbox: true,
                                githubBaseUrl: "https://github.com/org/repo",
                                githubDir: null,
                                module: {
                                    course: {
                                        id: "course-1",
                                    },
                                },
                            },
                        ])
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "contents/sb/vi.json"
                            ? {
                                body: "Lesson",
                            }
                            : null)

                        const result = await service.build()

                        expect(result.indexed).toBe(1)
                        expect(s3NameResolverService.repo).not.toHaveBeenCalled()
                    })

                it("tolerates a missing repo file map and skips blank files inside it",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            content("noRepo",
                                true),
                            content("blankFile",
                                true),
                        ])
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                            if (args.key === "contents/noRepo/vi.json" || args.key === "contents/blankFile/vi.json") {
                                return {
                                    body: `body of ${args.key}`,
                                }
                            }
                            if (args.key === "repo/repo-blankFile/frontend.json") {
                                return {
                                    "/src/empty.ts": {
                                        code: "   \n",
                                    },
                                    "/src/App.tsx": {
                                        code: "export const App = () => null",
                                    },
                                }
                            }
                            // repo/repo-noRepo/frontend.json is absent
                            return null
                        })

                        const result = await service.build()

                        // 2 bodies + only the ONE non-blank code file
                        expect(result.indexed).toBe(3)
                        const codeDocs = fromDocuments.mock.calls[0][0].filter(
                            (doc: { metadata: { kind: string } }) => doc.metadata.kind === "code",
                        )
                        expect(codeDocs).toHaveLength(1)
                        expect(codeDocs[0].metadata.filePath).toBe("/src/App.tsx")
                        expect(codeDocs[0].metadata.lang).toBe("typescript")
                    })
            })

        describe("challenge corpus",
            () => {
                beforeEach(() => {
                    mockContentRagOverrides.indexChallenges = true
                })

                it("indexes a challenge's title, description and hint per locale under its course",
                    async () => {
                        rowsByEntity({
                            ChallengeEntity: [
                                {
                                    id: "ch1",
                                    content: {
                                        module: {
                                            course: {
                                                id: "course-9",
                                            },
                                        },
                                    },
                                },
                            ],
                        })
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "challenges/ch1/vi.json"
                            ? {
                                title: "Xay dung API",
                                description: "Mo ta",
                                hint: undefined,
                            }
                            : null)

                        const result = await service.build()

                        expect(result.indexed).toBe(1)
                        const [
                            doc,
                        ] = fromDocuments.mock.calls[0][0]
                        expect(doc.pageContent).toBe("Xay dung API\n\nMo ta")
                        expect(doc.metadata).toMatchObject({
                            contentId: "ch1",
                            courseId: "course-9",
                            kind: "challenge",
                            lang: Locale.Vi,
                        })
                    })

                it("indexes an unattached challenge under an empty courseId and skips an all-blank snapshot",
                    async () => {
                        rowsByEntity({
                            ChallengeEntity: [
                                {
                                    id: "loose",
                                    content: null,
                                },
                                {
                                    id: "blank",
                                    content: null,
                                },
                            ],
                        })
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                            if (args.key === "challenges/loose/vi.json") {
                                return {
                                    title: "Bai tap",
                                }
                            }
                            if (args.key === "challenges/blank/vi.json") {
                                return {
                                    title: "  ",
                                    description: "",
                                }
                            }
                            return null
                        })

                        const result = await service.build()

                        expect(result.indexed).toBe(1)
                        expect(fromDocuments.mock.calls[0][0][0].metadata).toMatchObject({
                            contentId: "loose",
                            courseId: "",
                        })
                    })
            })

        describe("flashcard deck corpus",
            () => {
                beforeEach(() => {
                    mockContentRagOverrides.indexFlashcards = true
                })

                it("assembles a deck from its resolved translations and every card",
                    async () => {
                        rowsByEntity({
                            FlashcardDeckEntity: [
                                {
                                    id: "d1",
                                    courseId: "course-3",
                                    defaultLocale: Locale.Vi,
                                    title: "base title",
                                    description: "base description",
                                    translations: [],
                                    cards: [
                                        {
                                            defaultLocale: Locale.En,
                                            question: "base q",
                                            answer: "base a",
                                            explanation: "base e",
                                            translations: [],
                                        },
                                    ],
                                },
                            ],
                        })
                        s3ReadService.json.mockResolvedValue(null)
                        translationResolver.resolve.mockImplementation((
                            {
                                field,
                                locale,
                            }: ResolveTranslationCall,
                        ) => `${field}-${locale}`)

                        const result = await service.build()

                        expect(result.indexed).toBe(2)
                        const [
                            viDoc,
                        ] = fromDocuments.mock.calls[0][0]
                        expect(viDoc.pageContent).toBe(
                            "title-vi\n\ndescription-vi\n\nquestion-vi\nanswer-vi\nexplanation-vi",
                        )
                        expect(viDoc.metadata).toMatchObject({
                            contentId: "d1",
                            courseId: "course-3",
                            kind: "flashcard",
                            lang: Locale.Vi,
                        })
                        // the deck's own defaultLocale is the fallback handed to the resolver
                        expect(translationResolver.resolve).toHaveBeenCalledWith(
                            expect.objectContaining({
                                field: "title",
                                fallbackLocale: Locale.Vi,
                            }),
                        )
                        // a card without its own defaultLocale would inherit the deck's
                        expect(translationResolver.resolve).toHaveBeenCalledWith(
                            expect.objectContaining({
                                field: "question",
                                fallbackLocale: Locale.En,
                            }),
                        )
                    })

                it("falls back to the base columns when no translation resolves, and skips an empty deck",
                    async () => {
                        rowsByEntity({
                            FlashcardDeckEntity: [
                                {
                                    id: "d2",
                                    courseId: null,
                                    title: "Base deck",
                                    description: undefined,
                                    translations: [],
                                    cards: [
                                        {
                                            question: "Base question",
                                            answer: undefined,
                                            explanation: "  ",
                                            translations: [],
                                        },
                                    ],
                                },
                                {
                                    id: "empty",
                                    title: "",
                                    description: "",
                                    translations: [],
                                },
                            ],
                        })
                        s3ReadService.json.mockResolvedValue(null)
                        translationResolver.resolve.mockReturnValue("")

                        const result = await service.build()

                        // only d2, once per locale; the empty deck contributes nothing
                        expect(result.indexed).toBe(2)
                        const [
                            viDoc,
                        ] = fromDocuments.mock.calls[0][0]
                        expect(viDoc.pageContent).toBe("Base deck\n\nBase question")
                        // a deck with no course still gets an (empty) courseId payload
                        expect(viDoc.metadata.courseId).toBe("")
                        // a deck with no defaultLocale falls back to English
                        expect(translationResolver.resolve).toHaveBeenCalledWith(
                            expect.objectContaining({
                                field: "title",
                                fallbackLocale: Locale.En,
                            }),
                        )
                    })
            })

        describe("milestone task corpus",
            () => {
                beforeEach(() => {
                    mockContentRagOverrides.indexMilestoneTasks = true
                })

                it("prefers the language-agnostic brief and tags the owning course",
                    async () => {
                        rowsByEntity({
                            MilestoneTaskEntity: [
                                {
                                    id: "t1",
                                    milestone: {
                                        course: {
                                            id: "course-7",
                                        },
                                    },
                                },
                            ],
                        })
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => args.key === "milestone-tasks/t1/vi.json"
                            ? {
                                title: "Nhiem vu",
                                description: "Mo ta",
                                hint: "Goi y",
                                briefs: [
                                    {
                                        lang: "ts",
                                        body: "typescript brief",
                                    },
                                    {
                                        lang: "agnostic",
                                        body: "agnostic brief",
                                    },
                                ],
                            }
                            : null)

                        const result = await service.build()

                        expect(result.indexed).toBe(1)
                        const [
                            doc,
                        ] = fromDocuments.mock.calls[0][0]
                        expect(doc.pageContent).toBe("Nhiem vu\n\nMo ta\n\nGoi y\n\nagnostic brief")
                        expect(doc.metadata).toMatchObject({
                            contentId: "t1",
                            courseId: "course-7",
                            kind: "milestone",
                        })
                    })

                it("falls back to the first brief, tolerates none, and skips a blank snapshot",
                    async () => {
                        rowsByEntity({
                            MilestoneTaskEntity: [
                                {
                                    id: "first",
                                    milestone: null,
                                },
                                {
                                    id: "nobrief",
                                    milestone: null,
                                },
                                {
                                    id: "blank",
                                    milestone: null,
                                },
                            ],
                        })
                        s3ReadService.json.mockImplementation(async (args: { key: string }) => {
                            if (args.key === "milestone-tasks/first/vi.json") {
                                return {
                                    title: "First",
                                    briefs: [
                                        {
                                            lang: "java",
                                            body: "java brief",
                                        },
                                    ],
                                }
                            }
                            if (args.key === "milestone-tasks/nobrief/vi.json") {
                                return {
                                    title: "No brief",
                                }
                            }
                            if (args.key === "milestone-tasks/blank/vi.json") {
                                return {
                                    title: " ",
                                    briefs: [],
                                }
                            }
                            return null
                        })

                        const result = await service.build()

                        expect(result.indexed).toBe(2)
                        const pageContents = fromDocuments.mock.calls[0][0]
                            .map((doc: { pageContent: string }) => doc.pageContent)
                        expect(pageContents).toEqual([
                            "First\n\njava brief",
                            "No brief",
                        ])
                        expect(fromDocuments.mock.calls[0][0][0].metadata.courseId).toBe("")
                    })
            })

        describe("foundation corpus",
            () => {
                beforeEach(() => {
                    mockContentRagOverrides.indexFoundations = true
                })

                it("indexes a foundation's resolved title, description and value without a courseId",
                    async () => {
                        rowsByEntity({
                            FoundationEntity: [
                                {
                                    id: "f1",
                                    defaultLocale: Locale.Vi,
                                    title: "base title",
                                    description: "base description",
                                    value: "base value",
                                    translations: [],
                                },
                            ],
                        })
                        s3ReadService.json.mockResolvedValue(null)
                        translationResolver.resolve.mockImplementation((
                            {
                                field,
                                locale,
                            }: ResolveTranslationCall,
                        ) => `${field}-${locale}`)

                        const result = await service.build()

                        expect(result.indexed).toBe(2)
                        const [
                            viDoc,
                        ] = fromDocuments.mock.calls[0][0]
                        expect(viDoc.pageContent).toBe("title-vi\n\ndescription-vi\n\nvalue-vi")
                        expect(viDoc.metadata).toMatchObject({
                            contentId: "f1",
                            kind: "content",
                        })
                        // foundations hang off a category, not a course -- no courseId payload
                        expect(viDoc.metadata.courseId).toBeUndefined()
                        expect(translationResolver.resolve).toHaveBeenCalledWith(
                            expect.objectContaining({
                                field: "value",
                                fallbackLocale: Locale.Vi,
                            }),
                        )
                    })

                it("falls back to the base columns, treats missing text as empty, and skips a blank foundation",
                    async () => {
                        rowsByEntity({
                            FoundationEntity: [
                                {
                                    id: "f2",
                                    title: "Only a title",
                                    description: null,
                                    value: undefined,
                                    translations: [],
                                },
                                {
                                    id: "blank",
                                    title: "  ",
                                    translations: [],
                                },
                            ],
                        })
                        s3ReadService.json.mockResolvedValue(null)
                        translationResolver.resolve.mockReturnValue("")

                        const result = await service.build()

                        expect(result.indexed).toBe(2)
                        expect(fromDocuments.mock.calls[0][0][0].pageContent).toBe("Only a title")
                        // no defaultLocale on the row -> English is the fallback
                        expect(translationResolver.resolve).toHaveBeenCalledWith(
                            expect.objectContaining({
                                field: "title",
                                fallbackLocale: Locale.En,
                            }),
                        )
                    })
            })
    })
