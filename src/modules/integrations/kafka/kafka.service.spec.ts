import {
    KafkaService
} from "./kafka.service"

jest.mock("./request-queue-throttle-patch",
    () => ({
        applyKafkaRequestQueueThrottlePatch: jest.fn().mockReturnValue("skipped"),
    }))

describe("KafkaService",
    () => {
        it("connects consumers and creates only missing topics",
            async () => {
                const consumer = {
                    connect: jest.fn(), disconnect: jest.fn()
                }
                const admin = {
                    connect: jest.fn(), listTopics: jest.fn().mockResolvedValue(["existing"]), createTopics: jest.fn(), disconnect: jest.fn().mockResolvedValue(undefined)
                }
                const kafka = {
                    consumer: jest.fn().mockReturnValue(consumer), admin: jest.fn().mockReturnValue(admin)
                }
                const service = new KafkaService(kafka as never,
{
    log: jest.fn()
} as never)
                await expect(service.createConsumer({
                    groupId: "g"
                })).resolves.toEqual({
                    consumer
                })
                await service.ensureTopics({
                    topics: ["existing",
                        "missing"], numPartitions: 2
                })
                expect(admin.createTopics).toHaveBeenCalledWith({
                    topics: [{
                        topic: "missing", numPartitions: 2
                    }]
                })
                await service.onModuleDestroy()
                expect(consumer.disconnect).toHaveBeenCalled()
            })
        it("logs topic errors without throwing",
            async () => {
                const admin = {
                    connect: jest.fn().mockRejectedValue(new Error("down")), disconnect: jest.fn().mockResolvedValue(undefined)
                }
                const log = jest.fn()
                await new KafkaService({
                    admin: jest.fn().mockReturnValue(admin)
                } as never,
{
    log
} as never).ensureTopics({
                    topics: ["topic"]
                })
                expect(log).toHaveBeenCalled()
            })

        it("wraps consumer connection failures and skips empty topic requests",
            async () => {
                const connectError = new Error("broker unavailable")
                const kafka = {
                    consumer: jest.fn().mockReturnValue({
                        connect: jest.fn().mockRejectedValue(connectError),
                    }),
                    admin: jest.fn(),
                }
                const service = new KafkaService(kafka as never,
                    {
                        log: jest.fn(),
                    } as never)

                await expect(service.createConsumer({
                    groupId: "failing-group",
                })).rejects.toThrow("Failed to connect Kafka consumer")
                await service.ensureTopics({
                    topics: [],
                })
                expect(kafka.admin).not.toHaveBeenCalled()
            })

        it("logs isolated consumer disconnect failures during shutdown",
            async () => {
                const log = jest.fn()
                const disconnect = jest.fn().mockRejectedValue(new Error("disconnect failed"))
                const consumer = {
                    connect: jest.fn().mockResolvedValue(undefined),
                    disconnect,
                }
                const service = new KafkaService({
                    consumer: jest.fn().mockReturnValue(consumer),
                } as never,
{
    log,
} as never)

                await service.createConsumer({
                    groupId: "shutdown-group",
                })
                await expect(service.onModuleDestroy()).resolves.toBeUndefined()
                expect(disconnect).toHaveBeenCalledTimes(1)
                expect(log).toHaveBeenCalled()
            })

        it("does not issue CreateTopics when every requested topic already exists",
            async () => {
                const admin = {
                    connect: jest.fn().mockResolvedValue(undefined),
                    listTopics: jest.fn().mockResolvedValue(["known"]),
                    createTopics: jest.fn(),
                    disconnect: jest.fn().mockResolvedValue(undefined),
                }
                const service = new KafkaService({
                    admin: jest.fn().mockReturnValue(admin),
                } as never,
{
    log: jest.fn(),
} as never)

                await service.ensureTopics({
                    topics: ["known"],
                })

                expect(admin.createTopics).not.toHaveBeenCalled()
                expect(admin.disconnect).toHaveBeenCalledTimes(1)
            })

        it("keeps a disconnect failure from masking topic creation",
            async () => {
                const admin = {
                    connect: jest.fn().mockResolvedValue(undefined),
                    listTopics: jest.fn().mockResolvedValue([]),
                    createTopics: jest.fn().mockResolvedValue(true),
                    disconnect: jest.fn().mockRejectedValue(new Error("close failed")),
                }
                const service = new KafkaService({
                    admin: jest.fn().mockReturnValue(admin),
                } as never,
{
    log: jest.fn(),
} as never)

                await expect(service.ensureTopics({
                    topics: ["new-topic"],
                })).resolves.toBeUndefined()
                expect(admin.createTopics).toHaveBeenCalled()
            })
    })
