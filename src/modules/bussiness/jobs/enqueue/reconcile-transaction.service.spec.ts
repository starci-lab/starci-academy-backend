import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import type {
    Queue,
} from "bullmq"
import {
    EnqueueReconcileTransactionJobService,
} from "./reconcile-transaction.service"
import {
    bullData,
    BullQueueName,
    type ReconcileTransactionPayload,
} from "@modules/bullmq"
import {
    SUPERJSON,
} from "@modules/mixin"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    envConfig,
} from "@modules/env"

// `envConfig()` is a plain factory fn read on every `enqueue()` call; mock only
// the module so each test can dial the reconcile master switch / delay freely
// (delegates to the real implementation until a test overrides it).
jest.mock("@modules/env",
    () => {
        const actual = jest.requireActual<typeof import("@modules/env")>("@modules/env")
        return {
            ...actual,
            envConfig: jest.fn(actual.envConfig),
        }
    })

const mockEnvConfig = envConfig as jest.MockedFunction<typeof envConfig>

/** Queue name the SUT injects via `@InjectQueue(bullData[BullQueueName.ReconcileTransaction].name)`. */
const QUEUE_NAME = bullData[BullQueueName.ReconcileTransaction].name

/**
 * Stub the `services.api.transaction.reconcile` env slice the SUT reads.
 * Overrides merge over enabled defaults so each test only states what it needs.
 */
const setReconcileEnv = (
    overrides: Partial<{
        enabled: boolean
        delayMs: number
    }> = {
    },
): void => {
    mockEnvConfig.mockReturnValue({
        services: {
            api: {
                transaction: {
                    reconcile: {
                        enabled: true,
                        delayMs: 60_000,
                        ...overrides,
                    },
                },
            },
        },
    } as unknown as ReturnType<typeof envConfig>)
}

describe("EnqueueReconcileTransactionJobService",
    () => {
        let module: TestingModule
        let service: EnqueueReconcileTransactionJobService
        let reconcileQueue: jest.Mocked<Pick<Queue<string>, "add">>
        let superJson: {
            stringify: jest.Mock
            parse: jest.Mock
        }
        let winstonService: jest.Mocked<Pick<WinstonService, "log">>

        beforeEach(async () => {
            setReconcileEnv()

            reconcileQueue = {
                add: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<Queue<string>, "add">>

            // superjson stub -- stringify returns a fixed marker so the payload
            // handed to the queue can be asserted without depending on real SuperJSON
            superJson = {
                stringify: jest.fn().mockReturnValue("serialized-payload"),
                parse: jest.fn(),
            }

            winstonService = {
                log: jest.fn(),
            } as unknown as jest.Mocked<Pick<WinstonService, "log">>

            module = await Test.createTestingModule({
                providers: [
                    EnqueueReconcileTransactionJobService,
                    {
                        provide: SUPERJSON,
                        useValue: superJson,
                    },
                    {
                        provide: getQueueToken(QUEUE_NAME),
                        useValue: reconcileQueue,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                ],
            }).compile()

            service = module.get(EnqueueReconcileTransactionJobService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("enqueue",
            () => {
                it("serializes the payload and schedules the job with the configured delay when reconcile polling is enabled",
                    async () => {
                        setReconcileEnv({
                            delayMs: 45_000,
                        })

                        await service.enqueue({
                            transactionId: "txn-1",
                            attempt: 2,
                        })

                        const payload: ReconcileTransactionPayload = {
                            transactionId: "txn-1",
                            attempt: 2,
                        }
                        expect(superJson.stringify).toHaveBeenCalledWith(payload)
                        expect(reconcileQueue.add).toHaveBeenCalledWith(
                            "reconcile-transaction:txn-1:2",
                            "serialized-payload",
                            expect.objectContaining({
                                delay: 45_000,
                                jobId: expect.any(String),
                            }),
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileScheduled,
                            {
                                transactionId: "txn-1",
                                attempt: 2,
                                delayMs: 45_000,
                            },
                        )
                    })

                it("defaults attempt to 1 when omitted",
                    async () => {
                        await service.enqueue({
                            transactionId: "txn-2",
                        })

                        expect(reconcileQueue.add).toHaveBeenCalledWith(
                            "reconcile-transaction:txn-2:1",
                            expect.any(String),
                            expect.any(Object),
                        )
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            transactionId: "txn-2",
                            attempt: 1,
                        })
                    })

                it("uses the delayMs override instead of the configured delay when given",
                    async () => {
                        setReconcileEnv({
                            delayMs: 60_000,
                        })

                        await service.enqueue({
                            transactionId: "txn-3",
                            // the boot sweep passes 0 to poll immediately -- must win over the
                            // configured delay (`??`, not `||`, so 0 is honored, not defaulted)
                            delayMs: 0,
                        })

                        expect(reconcileQueue.add).toHaveBeenCalledWith(
                            expect.any(String),
                            expect.any(String),
                            expect.objectContaining({
                                delay: 0,
                            }),
                        )
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileScheduled,
                            expect.objectContaining({
                                delayMs: 0,
                            }),
                        )
                    })

                it("skips scheduling and logs a skip decision when reconcile polling is disabled",
                    async () => {
                        setReconcileEnv({
                            enabled: false,
                        })

                        await service.enqueue({
                            transactionId: "txn-4",
                            attempt: 3,
                        })

                        expect(reconcileQueue.add).not.toHaveBeenCalled()
                        expect(superJson.stringify).not.toHaveBeenCalled()
                        expect(winstonService.log).toHaveBeenCalledWith(
                            WinstonLog.TransactionReconcileScheduled,
                            {
                                transactionId: "txn-4",
                                attempt: 3,
                                decision: "skip",
                            },
                        )
                    })

                it("propagates the broker error and does not log success when the queue add rejects",
                    async () => {
                        reconcileQueue.add.mockRejectedValueOnce(new Error("broker unreachable"))

                        await expect(
                            service.enqueue({
                                transactionId: "txn-5",
                            }),
                        ).rejects.toThrow("broker unreachable")

                        expect(winstonService.log).not.toHaveBeenCalled()
                    })
            })
    })
