import SuperJSON from "superjson"
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
    EnqueueScoreUploadedCvJobService,
} from "./enqueue-score-uploaded-cv.service"

jest.mock("@modules/bussiness/jobs/utils/enqueue-ux-delay",
    () => ({
        sleepEnqueueUxDelay: jest.fn() 
    }))

const superJson = new SuperJSON()

describe("EnqueueScoreUploadedCvJobService",
    () => {
        const delayed = jest.mocked(sleepEnqueueUxDelay)

        beforeEach(() => {
            jest.clearAllMocks()
            delayed.mockResolvedValue(undefined)
        })

        it.each(Object.values(CvTargetLevel))("persists an empty-evidence upload and exact %s scoring bar",
            async (targetLevel) => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (_entity, value) => ({
                    ...value,
                    id: "cv-upload-1",
                }))
                const createJob = jest.fn().mockImplementation(async (input) => ({
                    id: input.id,
                    payload: input.payload,
                }))
                const queue = {
                    add: jest.fn().mockResolvedValue(undefined) 
                }
                const service = new EnqueueScoreUploadedCvJobService(
                    asEntityManager(entityManager),
                    {
                        createJob, failJob: jest.fn() 
                    } as never,
                    superJson,
                    queue as never,
                )

                const result = await service.enqueue({
                    userId: "user-1",
                    cdnKey: "cv/user-1.pdf",
                    language: Locale.En,
                    targetLevel,
                })
                await Promise.resolve()

                expect(result.cvGeneration).toEqual(expect.objectContaining({
                    id: "cv-upload-1",
                    targetLevel,
                    selectedEvidence: [],
                }))
                const call = createJob.mock.calls[0][0]
                expect(superJson.parse(call.payload)).toEqual(expect.objectContaining({
                    cvGenerationId: "cv-upload-1",
                    targetLevel,
                    language: Locale.En,
                }))
                expect(call.entityManager).toBe(entityManager)
                expect(queue.add).toHaveBeenCalled()
            })

        it("closes the job and uploaded run when BullMQ rejects",
            async () => {
                const entityManager = makeEntityManagerMock()
                entityManager.save.mockImplementation(async (_entity, value) => ({
                    ...value,
                    id: "cv-upload-1",
                }))
                const failJob = jest.fn().mockResolvedValue(undefined)
                const createJob = jest.fn().mockImplementation(async (input) => ({
                    id: input.id,
                    payload: input.payload,
                }))
                const service = new EnqueueScoreUploadedCvJobService(
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
                    cdnKey: "cv/user-1.pdf",
                    language: Locale.En,
                    targetLevel: CvTargetLevel.Mid,
                })
                await new Promise<void>((resolve) => setImmediate(resolve))

                expect(failJob).toHaveBeenCalled()
                expect(entityManager.update).toHaveBeenCalledWith(
                    expect.anything(),
                    {
                        id: "cv-upload-1" 
                    },
                    expect.objectContaining({
                        status: CvGenerationStatus.Failed 
                    }),
                )
            })
    })
