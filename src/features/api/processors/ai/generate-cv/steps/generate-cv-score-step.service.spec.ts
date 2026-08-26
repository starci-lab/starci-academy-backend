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
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    CvScoringService,
} from "../../shared/cv-scoring/cv-scoring.service"
import {
    GenerateCvScoreStepService,
} from "./generate-cv-score-step.service"
import {
    CvTargetLevel,
} from "@modules/databases/postgresql/primary/enums/cv-target-level"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** A composed CV as the compose step would have persisted it. */
const COMPOSED_CV = {
    fullName: "Jane Doe",
    headline: "Backend Engineer",
    summary: "Ships production systems.",
    skillGroups: [],
    experiences: [],
    education: [],
}

/** Minimal job + payload the score step reads. */
const makeContext = (payloadOverrides: Record<string, unknown> = {
}) => ({
    job: {
        id: "job-1",
    },
    queueName: "generate-cv",
    payload: {
        jobId: "job-1",
        cvGenerationId: "cv-gen-1",
        userId: "user-1",
        mode: "generate",
        targetLevel: CvTargetLevel.Mid,
        language: Locale.En,
        selectedEvidence: [],
        ...payloadOverrides,
    },
    extended: {
        cvGeneration: {
            id: "cv-gen-1",
        },
    },
}) as never

describe("GenerateCvScoreStepService",
    () => {
        let module: TestingModule
        let service: GenerateCvScoreStepService
        let entityManager: jest.Mocked<Pick<EntityManager, "update">>
        let jobActionService: jest.Mocked<
            Pick<JobActionService, "loadExecutionResult" | "saveExecutionResult" | "increaseJob" | "failJob">
        >
        let cvScoringService: jest.Mocked<Pick<CvScoringService, "score">>

        beforeEach(async () => {
            // entity manager mock -- only `update` (persist score/feedback) and
            // `transaction` (finalize step) are exercised by this step
            entityManager = {
                update: jest.fn().mockResolvedValue({
                    affected: 1,
                }),
            } as unknown as jest.Mocked<Pick<EntityManager, "update">>
            // `transaction` runs the callback inline with the same manager, no real BEGIN/COMMIT
            ;(entityManager as unknown as { transaction: jest.Mock }).transaction = jest.fn(
                (callback: (manager: EntityManager) => Promise<unknown>) =>
                    callback(entityManager as unknown as EntityManager),
            )

            jobActionService = {
                // compose result is present by default
                loadExecutionResult: jest.fn()
                    .mockResolvedValueOnce(COMPOSED_CV),
                saveExecutionResult: jest.fn(),
                increaseJob: jest.fn(),
                failJob: jest.fn(),
            } as unknown as jest.Mocked<
                Pick<JobActionService, "loadExecutionResult" | "saveExecutionResult" | "increaseJob" | "failJob">
            >

            cvScoringService = {
                score: jest.fn().mockResolvedValue({
                    score: 78,
                    feedback: {
                        shortFeedback: "Solid CV.",
                        templateLevel: "mid",
                        items: [],
                    },
                }),
            } as unknown as jest.Mocked<Pick<CvScoringService, "score">>

            module = await Test.createTestingModule({
                providers: [
                    GenerateCvScoreStepService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                    {
                        provide: CvScoringService,
                        useValue: cvScoringService,
                    },
                ],
            }).compile()

            service = module.get<GenerateCvScoreStepService>(GenerateCvScoreStepService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("process",
            () => {
                it("scores the composed CV and persists score + feedback onto the cv_generations row",
                    async () => {
                        await service.process(makeContext())

                        // the composed CV was fed to the shared scoring service as structuredData
                        expect(cvScoringService.score).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                structuredData: COMPOSED_CV,
                                targetLevel: CvTargetLevel.Mid,
                                language: Locale.En,
                            }),
                        )
                        // the returned score/feedback were written onto the row by id
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-1",
                            },
                            expect.objectContaining({
                                score: 78,
                                feedback: expect.objectContaining({
                                    shortFeedback: "Solid CV.",
                                }),
                            }),
                        )
                        // step execution result persisted + job advanced
                        expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: "score",
                                executionResult: expect.objectContaining({
                                    score: 78,
                                }),
                            }),
                        )
                        expect(jobActionService.increaseJob).toHaveBeenCalledTimes(1)
                    })

                it("best-effort: a scoring failure persists a null score/feedback WITHOUT losing the rendered CV or failing the job",
                    async () => {
                        cvScoringService.score.mockRejectedValueOnce(new Error("model exploded"))

                        await service.process(makeContext())

                        // degrade to null -- the generation itself already succeeded upstream
                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-1",
                            },
                            expect.objectContaining({
                                score: null,
                                feedback: null,
                            }),
                        )
                        // the step still completes normally -- no failJob, still advances
                        expect(jobActionService.failJob).not.toHaveBeenCalled()
                        expect(jobActionService.increaseJob).toHaveBeenCalledTimes(1)
                        expect(jobActionService.saveExecutionResult).toHaveBeenCalledWith(
                            expect.objectContaining({
                                key: "score",
                                executionResult: {
                                    score: null,
                                    feedback: null,
                                },
                            }),
                        )
                    })

                it("throws + marks the job failed when the compose execution result is missing",
                    async () => {
                        jobActionService.loadExecutionResult.mockReset()
                        jobActionService.loadExecutionResult.mockResolvedValueOnce(null)

                        await expect(service.process(makeContext())).rejects.toThrow(
                            "Missing an upstream execution result for this CV generation step.",
                        )

                        expect(jobActionService.failJob).toHaveBeenCalledTimes(1)
                        expect(cvScoringService.score).not.toHaveBeenCalled()
                    })

                it("step contract: returns void from process() (result is persisted, not returned)",
                    async () => {
                        const result = await service.process(makeContext())

                        expect(result).toBeUndefined()
                    })

                it("passes the explicit target level without XP or capstone-count inference",
                    async () => {
                        await service.process(makeContext({
                            targetLevel: CvTargetLevel.Senior,
                        }))

                        expect(cvScoringService.score).toHaveBeenCalledWith(
                            expect.objectContaining({
                                targetLevel: CvTargetLevel.Senior,
                            }),
                        )
                    })

                it("continues with a null score when the scorer returns no result",
                    async () => {
                        cvScoringService.score.mockResolvedValueOnce(null as never)

                        await service.process(makeContext())

                        expect(entityManager.update).toHaveBeenCalledWith(
                            UserCvGenerationEntity,
                            {
                                id: "cv-gen-1",
                            },
                            expect.objectContaining({
                                score: null,
                                feedback: null,
                            }),
                        )
                        expect(jobActionService.increaseJob).toHaveBeenCalled()
                    })

                it("forwards an explicit AI selection to the source-agnostic scorer",
                    async () => {
                        const selection = {
                            model: "gpt-4.1-mini",
                            provider: "openai",
                        }

                        await service.process(makeContext({
                            ai: selection,
                        }))

                        expect(cvScoringService.score).toHaveBeenCalledWith(
                            expect.objectContaining({
                                selection,
                            }),
                        )
                    })
            })
    })
