// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handlers pull `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle (same guard as
// review-personal-project-task.handler.spec.ts).
import "@modules/bussiness"
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
import type {
    EntityManager,
} from "typeorm"
import {
    ApolloServerModule,
    ApolloServerType,
} from "@modules/api"
import {
    CourseEntity,
    EnrollmentEntity,
    Locale,
    MilestoneEntity,
    MilestoneTaskEntity,
    PricingPhase,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    KeycloakAuthGraphQLGuard,
} from "@modules/keycloak"
import {
    GraphQLMustEnrolledGuard,
} from "@modules/bussiness"
import {
    UserService,
} from "@modules/bussiness/user"
import {
    CacheService,
} from "@modules/cache"
import {
    UrlValidatorService,
} from "@modules/validators"
import {
    EncryptionService,
} from "@modules/crypto"
import {
    EnqueueReviewPersonalProjectTaskJobService,
} from "@modules/bussiness"
import {
    GradingLaneValidationService,
} from "@modules/ai"
import {
    SubmitPersonalGithubUrlResolver,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.resolver"
import {
    SubmitPersonalGithubUrlService,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.service"
import {
    SubmitPersonalGithubUrlHandler,
} from "@features/api/core/graphql/mutations/personal-project/submit-personal-github-url/submit-personal-github-url.handler"
import {
    SyncPersonalProjectGithubResolver,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.resolver"
import {
    SyncPersonalProjectGithubService,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.service"
import {
    SyncPersonalProjectGithubHandler,
} from "@features/api/core/graphql/mutations/personal-project/sync-personal-project-github/sync-personal-project-github.handler"
import {
    ReviewPersonalProjectTaskResolver,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.resolver"
import {
    ReviewPersonalProjectTaskService,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.service"
import {
    ReviewPersonalProjectTaskHandler,
} from "@features/api/core/graphql/mutations/personal-project/review-personal-project-task/review-personal-project-task.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/**
 * e2e for the three personal-project mutations — `.claude` task brief
 * "personal-project mutations (submit / sync-personal-project-github /
 * review-personal-project-task)": none of the three had e2e coverage before
 * this file (their `.handler.spec.ts` siblings all mock the `EntityManager`).
 * Runs the real `GraphQLMustEnrolledGuard` (→ real `UserService.checkEnrollment`
 * SQL against real `enrollments` rows), the real handlers' validation branches,
 * and real Postgres writes on `EnrollmentEntity` — not a mocked DB.
 *
 * MOCKED (genuinely external to the process, or out of scope for this spec):
 *  - `EncryptionService` — real class does AES-256-GCM keyed off a mounted
 *    encryption key this harness doesn't have; stubbed to a deterministic
 *    encrypt so the stored ciphertext/last4 can still be asserted.
 *  - `GradingLaneValidationService` — real class resolves a pinned AI
 *    model/provider against the `ai_models` catalog; this spec's mutations
 *    never inspect its result besides feeding it into the enqueue payload, so
 *    it is stubbed to "no pin" (matches `review-personal-project-task.handler.spec.ts`).
 *  - `EnqueueReviewPersonalProjectTaskJobService` — the BullMQ boundary; the
 *    actual AI grading + GitHub fetch happen in a separate worker
 *    (`ReviewMilestoneTaskWorker`) that is out of scope here (per
 *    `.artifacts/states/progress` research: no queue/worker is exercised by
 *    the mutation itself). Stubbed to hand back a fixed job id.
 *  - `KeycloakAuthGraphQLGuard` — no Keycloak server in this harness;
 *    overridden to stamp `request.user` with whichever fake user the test
 *    "logs in" as (same pattern as `content-ai-entitlement.e2e-spec.ts`).
 *
 * REAL: Postgres (Testcontainers), the full GraphQL/Apollo wiring, the three
 * CQRS handlers under test, `GraphQLMustEnrolledGuard` + `UserService`
 * (`checkEnrollment` runs real SQL — `CacheService` is stubbed to always miss
 * so it never short-circuits to a stale in-memory set), and `UrlValidatorService`
 * (no external deps, safe to use as-is).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Personal-project mutations (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager

        /** The "logged in" user the overridden Keycloak guard stamps onto the request. */
        let currentUser: UserEntity | null = null

        /** Overrides the real Keycloak JWT verification — no Keycloak server here. */
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

        /** Fixture ids shared by every test (seeded once — read-only material). */
        let course: CourseEntity
        /** A second course with NO milestone tasks — for the "no tasks" branch. */
        let courseNoTasks: CourseEntity
        let task: MilestoneTaskEntity

        const enqueueReviewJobMock = {
            enqueue: jest.fn().mockResolvedValue({
                id: "job-e2e-1",
            }),
        }
        const gradingLaneValidationServiceMock = {
            validate: jest.fn().mockResolvedValue({
                gradingModel: null,
                gradingProvider: null,
            }),
        }
        const encryptionServiceMock = {
            encrypt: jest.fn(({ plainText }: { plainText: string }) => ({
                iv: "iv-mock",
                authTag: "authtag-mock",
                ciphertext: `ct-${plainText}`,
            })),
            decrypt: jest.fn(),
        }
        // CacheService always misses → UserService.checkEnrollment hits real
        // Postgres every time (no stale cross-test cache to reason about).
        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        const GRAPHQL_ENDPOINT = "/graphql"

        const SUBMIT_MUTATION = `
            mutation Submit($request: SubmitPersonalGithubUrlRequest!) {
                submitPersonalGithubUrl(request: $request) {
                    success
                    message
                    error
                    data {
                        id
                        personalProjectGithubUrl
                    }
                }
            }
        `
        const SYNC_MUTATION = `
            mutation Sync($request: SyncPersonalProjectGithubRequest!) {
                syncPersonalProjectGithub(request: $request) {
                    success
                    message
                    error
                }
            }
        `
        const REVIEW_MUTATION = `
            mutation Review($request: ReviewPersonalProjectTaskRequest!) {
                reviewPersonalProjectTask(request: $request) {
                    success
                    message
                    error
                    data {
                        jobId
                    }
                }
            }
        `

        /** POST a GraphQL mutation, optionally with an `x-course-id` header. */
        const post = (
            query: string,
            input: Record<string, unknown>,
            courseId?: string,
        ) => {
            const req = request(app.getHttpServer())
                .post(GRAPHQL_ENDPOINT)
                .send({
                    query,
                    variables: {
                        request: input,
                    },
                })
            if (courseId) {
                req.set("x-course-id",
                    courseId)
            }
            return req
        }

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    ApolloServerModule.register({
                        type: ApolloServerType.Monolithic,
                        useServices: false,
                    }),
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // CommandBus + @CommandHandler discovery for the 3 handlers
                    CqrsModule,
                ],
                providers: [
                    SubmitPersonalGithubUrlResolver,
                    SubmitPersonalGithubUrlService,
                    SubmitPersonalGithubUrlHandler,
                    SyncPersonalProjectGithubResolver,
                    SyncPersonalProjectGithubService,
                    SyncPersonalProjectGithubHandler,
                    ReviewPersonalProjectTaskResolver,
                    ReviewPersonalProjectTaskService,
                    ReviewPersonalProjectTaskHandler,
                    // REAL — the enrollment gate under test, resolved lazily by
                    // @UseGuards() from this module's own provider graph
                    GraphQLMustEnrolledGuard,
                    // REAL — checkEnrollment runs real SQL against real `enrollments`
                    UserService,
                    // REAL — no external deps, just `new URL(...)`
                    UrlValidatorService,
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EncryptionService,
                        useValue: encryptionServiceMock,
                    },
                    {
                        provide: GradingLaneValidationService,
                        useValue: gradingLaneValidationServiceMock,
                    },
                    {
                        provide: EnqueueReviewPersonalProjectTaskJobService,
                        useValue: enqueueReviewJobMock,
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

            // seed the read-only course/milestone/task fixtures ONCE — only
            // `users`/`enrollments` are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-pp-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const milestone = await entityManager.save(
                entityManager.create(MilestoneEntity,
                    {
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            task = await entityManager.save(
                entityManager.create(MilestoneTaskEntity,
                    {
                        defaultLocale: Locale.En,
                        maxScore: 100,
                        sortIndex: 0,
                        milestone,
                    }),
            )

            courseNoTasks = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Course With No Tasks",
                        displayId: "course-no-tasks-pp-e2e",
                        description: "e2e fixture course with zero milestone tasks",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/enrollment state; course/milestone/task fixtures
            // (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\" RESTART IDENTITY CASCADE",
            )
            currentUser = null
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
            cacheServiceMock.set.mockResolvedValue(undefined)
            cacheServiceMock.del.mockResolvedValue(undefined)
            gradingLaneValidationServiceMock.validate.mockResolvedValue({
                gradingModel: null,
                gradingProvider: null,
            })
            enqueueReviewJobMock.enqueue.mockResolvedValue({
                id: "job-e2e-1",
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

        /** Seed a REAL, active (`is_enrolled = true`) enrollment for (user, targetCourse). */
        const seedEnrollment = async (
            user: UserEntity,
            overrides: Partial<EnrollmentEntity> = {
            },
            targetCourse: CourseEntity = course,
        ): Promise<EnrollmentEntity> =>
            entityManager.save(
                entityManager.create(EnrollmentEntity,
                    {
                        user,
                        course: targetCourse,
                        pricingPhase: PricingPhase.Regular,
                        isEnrolled: true,
                        ...overrides,
                    }),
            )

        describe("submitPersonalGithubUrl",
            () => {
                it("enrolled learner → 200 + the enrollment's github url is written for real",
                    async () => {
                        currentUser = await seedUser("kc-submit-enrolled")
                        await seedEnrollment(currentUser)

                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.submitPersonalGithubUrl
                        expect(body.success).toBe(true)
                        expect(body.data.personalProjectGithubUrl).toBe(
                            "https://github.com/starci/personal-project",
                        )

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe(
                            "https://github.com/starci/personal-project",
                        )
                    })

                it("caller with NO enrollment row → BLOCKED by GraphQLMustEnrolledGuard, nothing written",
                    async () => {
                        currentUser = await seedUser("kc-submit-no-enrollment")
                        // no enrollment row at all for `course`

                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.submitPersonalGithubUrl
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("ENROLLMENT_NOT_FOUND_EXCEPTION")
                    })

                it("missing x-course-id header → CourseIdRequiredException, guard trips before the handler",
                    async () => {
                        currentUser = await seedUser("kc-submit-no-course-header")
                        await seedEnrollment(currentUser)

                        // deliberately NOT passing the course header this time
                        const response = await post(SUBMIT_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/personal-project",
                            })

                        expect(response.status).toBe(200)
                        const body = response.body.data.submitPersonalGithubUrl
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("COURSE_ID_REQUIRED_EXCEPTION")
                    })
            })

        describe("syncPersonalProjectGithub",
            () => {
                it("enrolled learner → url + branch upserted for real onto the enrollment row",
                    async () => {
                        currentUser = await seedUser("kc-sync-url-branch")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                githubUrl: "https://github.com/starci/pp-sync",
                                branch: "feature/milestone-1",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/pp-sync")
                        expect(reloaded.personalProjectGithubBranch).toBe("feature/milestone-1")
                    })

                it("private-repo token → encrypted at rest, only last4 is ever readable back",
                    async () => {
                        currentUser = await seedUser("kc-sync-token")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                githubToken: "ghp_SUPERSECRETTOKEN1234",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        // the mocked encryption's deterministic shape — proves the real
                        // handler round-tripped through EncryptionService.encrypt and
                        // persisted its JSON-stringified payload verbatim
                        expect(reloaded.personalProjectGithubTokenEncrypted).toBe(
                            JSON.stringify({
                                iv: "iv-mock",
                                authTag: "authtag-mock",
                                ciphertext: "ct-ghp_SUPERSECRETTOKEN1234",
                            }),
                        )
                        // masked hint only — the plaintext is never stored/returned
                        expect(reloaded.personalProjectGithubTokenLast4).toBe("1234")
                    })

                it("clearGithubToken → nulls both the encrypted token and its last4 hint",
                    async () => {
                        currentUser = await seedUser("kc-sync-clear-token")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubTokenEncrypted: JSON.stringify({
                                    iv: "old",
                                    authTag: "old",
                                    ciphertext: "old",
                                }),
                                personalProjectGithubTokenLast4: "9999",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                clearGithubToken: true,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        expect(response.body.data.syncPersonalProjectGithub.success).toBe(true)

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubTokenEncrypted).toBeNull()
                        expect(reloaded.personalProjectGithubTokenLast4).toBeNull()
                    })

                it("no field at all → PersonalProjectGithubSyncInputMissingException, no write",
                    async () => {
                        currentUser = await seedUser("kc-sync-empty")
                        await seedEnrollment(currentUser)

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_SYNC_INPUT_MISSING_EXCEPTION")
                    })

                it("branch-only update with no url ever stored → PersonalProjectGithubUrlMissingException",
                    async () => {
                        currentUser = await seedUser("kc-sync-branch-only")
                        await seedEnrollment(currentUser)
                        // no personalProjectGithubUrl on the enrollment at all

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "main",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_URL_MISSING_EXCEPTION")
                    })

                it("branch with disallowed characters → PersonalProjectInvalidBranchNameException, no write",
                    async () => {
                        currentUser = await seedUser("kc-sync-bad-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/existing",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "bad branch name!",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_INVALID_BRANCH_NAME_EXCEPTION")

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        // rejected before the transaction commits — branch never written
                        expect(reloaded.personalProjectGithubBranch).toBeNull()
                    })

                it("branch longer than 255 chars → PersonalProjectBranchTooLongException",
                    async () => {
                        currentUser = await seedUser("kc-sync-long-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/existing",
                            })

                        const response = await post(SYNC_MUTATION,
                            {
                                courseId: course.id,
                                branch: "a".repeat(256),
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.syncPersonalProjectGithub
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_BRANCH_TOO_LONG_EXCEPTION")
                    })
            })

        describe("reviewPersonalProjectTask",
            () => {
                it("no taskId given → defaults to the first milestone task, enqueues with the stored url/branch",
                    async () => {
                        currentUser = await seedUser("kc-review-default-task")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                                personalProjectGithubBranch: "main",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(true)
                        expect(body.data.jobId).toBe("job-e2e-1")

                        expect(enqueueReviewJobMock.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                taskId: task.id,
                                userId: currentUser.id,
                                githubUrl: "https://github.com/starci/stored-repo",
                                branch: "main",
                            }),
                        )
                        // enrollment untouched — request supplied neither url nor branch
                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/stored-repo")
                    })

                it("request supplies its own url/branch → they win AND get persisted back onto the enrollment",
                    async () => {
                        currentUser = await seedUser("kc-review-request-overrides")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stale-repo",
                                personalProjectGithubBranch: "old-branch",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                                githubUrl: "https://github.com/starci/fresh-repo",
                                branch: "fresh-branch",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(true)

                        expect(enqueueReviewJobMock.enqueue).toHaveBeenCalledWith(
                            expect.objectContaining({
                                taskId: task.id,
                                githubUrl: "https://github.com/starci/fresh-repo",
                                branch: "fresh-branch",
                            }),
                        )

                        const reloaded = await entityManager.findOneOrFail(EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: currentUser.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            })
                        expect(reloaded.personalProjectGithubUrl).toBe("https://github.com/starci/fresh-repo")
                        expect(reloaded.personalProjectGithubBranch).toBe("fresh-branch")
                    })

                it("no url anywhere (stored or request) → PersonalProjectGithubUrlMissingException, never enqueued",
                    async () => {
                        currentUser = await seedUser("kc-review-no-url")
                        await seedEnrollment(currentUser)
                        // no personalProjectGithubUrl stored, none in the request either

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_GITHUB_URL_MISSING_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })

                it("malformed branch in the request → PersonalProjectInvalidBranchNameException, never enqueued",
                    async () => {
                        currentUser = await seedUser("kc-review-bad-branch")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                            })

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: course.id,
                                taskId: task.id,
                                branch: "not a valid branch!",
                            },
                            course.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("PERSONAL_PROJECT_INVALID_BRANCH_NAME_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })

                it("course has zero milestone tasks and no taskId given → NoPersonalProjectTasksFoundException",
                    async () => {
                        currentUser = await seedUser("kc-review-no-tasks")
                        await seedEnrollment(currentUser,
                            {
                                personalProjectGithubUrl: "https://github.com/starci/stored-repo",
                            },
                            courseNoTasks)

                        const response = await post(REVIEW_MUTATION,
                            {
                                courseId: courseNoTasks.id,
                            },
                            courseNoTasks.id)

                        expect(response.status).toBe(200)
                        const body = response.body.data.reviewPersonalProjectTask
                        expect(body.success).toBe(false)
                        expect(body.error).toBe("NO_PERSONAL_PROJECT_TASKS_FOUND_EXCEPTION")
                        expect(enqueueReviewJobMock.enqueue).not.toHaveBeenCalled()
                    })
            })
    })
