import {
    AbstractProjectionListener
} from "./abstract-projection.listener"

class ProbeListener extends AbstractProjectionListener<string> {
    protected readonly groupId = "probe"
    protected readonly topics = ["cdc.probe"]
    readonly deriveTargets = jest.fn((message: { row: unknown }) => message.row ? ["target"] : [])
    readonly recomputeTarget = jest.fn().mockResolvedValue(undefined)

    constructor(kafka: never, logger: never) { super(kafka,
        logger) }
}

interface ConsumerRunOptions {
    eachMessage: (payload: never) => Promise<void>
}

describe("AbstractProjectionListener",
    () => {
        it("subscribes and runs the consumer, then recomputes decoded targets",
            async () => {
                let eachMessage: ((payload: never) => Promise<void>) | undefined
                const consumer = {
                    subscribe: jest.fn().mockResolvedValue(undefined),
                    run: jest.fn(async ({ eachMessage: callback }: ConsumerRunOptions) => { eachMessage = callback }),
                }
                const kafka = {
                    ensureTopics: jest.fn().mockResolvedValue(undefined), createConsumer: jest.fn().mockResolvedValue({
                        consumer
                    })
                }
                const logger = {
                    log: jest.fn()
                }
                const listener = new ProbeListener(kafka as never,
logger as never)
                await listener.onModuleInit()
                await eachMessage?.({
                    topic: "cdc.probe", message: {
                        value: Buffer.from(JSON.stringify({
                            payload: {
                                after: {
                                    id: "1"
                                }
                            }
                        }))
                    }
                } as never)
                expect(listener.recomputeTarget).toHaveBeenCalledWith("target")
                expect(logger.log).toHaveBeenCalled()
            })

        it("swallows tombstones and logs malformed messages",
            async () => {
                let eachMessage: ((payload: never) => Promise<void>) | undefined
                const consumer = {
                    subscribe: jest.fn().mockResolvedValue(undefined), run: jest.fn(async ({ eachMessage: callback }: ConsumerRunOptions) => { eachMessage = callback })
                }
                const kafka = {
                    ensureTopics: jest.fn().mockResolvedValue(undefined), createConsumer: jest.fn().mockResolvedValue({
                        consumer
                    })
                }
                const logger = {
                    log: jest.fn()
                }
                const listener = new ProbeListener(kafka as never,
logger as never)
                await listener.onModuleInit()
                await eachMessage?.({
                    topic: "cdc.probe", message: {
                        value: null
                    }
                } as never)
                await eachMessage?.({
                    topic: "cdc.probe", message: {
                        value: Buffer.from("{")
                    }
                } as never)
                expect(listener.recomputeTarget).not.toHaveBeenCalled()
                expect(logger.log).toHaveBeenCalledTimes(2)
            })
    })
