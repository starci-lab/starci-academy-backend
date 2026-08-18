import {
    QdrantVectorStore,
} from "@langchain/qdrant"
import {
    RagPlaygroundSourceKind,
} from "@modules/databases/postgresql/primary/enums/rag-playground-source-kind"
import {
    RagPlaygroundImportException,
} from "@modules/platform/exceptions/errors/rag-playground/import-failed"
import {
    RagPlaygroundSampleNotFoundException,
} from "@modules/platform/exceptions/errors/rag-playground/sample-not-found"
import {
    RagPlaygroundSessionNotFoundException,
} from "@modules/platform/exceptions/errors/rag-playground/session-not-found"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    PublicRagPlaygroundService,
} from "./public-rag-playground.service"

// the vector store is the only external boundary the playground touches besides
// Qdrant's raw client; both are stubbed so nothing leaves the process
jest.mock("@langchain/qdrant",
    () => ({
        QdrantVectorStore: {
            fromDocuments: jest.fn(),
            fromExistingCollection: jest.fn(),
        },
    }))

// cut the heavy embedding/ai/cache import chain -- the service is constructed by
// hand, so the real class is never needed
jest.mock("@modules/integrations/langchain/embedding-model.service",
    () => ({
        EmbeddingModelService: class {
        },
    }))

describe("PublicRagPlaygroundService",
    () => {
        let service: PublicRagPlaygroundService
        let qdrantClient: {
            deleteCollection: jest.Mock
        }
        let entityManager: {
            upsert: jest.Mock
            findOne: jest.Mock
            update: jest.Mock
        }
        let embeddingModelService: {
            getViaBalancer: jest.Mock
        }
        let githubRepoImportService: {
            importRepo: jest.Mock
        }
        let winstonService: {
            log: jest.Mock
        }
        const embeddingModel = {
        }
        const fromDocuments = QdrantVectorStore.fromDocuments as unknown as jest.Mock
        const fromExistingCollection = QdrantVectorStore.fromExistingCollection as unknown as jest.Mock

        beforeEach(() => {
            jest.clearAllMocks()
            qdrantClient = {
                deleteCollection: jest.fn().mockResolvedValue(undefined),
            }
            entityManager = {
                upsert: jest.fn().mockResolvedValue(undefined),
                findOne: jest.fn().mockResolvedValue(null),
                update: jest.fn().mockResolvedValue(undefined),
            }
            embeddingModelService = {
                getViaBalancer: jest.fn().mockResolvedValue(embeddingModel),
            }
            githubRepoImportService = {
                importRepo: jest.fn(),
            }
            winstonService = {
                log: jest.fn(),
            }
            fromDocuments.mockResolvedValue(undefined)
            fromExistingCollection.mockResolvedValue({
                similaritySearch: jest.fn().mockResolvedValue([]),
            })
            service = new PublicRagPlaygroundService(
                qdrantClient as never,
                entityManager as never,
                embeddingModelService as never,
                githubRepoImportService as never,
                winstonService as never,
            )
        })

        describe("listSamples",
            () => {
                it("exposes only the id and label of every curated sample, never its code",
                    () => {
                        const samples = service.listSamples()

                        expect(samples).toEqual([
                            {
                                id: "retrieval-helper",
                                label: "Retrieval helper (cosine similarity top-k)",
                            },
                            {
                                id: "express-todo-api",
                                label: "Express REST API (todos CRUD)",
                            },
                            {
                                id: "docker-compose-api",
                                label: "Dockerfile + docker-compose (API + Postgres)",
                            },
                        ])
                        for (const sample of samples) {
                            expect(Object.keys(sample)).toEqual([
                                "id",
                                "label",
                            ])
                        }
                    })
            })

        describe("index",
            () => {
                it("indexes a pasted snippet into the session collection and records the session row",
                    async () => {
                        const result = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: "export const answer = 42",
                            fileName: "answer.ts",
                        })

                        expect(result).toEqual({
                            sessionId: "sess-1",
                            chunkCount: 1,
                            sourceLabel: "answer.ts",
                        })
                        // the prior collection is dropped so a re-index replaces the source
                        expect(qdrantClient.deleteCollection).toHaveBeenCalledWith("playground-sess-1")
                        const [
                            chunks,
                            model,
                            options,
                        ] = fromDocuments.mock.calls[0]
                        expect(model).toBe(embeddingModel)
                        expect(options).toEqual({
                            client: qdrantClient,
                            collectionName: "playground-sess-1",
                        })
                        expect(chunks[0].pageContent).toBe("export const answer = 42")
                        expect(chunks[0].metadata.filePath).toBe("answer.ts")
                        expect(entityManager.upsert).toHaveBeenCalledWith(
                            expect.anything(),
                            expect.objectContaining({
                                sessionId: "sess-1",
                                sourceKind: RagPlaygroundSourceKind.Paste,
                                sourceLabel: "answer.ts",
                                sampleId: null,
                                chunkCount: 1,
                            }),
                            [
                                "sessionId",
                            ],
                        )
                    })

                it("labels a pasted snippet by its language when no file name is supplied",
                    async () => {
                        const result = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: "print(1)",
                            language: "python",
                        })

                        expect(result.sourceLabel).toContain("python")
                        expect(fromDocuments.mock.calls[0][0][0].metadata.filePath).toBeNull()
                    })

                it("falls back to a generic paste label when neither file name nor language is supplied",
                    async () => {
                        const withLanguage = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: "print(1)",
                            language: "python",
                        })
                        const withoutLanguage = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Upload,
                            code: "print(1)",
                        })

                        expect(withoutLanguage.sourceLabel).not.toBe(withLanguage.sourceLabel)
                        expect(withoutLanguage.sourceLabel.length).toBeGreaterThan(0)
                    })

                it("rejects a paste with no code at all",
                    async () => {
                        await expect(service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                        })).rejects.toBeInstanceOf(RagPlaygroundImportException)

                        expect(fromDocuments).not.toHaveBeenCalled()
                    })

                it("rejects a whitespace-only paste",
                    async () => {
                        await expect(service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: "   \n  ",
                        })).rejects.toBeInstanceOf(RagPlaygroundImportException)
                    })

                it("accepts a paste at exactly the size cap but rejects one character more",
                    async () => {
                        // "const x = 1\n" is 12 chars -> 5000 lines lands exactly on the 60k cap
                        const atCap = "const x = 1\n".repeat(5_000)

                        const result = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: atCap,
                        })

                        // the per-session chunk cap bounds Qdrant load from a public endpoint
                        expect(result.chunkCount).toBe(60)
                        expect(fromDocuments.mock.calls[0][0]).toHaveLength(60)

                        await expect(service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: `${atCap}x`,
                        })).rejects.toBeInstanceOf(RagPlaygroundImportException)
                    })

                it("indexes the first curated sample when no sample id is supplied",
                    async () => {
                        const result = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Sample,
                        })

                        expect(result.sourceLabel).toContain("Retrieval helper (cosine similarity top-k)")
                        expect(fromDocuments.mock.calls[0][0][0].metadata.filePath).toBe("sample.ts")
                        expect(entityManager.upsert.mock.calls[0][1]).toMatchObject({
                            sampleId: "retrieval-helper",
                        })
                    })

                it("indexes the requested curated sample",
                    async () => {
                        const result = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Sample,
                            sampleId: "express-todo-api",
                        })

                        expect(result.sourceLabel).toContain("Express REST API (todos CRUD)")
                        expect(entityManager.upsert.mock.calls[0][1]).toMatchObject({
                            sampleId: "express-todo-api",
                        })
                    })

                it("rejects an unknown sample id",
                    async () => {
                        const error = await service.index({
                            sessionId: "sess-1",
                            kind: RagPlaygroundSourceKind.Sample,
                            sampleId: "no-such-sample",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(RagPlaygroundSampleNotFoundException)
                        expect((error as RagPlaygroundSampleNotFoundException).metadata).toMatchObject({
                            sampleId: "no-such-sample",
                        })
                        expect(fromDocuments).not.toHaveBeenCalled()
                    })

                it("imports a GitHub repo and labels the session by owner/repo",
                    async () => {
                        githubRepoImportService.importRepo.mockResolvedValue([
                            {
                                pageContent: "export const a = 1",
                                metadata: {
                                    filePath: "src/a.ts",
                                },
                            },
                        ])

                        const result = await service.index({
                            sessionId: "sess-2",
                            kind: RagPlaygroundSourceKind.Github,
                            githubUrl: "https://github.com/starci/demo",
                        })

                        expect(githubRepoImportService.importRepo).toHaveBeenCalledWith("https://github.com/starci/demo")
                        expect(result.sourceLabel).toBe("starci/demo")
                    })

                it("rejects a GitHub import with no URL",
                    async () => {
                        await expect(service.index({
                            sessionId: "sess-2",
                            kind: RagPlaygroundSourceKind.Github,
                        })).rejects.toBeInstanceOf(RagPlaygroundImportException)

                        expect(githubRepoImportService.importRepo).not.toHaveBeenCalled()
                    })

                it("rejects a GitHub import whose URL is blank",
                    async () => {
                        await expect(service.index({
                            sessionId: "sess-2",
                            kind: RagPlaygroundSourceKind.Github,
                            githubUrl: "   ",
                        })).rejects.toBeInstanceOf(RagPlaygroundImportException)
                    })

                it("rejects a GitHub repo that yields no indexable content",
                    async () => {
                        githubRepoImportService.importRepo.mockResolvedValue([])

                        const error = await service.index({
                            sessionId: "sess-2",
                            kind: RagPlaygroundSourceKind.Github,
                            githubUrl: "https://github.com/starci/empty",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(RagPlaygroundImportException)
                        expect(fromDocuments).not.toHaveBeenCalled()
                        expect(entityManager.upsert).not.toHaveBeenCalled()
                    })

                it("still indexes when the previous collection cannot be dropped",
                    async () => {
                        qdrantClient.deleteCollection.mockRejectedValue(new Error("Not found: Collection"))

                        const result = await service.index({
                            sessionId: "sess-3",
                            kind: RagPlaygroundSourceKind.Paste,
                            code: "const a = 1",
                        })

                        expect(result.chunkCount).toBe(1)
                        expect(fromDocuments).toHaveBeenCalledTimes(1)
                    })
            })

        describe("retrieveContext",
            () => {
                it("rejects a session that was never indexed",
                    async () => {
                        entityManager.findOne.mockResolvedValue(null)

                        const error = await service.retrieveContext({
                            sessionId: "ghost",
                            question: "how does retrieval work?",
                        }).catch((thrown: unknown) => thrown)

                        expect(error).toBeInstanceOf(RagPlaygroundSessionNotFoundException)
                        expect((error as RagPlaygroundSessionNotFoundException).metadata).toMatchObject({
                            sessionId: "ghost",
                        })
                        expect(fromExistingCollection).not.toHaveBeenCalled()
                    })

                it("returns the retrieved chunks and bumps the session's last-accessed marker",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "row-1",
                            sessionId: "sess-1",
                        })
                        const similaritySearch = jest.fn().mockResolvedValue([
                            {
                                pageContent: "a".repeat(500),
                                metadata: {
                                    filePath: "src/a.ts",
                                },
                            },
                            {
                                pageContent: "pasted snippet",
                                metadata: {
                                    filePath: 42,
                                },
                            },
                        ])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        const result = await service.retrieveContext({
                            sessionId: "sess-1",
                            question: "how does retrieval work?",
                        })

                        // default depth is 5 when the caller omits topK
                        expect(similaritySearch).toHaveBeenCalledWith("how does retrieval work?",
                            5)
                        expect(fromExistingCollection.mock.calls[0][1]).toEqual({
                            client: qdrantClient,
                            collectionName: "playground-sess-1",
                        })
                        // snippets are capped for display, and a non-string filePath reads as null
                        expect(result.chunks[0].snippet).toHaveLength(400)
                        expect(result.chunks[0].filePath).toBe("src/a.ts")
                        expect(result.chunks[1].filePath).toBeNull()
                        expect(entityManager.update).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                id: "row-1",
                            },
                            expect.objectContaining({
                                lastAccessedAt: expect.any(Date),
                            }),
                        )
                    })

                it("honours an explicit retrieval depth",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "row-1",
                        })
                        const similaritySearch = jest.fn().mockResolvedValue([])
                        fromExistingCollection.mockResolvedValue({
                            similaritySearch,
                        })

                        await service.retrieveContext({
                            sessionId: "sess-1",
                            question: "q",
                            topK: 2,
                        })

                        expect(similaritySearch).toHaveBeenCalledWith("q",
                            2)
                    })

                it("degrades to an empty result and logs when the collection is unreachable",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "row-1",
                        })
                        fromExistingCollection.mockRejectedValue(new Error("Collection not found"))

                        const result = await service.retrieveContext({
                            sessionId: "sess-1",
                            question: "q",
                        })

                        expect(result).toEqual({
                            chunks: [],
                        })
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.RagRetrievalFailed,
                            expect.objectContaining({
                                sessionId: "sess-1",
                                error: "Collection not found",
                            }),
                        )
                        // the session row must NOT be touched on a degraded retrieval
                        expect(entityManager.update).not.toHaveBeenCalled()
                    })

                it("stringifies a non-Error retrieval failure into the log",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "row-1",
                        })
                        fromExistingCollection.mockRejectedValue("qdrant exploded")

                        await service.retrieveContext({
                            sessionId: "sess-1",
                            question: "q",
                        })

                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.RagRetrievalFailed,
                            expect.objectContaining({
                                error: "qdrant exploded",
                            }),
                        )
                    })
            })

        describe("buildAskMessages",
            () => {
                it("stuffs the retrieved chunks into the system prompt with numbered citations",
                    () => {
                        const [
                            system,
                            human,
                        ] = service.buildAskMessages({
                            question: "what does retrieveTopK do?",
                            chunks: [
                                {
                                    filePath: "sample.ts",
                                    snippet: "export function retrieveTopK() {}",
                                },
                                {
                                    filePath: null,
                                    snippet: "const x = 1",
                                },
                            ],
                        })

                        expect(String(system.content)).toContain("[1] sample.ts")
                        expect(String(system.content)).toContain("export function retrieveTopK() {}")
                        // a chunk with no file path is cited as a bare snippet
                        expect(String(system.content)).toContain("[2] snippet")
                        expect(human.content).toBe("what does retrieveTopK do?")
                    })

                it("tells the model there is no grounded context when nothing was retrieved",
                    () => {
                        const [
                            system,
                        ] = service.buildAskMessages({
                            question: "anything?",
                            chunks: [],
                        })

                        expect(String(system.content)).not.toContain("[1]")
                        expect(String(system.content).length).toBeGreaterThan(0)
                    })
            })
    })
