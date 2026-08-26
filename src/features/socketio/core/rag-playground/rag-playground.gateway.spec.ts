import {
    RagPlaygroundGateway
} from "./rag-playground.gateway"

describe("RagPlaygroundGateway",
    () => {
        it("joins and emits terminal expiry for a consumed run that is missing",
            async () => {
                const response = {
                    successToRoom: jest.fn()
                }
                const gateway = new RagPlaygroundGateway({
                    consume: jest.fn().mockReturnValue(undefined)
                } as never,
{
    stream: jest.fn()
} as never,
response as never,
{
    log: jest.fn()
} as never)
                await gateway.handleSubscribeRagPlaygroundRun({
                    join: jest.fn()
                } as never,
{
    data: {
        runId: "r1"
    }
} as never)
                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        runId: "r1", done: true, error: expect.any(String)
                    })
                }))
            })

        it("streams deltas and a sourced terminal chunk for a prepared run",
            async () => {
                const response = {
                    successToRoom: jest.fn(),
                }
                const aiInvoke = {
                    stream: jest.fn(async (params: { onChunk: (delta: string) => void }) => {
                        params.onChunk("hello")
                        params.onChunk(" world")
                        return {
                            provider: "local",
                            model: "qwen",
                        }
                    }),
                }
                const registry = {
                    consume: jest.fn().mockReturnValue({
                        messages: ["prompt"],
                        sources: ["lesson-1"],
                    }),
                }
                const gateway = new RagPlaygroundGateway(
                    registry as never,
                    aiInvoke as never,
                    response as never,
                    {
                        log: jest.fn(),
                    } as never,
                )
                const client = {
                    join: jest.fn(),
                }

                await gateway.handleSubscribeRagPlaygroundRun(client as never,
                    {
                        data: {
                            runId: "r1",
                        },
                    } as never)

                expect(client.join).toHaveBeenCalledWith("rag-playground-run:r1")
                expect(aiInvoke.stream).toHaveBeenCalledWith(expect.objectContaining({
                    categories: ["low"],
                    task: "chatting",
                }))
                expect(response.successToRoom).toHaveBeenCalledTimes(3)
                expect(response.successToRoom).toHaveBeenLastCalledWith(expect.objectContaining({
                    data: {
                        runId: "r1",
                        delta: "",
                        done: true,
                        sources: ["lesson-1"],
                    },
                }))
            })

        it("returns a terminal availability error when the local model rejects",
            async () => {
                const response = {
                    successToRoom: jest.fn(),
                }
                const log = jest.fn()
                const gateway = new RagPlaygroundGateway(
                    {
                        consume: jest.fn().mockReturnValue({
                            messages: ["prompt"],
                            sources: [],
                        }),
                    } as never,
                    {
                        stream: jest.fn().mockRejectedValue("provider offline"),
                    } as never,
                    response as never,
                    {
                        log,
                    } as never,
                )

                await gateway.handleSubscribeRagPlaygroundRun({
                    join: jest.fn(),
                } as never,
                    {
                        data: {
                            runId: "r2",
                        },
                    } as never)

                expect(log).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        sessionId: "r2",
                        error: "provider offline",
                    }))
                expect(response.successToRoom).toHaveBeenCalledWith(expect.objectContaining({
                    data: expect.objectContaining({
                        runId: "r2",
                        done: true,
                        error: expect.any(String),
                    }),
                }))
            })
    })
