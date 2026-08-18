import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    CvRagIndexService,
} from "./cv-rag-index.service"

jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromDocuments: jest.fn(),
        },
    }))

// cut the heavy embedding/ai/cache + mount/S3 import chains pulled in
// transitively by the SUT -- the service is constructed by hand, so the real
// classes are never needed
jest.mock("@modules/integrations/langchain/embedding-model.service",
    () => ({
        EmbeddingModelService: class {
        },
    }))
jest.mock("@modules/init/seeders/shared/contexts/loader.service",
    () => ({
        ContextLoaderService: class {
        },
    }))
jest.mock("@modules/init/seeders/shared/path/resolver.service",
    () => ({
        PathResolverService: class {
        },
    }))

describe("CvRagIndexService",
    () => {
        let service: CvRagIndexService
        let qdrantClient: {
            scroll: jest.Mock
            delete: jest.Mock
        }
        let embeddingModelService: {
            getViaBalancer: jest.Mock
        }
        let contextLoaderService: {
            load: jest.Mock
        }
        let pathResolverService: {
            filePaths: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        const embeddingModel = {
        }
        const fromDocuments = QdrantVectorStore.fromDocuments as unknown as jest.Mock
        const addDocuments = jest.fn()

        /** A corpus markdown file in the `# title / # description / # body` shape. */
        const markdown = (
            title: string,
            body: string,
        ) => `# title\n${title}\n\n# description\n${title} description\n\n# body\n${body}\n`

        /** Program `filePaths` so only the named folder yields entries. */
        const corpusIn = (
            byRelativePath: Record<string, Array<string>>,
        ) => {
            pathResolverService.filePaths.mockImplementation(async (
                baseDir: string,
                relativePath: string,
            ) => {
                expect(baseDir).toBe("cv")
                return (byRelativePath[relativePath] ?? []).map((entryId) => ({
                    relativePath: entryId,
                    orderIndex: 0,
                    displayId: entryId,
                }))
            })
        }

        beforeEach(() => {
            jest.clearAllMocks()
            qdrantClient = {
                // default: the `cv_rag` collection does not exist yet (first build)
                scroll: jest.fn().mockRejectedValue(new Error("Not found: Collection `cv_rag`")),
                delete: jest.fn().mockResolvedValue(undefined),
            }
            embeddingModelService = {
                getViaBalancer: jest.fn().mockResolvedValue(embeddingModel),
            }
            contextLoaderService = {
                load: jest.fn(),
            }
            pathResolverService = {
                filePaths: jest.fn().mockResolvedValue([]),
            }
            winstonService = {
                log: jest.fn(),
            }
            addDocuments.mockResolvedValue(undefined)
            fromDocuments.mockResolvedValue({
                addDocuments,
            })
            service = new CvRagIndexService(
                qdrantClient as never,
                embeddingModelService as never,
                contextLoaderService as never,
                pathResolverService as never,
                winstonService as never,
            )
        })

        it("scans every corpus folder and tags each entry with its retrieval kind",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                    catalogs: [
                        "catalogs/01-skills",
                    ],
                    samples: [
                        "samples/01-backend",
                    ],
                    refs: [
                        "refs/01-real-cv",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.endsWith("/en.md")) {
                        return markdown(relativePath,
                            "English body")
                    }
                    throw new Error(`missing ${baseDir}/${relativePath}`)
                })

                const result = await service.build()

                expect(pathResolverService.filePaths.mock.calls.map((call) => call[1])).toEqual([
                    "",
                    "catalogs",
                    "samples",
                    "refs",
                ])
                expect(result.indexed).toBe(4)
                const [
                    chunks,
                    model,
                    options,
                ] = fromDocuments.mock.calls[0]
                expect(model).toBe(embeddingModel)
                expect(options).toEqual({
                    client: qdrantClient,
                    collectionName: "cv_rag",
                })
                const kindByEntry = Object.fromEntries(
                    chunks.map((chunk: { metadata: { entryId: string, kind: string } }) => [
                        chunk.metadata.entryId,
                        chunk.metadata.kind,
                    ]),
                )
                expect(kindByEntry).toEqual({
                    "0-standard": "rubric",
                    "catalogs/01-skills": "catalog",
                    "samples/01-backend": "sample",
                    // refs/ are the teacher's cleaned real CVs -- same retrieval role as samples
                    "refs/01-real-cv": "sample",
                })
                for (const chunk of chunks) {
                    expect(chunk.metadata.lang).toBe("en")
                    expect(typeof chunk.metadata.sourceHash).toBe("string")
                }
            })

        it("indexes both locales when a vi translation is present",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => relativePath.endsWith("/vi.md")
                    ? markdown("Tieu de",
                        "Noi dung")
                    : markdown("Title",
                        "Body"))

                const result = await service.build()

                expect(result.indexed).toBe(2)
                const langs = fromDocuments.mock.calls[0][0]
                    .map((chunk: { metadata: { lang: string } }) => chunk.metadata.lang)
                expect(langs).toEqual([
                    "en",
                    "vi",
                ])
            })

        it("skips a locale whose file resolves to empty content",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => relativePath.endsWith("/en.md")
                    ? markdown("Title",
                        "Body")
                    : "")

                const result = await service.build()

                expect(result.indexed).toBe(1)
            })

        it("skips an entry whose markdown carries no title, description or body",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                    catalogs: [
                        "catalogs/01-skills",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.startsWith("0-standard/")) {
                        // no recognised section headings -> nothing parses out
                        return "just some prose with no sections\n"
                    }
                    if (relativePath.endsWith("/en.md")) {
                        return markdown("Skills",
                            "Body")
                    }
                    throw new Error("no vi")
                })

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(fromDocuments.mock.calls[0][0][0].metadata.entryId).toBe("catalogs/01-skills")
            })

        it("skips and logs a corpus entry that cannot be read, without aborting the build",
            async () => {
                corpusIn({
                    "": [
                        "0-broken",
                    ],
                    catalogs: [
                        "catalogs/01-skills",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.startsWith("0-broken/")) {
                        // a loader payload that is not markdown: parsing it raises a
                        // bare (non-Error) throwable, which the skip path stringifies
                        return {
                            split: () => {
                                throw "loader payload is not markdown"
                            },
                        }
                    }
                    if (relativePath.endsWith("/en.md")) {
                        return markdown("Skills",
                            "Body")
                    }
                    throw new Error("no vi")
                })

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.cv.item-skipped",
                        referenceId: "0-broken",
                        error: "loader payload is not markdown",
                    }),
                )
            })

        it("records an Error raised while collecting an entry by its message",
            async () => {
                corpusIn({
                    "": [
                        "0-broken",
                    ],
                })
                contextLoaderService.load.mockResolvedValue({
                    split: () => {
                        throw new Error("markdown parser blew up")
                    },
                })

                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.cv.item-skipped",
                        error: "markdown parser blew up",
                    }),
                )
            })

        it("records a no-op step and embeds nothing when the corpus is empty",
            async () => {
                const result = await service.build()

                expect(result.indexed).toBe(0)
                expect(fromDocuments).not.toHaveBeenCalled()
                expect(qdrantClient.delete).not.toHaveBeenCalled()
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.cv.unchanged",
                        count: 0,
                    }),
                )
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.ProcessStepExecuted,
                    expect.objectContaining({
                        step: "cv-rag-index",
                        meta: expect.objectContaining({
                            chunks: 0,
                        }),
                    }),
                )
            })

        it("skips re-embedding an entry whose markdown is unchanged since the last index",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.endsWith("/en.md")) {
                        return markdown("Title",
                            "Body")
                    }
                    throw new Error("no vi")
                })

                const first = await service.build()
                expect(first.indexed).toBe(1)
                const sourceHash = fromDocuments.mock.calls[0][0][0].metadata.sourceHash as string

                fromDocuments.mockClear()
                qdrantClient.delete.mockClear()
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    entryId: "0-standard",
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
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RagIndexProgress,
                    expect.objectContaining({
                        op: "rag.cv.unchanged",
                        meta: {
                            unchanged: 1,
                        },
                    }),
                )
            })

        it("clears the stale points of a changed entry before re-embedding it",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.endsWith("/en.md")) {
                        return markdown("Title",
                            "Rewritten body")
                    }
                    throw new Error("no vi")
                })
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    entryId: "0-standard",
                                    sourceHash: "stale-hash",
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })

                const result = await service.build()

                expect(result.indexed).toBe(1)
                expect(qdrantClient.delete).toHaveBeenCalledWith("cv_rag",
                    {
                        filter: {
                            must: [
                                {
                                    key: "metadata.entryId",
                                    match: {
                                        value: "0-standard",
                                    },
                                },
                            ],
                        },
                    })
                expect(fromDocuments.mock.calls[0][0][0].metadata.sourceHash).not.toBe("stale-hash")
            })

        it("drops the points of an entry that is no longer part of the corpus",
            async () => {
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    entryId: "samples/99-removed",
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
                expect(qdrantClient.delete).toHaveBeenCalledWith("cv_rag",
                    expect.objectContaining({
                        filter: {
                            must: [
                                {
                                    key: "metadata.entryId",
                                    match: {
                                        value: "samples/99-removed",
                                    },
                                },
                            ],
                        },
                    }))
                expect(winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.ProcessStepExecuted,
                    expect.objectContaining({
                        meta: expect.objectContaining({
                            removed: 1,
                        }),
                    }),
                )
            })

        it("does not fail the build when clearing stale points fails",
            async () => {
                qdrantClient.scroll.mockResolvedValue({
                    points: [
                        {
                            payload: {
                                metadata: {
                                    entryId: "samples/99-removed",
                                    sourceHash: "whatever",
                                },
                            },
                        },
                    ],
                    next_page_offset: null,
                })
                qdrantClient.delete.mockRejectedValue(new Error("Not found: Collection `cv_rag`"))

                await expect(service.build()).resolves.toEqual({
                    indexed: 0,
                })
            })

        it("paginates the diff baseline and ignores payloads without a usable marker",
            async () => {
                corpusIn({
                    "": [
                        "0-standard",
                    ],
                })
                contextLoaderService.load.mockRejectedValue(new Error("no file"))
                qdrantClient.scroll
                    .mockResolvedValueOnce({
                        points: [
                            // no payload at all
                            {
                            },
                            // marker without a hash
                            {
                                payload: {
                                    metadata: {
                                        entryId: "catalogs/01-skills",
                                    },
                                },
                            },
                            {
                                payload: {
                                    metadata: {
                                        entryId: "samples/01-backend",
                                        sourceHash: "h1",
                                    },
                                },
                            },
                            // duplicate id -- the first marker wins
                            {
                                payload: {
                                    metadata: {
                                        entryId: "samples/01-backend",
                                        sourceHash: "h2",
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
                                        entryId: "refs/01-real-cv",
                                        sourceHash: "h3",
                                    },
                                },
                            },
                        ],
                        // an absent cursor ends the scan just like an explicit null
                        next_page_offset: undefined,
                    })

                await service.build()

                expect(qdrantClient.scroll).toHaveBeenCalledTimes(2)
                expect(qdrantClient.scroll.mock.calls[0][1]).toMatchObject({
                    limit: 1000,
                    offset: undefined,
                    with_vector: false,
                })
                expect(qdrantClient.scroll.mock.calls[1][1]).toMatchObject({
                    offset: "cursor-2",
                })
                // only the two entries carrying a usable marker are treated as indexed
                const deletedEntryIds = qdrantClient.delete.mock.calls.map(
                    (call) => call[1].filter.must[0].match.value,
                )
                expect(deletedEntryIds.sort()).toEqual([
                    "refs/01-real-cv",
                    "samples/01-backend",
                ])
            })

        it("embeds in bounded batches once the corpus exceeds one round",
            async () => {
                // 201 entries -> 201 chunks -> one fromDocuments round of 200 plus one
                // addDocuments round of 1
                const entryIds = Array.from({
                    length: 201,
                },
                (
                    _value,
                    index,
                ) => `catalogs/${index}-entry`)
                corpusIn({
                    catalogs: entryIds,
                })
                contextLoaderService.load.mockImplementation(async (
                    _baseDir: string,
                    relativePath: string,
                ) => {
                    if (relativePath.endsWith("/en.md")) {
                        return markdown(relativePath,
                            "Body")
                    }
                    throw new Error("no vi")
                })

                const result = await service.build()

                expect(result.indexed).toBe(201)
                expect(fromDocuments).toHaveBeenCalledTimes(1)
                expect(fromDocuments.mock.calls[0][0]).toHaveLength(200)
                expect(addDocuments).toHaveBeenCalledTimes(1)
                expect(addDocuments.mock.calls[0][0]).toHaveLength(1)
            })
    })
