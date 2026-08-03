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
    CodingDifficulty,
    CodingLanguage,
    CodingProblemEntity,
    CodingProblemSolutionEntity,
    CodingSolutionRevealEntity,
    CodingSubmissionEntity,
    CodingVerdict,
    DeviceEntity,
    JobCategory,
    JobEntity,
    JobStatus,
    PrimaryPostgreSQLModule,
    UserEntity,
} from "@modules/databases"
import {
    CodingProblemNotFoundException,
} from "@modules/exceptions"
import {
    createSuperJsonServiceProvider,
    DayjsService,
} from "@modules/mixin"
import {
    EventEmitterService,
} from "@modules/event"
import {
    CodingSubmissionService,
    DeviceService,
    EnqueueJudgeCodingSubmissionJobService,
    JobActionService,
    JobStalledService,
} from "@modules/bussiness"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Queue name `EnqueueJudgeCodingSubmissionJobService` injects via `@InjectQueue`. */
const JUDGE_CODING_SUBMISSION_QUEUE_NAME =
    bullData[BullQueueName.JudgeCodingSubmission].name

// collapse the enqueue services' UX delay (`sleepEnqueueUxDelay`, default
// 100ms) to next-to-nothing so `waitForQueueAdd` below doesn't have to sleep long
process.env.BULLMQ_ENQUEUE_UX_DELAY = "1ms"

/**
 * Poll until `predicate()` is true or `timeoutMs` elapses — used to observe the
 * fire-and-forget `queue.add` call `EnqueueJudgeCodingSubmissionJobService`
 * schedules via `void sleepEnqueueUxDelay().then(() => queue.add(...))` rather
 * than awaiting it.
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
 * e2e for the coding-practice submission flows — `CodingSubmissionService.submit`
 * (backs the `submitCodingSolution` mutation) and `.recordSolutionReveal`
 * (backs `revealCodingSolution`) — run against REAL Postgres (Testcontainers),
 * not the mocked-`EntityManager` unit level.
 *
 * This is also the regression guard for `.artifacts/states/device/findings.md`
 * #1 (the round-1 device fix): `DeviceService.recordDevice` used to query
 * `where: { userId, fingerprint }` — `userId` is a `@RelationId` VIRTUAL
 * column, not a real queryable column, so TypeORM threw
 * `EntityPropertyNotFoundError` against the real schema on every real-client
 * submit (a mocked-`EntityManager` unit test could never catch this — the mock
 * has no schema to be wrong against). The fix is `where: { user: { id: userId
 * }, fingerprint }`. Because `CodingSubmissionService.submit` already saves the
 * `Pending` submission row BEFORE calling `recordDevice`, and wraps that call
 * in try/catch, a regression would NOT surface as a thrown error here — it
 * would silently swallow the device write and leave the submission's device
 * trail empty while everything else looks fine. So the regression guard is a
 * POSITIVE assertion: a real `DeviceEntity` row must exist after submit, not
 * just "submit didn't throw".
 *
 * MOCKED (no external infra available in this harness, and the true system
 * boundary the enqueue path stops at):
 *  - the BullMQ `Queue` client for `judge-coding-submission` — no Redis in
 *    this harness; `JobActionService.createJob` still writes the real tracked
 *    `jobs` row, only the broker hand-off (`queue.add`) is stubbed. The actual
 *    judging (Judge0) and any LLM-assisted step are outside this spec's scope
 *    entirely — an e2e only proves the job WAS queued.
 *  - `EventEmitterService` — real class fans out to NATS; stubbed (only
 *    `JobActionService.completeJob`/`failJob` call it, neither of which this
 *    spec's paths reach).
 *
 * REAL: Postgres (Testcontainers), `CodingSubmissionService` (the logic under
 * test), `DeviceService` (the round-1 fix — runs the real query against the
 * real schema), `JobActionService`/`JobStalledService` (the tracked `jobs` row
 * really gets written).
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Coding-practice submission flows — submit + reveal (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let codingSubmissionService: CodingSubmissionService
        let judgeCodingSubmissionQueue: jest.Mocked<Pick<Queue<string>, "add">>

        /** Read-only fixtures seeded ONCE — only per-test user/submission/job state is reset. */
        let problem: CodingProblemEntity
        let disabledProblem: CodingProblemEntity

        beforeAll(async () => {
            judgeCodingSubmissionQueue = {
                add: jest.fn().mockResolvedValue(undefined),
            } as unknown as jest.Mocked<Pick<Queue<string>, "add">>

            const moduleRef = await Test.createTestingModule({
                imports: [
                    // real Postgres against the Testcontainers DB — no hydration/
                    // resolvers/seeders, this focused app doesn't need them
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    // REAL — the submit/reveal logic under test
                    CodingSubmissionService,
                    // REAL — the round-1 device-record fix; runs the real query
                    // against the real schema
                    DeviceService,
                    // REAL — writes the real tracked `jobs` row; only the BullMQ
                    // queue client underneath is stubbed
                    EnqueueJudgeCodingSubmissionJobService,
                    JobActionService,
                    JobStalledService,
                    DayjsService,
                    // REAL superjson instance — the enqueue service serializes the
                    // job payload with it
                    createSuperJsonServiceProvider(),
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    // the true system boundary: no Redis in this harness, so the
                    // BullMQ broker hand-off itself is stubbed
                    {
                        provide: getQueueToken(JUDGE_CODING_SUBMISSION_QUEUE_NAME),
                        useValue: judgeCodingSubmissionQueue,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            codingSubmissionService = app.get(CodingSubmissionService)

            // seed the read-only problem fixtures ONCE — only users/submissions/
            // reveals/jobs/devices are reset between tests (see afterEach)
            problem = await entityManager.save(
                entityManager.create(CodingProblemEntity,
                    {
                        slug: "two-sum",
                        difficulty: CodingDifficulty.Easy,
                        title: "Two Sum",
                        statement: "Given an array of integers, return indices of the two numbers that add up to target.",
                        enabled: true,
                    }),
            )
            await entityManager.save(
                entityManager.create(CodingProblemSolutionEntity,
                    {
                        problem,
                        language: CodingLanguage.Python,
                        code: "def two_sum(nums, target): ...",
                    }),
            )
            await entityManager.save(
                entityManager.create(CodingProblemSolutionEntity,
                    {
                        problem,
                        language: CodingLanguage.JavaScript,
                        code: "function twoSum(nums, target) { ... }",
                    }),
            )
            disabledProblem = await entityManager.save(
                entityManager.create(CodingProblemEntity,
                    {
                        slug: "retired-problem",
                        difficulty: CodingDifficulty.Medium,
                        title: "Retired problem",
                        statement: "No longer offered.",
                        enabled: false,
                    }),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // reset per-test user/submission/reveal/job/device state; the problem
            // fixtures (seeded in beforeAll) are read-only across the whole suite
            await entityManager.query(
                "TRUNCATE TABLE \"users\", \"coding_submissions\", \"coding_solution_reveals\", \"jobs\", \"devices\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /** Seed a bare user (only keycloakId is required). */
        const seedUser = async (keycloakId: string): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId,
                    }),
            )

        describe("submit",
            () => {
                it("creates a Pending CodingSubmissionEntity row and enqueues a Queued JudgeCodingSubmission job on the stubbed queue, recording the device (round-1 fix) without stranding the submission",
                    async () => {
                        const user = await seedUser("kc-coding-submit-first")

                        const result = await codingSubmissionService.submit({
                            userId: user.id,
                            slug: problem.slug,
                            language: CodingLanguage.Python,
                            sourceCode: "def two_sum(nums, target): return []",
                            ipAddress: "203.0.113.10",
                            userAgent: "Mozilla/5.0 e2e",
                            fingerprint: "fingerprint-abc",
                        })

                        expect(result.submissionId).toBeDefined()
                        expect(result.jobId).toBeDefined()

                        const submission = await entityManager.findOneOrFail(
                            CodingSubmissionEntity,
                            {
                                where: {
                                    id: result.submissionId,
                                },
                            },
                        )
                        expect(submission.verdict).toBe(CodingVerdict.Pending)
                        expect(submission.userId).toBe(user.id)
                        expect(submission.codingProblemId).toBe(problem.id)
                        expect(submission.language).toBe(CodingLanguage.Python)
                        expect(submission.deviceFingerprint).toBe("fingerprint-abc")

                        // ROUND-1 DEVICE FIX regression guard: the real (user, fingerprint)
                        // query must actually find/create a row against the real schema —
                        // a regressed `where: { userId, fingerprint }` would throw inside
                        // DeviceService, get swallowed by CodingSubmissionService's
                        // try/catch, and silently leave this row absent
                        const device = await entityManager.findOneOrFail(
                            DeviceEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    fingerprint: "fingerprint-abc",
                                },
                            },
                        )
                        expect(device.ipAddress).toBe("203.0.113.10")
                        expect(device.userAgent).toBe("Mozilla/5.0 e2e")

                        // the submission is NOT stranded: the tracked `jobs` row is
                        // real and Queued regardless of the device-record outcome
                        const job = await entityManager.findOneOrFail(
                            JobEntity,
                            {
                                where: {
                                    id: result.jobId,
                                },
                            },
                        )
                        expect(job.status).toBe(JobStatus.Queued)
                        expect(job.actionType).toBe(ActionType.JudgeCodingSubmission)
                        expect(job.category).toBe(JobCategory.JudgeCoding)
                        expect(job.userId).toBe(user.id)

                        // the enqueue service fires `queue.add` on a detached, delayed
                        // promise chain — wait for it, then assert the SAME job row
                        // was actually handed to the (stubbed) BullMQ broker
                        await waitFor(() => judgeCodingSubmissionQueue.add.mock.calls.length > 0)
                        expect(judgeCodingSubmissionQueue.add).toHaveBeenCalledWith(
                            job.id,
                            job.payload,
                            {
                                jobId: job.id,
                            },
                        )
                    })

                it("no fingerprint supplied → no device row is written, but the submission still processes normally",
                    async () => {
                        const user = await seedUser("kc-coding-submit-no-fingerprint")

                        const result = await codingSubmissionService.submit({
                            userId: user.id,
                            slug: problem.slug,
                            language: CodingLanguage.JavaScript,
                            sourceCode: "function twoSum(nums, target) { return [] }",
                        })

                        const submission = await entityManager.findOneOrFail(
                            CodingSubmissionEntity,
                            {
                                where: {
                                    id: result.submissionId,
                                },
                            },
                        )
                        expect(submission.verdict).toBe(CodingVerdict.Pending)
                        expect(submission.deviceFingerprint).toBeNull()

                        const deviceCount = await entityManager.count(DeviceEntity)
                        expect(deviceCount).toBe(0)

                        // still not stranded — the job is queued regardless
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(1)
                    })

                it("submitting twice from the SAME device (fingerprint) upserts one DeviceEntity row (bumps last-seen, no duplicate)",
                    async () => {
                        const user = await seedUser("kc-coding-submit-same-device")

                        await codingSubmissionService.submit({
                            userId: user.id,
                            slug: problem.slug,
                            language: CodingLanguage.Python,
                            sourceCode: "attempt 1",
                            fingerprint: "fingerprint-repeat",
                            ipAddress: "203.0.113.1",
                        })
                        await codingSubmissionService.submit({
                            userId: user.id,
                            slug: problem.slug,
                            language: CodingLanguage.Python,
                            sourceCode: "attempt 2",
                            fingerprint: "fingerprint-repeat",
                            ipAddress: "203.0.113.2",
                        })

                        const deviceCount = await entityManager.count(DeviceEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    fingerprint: "fingerprint-repeat",
                                },
                            })
                        expect(deviceCount).toBe(1)

                        const device = await entityManager.findOneOrFail(
                            DeviceEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    fingerprint: "fingerprint-repeat",
                                },
                            },
                        )
                        // refreshed to the SECOND submit's IP, not the first
                        expect(device.ipAddress).toBe("203.0.113.2")

                        // two independent submission rows though — history is append-only
                        const submissionCount = await entityManager.count(CodingSubmissionEntity)
                        expect(submissionCount).toBe(2)
                    })

                it("an unknown/disabled problem slug throws CodingProblemNotFoundException and writes no submission row",
                    async () => {
                        const user = await seedUser("kc-coding-submit-missing")

                        await expect(
                            codingSubmissionService.submit({
                                userId: user.id,
                                slug: "does-not-exist",
                                language: CodingLanguage.Python,
                                sourceCode: "print(1)",
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)

                        await expect(
                            codingSubmissionService.submit({
                                userId: user.id,
                                slug: disabledProblem.slug,
                                language: CodingLanguage.Python,
                                sourceCode: "print(1)",
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)

                        const count = await entityManager.count(CodingSubmissionEntity)
                        expect(count).toBe(0)
                        const jobCount = await entityManager.count(JobEntity)
                        expect(jobCount).toBe(0)
                    })
            })

        describe("recordSolutionReveal",
            () => {
                it("first reveal returns revealed:true + the reference solutions, and persists ONE forfeit-marker row",
                    async () => {
                        const user = await seedUser("kc-reveal-first")

                        const result = await codingSubmissionService.recordSolutionReveal({
                            userId: user.id,
                            slug: problem.slug,
                        })

                        expect(result.revealed).toBe(true)
                        expect(result.solutions).toHaveLength(2)
                        expect(result.solutions.map((s) => s.language).sort()).toEqual(
                            [
                                CodingLanguage.JavaScript,
                                CodingLanguage.Python,
                            ].sort(),
                        )

                        const reveal = await entityManager.findOneOrFail(
                            CodingSolutionRevealEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    problem: {
                                        id: problem.id,
                                    },
                                },
                            },
                        )
                        expect(reveal.userId).toBe(user.id)
                    })

                it("a second reveal of the SAME problem is idempotent — revealed:false, still serves the solutions, no duplicate row",
                    async () => {
                        const user = await seedUser("kc-reveal-repeat")

                        const first = await codingSubmissionService.recordSolutionReveal({
                            userId: user.id,
                            slug: problem.slug,
                        })
                        const second = await codingSubmissionService.recordSolutionReveal({
                            userId: user.id,
                            slug: problem.slug,
                        })

                        expect(first.revealed).toBe(true)
                        expect(second.revealed).toBe(false)
                        expect(second.solutions).toHaveLength(2)

                        const count = await entityManager.count(
                            CodingSolutionRevealEntity,
                            {
                                where: {
                                    user: {
                                        id: user.id,
                                    },
                                    problem: {
                                        id: problem.id,
                                    },
                                },
                            },
                        )
                        expect(count).toBe(1)
                    })

                it("the forfeit gate is per (user, problem) — a SECOND user revealing the SAME problem gets its own row",
                    async () => {
                        const userA = await seedUser("kc-reveal-user-a")
                        const userB = await seedUser("kc-reveal-user-b")

                        await codingSubmissionService.recordSolutionReveal({
                            userId: userA.id,
                            slug: problem.slug,
                        })
                        const resultB = await codingSubmissionService.recordSolutionReveal({
                            userId: userB.id,
                            slug: problem.slug,
                        })

                        expect(resultB.revealed).toBe(true)
                        const count = await entityManager.count(
                            CodingSolutionRevealEntity,
                            {
                                where: {
                                    problem: {
                                        id: problem.id,
                                    },
                                },
                            },
                        )
                        expect(count).toBe(2)
                    })

                it("an unknown/disabled problem slug throws CodingProblemNotFoundException and writes no reveal row",
                    async () => {
                        const user = await seedUser("kc-reveal-missing")

                        await expect(
                            codingSubmissionService.recordSolutionReveal({
                                userId: user.id,
                                slug: "does-not-exist",
                            }),
                        ).rejects.toBeInstanceOf(CodingProblemNotFoundException)

                        const count = await entityManager.count(CodingSolutionRevealEntity)
                        expect(count).toBe(0)
                    })
            })
    })
