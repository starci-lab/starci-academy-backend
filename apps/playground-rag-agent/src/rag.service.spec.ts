import {
    RagService
} from "./rag.service"

const originalFetch = global.fetch

describe("RagService",
    () => {
        afterEach(() => { global.fetch = originalFetch })

        it("probes local Ollama and degrades when it is unavailable",
            async () => {
                global.fetch = jest.fn().mockResolvedValueOnce(new Response(JSON.stringify({
                    models: [{
                        name: "qwen"
                    }]
                }),
                {
                    status: 200
                }))
                await expect(new RagService().probeOllama()).resolves.toEqual({
                    serving: true, models: ["qwen"]
                })
                global.fetch = jest.fn().mockRejectedValueOnce(new Error("offline"))
                await expect(new RagService().probeOllama()).resolves.toEqual({
                    serving: false, models: []
                })
            })

        it("indexes inline code, skips empty sources, and keeps partial embeddings",
            async () => {
                const service = new RagService()
                await expect(service.index({
                    kind: "paste", code: "", fileName: "empty.ts"
                })).resolves.toMatchObject({
                    chunkCount: 0, sourceLabel: "empty.ts (on-device indexing needs inline code for now)"
                })
                global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({
                    embedding: [1,
                        0]
                }),
                {
                    status: 200
                }))
                await expect(service.index({
                    kind: "paste", code: "const value = 1", fileName: "sample.ts"
                })).resolves.toMatchObject({
                    chunkCount: 1, sourceLabel: "sample.ts"
                })
                global.fetch = jest.fn()
                    .mockResolvedValueOnce(new Response(JSON.stringify({
                        embedding: [1,
                            0]
                    }),
                    {
                        status: 200
                    }))
                    .mockRejectedValueOnce(new Error("embed failed"))
                const longCode = Array.from({
                    length: 50
                },
                (_, index) => `const line${index} = ${index}`).join("\n")
                await expect(service.index({
                    kind: "paste", code: longCode, fileName: "partial.ts"
                })).resolves.toMatchObject({
                    chunkCount: 1, sourceLabel: "partial.ts"
                })
            })

        it("answers from indexed context and reports a stream failure",
            async () => {
                const stream = new ReadableStream<Uint8Array>({
                    start(controller) {
                        controller.enqueue(new TextEncoder().encode("{\"response\":\"answer \",\"done\":false}\n{\"response\":\"done\",\"done\":true}\n"))
                        controller.close()
                    },
                })
                global.fetch = jest.fn().mockImplementation(async (input: RequestInfo | URL) => {
                    const url = String(input)
                    if (url.endsWith("/api/tags")) return new Response(JSON.stringify({
                        models: [{
                            name: "qwen2"
                        }]
                    }),
                    {
                        status: 200
                    })
                    if (url.endsWith("/api/embeddings")) return new Response(JSON.stringify({
                        embedding: [1,
                            0]
                    }),
                    {
                        status: 200
                    })
                    return new Response(stream,
                        {
                            status: 200
                        })
                })
                const service = new RagService()
                await service.index({
                    kind: "paste", code: "const grounded = true", fileName: "grounded.ts"
                })
                const chunks: Array<string> = []
                await expect(service.ask("What is grounded?",
                    (text) => { chunks.push(text) })).resolves.toMatchObject({
                    sources: [{
                        filePath: "grounded.ts"
                    }]
                })
                expect(chunks).toContain("answer done")

                global.fetch = jest.fn().mockRejectedValue(new Error("offline"))
                const failedChunks: Array<string> = []
                await expect(service.ask("offline",
                    (text) => { failedChunks.push(text) })).resolves.toEqual({
                    sources: []
                })
                expect(failedChunks[0]).toContain("[error]")
            })

        it("reports a healthy Ollama with no installed models using the empty-model fallback",
            async () => {
                global.fetch = jest.fn().mockResolvedValueOnce(new Response(JSON.stringify({
                }),
                {
                    status: 200,
                }))

                await expect(new RagService().probeOllama()).resolves.toEqual({
                    serving: true,
                    models: [],
                })
            })

        it("selects generation models by preference and handles zero-norm vectors",
            async () => {
                const service = new RagService() as unknown as {
                    pickGenModel: (models: Array<string>) => string
                    cosineSimilarity: (left: Array<number>, right: Array<number>) => number
                }

                expect(service.pickGenModel(["nomic-embed-text"])).toBe("qwen2.5:3b")
                expect(service.pickGenModel(["qwen2.5:7b",
                    "llama3"])).toBe("qwen2.5:7b")
                expect(service.pickGenModel(["llama3"])).toBe("llama3")
                expect(service.pickGenModel([])).toBe("qwen2.5:3b")
                expect(service.cosineSimilarity([0,
                    0],
                [1,
                    2])).toBe(0)
                expect(service.cosineSimilarity([1,
                    0],
                [1,
                    0])).toBe(1)
            })

        it("uses unknown labels and preserves an index when a later embedding fails",
            async () => {
                const service = new RagService()
                await expect(service.index({
                    kind: "paste", code: "", fileName: "",
                })).resolves.toMatchObject({
                    chunkCount: 0, sourceLabel: "unknown (on-device indexing needs inline code for now)",
                })
                global.fetch = jest.fn()
                    .mockResolvedValueOnce(new Response(JSON.stringify({
                        embedding: [1,
                            0],
                    })))
                    .mockRejectedValueOnce(new Error("second chunk failed"))
                const code = Array.from({
                    length: 40
                },
                (_, index) => `line ${index}`).join("\n")
                await expect(service.index({
                    kind: "paste", code,
                })).resolves.toMatchObject({
                    chunkCount: 1, sourceLabel: "pasted-code",
                })
            })

        it("completes generation without a response body",
            async () => {
                global.fetch = jest.fn().mockResolvedValueOnce(new Response(null))
                const chunks: Array<[string, boolean]> = []
                const service = new RagService() as unknown as {
                    streamGenerate: (prompt: string, model: string, onChunk: (text: string, done: boolean) => void) => Promise<void>
                }
                await service.streamGenerate("prompt",
                    "model",
                    (text, done) => {
                        chunks.push([text,
                            done])
                    })
                expect(chunks).toEqual([["",
                    true]])
            })
    })
