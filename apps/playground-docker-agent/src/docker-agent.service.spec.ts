import {
    EVENT,
    RESOURCE_INTERVAL_MS,
} from "@modules/playground-agent-core/constants"
import {
    DockerAgentService,
} from "./docker-agent.service"

type FakeSocket = {
    on: jest.Mock
    emit: jest.Mock
    handlers: Record<string, () => void>
}

const makeSocket = (): FakeSocket => {
    const handlers: Record<string, () => void> = {
    }
    return {
        handlers,
        on: jest.fn((event: string, handler: () => void) => {
            handlers[event] = handler
        }),
        emit: jest.fn(),
    }
}

const meta = {
    cliName: "docker-agent",
    packageName: "docker-agent",
    label: "Docker agent",
    description: "Docker",
    readyMessage: "ready",
    taskName: "docker-agent",
    systemdUnit: "docker-agent.service",
    launchdLabel: "docker-agent",
}

describe("DockerAgentService",
    () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it("reports resources from setup, pairing, verification, and command hooks",
            async () => {
                const socket = makeSocket()
                const resources = {
                    snapshot: jest.fn().mockResolvedValue([
                        {
                            kind: "Container",
                            name: "web",
                            status: "Running",
                        },
                    ]),
                }
                const service = new DockerAgentService(
                    meta,
                    {
                        collect: jest.fn(),
                    } as never,
                    resources as never,
                )
                const capability = service as unknown as {
                    socket: FakeSocket
                    onSetup: () => void
                    onPaired: () => void
                    afterCommand: () => void
                    onShutdown: () => void
                }
                capability.socket = socket

                capability.onSetup()
                capability.onPaired()
                capability.afterCommand()
                await socket.handlers[EVENT.stepVerified]?.()
                await socket.handlers[EVENT.verifyNow]?.()
                await Promise.resolve()

                expect(socket.on).toHaveBeenCalledWith(EVENT.stepVerified,
                    expect.any(Function))
                expect(socket.on).toHaveBeenCalledWith(EVENT.verifyNow,
                    expect.any(Function))
                expect(resources.snapshot).toHaveBeenCalledTimes(4)
                expect(socket.emit).toHaveBeenCalledWith(EVENT.resourcesReport,
                    {
                        verificationRequested: false,
                        resources: [
                            {
                                kind: "Container",
                                name: "web",
                                status: "Running",
                            },
                        ],
                    })
                expect(socket.emit).toHaveBeenCalledWith(EVENT.resourcesReport,
                    {
                        verificationRequested: true,
                        resources: [
                            {
                                kind: "Container",
                                name: "web",
                                status: "Running",
                            },
                        ],
                    })

                capability.onShutdown()
                jest.advanceTimersByTime(RESOURCE_INTERVAL_MS)
                expect(resources.snapshot).toHaveBeenCalledTimes(4)
            })

        it("swallows a failed snapshot and does not emit a resources report",
            async () => {
                const socket = makeSocket()
                const service = new DockerAgentService(
                    meta,
                    {
                        collect: jest.fn(),
                    } as never,
                    {
                        snapshot: jest.fn().mockRejectedValue(new Error("docker unavailable")),
                    } as never,
                )
                const capability = service as unknown as {
                    socket: FakeSocket
                    onPaired: () => void
                    onShutdown: () => void
                }
                capability.socket = socket

                capability.onPaired()
                await Promise.resolve()
                capability.onShutdown()

                expect(socket.emit).not.toHaveBeenCalledWith(EVENT.resourcesReport,
                    expect.anything())
            })
    })
