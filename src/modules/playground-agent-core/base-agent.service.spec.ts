jest.mock("socket.io-client",
    () => ({
        io: jest.fn(),
    }))

import {
    BaseAgentService
} from "./base-agent.service"
import {
    io
} from "socket.io-client"
import {
    EVENT
} from "./constants"

class TestAgent extends BaseAgentService {
    constructor() {
        super({
            label: "test", readyMessage: "ready"
        } as never,
{
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
    })
