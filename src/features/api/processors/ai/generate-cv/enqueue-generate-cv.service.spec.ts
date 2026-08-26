import SuperJSON from "superjson"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    sleepEnqueueUxDelay,
} from "@modules/bussiness/jobs/utils/enqueue-ux-delay"
import {
    asEntityManager,
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    EnqueueGenerateCvJobService,
} from "./enqueue-generate-cv.service"

jest.mock("@modules/bussiness/jobs/utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn()
    }))

const snapshot = [{
    milestoneTaskAttemptId: "018f47c0-4b15-7e5a-b8a8-3f06f9142601",
    milestoneTaskId: "018f47c0-4b15-7e5a-b8a8-3f06f9142602",
    milestoneId: "018f47c0-4b15-7e5a-b8a8-3f06f9142603",
    courseId: "018f47c0-4b15-7e5a-b8a8-3f06f9142604",
    taskTitle: "Build an API",
    milestoneTitle: "Backend capstone",
    courseTitle: "Fullstack Master",
    score: 92,
    passedAt: "2026-08-01T00:00:00.000Z",
}]
const superJson = new SuperJSON()

describe("EnqueueGenerateCvJobService",
    () => {
        const delayed = jest.mocked(sleepEnqueueUxDelay)

        beforeEach(() => {
            jest.clearAllMocks()
            delayed.mockResolvedValue(undefined)
        })

        it("atomically persists the run and identical retry-stable job payload",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (_entity, value) => ({
                    ...value,
                    id: "cv-1",
                }))
                const createJob = jest.fn().mockImplementation(async (input) => ({
                    id: input.id,
                    payload: input.payload,
                }))
                const queue = {
                    add: jest.fn().mockResolvedValue(undefined)
                }
                const service = new EnqueueGenerateCvJobService(
                    asEntityManager(entityManager),
                    {
                        createJob, failJob: jest.fn()
                    } as never,
                    superJson,
                    queue as never,
                )

                const result = await service.enqueue({
                    userId: "user-1",
                    mode: CvGenerationMode.Generate,
                    language: Locale.En,
                    targetRole: "Backend Engineer",
                    targetLevel: CvTargetLevel.Senior,
                    selectedEvidence: snapshot,
                })
                await Promise.resolve()

                expect(result.cvGeneration).toEqual(expect.objectContaining({
                    id: "cv-1",
                    targetLevel: CvTargetLevel.Senior,
                    selectedEvidence: snapshot,
                }))
                const call = createJob.mock.calls[0][0]
                expect(superJson.parse(call.payload)).toEqual(expect.objectContaining({
                    cvGenerationId: "cv-1",
                    targetLevel: CvTargetLevel.Senior,
                    language: Locale.En,
                    selectedEvidence: snapshot,
                }))
                expect(call.entityManager).toBe(entityManager)
                expect(queue.add).toHaveBeenCalledWith(call.id,
                    call.payload,
                    {
                        jobId: call.id
                    })
            })

        it("does not create a tracked job when the generation row fails",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockRejectedValueOnce(new Error("db unavailable"))
                const createJob = jest.fn()
                const service = new EnqueueGenerateCvJobService(
                    asEntityManager(entityManager),
                    {
                        createJob
                    } as never,
                    superJson,
                    {
                        add: jest.fn()
                    } as never,
                )

                await expect(service.enqueue({
                    userId: "user-1",
                    mode: CvGenerationMode.Generate,
                    language: Locale.En,
                    targetLevel: CvTargetLevel.Junior,
                    selectedEvidence: [],
                })).rejects.toThrow("db unavailable")
                expect(createJob).not.toHaveBeenCalled()
            })

        it("closes both durable states when BullMQ rejects",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (_entity, value) => ({
                    ...value,
                    id: "cv-1",
                }))
                const failJob = jest.fn().mockResolvedValue(undefined)
                const createJob = jest.fn().mockImplementation(async (input) => ({
                    id: input.id,
                    payload: input.payload,
                }))
                const service = new EnqueueGenerateCvJobService(
                    asEntityManager(entityManager),
                    {
                        createJob, failJob
                    } as never,
                    superJson,
                    {
                        add: jest.fn().mockRejectedValue(new Error("redis down"))
                    } as never,
                )

                await service.enqueue({
                    userId: "user-1",
                    mode: CvGenerationMode.Generate,
                    language: Locale.En,
                    targetLevel: CvTargetLevel.Mid,
                    selectedEvidence: [],
                })
                await new Promise<void>((resolve) => setImmediate(resolve))

                expect(failJob).toHaveBeenCalledWith(expect.objectContaining({
                    error: expect.stringContaining("redis down"),
                }))
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "cv-1"
                    },
                    expect.objectContaining({
                        status: CvGenerationStatus.Failed
                    }),
                )
            })

        it("records an unknown broker failure when the rejection is not an Error",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (_entity, value) => ({
                    ...value,
                    id: "cv-1",
                }))
                const failJob = jest.fn().mockResolvedValue(undefined)
                const createJob = jest.fn().mockResolvedValue({
                    id: "job-1",
                    payload: "serialized",
                })
                const service = new EnqueueGenerateCvJobService(
                    asEntityManager(entityManager),
                    {
                        createJob,
                        failJob,
                    } as never,
                    superJson,
                    {
                        add: jest.fn().mockRejectedValue("broker unavailable"),
                    } as never,
                )

                await service.enqueue({
                    userId: "user-1",
                    mode: CvGenerationMode.Generate,
                    language: Locale.En,
                    targetLevel: CvTargetLevel.Mid,
                    selectedEvidence: [],
                })
                await new Promise<void>((resolve) => setImmediate(resolve))

                expect(failJob).toHaveBeenCalledWith(expect.objectContaining({
                    error: expect.stringContaining("unknown error"),
                }))
            })
    })
