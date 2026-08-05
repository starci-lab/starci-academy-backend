import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    CommandBus,
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getQueueToken,
} from "@nestjs/bullmq"
import type {
    Queue,
} from "bullmq"
import {
    bullData,
    BullQueueName,
} from "@modules/bullmq"
import {
    ActionType,
    ChallengeDifficulty,
    ChallengeEntity,
    ChallengeSubmissionEntity,
    ContentEntity,
    CourseEntity,
    EnrollmentEntity,
    JobCategory,
    JobEntity,
    JobStatus,
    Locale,
    ModuleEntity,
    PostgreSqlAdvisoryLockService,
    PrimaryPostgreSQLModule,
    SubmissionType,
    UserChallengeSubmissionEntity,
    UserEntity,
} from "@modules/databases"
import {
    ChallengePremiumLockedException,
    ChallengeSubmissionNotFoundException,
    SubmissionUrlInvalidException,
} from "@modules/exceptions"
import {
    AiEntitlementService,
    AiModelCatalogService,
    GradingLaneValidationService,
} from "@modules/ai"
import {
    createSuperJsonServiceProvider,
    DayjsService,
} from "@modules/mixin"
import {
    AiAutoQuotaConfigService,
    MountFilesystemService,
} from "@modules/filesystem"
import {
    CacheService,
} from "@modules/cache"
import {
    EventEmitterService,
} from "@modules/event"
import {
    UrlValidatorService,
} from "@modules/validators"
import {
    EnqueueProcessGitSubmissionJobService,
    EnqueueProcessGoogleDocsSubmissionJobService,
    JobActionService,
    JobStalledService,
    UserService,
} from "@modules/bussiness"
import {
    SubmitChallengeSubmissionCommand,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.command"
import {
    SubmitChallengeSubmissionHandler,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/submit-challenge-submission.handler"
import type {
    SubmitChallengeSubmissionResult,
} from "@features/api/core/graphql/mutations/challenge-submissions/submit-challenge-submission/types"
import {
    SyncSubmissionCommand,
} from "@features/api/core/graphql/mutations/challenge-submissions/sync-submission/sync-submission.command"
import {
    SyncSubmissionHandler,
} from "@features/api/core/graphql/mutations/challenge-submissions/sync-submission/sync-submission.handler"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Queue names the SUT enqueue services inject via `@InjectQueue`. */
const PROCESS_GIT_SUBMISSION_QUEUE_NAME =
    bullData[BullQueueName.ProcessGitSubmission].name
const PROCESS_GOOGLE_DOCS_SUBMISSION_QUEUE_NAME =
    bullData[BullQueueName.ProcessGoogleDocsSubmission].name

// the enqueue services fire `queue.add` after a short UX delay
// (`sleepEnqueueUxDelay`, default 100ms) on a detached promise chain -- collapse
// it to next-to-nothing so `waitForQueueAdd` below doesn't have to sleep long.
process.env.BULLMQ_ENQUEUE_UX_DELAY = "1ms"

/**
 * Poll until `predicate()` is true or `timeoutMs` elapses -- used to observe the
 * fire-and-forget `queue.add` call the enqueue services schedule via
 * `void sleepEnqueueUxDelay().then(() => queue.add(...))` rather than awaiting it.
 */
const waitFor = async (
    predicate: () => boolean,
    timeoutMs = 2_000,
): Promise<void> => {
    const start = Date.now()
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error("waitFor: condition not met within timeout")
        }
        await new Promise((resolve) => setTimeout(resolve,
            20))
    }
}

/**
 * e2e for the challenge-submissions write flows --
 * `submitChallengeSubmission` (`submit-challenge-submission.handler.ts`) and
 * `syncSubmission` (`sync-submission.handler.ts`) -- run through the real
 * {@link CommandBus} (proving CQRS discovery/wiring, not just the handler
 * class) against REAL Postgres (Testcontainers), not the mocked-`EntityManager`
 * unit level already covered by each handler's own `.handler.spec.ts`.
 *
 * MOCKED (no external infra available in this harness, and the true system
 * boundary the enqueue path stops at):
 *  - the BullMQ `Queue` clients (`@InjectQueue` tokens for the
 *    process-git-submission / process-google-docs-submission queues) -- no
 *    Redis in this harness; `JobActionService.createJob` still writes the real
 *    tracked `jobs` row, only the broker hand-off (`queue.add`) is stubbed.
 *    Grading itself (the worker pipeline behind that queue, which calls the
 *    LLM) is proven by the harness tier (`.claude/canon/be/enforce/authoring/testing.md`
 *    §3), never here -- an e2e only proves the job WAS queued, not what the
 *    model returns.
 *  - `CacheService` -- real class talks to Redis; stubbed to always miss
 *    (unused by the paths under test -- `UserService.resolveOrCreateTrialEnrollment`
 *    never reads it -- but the constructor still needs a provider to compile).
 *  - `EventEmitterService` -- real class fans out to NATS; stubbed (only
 *    `JobActionService.completeJob`/`failJob` call it, neither of which this
 *    spec's paths reach).
 *  - `MountFilesystemService` / `AiAutoQuotaConfigService` -- real classes read
 *    mounted config files; stubbed to a fixed free-tier base (matches the
 *    pattern `createE2eApp` and `rewards-redeem.e2e-spec.ts` already use).
 *
 * REAL: Postgres (Testcontainers), the CQRS `CommandBus` + both handlers,
 * `JobActionService`/`JobStalledService` (the tracked `jobs` row really gets
 * written), `PostgreSqlAdvisoryLockService` (the real `pg_advisory_xact_lock`
 * runs), `GradingLaneValidationService` + `AiEntitlementService` +
 * `AiModelCatalogService` (the grading-quota gate runs real SQL), `UserService`
 * (`resolveOrCreateTrialEnrollment` writes a real trial `EnrollmentEntity`),
 * and `UrlValidatorService` (pure regex, no external deps).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Challenge-submissions write flows — submit + sync (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let commandBus: CommandBus
        let processGitSubmissionQueue: jest.Mocked<Pick<Queue<string>, "add">>
        let processGoogleDocsSubmissionQueue: jest.Mocked<Pick<Queue<string>, "add">>

        /** Read-only fixtures seeded ONCE per describe block below -- see each block's `beforeAll`. */
        let course: CourseEntity
        let module_: ModuleEntity
        let content: ContentEntity
        let challenge: ChallengeEntity

        const cacheServiceMock = {
            get: jest.fn().mockResolvedValue(undefined),
            set: jest.fn().mockResolvedValue(undefined),
            del: jest.fn().mockResolvedValue(undefined),
        }

        beforeAll(async () => {
            processGitSubmissionQueue = {
                add: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<Queue<string>, "add">>
            processGoogleDocsSubmissionQueue = {
                add: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<Queue<string>, "add">>

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    // real Postgres against the Testcontainers DB -- no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // CommandBus + automatic @CommandHandler discovery -- proves the
                    // two handlers under test are actually wired, not just callable
                    CqrsModule,
                ],
                providers: [
                    // REAL -- the two handlers under test
                    SubmitChallengeSubmissionHandler,
                    SyncSubmissionHandler,
                    // REAL -- the tracked `jobs` row + advisory lock the handlers use
                    JobActionService,
                    JobStalledService,
                    PostgreSqlAdvisoryLockService,
                    // REAL -- enqueue services (write the jobs row for real; only the
                    // BullMQ queue client underneath is stubbed, see below)
                    EnqueueProcessGitSubmissionJobService,
                    EnqueueProcessGoogleDocsSubmissionJobService,
                    // REAL -- grading-quota gate + model-pick validation, real SQL
                    GradingLaneValidationService,
                    AiEntitlementService,
                    AiModelCatalogService,
                    // REAL -- resolveOrCreateTrialEnrollment runs real SQL
                    UserService,
                    // REAL -- pure regex validators, no external deps
                    UrlValidatorService,
                    DayjsService,
                    // REAL superjson instance -- the enqueue services serialize the
                    // job payload with it and this spec parses it back with the same one
                    createSuperJsonServiceProvider(),
                    // mocked config services the AiEntitlement constructor needs but
                    // this spec's paths never actually read from
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: [],
                                },
                            }),
                        },
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                creditsPer5h: 30,
                                creditsPerWeek: 100,
                            }),
                        },
                    },
                    {
                        provide: CacheService,
                        useValue: cacheServiceMock,
                    },
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    // the true system boundary: no Redis in this harness, so the
                    // BullMQ broker hand-off itself is stubbed -- everything upstream
                    // of it (the tracked `jobs` row) is real
                    {
                        provide: getQueueToken(PROCESS_GIT_SUBMISSION_QUEUE_NAME),
                        useValue: processGitSubmissionQueue,
                    },
                    {
                        provide: getQueueToken(PROCESS_GOOGLE_DOCS_SUBMISSION_QUEUE_NAME),
                        useValue: processGoogleDocsSubmissionQueue,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            commandBus = app.get(CommandBus)

            // seed the read-only course/module/content/challenge fixtures ONCE --
            // only users/submissions/jobs are reset between tests (see afterEach)
            course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "fullstack-mastery-submission-e2e",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            module_ = await entityManager.save(
                entityManager.create(ModuleEntity,
                    {
                        title: "NestJS Fundamentals",
                        displayId: "nestjs-fundamentals-e2e",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            content = await entityManager.save(
                entityManager.create(ContentEntity,
                    {
                        title: "Build a REST endpoint",
                        displayId: "build-a-rest-endpoint-e2e",
                        body: "",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: module_,
                    }),
            )
            challenge = await entityManager.save(
                entityManager.create(ChallengeEntity,
                    {
                        title: "Ship the endpoint",
                        displayId: "ship-the-endpoint-e2e",
                        description: "e2e fixture challenge",
                        difficulty: ChallengeDifficulty.Easy,
                        defaultLocale: Locale.En,
                        content,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/submission/job state; course/module/content/
            // challenge fixtures (seeded in beforeAll) are read-only across the suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"enrollments\", \"user_challenge_submissions\", \"jobs\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
            cacheServiceMock.get.mockResolvedValue(undefined)
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        /** Seed a challenge submission requirement of the given type, attached to the shared fixture challenge. */
        const seedChallengeSubmission = async (
            type: SubmissionType,
            displayIdSuffix: string,
        ): Promise<ChallengeSubmissionEntity> =>
            entityManager.save(
                entityManager.create(ChallengeSubmissionEntity,
                    {
                        type,
                        title: `Submit — ${displayIdSuffix}`,
                        orderIndex: 0,
                        challenge,
                    }),
            )

        describe("submitChallengeSubmission",
            () => {
                it("first submit (GithubUrl type) creates the UserChallengeSubmission row, resolve-creates a TRIAL enrollment, and enqueues a Queued ProcessGitSubmission job on the stubbed queue",
                    async () => {
                        const user = await seedUser("kc-submit-git-first")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "git-first",
                        )

                        const result: SubmitChallengeSubmissionResult =
                            await commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: submission.id,
                                        githubUrl: "https://github.com/starci/academy",
                                    },
                                    user,
                                }),
                            )

                        expect(result.jobId).toBeDefined()

                        const userChallengeSubmission = await entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(userChallengeSubmission.submissionUrl).toBe(
                            "https://github.com/starci/academy",
                        )
                        expect(userChallengeSubmission.enrollmentId).toBeDefined()

                        // resolveOrCreateTrialEnrollment must have written a TRIAL row
                        // (is_enrolled: false) -- submitting a challenge never itself
                        // grants a paid enrollment
                        const enrollment = await entityManager.findOneOrFail(
                            EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            },
                        )
                        expect(enrollment.isEnrolled).toBe(false)
                        expect(userChallengeSubmission.enrollmentId).toBe(enrollment.id)

                        // the tracked `jobs` row is real and Queued (the "pending
                        // grading" state) regardless of the stubbed broker
                        const job = await entityManager.findOneOrFail(
                            JobEntity,
                            {
                                where: {
                                    id: result.jobId,
                                },
                            },
                        )
                        expect(job.status).toBe(JobStatus.Queued)
                        expect(job.actionType).toBe(ActionType.ProcessGitSubmission)
                        expect(job.category).toBe(JobCategory.SubmitChallenge)
                        expect(job.userId).toBe(user.id)
                        expect(job.refs.challengeSubmissionId).toBe(submission.id)

                        // the enqueue services fire `queue.add` on a detached, delayed
                        // promise chain -- wait for it, then assert the SAME job row
                        // was actually handed to the (stubbed) BullMQ broker
                        await waitFor(() => processGitSubmissionQueue.add.mock.calls.length > 0)
                        expect(processGitSubmissionQueue.add).toHaveBeenCalledWith(
                            job.id,
                            job.payload,
                            {
                                jobId: job.id,
                            },
                        )
                        // the Google Docs queue is untouched by a GithubUrl-type submit
                        expect(processGoogleDocsSubmissionQueue.add).not.toHaveBeenCalled()
                    })

                it("GoogleDocsUrl type submission enqueues on the process-google-docs-submission queue, not the git one",
                    async () => {
                        const user = await seedUser("kc-submit-docs-first")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GoogleDocsUrl,
                            "docs-first",
                        )

                        const result: SubmitChallengeSubmissionResult =
                            await commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: submission.id,
                                        githubUrl:
                                            "https://docs.google.com/document/d/abc123/edit",
                                    },
                                    user,
                                }),
                            )

                        const job = await entityManager.findOneOrFail(
                            JobEntity,
                            {
                                where: {
                                    id: result.jobId,
                                },
                            },
                        )
                        expect(job.actionType).toBe(ActionType.ProcessGoogleDocsSubmission)

                        await waitFor(() => processGoogleDocsSubmissionQueue.add.mock.calls.length > 0)
                        expect(processGoogleDocsSubmissionQueue.add).toHaveBeenCalledWith(
                            job.id,
                            job.payload,
                            {
                                jobId: job.id,
                            },
                        )
                        expect(processGitSubmissionQueue.add).not.toHaveBeenCalled()
                    })

                it("a second submit on the SAME (user, challengeSubmission) reuses the existing row (no duplicate) and re-enqueues",
                    async () => {
                        const user = await seedUser("kc-submit-git-repeat")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "git-repeat",
                        )

                        const first: SubmitChallengeSubmissionResult =
                            await commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: submission.id,
                                        githubUrl: "https://github.com/starci/first",
                                    },
                                    user,
                                }),
                            )
                        const second: SubmitChallengeSubmissionResult =
                            await commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: submission.id,
                                        githubUrl: "https://github.com/starci/second",
                                    },
                                    user,
                                }),
                            )

                        expect(second.jobId).not.toBe(first.jobId)

                        const count = await entityManager.count(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(count).toBe(1)

                        const row = await entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        // the URL was overwritten by the second submit, not appended
                        expect(row.submissionUrl).toBe("https://github.com/starci/second")

                        // both jobs are real, independent Queued rows
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(2)
                    })

                it("first-ever submit with NO githubUrl throws SubmissionUrlInvalidException and writes no row (transaction rolls back)",
                    async () => {
                        const user = await seedUser("kc-submit-no-url")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "no-url",
                        )

                        await expect(
                            commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: submission.id,
                                    },
                                    user,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(SubmissionUrlInvalidException)

                        const count = await entityManager.count(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                },
                            },
                        )
                        expect(count).toBe(0)
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(0)
                    })

                it("a challenge inside PREMIUM content throws ChallengePremiumLockedException before any row or job is written",
                    async () => {
                        const premiumContent = await entityManager.save(
                            entityManager.create(ContentEntity,
                                {
                                    title: "Premium lesson",
                                    displayId: "premium-lesson-e2e",
                                    body: "",
                                    defaultLocale: Locale.En,
                                    isPremium: true,
                                    module: module_,
                                }),
                        )
                        const premiumChallenge = await entityManager.save(
                            entityManager.create(ChallengeEntity,
                                {
                                    title: "Premium challenge",
                                    displayId: "premium-challenge-e2e",
                                    description: "e2e fixture",
                                    difficulty: ChallengeDifficulty.Easy,
                                    defaultLocale: Locale.En,
                                    content: premiumContent,
                                }),
                        )
                        const premiumSubmission = await entityManager.save(
                            entityManager.create(ChallengeSubmissionEntity,
                                {
                                    type: SubmissionType.GithubUrl,
                                    title: "Submit — premium",
                                    orderIndex: 0,
                                    challenge: premiumChallenge,
                                }),
                        )
                        const user = await seedUser("kc-submit-premium-locked")

                        await expect(
                            commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId: premiumSubmission.id,
                                        githubUrl: "https://github.com/starci/academy",
                                    },
                                    user,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(ChallengePremiumLockedException)

                        const count = await entityManager.count(UserChallengeSubmissionEntity)
                        expect(count).toBe(0)
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(0)
                    })

                it("an unknown challengeSubmissionId throws ChallengeSubmissionNotFoundException",
                    async () => {
                        const user = await seedUser("kc-submit-missing")

                        await expect(
                            commandBus.execute(
                                new SubmitChallengeSubmissionCommand({
                                    request: {
                                        challengeSubmissionId:
                                            "11111111-1111-4111-8111-111111111111",
                                        githubUrl: "https://github.com/starci/academy",
                                    },
                                    user,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(ChallengeSubmissionNotFoundException)
                    })
            })

        describe("syncSubmission",
            () => {
                it("creates a fresh row with the given url and resolve-creates a TRIAL enrollment, WITHOUT enqueuing any grading job",
                    async () => {
                        const user = await seedUser("kc-sync-fresh")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "sync-fresh",
                        )

                        await commandBus.execute(
                            new SyncSubmissionCommand({
                                request: {
                                    id: submission.id,
                                    url: "https://github.com/starci/synced",
                                },
                                user,
                            }),
                        )

                        const row = await entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(row.submissionUrl).toBe("https://github.com/starci/synced")
                        expect(row.enrollmentId).toBeDefined()

                        const enrollment = await entityManager.findOneOrFail(
                            EnrollmentEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    course: {
                                        id: course.id,
                                    },
                                },
                            },
                        )
                        expect(enrollment.isEnrolled).toBe(false)

                        // sync never enqueues grading -- that's submitChallengeSubmission's job
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(0)
                    })

                it("a selection-only sync (no url) creates the row with an EMPTY submissionUrl, still resolving the enrollment",
                    async () => {
                        const user = await seedUser("kc-sync-selection-only")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "sync-selection-only",
                        )

                        await commandBus.execute(
                            new SyncSubmissionCommand({
                                request: {
                                    id: submission.id,
                                },
                                user,
                            }),
                        )

                        const row = await entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(row.submissionUrl).toBe("")
                        expect(row.enrollmentId).toBeDefined()
                    })

                it("a second sync on the SAME row updates the url in place — no duplicate row",
                    async () => {
                        const user = await seedUser("kc-sync-repeat")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "sync-repeat",
                        )

                        await commandBus.execute(
                            new SyncSubmissionCommand({
                                request: {
                                    id: submission.id,
                                    url: "https://github.com/starci/v1",
                                },
                                user,
                            }),
                        )
                        await commandBus.execute(
                            new SyncSubmissionCommand({
                                request: {
                                    id: submission.id,
                                    url: "https://github.com/starci/v2",
                                },
                                user,
                            }),
                        )

                        const count = await entityManager.count(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(count).toBe(1)

                        const row = await entityManager.findOneOrFail(
                            UserChallengeSubmissionEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    submission: {
                                        id: submission.id,
                                    },
                                },
                            },
                        )
                        expect(row.submissionUrl).toBe("https://github.com/starci/v2")
                    })

                it("an invalid URL for the submission's type throws SubmissionUrlInvalidException and writes nothing",
                    async () => {
                        const user = await seedUser("kc-sync-bad-url")
                        const submission = await seedChallengeSubmission(
                            SubmissionType.GithubUrl,
                            "sync-bad-url",
                        )

                        // a well-formed, `new URL()`-parsable link that is NOT a
                        // GitHub URL -- passes `UrlValidatorService.isParsable` so it
                        // reaches the type-pattern check that raises
                        // SubmissionUrlInvalidException (an unparsable string like
                        // "not-a-github-url" would trip `isParsable` first and throw
                        // the earlier InvalidUrlException instead)
                        await expect(
                            commandBus.execute(
                                new SyncSubmissionCommand({
                                    request: {
                                        id: submission.id,
                                        url: "https://gitlab.com/starci/academy",
                                    },
                                    user,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(SubmissionUrlInvalidException)

                        const count = await entityManager.count(UserChallengeSubmissionEntity)
                        expect(count).toBe(0)
                    })

                it("an unknown submission id throws ChallengeSubmissionNotFoundException",
                    async () => {
                        const user = await seedUser("kc-sync-missing")

                        await expect(
                            commandBus.execute(
                                new SyncSubmissionCommand({
                                    request: {
                                        id: "11111111-1111-4111-8111-111111111111",
                                        url: "https://github.com/starci/academy",
                                    },
                                    user,
                                }),
                            ),
                        ).rejects.toBeInstanceOf(ChallengeSubmissionNotFoundException)
                    })
            })
    })
