// Load the bussiness barrel first so its base classes are initialised before the
// worker pulls its deps -- dodges a load-order "Class extends value undefined"
// cycle (mirrors the CV handler specs).
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import type {
    Job,
} from "bullmq"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import type {
    ScoreUploadedCvPayload,
} from "@modules/integrations/bullmq/types/payloads/score-uploaded-cv"
import {
    ScoreUploadedCvService,
} from "../shared/cv-scoring/score-uploaded-cv.service"
import {
    ScoreUploadedCvWorker,
} from "./score-uploaded-cv.worker"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** SuperJSON injection token (see `@modules/mixin` superjson provider). */
const SUPERJSON = "SUPERJSON"

/** The payload the worker parses out of the BullMQ job data. */
const PAYLOAD: ScoreUploadedCvPayload = {
    jobId: "job-1",
    cvGenerationId: "cv-gen-upload-1",
    userId: "user-1",
}

/** The tracked job row the JobActionService loads by id. */
const JOB_ROW = {
    id: "job-1",
    maxSteps: 1,
    currentStep: 0,
}

/**
 * Build a minimal BullMQ job stand-in carrying only the fields the worker reads.
 *
 * @param data - The serialized payload string (`job.data`).
 * @returns a Job-typed stub with id / data / queueName populated.
 */
const fakeBullJob = (
    data: string,
): Job<string> => ({
    id: "job-1",
    data,
    queueName: "score-uploaded-cv",
}) as unknown as Job<string>

describe("ScoreUploadedCvWorker",
    () => {
        let module: TestingModule
        let worker: ScoreUploadedCvWorker
        let jobActionService: jest.Mocked<Pick<JobActionService, "getJob" | "processingJob" | "completeJob" | "failJob">>
        let scoreUploadedCvService: jest.Mocked<Pick<ScoreUploadedCvService, "scoreUploadedCv">>
        let entityManager: jest.Mocked<Pick<EntityManager, "update">>

        beforeEach(async () => {
            jobActionService = {
                getJob: jest.fn().mockResolvedValue(JOB_ROW),
                processingJob: jest.fn().mockResolvedValue(undefined),
                completeJob: jest.fn().mockResolvedValue(undefined),
                failJob: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<JobActionService, "getJob" | "processingJob" | "completeJob" | "failJob">>

            // shared upload-scoring service -- happy path resolves the written grade
            scoreUploadedCvService = {
                scoreUploadedCv: jest.fn().mockResolvedValue({
                    score: 82,
                    feedback: {
                        shortFeedback: "Strong uploaded CV.",
                    },
                }),
            } as unknown as jest.Mocked<Pick<ScoreUploadedCvService, "scoreUploadedCv">>

            entityManager = {
                update: jest.fn().mockResolvedValue({
                    affected: 1,
                }),
            } as unknown as jest.Mocked<Pick<EntityManager, "update">>

            // superjson stub -- parse returns the fixed payload regardless of input
            const superJson = {
                parse: jest.fn().mockReturnValue(PAYLOAD),
                stringify: jest.fn(),
            }

            // dayjs stub -- `now()` returns a chainable object with `diff` + `toDate`
            const nowStub = {
                diff: jest.fn().mockReturnValue(0),
                toDate: jest.fn().mockReturnValue(new Date(0)),
            }
            const dayjsService = {
                now: jest.fn().mockReturnValue(nowStub),
                from: jest.fn().mockReturnValue(nowStub),
            }

            module = await Test.createTestingModule({
                providers: [
                    ScoreUploadedCvWorker,
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
                    },
                    {
                        provide: SUPERJSON,
                        useValue: superJson,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                    {
                        provide: DayjsService,
                        useValue: dayjsService,
                    },
                    {
                        provide: ScoreUploadedCvService,
                        useValue: scoreUploadedCvService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            worker = module.get<ScoreUploadedCvWorker>(ScoreUploadedCvWorker)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("process",
            () => {
                it("claims the job, delegates scoring to the SHARED service, marks the row Done, and completes the job",
                    async () => {
                        await worker.process(fakeBullJob("serialized-payload"))

                        // claimed the tracked job (processing) before doing work
                        expect(jobActionService.processingJob).toHaveBeenCalledWith(
                            expect.objectContaining({
                                job: JOB_ROW,
                            }),
                        )
                        // delegated the whole buffer->extract->score->persist to the shared service
                        expect(scoreUploadedCvService.scoreUploadedCv).toHaveBeenCalledWith(
                            expect.objectContaining({
                                cvGenerationId: "cv-gen-upload-1",
                                userId: "user-1",
                            }),
                        )
                        // flipped the uploaded row to Done (score/feedback already written)
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-upload-1",
                            },
                            expect.objectContaining({
                                status: CvGenerationStatus.Done,
                            }),
                        )
                        // completed the tracked job; never failed it
                        expect(jobActionService.completeJob).toHaveBeenCalled()
                        expect(jobActionService.failJob).not.toHaveBeenCalled()
                    })

                it("marks the row Failed + fails the job + rethrows when scoring throws",
                    async () => {
                        scoreUploadedCvService.scoreUploadedCv.mockRejectedValueOnce(
                            new Error("model exploded"),
                        )

                        await expect(
                            worker.process(fakeBullJob("serialized-payload")),
                        ).rejects.toThrow("model exploded")

                        // the row is flipped to Failed (so the FE stops polling)
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-upload-1",
                            },
                            expect.objectContaining({
                                status: CvGenerationStatus.Failed,
                                errorMessage: "model exploded",
                            }),
                        )
                        // the tracked job is failed, and completion never happens
                        expect(jobActionService.failJob).toHaveBeenCalledWith(
                            expect.objectContaining({
                                job: JOB_ROW,
                                error: "model exploded",
                            }),
                        )
                        expect(jobActionService.completeJob).not.toHaveBeenCalled()
                    })
            })
    })
