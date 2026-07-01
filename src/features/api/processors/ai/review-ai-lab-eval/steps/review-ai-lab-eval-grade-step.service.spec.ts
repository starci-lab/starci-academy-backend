import {
    makeEntityManagerMock,
    EntityManagerMock,
} from "@modules/tests"
import {
    AiMode,
    Locale,
} from "@modules/databases"

/**
 * Mock `@modules/ai` so the module-level `resolveGradingInvokeOptions` resolver
 * is a controllable spy (the SUT calls it directly, not through a dep). Keep the
 * real `DEFAULT_MODEL_CREDIT` so the fallback wiring stays honest. The service
 * classes from this barrel are constructor-injected as mocks below, so their
 * real impls are irrelevant here.
 */
const resolveGradingInvokeOptionsMock = jest.fn()
jest.mock(
    "@modules/ai",
    () => ({
        ...jest.requireActual("@modules/ai"),
        resolveGradingInvokeOptions: (...args: unknown[]) =>
            resolveGradingInvokeOptionsMock(...args),
    }),
)

import {
    ReviewAiLabEvalGradeStepService,
} from "./review-ai-lab-eval-grade-step.service"

/** Build the SUT with every constructor dep mocked. Returns the service + handles. */
const makeService = (entityManager: EntityManagerMock) => {
    const jobActionService = {
        increaseJob: jest.fn(),
        saveExecutionResult: jest.fn(),
        failJob: jest.fn(),
    }
    const winstonService = {
        log: jest.fn(),
    }
    const aiEntitlementService = {
        consume: jest.fn().mockResolvedValue(undefined),
    }
    const aiModelCatalogService = {
        creditForModel: jest.fn().mockResolvedValue(42),
    }
    const creditUsageService = {
        getSnapshot: jest.fn().mockResolvedValue({
            overQuota: false,
        }),
        invalidate: jest.fn().mockResolvedValue(undefined),
    }
    const aiLabEvalService = {
        gradeEvalSet: jest.fn().mockResolvedValue({
            score: 88,
            cases: [],
        }),
    }

    const service = new ReviewAiLabEvalGradeStepService(
        entityManager as never,
        jobActionService as never,
        winstonService as never,
        aiEntitlementService as never,
        aiModelCatalogService as never,
        creditUsageService as never,
        aiLabEvalService as never,
    )

    return {
        service,
        jobActionService,
        winstonService,
        aiEntitlementService,
        aiModelCatalogService,
        creditUsageService,
        aiLabEvalService,
    }
}

/** Minimal job + payload context the grade step reads. */
const makeContext = (payloadOverrides: Record<string, unknown> = {}) => ({
    job: {
        id: "job-1",
    },
    queueName: "review-ai-lab-eval",
    payload: {
        userId: "user-1",
        evalSetId: "eval-1",
        submittedSystemPrompt: "SYSTEM",
        submittedUserTemplate: "USER-{{x}}",
        params: {
            x: "1",
        },
        locale: Locale.En,
        ai: {
            mode: AiMode.Auto,
        },
        ...payloadOverrides,
    },
}) as never

describe("ReviewAiLabEvalGradeStepService",
    () => {
        let entityManager: EntityManagerMock

        beforeEach(() => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            // Auto lane resolver → no pinned model (balancer)
            resolveGradingInvokeOptionsMock.mockResolvedValue({
                model: null,
                provider: null,
            })
        })

        it("happy path (Auto): gates quota, grades the eval set, debits 0 (no pinned model), invalidates, persists verdict",
            async () => {
                const {
                    service,
                    aiLabEvalService,
                    aiEntitlementService,
                    aiModelCatalogService,
                    creditUsageService,
                    jobActionService,
                    winstonService,
                } = makeService(entityManager)

                await service.process(makeContext())

                // quota gate consulted the credit pool for Auto
                expect(creditUsageService.getSnapshot).toHaveBeenCalledWith("user-1")

                // graded the submitted template against the eval set
                expect(aiLabEvalService.gradeEvalSet).toHaveBeenCalledTimes(1)
                const gradeArg = aiLabEvalService.gradeEvalSet.mock.calls[0][0]
                expect(gradeArg).toMatchObject({
                    evalSetId: "eval-1",
                    submittedSystemPrompt: "SYSTEM",
                    userTemplate: "USER-{{x}}",
                    locale: Locale.En,
                })
                expect(gradeArg.invokeOptions).toEqual({
                    model: null,
                    provider: null,
                })

                // Auto with no pinned model → cost 0, no catalog lookup
                expect(aiEntitlementService.consume).toHaveBeenCalledWith({
                    userId: "user-1",
                    mode: AiMode.Auto,
                    cost: 0,
                })
                expect(aiModelCatalogService.creditForModel).not.toHaveBeenCalled()

                // cached Auto total invalidated after the charge
                expect(creditUsageService.invalidate).toHaveBeenCalledWith("user-1")

                // verdict persisted with resolved usage
                expect(jobActionService.increaseJob).toHaveBeenCalledTimes(1)
                const saveArg = jobActionService.saveExecutionResult.mock.calls[0][0]
                expect(saveArg.key).toBe("review-ai-lab-eval-grade")
                expect(saveArg.executionResult).toEqual({
                    grade: {
                        score: 88,
                        cases: [],
                    },
                    aiUsage: {
                        model: null,
                        provider: null,
                        mode: AiMode.Auto,
                    },
                })

                expect(winstonService.log).toHaveBeenCalledTimes(1)
                expect(jobActionService.failJob).not.toHaveBeenCalled()
            })

        it("Premium pinned model: debits the model's catalog credit (fallback DEFAULT_MODEL_CREDIT) + surfaces model/provider",
            async () => {
                resolveGradingInvokeOptionsMock.mockResolvedValue({
                    model: "gpt-x",
                    provider: "openai",
                })

                const {
                    service,
                    aiEntitlementService,
                    aiModelCatalogService,
                    jobActionService,
                } = makeService(entityManager)

                await service.process(makeContext({
                    ai: {
                        mode: AiMode.Premium,
                    },
                }))

                // pinned model → charge by catalog credit (mocked 42), with DEFAULT_MODEL_CREDIT fallback
                expect(aiModelCatalogService.creditForModel).toHaveBeenCalledWith({
                    name: "gpt-x",
                    fallback: 20,
                })
                expect(aiEntitlementService.consume).toHaveBeenCalledWith({
                    userId: "user-1",
                    mode: AiMode.Premium,
                    cost: 42,
                })

                const saveArg = jobActionService.saveExecutionResult.mock.calls[0][0]
                expect(saveArg.executionResult.aiUsage).toEqual({
                    model: "gpt-x",
                    provider: "openai",
                    mode: AiMode.Premium,
                })
            })

        it("Premium lane does NOT gate the Auto credit pool",
            async () => {
                resolveGradingInvokeOptionsMock.mockResolvedValue({
                    model: "gpt-x",
                    provider: "openai",
                })

                const { service, creditUsageService, aiLabEvalService } =
                    makeService(entityManager)

                await service.process(makeContext({
                    ai: {
                        mode: AiMode.Premium,
                    },
                }))

                expect(creditUsageService.getSnapshot).not.toHaveBeenCalled()
                expect(aiLabEvalService.gradeEvalSet).toHaveBeenCalledTimes(1)
            })

        it("Auto over-quota: throws AiQuotaExhaustedException, never grades, fails the job",
            async () => {
                const {
                    service,
                    creditUsageService,
                    aiLabEvalService,
                    jobActionService,
                } = makeService(entityManager)
                creditUsageService.getSnapshot.mockResolvedValue({
                    overQuota: true,
                })

                await expect(service.process(makeContext())).rejects.toThrow()

                // never spent tokens / debited
                expect(aiLabEvalService.gradeEvalSet).not.toHaveBeenCalled()
                // job failed with change event emitted
                expect(jobActionService.failJob).toHaveBeenCalledTimes(1)
                expect(jobActionService.failJob.mock.calls[0][0]).toMatchObject({
                    emitChangeEvent: true,
                })
            })

        it("grading failure: propagates the error and fails the job (emitChangeEvent)",
            async () => {
                const {
                    service,
                    aiLabEvalService,
                    jobActionService,
                    winstonService,
                } = makeService(entityManager)
                aiLabEvalService.gradeEvalSet.mockRejectedValue(new Error("LLM down"))

                await expect(service.process(makeContext())).rejects.toThrow("LLM down")

                expect(jobActionService.failJob).toHaveBeenCalledTimes(1)
                // never reached finalize/log on failure
                expect(jobActionService.saveExecutionResult).not.toHaveBeenCalled()
                expect(winstonService.log).not.toHaveBeenCalled()
            })

        it("defaults the lane to Auto when the submission pinned no ai mode",
            async () => {
                const { service, creditUsageService, aiEntitlementService } =
                    makeService(entityManager)

                await service.process(makeContext({
                    ai: undefined,
                }))

                // undefined ai → treated as Auto: pool gated + billed on Auto
                expect(creditUsageService.getSnapshot).toHaveBeenCalledWith("user-1")
                expect(aiEntitlementService.consume.mock.calls[0][0].mode).toBe(AiMode.Auto)
            })
    })
