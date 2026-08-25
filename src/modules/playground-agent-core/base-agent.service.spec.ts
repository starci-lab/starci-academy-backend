import {
    BaseAgentService 
} from "./base-agent.service"
import {
    EVENT 
} from "./constants"

const handlers: Record<string, (payload?: unknown) => void> = {
}
const socket = {
    on: jest.fn((event: string, cb: (payload?: unknown) => void) => {
        handlers[event] = cb
    }),
    emit: jest.fn(),
    close: jest.fn(),
}
jest.mock("socket.io-client",
    () => ({
        io: jest.fn(() => socket) 
    }))
jest.mock("node:child_process",
    () => ({
        spawn: jest.fn(() => ({
            stdout: {
                on: jest.fn() 
            },
            stderr: {
                on: jest.fn() 
            },
            on: jest.fn(),
        })),
    }))

class Agent extends BaseAgentService {
    paired = 0
    setup = 0
    protected onSetup() {
        this.setup++
    }
    protected onPaired() {
        this.paired++
    }
}

describe("BaseAgentService",
    () => {
        beforeEach(() => {
            socket.emit.mockClear()
            socket.on.mockClear()
            Object.keys(handlers).forEach((k) => delete handlers[k])
        })
        it("wires pairing, ping, logging and device reporting",
            async () => {
                const device = {
                    collect: jest
                        .fn()
                        .mockResolvedValue({
                            platform: "win",
                            arch: "x64",
                            cpuModel: "cpu",
                            cpuCores: 4,
                            totalMemBytes: 1e9,
                        }),
                }
                const agent = new Agent(
      {
          label: "test", readyMessage: "ready" 
      } as never,
      device as never,
                )
                jest.spyOn(process,
                    "exit").mockImplementation((() => undefined) as never)
                agent.run("code",
                    "http://server")
                expect(agent.setup).toBe(1)
                handlers.connect()
                const ack = socket.emit.mock.calls.find(
                    (c: unknown[]) => c[0] === EVENT.pair,
                )?.[2]
                ack({
                    sessionId: "session", currentStepIndex: 0 
                })
                await Promise.resolve()
                expect(agent.paired).toBe(1)
                expect(device.collect).toHaveBeenCalled()
                handlers[EVENT.ping]({
                    t: 9 
                })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.pong,
                    {
                        t: 9 
                    })
            })
        it("ignores empty commands and exits on pairing failure",
            () => {
                const agent = new Agent(
      {
          label: "test", readyMessage: "ready" 
      } as never,
      {
          collect: jest
              .fn()
              .mockResolvedValue({
                  platform: "win",
                  arch: "x64",
                  cpuModel: "cpu",
                  cpuCores: 1,
                  totalMemBytes: 1,
              }),
      } as never,
                )
                const exit = jest
                    .spyOn(process,
                        "exit")
                    .mockImplementation((() => undefined) as never)
                agent.run("code",
                    "server")
                handlers[EVENT.commandRun]({
                    command: "" 
                })
                handlers.connect()
                const ack = socket.emit.mock.calls.at(-1)?.[2]
                ack({
                    error: "bad code" 
                })
                expect(exit).toHaveBeenCalledWith(1)
            })
    })
