import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    INestApplication,
} from "@nestjs/common"
import type {
    EntityManager,
} from "typeorm"
import {
    AiLabEvalCaseEntity,
    AiLabEvalCaseResultEntity,
    AiLabEvalRunEntity,
    AiLabEvalRunStatus,
    AiLabEvalSetEntity,
    AiLabMetricKind,
    CourseEntity,
    EnrollmentEntity,
    Locale,
    ModelProvider,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    AiInvokeService,
} from "@modules/ai"
import type {
    AiInvokeResult,
    ResolveGradingInvokeOptionsResult,
} from "@modules/ai"
import {
    EmbeddingModelService,
} from "@modules/langchain"
import {
    AiLabEvalMetricService,
    AiLabEvalService,
} from "@modules/bussiness"
import type {
    SeedEvalSetAndRunResult_TestOnly,
} from "./types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Resolved Auto-lane invoke options the grade step hands to the eval service. */
const AUTO_INVOKE_OPTIONS: ResolveGradingInvokeOptionsResult = {
    model: "gpt-4o",
    provider: ModelProvider.OpenAI,
}

/**
 * Focused e2e for the AI Lab eval-runner happy path.
 *
 * Exercises the runner's real logic against a real (Testcontainers) Postgres:
 * grade a submitted prompt template against an eval set via the same
 * {@link AiLabEvalService.gradeEvalSet} call the grade step makes, then reproduce
 * the complete step's verdict write-back and assert the persisted rows.
 *
 * The only thing mocked is the LLM provider call ({@link AiInvokeService.invoke})
 * — it returns deterministic text per case, so the verdict is reproducible and no
 * real model is ever hit. The BullMQ/Redis job plumbing is shared infra covered
 * elsewhere and intentionally out of scope here.
 */
describe("AI Lab eval-runner happy path (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let invoke: jest.Mock

        beforeAll(async () => {
            // deterministic LLM stand-in — programmed per test, never the network
            invoke = jest.fn()

            const moduleRef = await Test.createTestingModule({
                imports: [
                    // real Postgres against the test container; skip the global app
                    // graph (hydration/seeders/resolvers) the runner does not need
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // real grading logic
                    AiLabEvalService,
                    AiLabEvalMetricService,
                    // mocked LLM provider — exact/contains cases never read its text
                    // for scoring beyond equality, so a fixed echo is enough
                    {
                        provide: AiInvokeService,
                        useValue: {
                            invoke,
                        },
                    },
                    // embedding model is unused by exact/contains cases; provide a
                    // stub so the metric service can be constructed
                    {
                        provide: EmbeddingModelService,
                        useValue: {
                            get: () => ({
                                embedQuery: jest.fn(),
                            }),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            // named-only datasource: TypeORM's default shutdown hook finds nothing
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // wipe every table the seed touched so cases stay independent
            await entityManager.query(
                "TRUNCATE TABLE \"ai_lab_eval_case_results\", \"ai_lab_eval_runs\", "
                + "\"ai_lab_eval_cases\", \"ai_lab_eval_sets\", \"enrollments\", "
                + "\"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /**
         * Seed a user, a course, an enrollment, and a two-case eval set
         * (one exact-match case, one contains case) — the real rows the
         * eval-runner grades against.
         */
        const seedEvalSetAndRun = async (): Promise<SeedEvalSetAndRunResult_TestOnly> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: "kc-ai-lab-runner",
                    }),
            )
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "AI Lab e2e course",
                        description: "Course seeded for the AI Lab eval-runner e2e.",
                        displayId: "ai-lab-e2e",
                        originalPrice: 0,
                        defaultLocale: Locale.En,
                    }),
            )
            const enrollment = await entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course,
                        pricingPhase: PricingPhase.Regular,
                    }),
            )

            // an eval set with two ordered cases scored by pure string metrics
            const evalSet = await entityManager.save(
                entityManager.create(AiLabEvalSetEntity,
                    {
                        challenge: null,
                        milestoneTask: null,
                        slug: "ai-lab-e2e-set",
                        judgeRubric: "n/a — no judge cases in this set",
                        passThreshold: 0.5,
                    }),
            )
            const exactCase = await entityManager.save(
                entityManager.create(AiLabEvalCaseEntity,
                    {
                        evalSet,
                        orderIndex: 0,
                        input: "France",
                        expectedOutput: "Paris",
                        expectedContains: null,
                        mustCite: false,
                        metricKind: AiLabMetricKind.Exact,
                        embeddingThreshold: null,
                        weight: 1,
                    }),
            )
            const containsCase = await entityManager.save(
                entityManager.create(AiLabEvalCaseEntity,
                    {
                        evalSet,
                        orderIndex: 1,
                        input: "Japan",
                        expectedOutput: null,
                        expectedContains: [
                            "Tokyo",
                        ],
                        mustCite: false,
                        metricKind: AiLabMetricKind.Contains,
                        embeddingThreshold: null,
                        weight: 1,
                    }),
            )

            // the Pending run SubmitEvalChallengeService persists before grading
            const evalRun = await entityManager.save(
                entityManager.create(AiLabEvalRunEntity,
                    {
                        user,
                        enrollment,
                        evalSet,
                        job: null,
                        submittedSystemPrompt: null,
                        submittedUserTemplate: "Capital of {{input}}?",
                        submittedParams: {
                        },
                        model: null,
                        provider: null,
                        totalScore: 0,
                        maxScore: 0,
                        passed: false,
                        status: AiLabEvalRunStatus.Pending,
                    }),
            )

            return {
                evalSetId: evalSet.id,
                evalRunId: evalRun.id,
                exactCaseId: exactCase.id,
                containsCaseId: containsCase.id,
            }
        }

        it("grades the eval set and persists a Completed verdict with per-case rows",
            async () => {
                const {
                    evalSetId,
                    evalRunId,
                    exactCaseId,
                    containsCaseId,
                } = await seedEvalSetAndRun()

                const evalService = app.get(AiLabEvalService)

                // the "model" answers each rendered case input correctly
                const answerFor = (text: string): AiInvokeResult => ({
                    text,
                    model: "gpt-4o",
                    provider: ModelProvider.OpenAI,
                    attempts: 1,
                })
                invoke
                    // case 0 (exact): "Capital of France?" → "Paris"
                    .mockResolvedValueOnce(answerFor("Paris"))
                    // case 1 (contains): "Capital of Japan?" → text containing "Tokyo"
                    .mockResolvedValueOnce(answerFor("The capital is Tokyo."))

                // ---- grade step: the exact call ReviewAiLabEvalGradeStepService makes ----
                const grade = await evalService.gradeEvalSet({
                    evalSetId,
                    submittedSystemPrompt: null,
                    userTemplate: "Capital of {{input}}?",
                    params: {
                    },
                    invokeOptions: AUTO_INVOKE_OPTIONS,
                    locale: Locale.En,
                })

                // both cases pass at weight 1 → full weighted score, set passes
                expect(grade.maxScore).toBe(2)
                expect(grade.totalScore).toBe(2)
                expect(grade.passed).toBe(true)
                expect(grade.caseResults).toHaveLength(2)
                expect(grade.caseResults[0].passed).toBe(true)
                expect(grade.caseResults[0].metricScore).toBe(1)
                expect(grade.caseResults[1].passed).toBe(true)

                // cost accounting: exactly one model call per case, no judge calls
                expect(invoke).toHaveBeenCalledTimes(2)

                // ---- complete step: write the verdict back exactly as the worker does ----
                await entityManager.transaction(async (manager) => {
                    await manager.update(
                        AiLabEvalRunEntity,
                        {
                            id: evalRunId,
                        },
                        {
                            status: AiLabEvalRunStatus.Completed,
                            totalScore: grade.totalScore,
                            maxScore: grade.maxScore,
                            passed: grade.passed,
                            model: AUTO_INVOKE_OPTIONS.model,
                            provider: AUTO_INVOKE_OPTIONS.provider,
                        },
                    )
                    await manager.delete(
                        AiLabEvalCaseResultEntity,
                        {
                            evalRun: {
                                id: evalRunId,
                            },
                        },
                    )
                    const rows = grade.caseResults.map((caseResult) =>
                        manager.create(
                            AiLabEvalCaseResultEntity,
                            {
                                evalRun: {
                                    id: evalRunId,
                                },
                                evalCase: {
                                    id: caseResult.evalCaseId,
                                },
                                orderIndex: caseResult.orderIndex,
                                actualOutput: caseResult.actualOutput,
                                metricScore: caseResult.metricScore,
                                judgeScore: caseResult.judgeScore,
                                passed: caseResult.passed,
                                citationPresent: caseResult.citationPresent,
                                feedback: caseResult.feedback,
                            },
                        ),
                    )
                    await manager.save(
                        AiLabEvalCaseResultEntity,
                        rows,
                    )
                })

                // ---- reload from Postgres and assert the persisted verdict ----
                const persisted = await entityManager.findOne(
                    AiLabEvalRunEntity,
                    {
                        where: {
                            id: evalRunId,
                        },
                        relations: {
                            caseResults: true,
                        },
                    },
                )
                expect(persisted?.status).toBe(AiLabEvalRunStatus.Completed)
                expect(persisted?.passed).toBe(true)
                expect(persisted?.totalScore).toBe(2)
                expect(persisted?.maxScore).toBe(2)
                expect(persisted?.model).toBe("gpt-4o")

                // one persisted case-result row per eval case, scored correctly
                expect(persisted?.caseResults).toHaveLength(2)
                const byCase = new Map(
                    (persisted?.caseResults ?? []).map((row) => [
                        row.evalCaseId,
                        row,
                    ]),
                )
                expect(byCase.get(exactCaseId)?.passed).toBe(true)
                expect(byCase.get(exactCaseId)?.actualOutput).toBe("Paris")
                expect(byCase.get(containsCaseId)?.passed).toBe(true)
                expect(byCase.get(containsCaseId)?.actualOutput)
                    .toBe("The capital is Tokyo.")
            })
    })
