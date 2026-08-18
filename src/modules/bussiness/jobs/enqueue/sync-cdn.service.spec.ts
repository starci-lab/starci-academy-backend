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
import dayjs from "dayjs"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
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
    JobActionService,
} from "../atomic/job-action.service"
import {
    EnqueueSyncCdnJobService,
} from "./sync-cdn.service"

// the UX delay is a real timer in production; stub it so the fire-and-forget
// broker push settles on the next tick instead of after a wall-clock wait
jest.mock("../utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn().mockResolvedValue(undefined),
    }))

/** Queue name the SUT injects via `@InjectQueue`. */
const QUEUE_NAME = bullData[BullQueueName.SyncCdn].name

describe("EnqueueSyncCdnJobService",
    () => {
        let testingModule: TestingModule
        let service: EnqueueSyncCdnJobService
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

        /** The sync request every test enqueues. */
        const params = {
            entityKind: CourseEntity.name,
            syncAt: dayjs("2026-08-19T00:00:00.000Z"),
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
                    EnqueueSyncCdnJobService,
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

            service = testingModule.get(EnqueueSyncCdnJobService)
        })

        afterEach(async () => {
            await testingModule.close()
        })

        it("persists a jobs row carrying the serialized sync payload",
            async () => {
                const created = await service.enqueue(params)

                expect(created).toBe(job)
                expect(superJson.stringify).toHaveBeenCalledWith(params)
                expect(jobActionService.createJob).toHaveBeenCalledWith({
                    id: expect.any(String),
                    actionType: ActionType.SyncCdn,
                    maxSteps: 2,
                    payload: "serialized-payload",
                })
            })

        it("pushes the job to the broker pinned to the row id",
            async () => {
                await service.enqueue(params)
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

                await service.enqueue(params)
                await settleBrokerPush()

                expect(jobActionService.failJob).toHaveBeenCalledWith({
                    job,
                    error: "Failed to enqueue job to broker: redis down",
                })
            })

        it("falls back to `unknown error` when the rejection carries no message",
            async () => {
                queue.add.mockRejectedValue(undefined)

                await service.enqueue(params)
                await settleBrokerPush()

                expect(jobActionService.failJob).toHaveBeenCalledWith({
                    job,
                    error: "Failed to enqueue job to broker: unknown error",
                })
            })

        it("returns without waiting for the broker push to settle",
            async () => {
                // a push that never resolves must not hold the caller: the chain is
                // deliberately fire-and-forget so the UX delay never blocks the reply
                queue.add.mockReturnValue(new Promise<void>(() => {
                }))

                await expect(service.enqueue(params)).resolves.toBe(job)
            })
    })
