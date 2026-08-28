import {
    Test,
} from "@nestjs/testing"
import type {
    TestingModule,
} from "@nestjs/testing"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import type {
    Queue,
} from "bullmq"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import type {
    AiJobSelection,
} from "@modules/ai/types/ai-job-selection"
import {
    JobActionService,
} from "../atomic/job-action.service"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "./review-personal-project-task.service"

// the UX delay is a real timer in production; stub it so the fire-and-forget
// broker push settles on the next tick instead of after a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.ReviewPersonalProjectTask].name

describe("EnqueueReviewPersonalProjectTaskJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueReviewPersonalProjectTaskJobService
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

        /** The minimum review request; individual tests widen it. */
        const baseParams = {
            enrollmentId: "enrollment-1",
            githubUrl: "https://github.com/learner/project",
            taskId: "task-1",
            userId: "user-1",
            locale: Locale.En,
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
                    EnqueueReviewPersonalProjectTaskJobService,
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
                ],
            }).compile()

            service = testingModule.get(EnqueueReviewPersonalProjectTaskJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        it("omits `lang` and `ai` from the payload when the caller sends neither",
            async () => {
                const created = await service.enqueue(baseParams)

                expect(created).toBe(job)
                expect(superJson.stringify).toHaveBeenCalledWith({
                    enrollmentId: "enrollment-1",
                    githubUrl: "https://github.com/learner/project",
                    taskId: "task-1",
                    branch: "main",
                    locale: Locale.En,
                })
                expect(jobActionService.createJob).toHaveBeenCalledWith({
                    id: expect.any(String),
                    userId: "user-1",
                    actionType: ActionType.ReviewPersonalProjectTask,
                    category: JobCategory.ReviewTask,
                    maxSteps: 2,
                    payload: "serialized-payload",
                    refs: {
                        enrollmentId: "enrollment-1",
                        taskId: "task-1",
                    },
                })
            })

        it("carries `lang`, `ai` and an explicit branch when they are supplied",
            async () => {
                const ai = {
                    lane: "auto",
                } as unknown as AiJobSelection

                await service.enqueue({
                    ...baseParams,
                    branch: "develop",
                    lang: "typescript",
                    ai,
                })

                expect(superJson.stringify).toHaveBeenCalledWith({
                    enrollmentId: "enrollment-1",
                    githubUrl: "https://github.com/learner/project",
                    taskId: "task-1",
                    branch: "develop",
                    locale: Locale.En,
                    lang: "typescript",
                    ai,
                })
            })

        it("pushes the job to the broker pinned to the row id",
            async () => {
                await service.enqueue(baseParams)
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

                await service.enqueue(baseParams)
                await settleBrokerPush()

                expect(jobActionService.failJob).toHaveBeenCalledWith({
                    job,
                    error: "Failed to enqueue job to broker: redis down",
                })
            })

        it("falls back to `unknown error` when the rejection carries no message",
            async () => {
                queue.add.mockRejectedValue(undefined)

                await service.enqueue(baseParams)
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

                await expect(service.enqueue(baseParams)).resolves.toBe(job)
            })
    })
