import type {
    EachMessagePayload,
} from "kafkajs"
import {
    WinstonLog,
} from "@modules/platform/winston/enums/winston-log"
import {
    EsSyncUserListener,
} from "./es-sync-user.listener"

describe("EsSyncUserListener",
    () => {
        const topic = "users"

        const payload = (value: string | null): EachMessagePayload => ({
            topic,
            partition: 0,
            message: {
                value: value === null ? null : Buffer.from(value),
                key: null,
                timestamp: "0",
                attributes: {
                },
                offset: "0",
                headers: {
                },
            },
        } as unknown as EachMessagePayload)

        const createListener = () => {
            const consumer = {
                subscribe: jest.fn().mockResolvedValue(undefined),
                run: jest.fn().mockResolvedValue(undefined),
            }
            const kafkaService = {
                ensureTopics: jest.fn().mockResolvedValue(undefined),
                createConsumer: jest.fn().mockResolvedValue({
                    consumer,
                }),
            }
            const esSyncUserService = {
                reindexOne: jest.fn().mockResolvedValue(undefined),
            }
            const winstonService = {
                log: jest.fn(),
            }
            const listener = new EsSyncUserListener(
                esSyncUserService as never,
                kafkaService as never,
                winstonService as never,
            )
            return {
                listener,
                consumer,
                kafkaService,
                esSyncUserService,
                winstonService,
            }
        }

        it("subscribes the CDC consumer and reindexes standard and flat rows",
            async () => {
                const setup = createListener()
                let handler: ((message: EachMessagePayload) => Promise<void>) | undefined
                setup.consumer.run.mockImplementation(
                    async (config: {
                        eachMessage: (message: EachMessagePayload) => Promise<void>
                    }) => {
                        handler = config.eachMessage
                    },
                )

                await setup.listener.onModuleInit()

                expect(setup.kafkaService.ensureTopics).toHaveBeenCalledWith({
                    topics: [expect.stringContaining("users")],
                })
                expect(setup.kafkaService.createConsumer).toHaveBeenCalledWith({
                    groupId: "es-sync-user",
                })
                expect(setup.consumer.subscribe).toHaveBeenCalledWith({
                    topics: [expect.stringContaining("users")],
                    fromBeginning: false,
                })
                expect(setup.consumer.run).toHaveBeenCalledWith({
                    eachMessage: expect.any(Function),
                })

                await handler!(payload(JSON.stringify({
                    payload: {
                        id: "user-1",
                    },
                })))
                await handler!(payload(JSON.stringify({
                    id: "user-2",
                })))

                expect(setup.esSyncUserService.reindexOne).toHaveBeenNthCalledWith(1,
                    {
                        userId: "user-1",
                    })
                expect(setup.esSyncUserService.reindexOne).toHaveBeenNthCalledWith(2,
                    {
                        userId: "user-2",
                    })
                expect(setup.winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.CdcListenerSubscribed,
                    expect.objectContaining({
                        op: "es-sync-user.cdc.subscribed",
                    }),
                )
            })

        it("skips tombstones and malformed rows without reindexing",
            async () => {
                const setup = createListener()
                let handler: ((message: EachMessagePayload) => Promise<void>) | undefined
                setup.consumer.run.mockImplementation(
                    async (config: {
                        eachMessage: (message: EachMessagePayload) => Promise<void>
                    }) => {
                        handler = config.eachMessage
                    },
                )
                await setup.listener.onModuleInit()

                await handler!(payload(null))
                await handler!(payload(JSON.stringify({
                    payload: {
                        email: "without-id@example.com",
                    },
                })))

                expect(setup.esSyncUserService.reindexOne).not.toHaveBeenCalled()
                expect(setup.winstonService.log).toHaveBeenCalledTimes(1)
            })

        it("logs malformed JSON and reindex failures without throwing",
            async () => {
                const setup = createListener()
                let handler: ((message: EachMessagePayload) => Promise<void>) | undefined
                setup.consumer.run.mockImplementation(
                    async (config: {
                        eachMessage: (message: EachMessagePayload) => Promise<void>
                    }) => {
                        handler = config.eachMessage
                    },
                )
                await setup.listener.onModuleInit()

                await handler!(payload("not-json"))
                setup.esSyncUserService.reindexOne.mockRejectedValueOnce(
                    new Error("elasticsearch unavailable"),
                )
                await handler!(payload(JSON.stringify({
                    payload: {
                        id: "user-3",
                    },
                })))

                expect(setup.winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.RequestHandlingFailed,
                    expect.objectContaining({
                        op: "es-sync-user.cdc.message-failed",
                    }),
                )
                expect(setup.winstonService.log).toHaveBeenCalledTimes(3)
            })

        it("disables the listener gracefully when Kafka boot fails",
            async () => {
                const setup = createListener()
                setup.kafkaService.ensureTopics.mockRejectedValueOnce(
                    new Error("broker unavailable"),
                )

                await expect(setup.listener.onModuleInit()).resolves.toBeUndefined()

                expect(setup.winstonService.log).toHaveBeenCalledWith(
                    WinstonLog.CdcListenerDisabled,
                    expect.objectContaining({
                        op: "es-sync-user.cdc.disabled",
                        error: "broker unavailable",
                    }),
                )
                expect(setup.kafkaService.createConsumer).not.toHaveBeenCalled()
            })
    })
