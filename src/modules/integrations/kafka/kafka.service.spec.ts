import {
    KafkaService
} from "./kafka.service"

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
    })
