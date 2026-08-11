import "@modules/bussiness/bussiness.module"
import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
    CanActivate,
    ExecutionContext,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    GqlExecutionContext,
} from "@nestjs/graphql"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
} from "@modules/api/apollo/server/apollo-server.module"
import {
    ApolloServerType,
} from "@modules/api/apollo/server/enums/server"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    UserCvGenerationEntity,
} from "@modules/databases/postgresql/primary/entities/user-cv-generation.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    CvGenerationMode,
} from "@modules/databases/postgresql/primary/enums/cv-generation-mode"
import {
    CvGenerationStatus,
} from "@modules/databases/postgresql/primary/enums/cv-generation-status"
import {
    CvSource,
} from "@modules/databases/postgresql/primary/enums/cv-source"
import {
    JobCategory,
} from "@modules/databases/postgresql/primary/enums/job-category"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/integrations/keycloak/guards/keycloak-auth-graphql.guard"
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
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    GradingLaneValidationService,
} from "@modules/ai/grading-lane-validation.service"
import {
    EnqueueGenerateCvJobService,
} from "@features/api/processors/ai/generate-cv/enqueue-generate-cv.service"
import {
    GenerateCvCompleteStepService,
} from "@features/api/processors/ai/generate-cv/steps/generate-cv-complete-step.service"
import {
    EnqueueScoreUploadedCvJobService,
} from "@features/api/processors/ai/score-uploaded-cv/enqueue-score-uploaded-cv.service"
import {
    UploadCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.handler"
import {
    UploadCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.resolver"
import {
    UploadCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/upload-cv/upload-cv.service"
import {
    GenerateCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.handler"
import {
    GenerateCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.resolver"
import {
    GenerateCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/generate-cv/generate-cv.service"
import {
    ReviseCvHandler,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.handler"
import {
    ReviseCvResolver,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.resolver"
import {
    ReviseCvService,
} from "@features/api/core/graphql/mutations/cv-submissions/revise-cv/revise-cv.service"
import {
    TestHelpersModule,
} from "@tests/helpers/test-helpers.module"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the CV-generation row lifecycle -- `generateCv` / `uploadCv` /
 * `reviseCv`, the "submitted" half of the CV-submission state machine
 * (`cv_blocks` "draft" documents are covered separately in
 * `cv-submission-blocks.e2e-spec.ts`).
 *
 * CV generation itself is LLM-driven and runs OUT OF PROCESS: these three
 * mutations only create the `Pending` `cv_generations` row + the tracked
 * `jobs` row and hand off to a BullMQ worker (`generate-cv.worker.ts` /
 * `score-uploaded-cv.worker.ts`) that never runs in this focused test module.
 * So this spec proves the row/state UP TO that hand-off -- the actual
 * generation (Pending -> Done, `structuredData`/`score` filled by a real model
 * call) is out of scope here and belongs to a `*.harness-spec.ts` instead
 * (`.claude/canon/be/enforce/authoring/testing.md` §3).
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, every
 * resolver/service/handler in the upload/generate/revise chain, AND -- unlike
 * a unit-level unit spec (`generate-cv.handler.spec.ts` etc., which mock the
 * enqueue services wholesale) -- the REAL `EnqueueGenerateCvJobService` /
 * `EnqueueScoreUploadedCvJobService` / `JobActionService` / `DayjsService` /
 * `SuperJSON` provider, so the `cv_generations` row AND the `jobs` row are
 * both genuinely written to Postgres, exercising the exact same DB-write path
 * production takes.
 *
 * MOCKED (genuinely external to this process):
 *  - The two BullMQ `Queue` tokens (`generate-cv` / `score-uploaded-cv`) --
 *    no Redis broker in this harness; the enqueue services already fire the
 *    `Queue.add` call fire-and-forget (`void sleep().then(...)`, never
 *    awaited) specifically so a broker miss cannot block the caller, so this
 *    spec asserts on the awaited DB writes instead of the queue call.
 *  - `EventEmitterService` -- real class fans out through a NATS producer that
 *    needs a live broker connection (matches `notifications.e2e-spec.ts` /
 *    `follows.e2e-spec.ts`'s rationale for the same class); `JobActionService`
 *    needs it to construct but `createJob` itself never calls `emit`.
 *  - `GradingLaneValidationService` -- real class validates a model/provider
 *    pick against the AI entitlement + model catalog; every test here omits
 *    the pick (the common "let the balancer choose" case), so it is stubbed
 *    to the same empty-lane shortcut the real class already takes in that
 *    case, avoiding the need to also wire `AiEntitlementService`/
 *    `AiModelCatalogService` for a path this spec never exercises.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("a learner builds a CV and the generated artifact is persisted",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        const fakeAuthGuard: CanActivate = {
            canActivate: (context: ExecutionContext): boolean => {
                if (!currentUser) {
                    return false
                }
                const gqlContext = GqlExecutionContext.create(context)
                    .getContext<{ req: { user?: UserEntity } }>()
                gqlContext.req.user = currentUser
                return true
            },
        }

        const gradingLaneValidationServiceMock = {
            validate: jest.fn().mockResolvedValue({
            }),
        }
        const eventEmitterServiceMock = {
            emit: jest.fn().mockResolvedValue(undefined),
            on: jest.fn(),
            off: jest.fn(),
        }
        // no live Redis in this harness -- both enqueue services fire-and-forget
        // `Queue.add`, so a stub is enough for the awaited DB-write path
        const generateCvQueueMock = {
            add: jest.fn().mockResolvedValue(undefined),
        }
        const scoreUploadedCvQueueMock = {
            add: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const UPLOAD_CV_MUTATION = `
            mutation UploadCv($request: UploadCvRequest!) {
                uploadCv(request: $request) {
                    success
                    message
                    error
                    data {
                        jobId
                        cvGenerationId
                    }
                }
            }
        `
        const GENERATE_CV_MUTATION = `
            mutation GenerateCv($request: GenerateCvRequest!) {
                generateCv(request: $request) {
                    success
                    message
                    error
                    data {
                        jobId
                        cvGenerationId
                    }
                }
            }
        `
        const REVISE_CV_MUTATION = `
            mutation ReviseCv($request: ReviseCvRequest!) {
                reviseCv(request: $request) {
                    success
                    message
                    error
                    data {
                        jobId
                        cvGenerationId
                    }
                }
            }
        `

        const uploadCv = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: UPLOAD_CV_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        const generateCv = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: GENERATE_CV_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        const reviseCv = (input: Record<string, unknown>) =>
            request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query: REVISE_CV_MUTATION,
                    variables: {
                        request: input,
                    },
                })

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                ],
                providers: [
                    UploadCvResolver,
                    UploadCvService,
                    UploadCvHandler,
                    GenerateCvResolver,
                    GenerateCvService,
                    GenerateCvHandler,
                    ReviseCvResolver,
                    ReviseCvService,
                    ReviseCvHandler,
                    // REAL -- proves the Pending cv_generations row + the tracked jobs
                    // row are genuinely written, not just "the mock was called"
                    EnqueueGenerateCvJobService,
                    EnqueueScoreUploadedCvJobService,
                    GenerateCvCompleteStepService,
                    JobActionService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationServiceMock,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: eventEmitterServiceMock,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                    {
                        provide: getQueueToken("generate-cv"),
                        useValue: generateCvQueueMock,
                    },
                    {
                        provide: getQueueToken(bullData[BullQueueName.ScoreUploadedCv].name),
                        useValue: scoreUploadedCvQueueMock,
                    },
                ],
            })
                .overrideGuard(KeycloakAuthGraphQLGuard)
                .useValue(fakeAuthGuard)
                .compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"cv_generations\", \"jobs\", \"users\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            gradingLaneValidationServiceMock.validate.mockResolvedValue({
            })
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        describe("uploadCv",
            () => {
                it("creates a Pending, source=uploaded cv_generations row scoped to the caller + a tracked jobs row",
                    async () => {
                        currentUser = await seedUser("kc-cv-upload-owner")
                        const cdnKey = `users/cv-submissions/${currentUser.id}/resume.pdf`

                        const response = await uploadCv({
                            cdnKey,
                            label: "My uploaded CV",
                            targetRole: "Backend Engineer",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.uploadCv
                        expect(body.success).toBe(true)
                        expect(body.data.cvGenerationId).toBeDefined()
                        expect(body.data.jobId).toBeDefined()

                        // the unified cv_generations row is REAL -- source=uploaded,
                        // status=Pending (the worker that flips it to Done never runs here)
                        const generation = await entityManager.findOneOrFail(
                            UserCvGenerationEntity,
                            {
                                where: {
                                    id: body.data.cvGenerationId,
                                },
                            },
                        )
                        expect(generation.userId).toBe(currentUser.id)
                        expect(generation.status).toBe(CvGenerationStatus.Pending)
                        expect(generation.source).toBe(CvSource.Uploaded)
                        expect(generation.mode).toBe(CvGenerationMode.Generate)
                        expect(generation.uploadedCdnKey).toBe(cdnKey)
                        expect(generation.label).toBe("My uploaded CV")
                        expect(generation.targetRole).toBe("Backend Engineer")

                        // the tracked jobs row is REAL -- proves EnqueueScoreUploadedCvJobService
                        // actually ran its DB write, not just that it was called
                        const job = await entityManager.findOneOrFail(JobEntity,
                            {
                                where: {
                                    id: body.data.jobId,
                                },
                            })
                        expect(job.userId).toBe(currentUser.id)
                        expect(job.status).toBe(JobStatus.Queued)
                        expect(job.actionType).toBe(ActionType.ProcessCvSubmission)
                        expect(job.category).toBe(JobCategory.ReviewCv)
                        // single-step: score only (not the 5-step generate pipeline)
                        expect(job.maxSteps).toBe(1)
                    })
            })

        describe("generateCv",
            () => {
                it("creates a Pending, source=generated cv_generations row scoped to the caller + a tracked jobs row (5-step pipeline)",
                    async () => {
                        currentUser = await seedUser("kc-cv-generate-owner")

                        const response = await generateCv({
                            extraPrompts: "I built project A and project B, know Golang/TypeScript",
                            label: "AI-built CV",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.generateCv
                        expect(body.success).toBe(true)
                        expect(body.data.cvGenerationId).toBeDefined()
                        expect(body.data.jobId).toBeDefined()

                        const generation = await entityManager.findOneOrFail(
                            UserCvGenerationEntity,
                            {
                                where: {
                                    id: body.data.cvGenerationId,
                                },
                            },
                        )
                        expect(generation.userId).toBe(currentUser.id)
                        expect(generation.status).toBe(CvGenerationStatus.Pending)
                        expect(generation.source).toBe(CvSource.Generated)
                        expect(generation.mode).toBe(CvGenerationMode.Generate)
                        expect(generation.sourceCvSubmissionId).toBeNull()
                        expect(generation.extraPrompts).toBe(
                            "I built project A and project B, know Golang/TypeScript",
                        )

                        const job = await entityManager.findOneOrFail(JobEntity,
                            {
                                where: {
                                    id: body.data.jobId,
                                },
                            })
                        expect(job.userId).toBe(currentUser.id)
                        expect(job.status).toBe(JobStatus.Queued)
                        expect(job.actionType).toBe(ActionType.ProcessCvSubmission)
                        // gather -> compose -> render -> score -> complete
                        expect(job.maxSteps).toBe(5)

                        const jobActionService = app.get(JobActionService)
                        const composed = {
                            fullName: "Flow Learner",
                            headline: "Backend Engineer",
                            summary: "Builds reliable distributed services.",
                            skillGroups: [
                                {
                                    category: "Backend",
                                    items: [
                                        "TypeScript",
                                        "PostgreSQL",
                                    ],
                                },
                            ],
                            experiences: [
                                {
                                    title: "Platform Engineer",
                                    org: "Flow Systems",
                                    location: "Remote",
                                    dateRange: "2024-2026",
                                    bullets: [
                                        "Built idempotent payment workers.",
                                    ],
                                },
                            ],
                            education: [],
                        }
                        await jobActionService.saveExecutionResult({
                            job,
                            key: "compose",
                            executionResult: composed,
                        })
                        await jobActionService.saveExecutionResult({
                            job,
                            key: "render",
                            executionResult: {
                                latexCdnKey: `cv-generations/${currentUser.id}/${generation.id}.tex`,
                                pdfCdnKey: `cv-generations/${currentUser.id}/${generation.id}.pdf`,
                            },
                        })
                        await app.get(GenerateCvCompleteStepService).process({
                            payload: {
                                jobId: job.id,
                                cvGenerationId: generation.id,
                                userId: currentUser.id,
                                mode: CvGenerationMode.Generate,
                            },
                            job,
                            queueName: "generate-cv",
                            extended: {
                                cvGeneration: generation,
                            },
                        })

                        const completed = await entityManager.findOneOrFail(
                            UserCvGenerationEntity,
                            {
                                where: {
                                    id: generation.id,
                                },
                            },
                        )
                        expect(completed.status).toBe(CvGenerationStatus.Done)
                        expect(completed.structuredData).toEqual(composed)
                        expect(completed.latexCdnKey).toContain(generation.id)
                        expect(completed.generatedPdfCdnKey).toContain(generation.id)
                        expect(completed.processedAt).toBeInstanceOf(Date)
                    })
            })

        describe("reviseCv",
            () => {
                /** Seed an existing (already-Done) generation row owned by `owner`. */
                const seedSourceGeneration = async (
                    owner: UserEntity,
                ): Promise<UserCvGenerationEntity> =>
                    entityManager.save(
                        entityManager.create(UserCvGenerationEntity,
                            {
                                user: {
                                    id: owner.id,
                                },
                                mode: CvGenerationMode.Generate,
                                source: CvSource.Generated,
                                status: CvGenerationStatus.Done,
                                structuredData: {
                                    summary: "Existing CV",
                                },
                            }),
                    )

                it("owner can revise: a NEW Pending row is created with mode=Revise pointing at the source",
                    async () => {
                        currentUser = await seedUser("kc-cv-revise-owner")
                        const source = await seedSourceGeneration(currentUser)

                        const response = await reviseCv({
                            cvSubmissionId: source.id,
                            extraPrompts: "Make it punchier",
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviseCv
                        expect(body.success).toBe(true)
                        expect(body.data.cvGenerationId).not.toBe(source.id)

                        const revision = await entityManager.findOneOrFail(
                            UserCvGenerationEntity,
                            {
                                where: {
                                    id: body.data.cvGenerationId,
                                },
                            },
                        )
                        expect(revision.userId).toBe(currentUser.id)
                        expect(revision.status).toBe(CvGenerationStatus.Pending)
                        expect(revision.mode).toBe(CvGenerationMode.Revise)
                        expect(revision.sourceCvSubmissionId).toBe(source.id)
                        expect(revision.extraPrompts).toBe("Make it punchier")

                        // exactly the source + the one fresh revision row exist
                        const count = await entityManager.count(UserCvGenerationEntity)
                        expect(count).toBe(2)
                    })

                it("ownership: reviewing another user's generation 404s as CV_GENERATION_NOT_FOUND_EXCEPTION — no row is created",
                    async () => {
                        const owner = await seedUser("kc-cv-revise-target-owner")
                        const source = await seedSourceGeneration(owner)
                        // a DIFFERENT user is logged in and tries to revise it
                        currentUser = await seedUser("kc-cv-revise-outsider")

                        const response = await reviseCv({
                            cvSubmissionId: source.id,
                        })

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviseCv
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CV_GENERATION_NOT_FOUND_EXCEPTION")
                        expect(body.data).toBeNull()

                        // only the seeded source row exists -- the enqueue path never ran
                        const count = await entityManager.count(UserCvGenerationEntity)
                        expect(count).toBe(1)
                        expect(generateCvQueueMock.add).not.toHaveBeenCalled()
                    })

                it("a non-existent source id 404s the same way as a foreign one (ownership is never leaked)",
                    async () => {
                        currentUser = await seedUser("kc-cv-revise-nothing-to-revise")

                        const response = await reviseCv({
                            cvSubmissionId: "11111111-1111-4111-8111-111111111111",
                        })

                        const body = response.body.data.reviseCv
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("CV_GENERATION_NOT_FOUND_EXCEPTION")

                        const count = await entityManager.count(UserCvGenerationEntity)
                        expect(count).toBe(0)
                    })
            })
    })
