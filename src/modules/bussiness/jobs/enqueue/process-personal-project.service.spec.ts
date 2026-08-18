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
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    EnqueueProcessPersonalProjectJobService,
} from "./process-personal-project.service"

// the UX delay is a real timer in production; stub it so the fire-and-forget
// broker push settles on the next tick instead of after a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.ProcessPersonalProject].name

describe("EnqueueProcessPersonalProjectJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueProcessPersonalProjectJobService
        let queue: {
            add: jest.Mock
        }
        let jobActionService: {
            createJob: jest.Mock
            failJob: jest.Mock
        }
        let superJson: {
            stringify: jest.Mock
            parse: jest.Mock
        }

        /** The persisted jobs row `createJob` hands back. */
        const job = {
            id: "job-1",
            payload: "serialized-payload",
        }

        /**
         * Let the fire-and-forget `sleepEnqueueUxDelay().then(...)` chain settle.
         * A macrotask tick, not a wait: the stubbed delay is already resolved.
         */
        const settleBrokerPush = async (): Promise<void> =>
            new Promise<void>((resolve) => {
                setImmediate(resolve)
            })

        beforeEach(async () => {
            queue = {
                add: jest.fn().mockResolvedValue(undefined),
            }
            jobActionService = {
                createJob: jest.fn().mockResolvedValue(job),
                failJob: jest.fn().mockResolvedValue(undefined),
            }
            superJson = {
                stringify: jest.fn().mockReturnValue("serialized-payload"),
                parse: jest.fn(),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    EnqueueProcessPersonalProjectJobService,
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
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
                        useValue: makeEntityManagerMock(),
                    },
                ],
            }).compile()

            service = testingModule.get(EnqueueProcessPersonalProjectJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        it("serializes the attempt with the caller's branch",
            async () => {
                const created = await service.enqueue({
                    attemptId: "attempt-1",
                    branch: "feature/x",
                    userId: "user-1",
                })

                expect(created).toBe(job)
                expect(superJson.stringify).toHaveBeenCalledWith({
                    attemptId: "attempt-1",
                    branch: "feature/x",
                })
                expect(jobActionService.createJob).toHaveBeenCalledWith({
                    id: expect.any(String),
                    userId: "user-1",
                    actionType: ActionType.ProcessPersonalProject,
                    maxSteps: 2,
                    payload: "serialized-payload",
                })
            })

        it("defaults the graded branch to `main` when none is given",
            async () => {
                await service.enqueue({
                    attemptId: "attempt-1",
                    userId: "user-1",
                })

                expect(superJson.stringify).toHaveBeenCalledWith({
                    attemptId: "attempt-1",
                    branch: "main",
                })
            })

        it("pushes the job to the broker pinned to the row id",
            async () => {
                await service.enqueue({
                    attemptId: "attempt-1",
                    userId: "user-1",
                })
                await settleBrokerPush()

                expect(queue.add).toHaveBeenCalledWith(
                    "job-1",
                    "serialized-payload",
                    {
                        jobId: "job-1",
                    },
                )
                expect(jobActionService.failJob).not.toHaveBeenCalled()
            })

        it("marks the job failed when the broker push rejects",
            async () => {
                queue.add.mockRejectedValue(new Error("redis down"))

                await service.enqueue({
                    attemptId: "attempt-1",
                    userId: "user-1",
                })
                await settleBrokerPush()

                expect(jobActionService.failJob).toHaveBeenCalledWith({
                    job,
                    error: "Failed to enqueue job to broker: redis down",
                })
            })

        it("falls back to `unknown error` when the rejection carries no message",
            async () => {
                queue.add.mockRejectedValue(undefined)

                await service.enqueue({
                    attemptId: "attempt-1",
                    userId: "user-1",
                })
                await settleBrokerPush()

                expect(jobActionService.failJob).toHaveBeenCalledWith({
                    job,
                    error: "Failed to enqueue job to broker: unknown error",
                })
            })

        it("returns without waiting for the broker push to settle",
            async () => {
                queue.add.mockReturnValue(new Promise<void>(() => {
                }))

                await expect(service.enqueue({
                    attemptId: "attempt-1",
                    userId: "user-1",
                })).resolves.toBe(job)
            })
    })
