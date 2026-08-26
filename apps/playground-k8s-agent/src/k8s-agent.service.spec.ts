import {
    EVENT,
    RESOURCE_INTERVAL_MS,
} from "@modules/playground-agent-core/constants"
import {
    K8sAgentService,
} from "./k8s-agent.service"

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
    cliName: "k8s-agent",
    packageName: "k8s-agent",
    label: "K8s agent",
    description: "Kubernetes",
    readyMessage: "ready",
    taskName: "k8s-agent",
    systemdUnit: "k8s-agent.service",
    launchdLabel: "k8s-agent",
}

describe("K8sAgentService",
    () => {
        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.useRealTimers()
        })

        it("emits a snapshot for lifecycle and verification events, then stops polling",
            async () => {
                const socket = makeSocket()
                const resources = {
                    snapshot: jest.fn().mockResolvedValue([
                        {
                            kind: "Pod",
                            name: "api",
                            status: "Running",
                        },
                    ]),
                }
                const service = new K8sAgentService(
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

                expect(resources.snapshot).toHaveBeenCalledTimes(4)
                expect(socket.emit).toHaveBeenCalledWith(EVENT.resourcesReport,
                    {
                        resources: [
                            {
                                kind: "Pod",
                                name: "api",
                                status: "Running",
                            },
                        ],
                    })

                capability.onShutdown()
                jest.advanceTimersByTime(RESOURCE_INTERVAL_MS)
                expect(resources.snapshot).toHaveBeenCalledTimes(4)
            })

        it("keeps the relay alive when the Kubernetes snapshot rejects",
            async () => {
                const socket = makeSocket()
                const service = new K8sAgentService(
                    meta,
                    {
                        collect: jest.fn(),
                    } as never,
                    {
                        snapshot: jest.fn().mockRejectedValue(new Error("kubectl unavailable")),
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
