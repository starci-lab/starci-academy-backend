jest.mock("socket.io-client",
    () => ({
        io: jest.fn(),
    }))
jest.mock("node:child_process",
    () => ({
        spawn: jest.fn(),
    }))

import {
    BaseAgentService
} from "./base-agent.service"
import {
    io
} from "socket.io-client"
import {
    spawn
} from "node:child_process"
import {
    EVENT
} from "./constants"
import type {
    PairAck
} from "./types"

class TestAgent extends BaseAgentService {
    constructor() {
        super({
            label: "test", readyMessage: "ready"
        } as never,
        {
            collect: jest.fn().mockResolvedValue({
            }),
        } as never)
    }
    runQueue(work: () => Promise<void>): void { this.enqueue(work) }
}

describe("BaseAgentService",
    () => {
        it("serializes queued work and continues after a rejected task",
            async () => {
                const agent = new TestAgent()
                const calls: Array<string> = []
                agent.runQueue(async () => { calls.push("first"); throw new Error("expected") })
                agent.runQueue(async () => { calls.push("second") })
                await new Promise((resolve) => setImmediate(resolve))
                await new Promise((resolve) => setImmediate(resolve))
                expect(calls).toEqual(["first",
                    "second"])
            })

        it("answers ping events and ignores empty command payloads",
            () => {
                const handlers = new Map<string, (...args: Array<unknown>) => void>()
                const socket = {
                    emit: jest.fn(),
                    on: jest.fn((event: string, handler: (...args: Array<unknown>) => void) => {
                        handlers.set(event,
                            handler)
                    }),
                    close: jest.fn(),
                }
                jest.mocked(io).mockReturnValue(socket as never)
                const agent = new TestAgent()

                agent.run("PAIR",
                    "https://server.test")
                handlers.get(EVENT.ping)?.({
                    t: 123
                })
                handlers.get(EVENT.commandRun)?.({
                    command: ""
                })

                expect(socket.emit).toHaveBeenCalledWith(EVENT.pong,
                    {
                        t: 123
                    })
                expect(socket.emit).not.toHaveBeenCalledWith(EVENT.commandOutput,
                    expect.anything())
            })

        it("streams command output, errors, and non-zero exits through the socket",
            async () => {
                const handlers = new Map<string, (...args: Array<unknown>) => void>()
                const socket = {
                    emit: jest.fn(),
                    on: jest.fn((event: string, handler: (...args: Array<unknown>) => void) => {
                        handlers.set(event,
                            handler)
                    }),
                    close: jest.fn(),
                }
                const childHandlers = new Map<string, (value: unknown) => void>()
                const stdout = {
                    on: jest.fn(),
                }
                const stderr = {
                    on: jest.fn(),
                }
                const child = {
                    stdout,
                    stderr,
                    on: jest.fn((event: string, handler: (value: unknown) => void) => {
                        childHandlers.set(event,
                            handler)
                    }),
                }
                jest.mocked(io).mockReturnValue(socket as never)
                jest.mocked(spawn).mockReturnValue(child as never)
                const agent = new TestAgent()
                agent.run("PAIR",
                    "https://server.test")
                handlers.get(EVENT.commandRun)?.({
                    command: "echo hello",
                })
                await new Promise((resolve) => setImmediate(resolve))
                await new Promise((resolve) => setImmediate(resolve))
                expect(spawn).toHaveBeenCalledWith("echo hello",
                    {
                        shell: true,
                        windowsHide: true,
                    })
                const stdoutForward = jest.mocked(stdout.on).mock.calls[0][1] as (chunk: Buffer) => void
                const stderrForward = jest.mocked(stderr.on).mock.calls[0][1] as (chunk: Buffer) => void
                stdoutForward(Buffer.from("hello\n"))
                stderrForward(Buffer.from("warning\n"))
                childHandlers.get("error")?.(new Error("not found"))
                childHandlers.get("close")?.(2)
                expect(socket.emit).toHaveBeenCalledWith(EVENT.commandOutput,
                    {
                        output: "$ echo hello\n",
                    })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.commandOutput,
                    {
                        output: "hello\n",
                    })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.commandOutput,
                    {
                        output: "warning\n",
                    })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.commandOutput,
                    {
                        output: "\n[agent] failed to run: not found\n",
                    })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.commandOutput,
                    {
                        output: "\n[exit 2]\n",
                    })
            })

        it("pairs successfully, reports device info, and handles connection lifecycle logs",
            async () => {
                const handlers = new Map<string, (...args: Array<unknown>) => void>()
                const device = {
                    platform: "linux",
                    arch: "x64",
                    cpuModel: "Test CPU",
                    cpuCores: 4,
                    totalMemBytes: 2_000_000_000,
                    gpu: "NVIDIA Test GPU",
                }
                const socket = {
                    emit: jest.fn((event: string, ...args: Array<unknown>) => {
                        if (event === EVENT.pair) {
                            const acknowledge = args[1] as (ack: PairAck) => void
                            acknowledge({
                                sessionId: "session-1",
                                playgroundSlug: "demo",
                                currentStepIndex: 0,
                            })
                        }
                    }),
                    on: jest.fn((event: string, handler: (...args: Array<unknown>) => void) => {
                        handlers.set(event,
                            handler)
                    }),
                    close: jest.fn(),
                }
                jest.mocked(io).mockReturnValue(socket as never)
                const agent = new TestAgent()
                const collect = jest.spyOn((agent as unknown as { deviceService: { collect: () => Promise<unknown> } }).deviceService,
                    "collect").mockResolvedValue(device)
                agent.run("PAIR",
                    "https://server.test")
                handlers.get("connect")?.()
                await new Promise((resolve) => setImmediate(resolve))
                handlers.get("connect_error")?.(new Error("offline"))
                handlers.get("disconnect")?.("transport close")
                ;(agent as unknown as { sendLog: (line: string, level?: "info" | "warn" | "error") => void }).sendLog("broken",
                    "error")
                expect(collect).toHaveBeenCalledTimes(1)
                expect(socket.emit).toHaveBeenCalledWith(EVENT.deviceInfo,
                    device)
                expect(socket.emit).toHaveBeenCalledWith(EVENT.log,
                    expect.objectContaining({
                        line: "ready",
                        level: "info",
                    }))
                expect(socket.emit).toHaveBeenCalledWith(EVENT.log,
                    expect.objectContaining({
                        level: "warn",
                    }))
            })

        it("reports failed pairing and performs graceful shutdown",
            () => {
                const handlers = new Map<string, (...args: Array<unknown>) => void>()
                const socket = {
                    emit: jest.fn((event: string, ...args: Array<unknown>) => {
                        if (event === EVENT.pair) {
                            const acknowledge = args[1] as (ack: PairAck) => void
                            acknowledge({
                                error: "invalid pairing code",
                            })
                        }
                    }),
                    on: jest.fn((event: string, handler: (...args: Array<unknown>) => void) => {
                        handlers.set(event,
                            handler)
                    }),
                    close: jest.fn(),
                }
                jest.mocked(io).mockReturnValue(socket as never)
                const exit = jest.spyOn(process,
                    "exit").mockImplementation((() => undefined) as never)
                const processOn = jest.spyOn(process,
                    "on")
                const agent = new TestAgent()
                agent.run("BAD",
                    "https://server.test")
                handlers.get("connect")?.()
                expect(exit).toHaveBeenCalledWith(1)

                const shutdownCall = processOn.mock.calls.find((call) => call[0] === "SIGINT")
                if (!shutdownCall) {
                    throw new Error("SIGINT handler was not registered")
                }
                const shutdown = shutdownCall[1] as () => void
                shutdown()
                expect(socket.close).toHaveBeenCalledTimes(1)
                expect(exit).toHaveBeenCalledWith(0)
                processOn.mockRestore()
                exit.mockRestore()
            })
    })
