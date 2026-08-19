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
                    code: "", fileName: "empty.ts" 
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
                    code: "const value = 1", fileName: "sample.ts" 
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
                    code: longCode, fileName: "partial.ts" 
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
                    code: "const grounded = true", fileName: "grounded.ts" 
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
    })
