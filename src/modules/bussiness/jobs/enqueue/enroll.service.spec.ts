import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import type {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    envConfig,
} from "@modules/platform/env/config"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    InstallmentPlanService,
} from "../../installment-plan/installment-plan.service"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    JobStalledService,
} from "../atomic/job-stalled.service"
import {
    EnqueueEnrollJobService,
} from "./enroll.service"

// the UX delay is a real timer in production; the enroll push is AWAITED, so the
// stub keeps the payment-finalize path from stalling on a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.Enroll].name

describe("EnqueueEnrollJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueEnrollJobService
        let queue: {
            add: jest.Mock
        }
        let jobActionService: {
            createJob: jest.Mock
            failJob: jest.Mock
        }
        let jobStalledService: {
            requeueJob: jest.Mock
        }
        let superJson: {
            stringify: jest.Mock
            parse: jest.Mock
        }
        let entityManager: EntityManagerMock
        let installmentPlanService: {
            createFixedPlan: jest.Mock
        }

        /** The persisted jobs row both the create and requeue paths hand back. */
        const job = {
            id: "job-1",
            payload: "serialized-payload",
        }

        /**
         * Build a paid Enroll transaction for the fan-out tests.
         *
         * @param overrides - Fields to change on the default single-course order
         * @returns The transaction the service will fan out
         */
        const transaction = (
            overrides: Partial<TransactionEntity> = {
            },
        ): TransactionEntity => ({
            id: "transaction-1",
            userId: "user-1",
            courseId: "course-1",
            installmentMonths: null,
            installmentTotalVnd: null,
            installmentMarkupPercent: null,
            ...overrides,
        }) as unknown as TransactionEntity

        beforeEach(async () => {
            queue = {
                add: jest.fn().mockResolvedValue(undefined),
            }
            jobActionService = {
                createJob: jest.fn().mockResolvedValue(job),
                failJob: jest.fn().mockResolvedValue(undefined),
            }
            jobStalledService = {
                requeueJob: jest.fn().mockResolvedValue(job),
            }
            superJson = {
                stringify: jest.fn().mockReturnValue("serialized-payload"),
                parse: jest.fn(),
            }
            entityManager = makeEntityManagerMock()
            entityManager.find.mockResolvedValue([])
            entityManager.findOne.mockResolvedValue(null)
            installmentPlanService = {
                createFixedPlan: jest.fn().mockResolvedValue({
                    id: "plan-1",
                }),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    EnqueueEnrollJobService,
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
                    },
                    {
                        provide: JobStalledService,
                        useValue: jobStalledService,
                    },
                    {
                        provide: SUPERJSON,
                        useValue: superJson,
                    },
                    {
                        provide: getQueueToken(QUEUE_NAME),
                        useValue: queue as unknown as Queue<string>,
                    },
                    {
                        provide: getEntityManagerToken("primary"),
                        useValue: entityManager,
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: installmentPlanService,
                    },
                ],
            }).compile()

            service = testingModule.get(EnqueueEnrollJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        describe("enqueue",
            () => {
                it("creates a job row and awaits the broker push",
                    async () => {
                        const created = await service.enqueue({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                        })

                        expect(created).toBe(job)
                        expect(jobStalledService.requeueJob).not.toHaveBeenCalled()
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                        })
                        expect(jobActionService.createJob).toHaveBeenCalledWith({
                            id: expect.any(String),
                            userId: "user-1",
                            actionType: ActionType.Enroll,
                            maxSteps: envConfig().job.enroll.maxSteps,
                            payload: "serialized-payload",
                        })
                        // AWAITED, unlike every other enqueue service on this path
                        expect(queue.add).toHaveBeenCalledWith(
                            "job-1",
                            "serialized-payload",
                            {
                                jobId: "job-1",
                            },
                        )
                    })

                it("requeues an existing row instead of minting a new one",
                    async () => {
                        const created = await service.enqueue({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                            jobId: "stalled-job",
                        })

                        expect(created).toBe(job)
                        expect(jobStalledService.requeueJob).toHaveBeenCalledWith({
                            id: "stalled-job",
                        })
                        expect(jobActionService.createJob).not.toHaveBeenCalled()
                    })

                it("fails the job AND rethrows so the gateway re-delivers",
                    async () => {
                        const failure = new Error("redis down")
                        queue.add.mockRejectedValue(failure)

                        await expect(service.enqueue({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                        })).rejects.toBe(failure)
                        expect(jobActionService.failJob).toHaveBeenCalledWith({
                            job,
                            error: "Failed to enqueue job to broker: redis down",
                        })
                    })

                it("falls back to `unknown error` when the rejection carries no message",
                    async () => {
                        queue.add.mockRejectedValue(undefined)

                        await expect(service.enqueue({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                        })).rejects.toBeUndefined()
                        expect(jobActionService.failJob).toHaveBeenCalledWith({
                            job,
                            error: "Failed to enqueue job to broker: unknown error",
                        })
                    })
            })

        describe("enqueueForTransaction",
            () => {
                it("enqueues one job for a legacy single-course order",
                    async () => {
                        const result = await service.enqueueForTransaction({
                            transaction: transaction(),
                        })

                        expect(result).toEqual({
                            enqueuedCount: 1,
                        })
                        expect(entityManager.find).toHaveBeenCalledWith(
                            TransactionItemEntity,
                            {
                                where: {
                                    transaction: {
                                        id: "transaction-1",
                                    },
                                },
                            },
                        )
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-1",
                        })
                        expect(queue.add).toHaveBeenCalledTimes(1)
                    })

                it("fans a multi-course order out to one job per line",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                courseId: "course-a",
                            },
                            {
                                courseId: "course-b",
                            },
                        ])

                        const result = await service.enqueueForTransaction({
                            transaction: transaction(),
                        })

                        expect(result).toEqual({
                            enqueuedCount: 2,
                        })
                        expect(queue.add).toHaveBeenCalledTimes(2)
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-a",
                        })
                        expect(superJson.stringify).toHaveBeenCalledWith({
                            transactionId: "transaction-1",
                            userId: "user-1",
                            courseId: "course-b",
                        })
                    })

                it("reports zero for a malformed order with neither items nor a course",
                    async () => {
                        const result = await service.enqueueForTransaction({
                            transaction: transaction({
                                courseId: null as unknown as string,
                            }),
                        })

                        expect(result).toEqual({
                            enqueuedCount: 0,
                        })
                        expect(jobActionService.createJob).not.toHaveBeenCalled()
                        expect(installmentPlanService.createFixedPlan)
                            .not.toHaveBeenCalled()
                    })

                it("propagates a broker failure so the webhook returns non-2xx",
                    async () => {
                        queue.add.mockRejectedValue(new Error("redis down"))

                        await expect(service.enqueueForTransaction({
                            transaction: transaction(),
                        })).rejects.toThrow("redis down")
                        expect(installmentPlanService.createFixedPlan)
                            .not.toHaveBeenCalled()
                    })

                it("creates no installment plan for a one-shot purchase",
                    async () => {
                        await service.enqueueForTransaction({
                            transaction: transaction(),
                        })

                        expect(installmentPlanService.createFixedPlan)
                            .not.toHaveBeenCalled()
                        expect(entityManager.findOne).not.toHaveBeenCalled()
                    })

                it("creates the fixed plan once for an installment checkout",
                    async () => {
                        entityManager.find.mockResolvedValue([
                            {
                                courseId: "course-a",
                            },
                            {
                                courseId: "course-b",
                            },
                        ])

                        await service.enqueueForTransaction({
                            transaction: transaction({
                                installmentMonths: 6,
                                installmentTotalVnd: 12_000_000,
                                installmentMarkupPercent: 8,
                            }),
                        })

                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            InstallmentPlanEntity,
                            {
                                where: {
                                    originTransaction: {
                                        id: "transaction-1",
                                    },
                                },
                            },
                        )
                        expect(installmentPlanService.createFixedPlan)
                            .toHaveBeenCalledWith({
                                userId: "user-1",
                                originTransactionId: "transaction-1",
                                lockedCourseIds: [
                                    "course-a",
                                    "course-b",
                                ],
                                totalAmountVnd: 12_000_000,
                                months: 6,
                                markupPercent: 8,
                            })
                    })

                it("defaults a missing markup to zero",
                    async () => {
                        await service.enqueueForTransaction({
                            transaction: transaction({
                                installmentMonths: 3,
                                installmentTotalVnd: 6_000_000,
                                installmentMarkupPercent: null,
                            }),
                        })

                        expect(installmentPlanService.createFixedPlan)
                            .toHaveBeenCalledWith(expect.objectContaining({
                                markupPercent: 0,
                            }))
                    })

                it("does not re-create the plan when the webhook is re-delivered",
                    async () => {
                        entityManager.findOne.mockResolvedValue({
                            id: "existing-plan",
                        })

                        await service.enqueueForTransaction({
                            transaction: transaction({
                                installmentMonths: 6,
                                installmentTotalVnd: 12_000_000,
                            }),
                        })

                        expect(installmentPlanService.createFixedPlan)
                            .not.toHaveBeenCalled()
                    })

                it("skips the plan when only the month count is present",
                    async () => {
                        await service.enqueueForTransaction({
                            transaction: transaction({
                                installmentMonths: 6,
                                installmentTotalVnd: null,
                            }),
                        })

                        expect(installmentPlanService.createFixedPlan)
                            .not.toHaveBeenCalled()
                    })
            })
    })
