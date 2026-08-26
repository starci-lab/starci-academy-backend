import type {
    NatsConnection,
} from "nats"
import {
    EventEmitter2,
} from "@nestjs/event-emitter"
import {
    CacheService,
} from "@modules/integrations/cache/cache.service"
import {
    InstanceService,
} from "@modules/lib/mixin/instance.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    StreamAsyncIteratorService,
} from "@modules/lib/stream-async-iterator/stream-async-iterator.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    EventName,
} from "../enums/event-name"
import {
    configMap,
} from "../config"
import {
    NatsBridgeService,
} from "./nats-bridge.service"
import {
    NatsMessageFactoryService,
} from "./nats-message-factory.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"

interface RetryInvocation {
    action: () => Promise<void>
}

describe("NatsBridgeService",
    () => {
        const localInstanceId = "instance-a"
        const eventPayload = {
            conversationId: "conversation-1",
            messageId: "message-1",
            authorId: "member-1",
        }

        const createService = (producerId: string) => {
            const eventEmitter = {
                emit: jest.fn(),
            }
            const cacheService = {
                get: jest.fn().mockResolvedValue(undefined),
                set: jest.fn().mockResolvedValue(undefined),
            }
            let retryInvocation: RetryInvocation | undefined
            const retryService = {
                retry: jest.fn((invocation: RetryInvocation) => {
                    retryInvocation = invocation
                    return Promise.resolve()
                }),
            }
            const streamAsyncIteratorService = {
                createStream: jest.fn().mockResolvedValue({
                    async *[Symbol.asyncIterator]() {
                        yield {
                            subject: EventName.ChatMessageCreated,
                            data: new TextEncoder().encode("envelope"),
                        }
                    },
                }),
            }
            const messageFactory = {
                parse: jest.fn().mockReturnValue({
                    id: producerId,
                    digest: `digest-${producerId}`,
                    data: eventPayload,
                }),
            }
            const service = new NatsBridgeService(
                {
                    subjects: [EventName.ChatMessageCreated],
                },
                eventEmitter as unknown as EventEmitter2,
                messageFactory as unknown as NatsMessageFactoryService,
                cacheService as unknown as CacheService,
                {
                    getId: jest.fn().mockReturnValue(localInstanceId),
                } as unknown as InstanceService,
                retryService as unknown as RetryService,
                streamAsyncIteratorService as unknown as StreamAsyncIteratorService,
                {
                } as NatsConnection,
                {
                    log: jest.fn(),
                } as unknown as WinstonService,
                new DayjsService(),
            )
            return {
                service,
                eventEmitter,
                cacheService,
                streamAsyncIteratorService,
                messageFactory,
                retryService,
                runConsumer: async () => {
                    await service.bridgeEvents()
                    await retryInvocation?.action()
                },
            }
        }

        beforeEach(() => {
            jest.useFakeTimers()
        })

        afterEach(() => {
            jest.clearAllTimers()
            jest.useRealTimers()
        })

        it("does not re-emit an envelope produced by this instance",
            async () => {
                const world = createService(localInstanceId)

                await world.runConsumer()

                expect(world.eventEmitter.emit).not.toHaveBeenCalled()
                expect(world.cacheService.set).not.toHaveBeenCalled()
            })

        it("routes chat-message events through both local and cross-instance paths",
            () => {
                expect(configMap[EventName.ChatMessageCreated]).toEqual(expect.objectContaining({
                    useLocal: true,
                    useNats: true,
                }))
            })

        it("intersects configured subjects during module initialization",
            async () => {
                const world = createService("instance-b")

                await world.service.onModuleInit()

                expect(world.retryService.retry).toHaveBeenCalledWith(expect.objectContaining({
                    options: {
                        retries: Infinity,
                    },
                }))
            })

        it("re-emits a foreign envelope under its event subject",
            async () => {
                const world = createService("instance-b")

                await world.runConsumer()

                expect(world.eventEmitter.emit).toHaveBeenCalledWith(
                    EventName.ChatMessageCreated,
                    eventPayload,
                )
                expect(world.cacheService.set).toHaveBeenCalledTimes(1)
            })

        it("skips duplicate and ping envelopes while reporting stream lifecycle callbacks",
            async () => {
                const world = createService("instance-b")
                world.cacheService.get.mockResolvedValue({
                    alreadySeen: true,
                })
                world.streamAsyncIteratorService.createStream.mockImplementation(
                    async (callbacks: {
                        onOpen: () => void
                        onClose: () => void
                        onError: (error: Error) => void
                    }) => {
                        callbacks.onOpen()
                        callbacks.onError(new Error("stream failed"))
                        callbacks.onClose()
                        return {
                            async *[Symbol.asyncIterator]() {
                                yield {
                                    subject: EventName.Ping,
                                    data: new TextEncoder().encode("envelope"),
                                }
                                yield {
                                    subject: EventName.ChatMessageCreated,
                                    data: new TextEncoder().encode("envelope"),
                                }
                            },
                        }
                    })

                await world.runConsumer()

                expect(world.cacheService.get).toHaveBeenCalledTimes(1)
                expect(world.cacheService.set).not.toHaveBeenCalled()
                expect(world.eventEmitter.emit).not.toHaveBeenCalled()
            })

        it("parses an empty payload as an empty envelope and still emits foreign events",
            async () => {
                const world = createService("instance-b")
                world.streamAsyncIteratorService.createStream.mockResolvedValueOnce({
                    async *[Symbol.asyncIterator]() {
                        yield {
                            subject: EventName.ChatMessageCreated,
                            data: new Uint8Array(),
                        }
                    },
                })

                await world.runConsumer()

                expect(world.messageFactory.parse).toHaveBeenCalledWith("{}")
                expect(world.eventEmitter.emit).toHaveBeenCalledWith(
                    EventName.ChatMessageCreated,
                    eventPayload,
                )
            })

        it("does not emit a ping as an application event",
            async () => {
                const world = createService("instance-a")
                world.streamAsyncIteratorService.createStream.mockResolvedValueOnce({
                    async *[Symbol.asyncIterator]() {
                        yield {
                            subject: EventName.Ping,
                            data: new TextEncoder().encode("ping"),
                        }
                    },
                })
                await world.runConsumer()

                expect(world.eventEmitter.emit).not.toHaveBeenCalled()
            })
    })
