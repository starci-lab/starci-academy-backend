import {
    Test
} from "@nestjs/testing"
import type {
    TestingModule
} from "@nestjs/testing"
import {
    getQueueToken
} from "@nestjs/bullmq"
import type {
    Queue
} from "bullmq"
import {
    ActionType
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    JobCategory
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    Locale
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ModelProvider
} from "@modules/databases/postgresql/primary/enums/model-provider"
import {
    bullData
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    SUPERJSON
} from "@modules/lib/mixin/constants/superjson"
import {
    envConfig
} from "@modules/platform/env/config"
import type {
    AiJobSelection
} from "@modules/ai/types/ai-job-selection"
import {
    JobActionService
} from "../atomic/job-action.service"
import {
    JobStalledService
} from "../atomic/job-stalled.service"
import {
    EnqueueProcessGitSubmissionJobService
} from "./process-git-submission.service"

// the UX delay is a real timer in production; stub it so the fire-and-forget
// broker push settles on the next tick instead of after a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.ProcessGitSubmission].name

describe("EnqueueProcessGitSubmissionJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueProcessGitSubmissionJobService
        let queue: {
    add: jest.Mock;
  }
        let jobActionService: {
    createJob: jest.Mock;
    failJob: jest.Mock;
  }
        let jobStalledService: {
    requeueJob: jest.Mock;
  }
        let superJson: {
    stringify: jest.Mock;
    parse: jest.Mock;
  }

        /** The persisted jobs row both the create and requeue paths hand back. */
        const job = {
            id: "job-1",
            payload: "serialized-payload",
            fencingToken: 0,
        }

        /** The minimum submit request; individual tests widen it. */
        const baseParams = {
            userId: "user-1",
            enrollmentId: "enrollment-1",
            courseId: "course-1",
            challengeSubmissionId: "challenge-submission-1",
            userChallengeSubmissionId: "user-challenge-submission-1",
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
            jobStalledService = {
                requeueJob: jest.fn().mockResolvedValue(job),
            }
            superJson = {
                stringify: jest.fn().mockReturnValue("serialized-payload"),
                parse: jest.fn(),
            }

            testingModule = await Test.createTestingModule({
                providers: [
                    EnqueueProcessGitSubmissionJobService,
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
                ],
            }).compile()

            service = testingModule.get(EnqueueProcessGitSubmissionJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        it("omits every optional field the caller left out",
            async () => {
                const created = await service.enqueue(baseParams)

                expect(created).toBe(job)
                const [createArgs] = jobActionService.createJob.mock.calls[0]
                expect(createArgs).toEqual({
                    id: expect.any(String),
                    userId: "user-1",
                    actionType: ActionType.ProcessGitSubmission,
                    category: JobCategory.SubmitChallenge,
                    maxSteps: envConfig().job.processGitSubmission.maxSteps,
                    payload: "serialized-payload",
                    challengeSubmissionId: "challenge-submission-1",
                    refs: {
                        enrollmentId: "enrollment-1",
                        userChallengeSubmissionId: "user-challenge-submission-1",
                    },
                })
                expect(superJson.stringify).toHaveBeenCalledWith({
                    jobId: createArgs.id,
                    enrollmentId: "enrollment-1",
                    userChallengeSubmissionId: "user-challenge-submission-1",
                })
            })

        it("carries every optional override into the payload when supplied",
            async () => {
                const ai = {
                    lane: "premium",
                } as unknown as AiJobSelection

                await service.enqueue({
                    ...baseParams,
                    branch: "develop",
                    embeddingModel: "text-embedding-3-small",
                    embeddingProvider: ModelProvider.OpenAI,
                    locale: Locale.Vi,
                    ai,
                    lang: "typescript",
                })

                const [createArgs] = jobActionService.createJob.mock.calls[0]
                expect(superJson.stringify).toHaveBeenCalledWith({
                    jobId: createArgs.id,
                    enrollmentId: "enrollment-1",
                    userChallengeSubmissionId: "user-challenge-submission-1",
                    branch: "develop",
                    embeddingModel: "text-embedding-3-small",
                    embeddingProvider: ModelProvider.OpenAI,
                    locale: Locale.Vi,
                    ai,
                    lang: "typescript",
                })
            })

        it("requeues an existing row instead of minting a new one",
            async () => {
                const created = await service.enqueue({
                    ...baseParams,
                    jobId: "stalled-job",
                })

                expect(created).toBe(job)
                expect(jobStalledService.requeueJob).toHaveBeenCalledWith({
                    id: "stalled-job",
                })
                expect(jobActionService.createJob).not.toHaveBeenCalled()
            })

        it("pushes the job to the broker pinned to the row id",
            async () => {
                await service.enqueue(baseParams)
                await settleBrokerPush()

                expect(queue.add).toHaveBeenCalledWith("job-1",
                    "serialized-payload",
                    {
                        jobId: "job-1",
                    })
                expect(jobActionService.failJob).not.toHaveBeenCalled()
            })

        it("uses the fencing token as a new broker dispatch identity on retry",
            async () => {
                await service.publish({
                    ...job,
                    fencingToken: 2,
                } as never)

                expect(queue.add).toHaveBeenCalledWith("job-1",
                    "serialized-payload",
                    {
                        jobId: "job-1-2",
                    })
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
                queue.add.mockReturnValue(new Promise<void>(() => {}))

                await expect(service.enqueue(baseParams)).resolves.toBe(job)
            })
    })
