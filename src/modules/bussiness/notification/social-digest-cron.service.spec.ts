import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    SocialDigestCronService,
} from "./social-digest-cron.service"
import {
    NotificationType,
} from "@modules/databases"
import {
    enqueueLearnerEmail,
} from "@modules/transactional-email"
import {
    envConfig,
} from "@modules/env"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    WinstonLog,
    WinstonService,
} from "@modules/winston"
import {
    EnqueueSendMailJobService,
} from "../jobs"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

// the cron calls the free `enqueueLearnerEmail(...)` helper directly rather than
// through DI — mock the module so each test can program success/failure per user
jest.mock("@modules/transactional-email",
    () => ({
        enqueueLearnerEmail: jest.fn(),
    }))

// `envConfig()` is read for the web base URL used in the digest email context —
// mock only the module so tests can stub the slice actually read
jest.mock("@modules/env",
    () => {
        const actual = jest.requireActual<typeof import("@modules/env")>("@modules/env")
        return {
            ...actual,
            // default to the real envConfig so a module-load-time call (e.g. the
            // cache config's top-level `envConfig().cache…`) doesn't hit an
            // undefined return; individual tests still override via mockReturnValue
            envConfig: jest.fn(actual.envConfig),
        }
    })

const mockEnqueueLearnerEmail = enqueueLearnerEmail as jest.MockedFunction<typeof enqueueLearnerEmail>
const mockEnvConfig = envConfig as jest.MockedFunction<typeof envConfig>

/**
 * A chainable stand-in for the digest aggregation query builder
 * (`createQueryBuilder(NotificationEntity, "n").innerJoin(...).select(...)…`).
 * Every select/where/group method returns the builder; `getRawMany` is the
 * terminal the test programs.
 */
interface DigestQueryBuilderMock {
    /** Chainable: records the eager join to the recipient user row. */
    innerJoin: jest.Mock
    /** Chainable: records the root select column. */
    select: jest.Mock
    /** Chainable: records an additional select column. */
    addSelect: jest.Mock
    /** Chainable: records the root WHERE (the 24h window). */
    where: jest.Mock
    /** Chainable: records an additional AND clause (opt-in / not-deleted gates). */
    andWhere: jest.Mock
    /** Chainable: records a group-by column. */
    groupBy: jest.Mock
    /** Chainable: records an additional group-by column. */
    addGroupBy: jest.Mock
    /** Terminal: resolves the grouped `(userId, type, count)` rows. */
    getRawMany: jest.Mock
}

/** Build a fresh chainable digest-aggregation query-builder mock. */
const makeDigestQueryBuilderMock = (): DigestQueryBuilderMock => {
    // declare first so each chainable method can return the same instance
    const builder = {
    } as DigestQueryBuilderMock
    builder.innerJoin = jest.fn(() => builder)
    builder.select = jest.fn(() => builder)
    builder.addSelect = jest.fn(() => builder)
    builder.where = jest.fn(() => builder)
    builder.andWhere = jest.fn(() => builder)
    builder.groupBy = jest.fn(() => builder)
    builder.addGroupBy = jest.fn(() => builder)
    // terminal resolves "no activity" until a test programs it
    builder.getRawMany = jest.fn().mockResolvedValue([])
    return builder
}

describe("SocialDigestCronService",
    () => {
        let module: TestingModule
        let service: SocialDigestCronService
        let entityManager: EntityManagerMock
        let queryBuilder: DigestQueryBuilderMock
        let enqueueSendMailJobService: {
            enqueue: jest.Mock
        }
        let winstonLogSpy: jest.Mock

        beforeEach(async () => {
            jest.clearAllMocks()

            entityManager = makeEntityManagerMock()
            queryBuilder = makeDigestQueryBuilderMock()
            entityManager.createQueryBuilder = jest.fn(() => queryBuilder)

            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            }

            mockEnvConfig.mockReturnValue({
                web: {
                    baseUrl: "https://academy.test",
                },
            } as unknown as ReturnType<typeof envConfig>)

            // happy-path default: every enqueue succeeds unless a test overrides it
            mockEnqueueLearnerEmail.mockResolvedValue(undefined)

            winstonLogSpy = jest.fn()

            module = await Test.createTestingModule({
                providers: [
                    SocialDigestCronService,
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: winstonLogSpy,
                        },
                    },
                ],
            }).compile()

            service = module.get<SocialDigestCronService>(SocialDigestCronService)
        })

        afterEach(async () => {
            await module.close()
            jest.restoreAllMocks()
        })

        describe("sendDailyDigests",
            () => {
                it("aggregates the 24h window per opted-in recipient and enqueues one digest email each",
                    async () => {
                        queryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                userId: "user-1",
                                type: NotificationType.NewFollower,
                                count: "2",
                            },
                            {
                                userId: "user-1",
                                type: NotificationType.CommentReply,
                                count: "1",
                            },
                            {
                                userId: "user-2",
                                type: NotificationType.CommunityReply,
                                count: "3",
                            },
                        ])

                        await service.sendDailyDigests()

                        expect(entityManager.createQueryBuilder).toHaveBeenCalledTimes(1)
                        // the aggregation gates on opted-in, non-deleted recipients only
                        expect(queryBuilder.andWhere).toHaveBeenCalledWith("u.email_digest_enabled = true")
                        expect(queryBuilder.andWhere).toHaveBeenCalledWith("u.is_deleted = false")

                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledTimes(2)
                        // user-1: 2 followers + 1 reply = 3 total, folded into one summary email
                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-1",
                                template: "activity-digest",
                                webBaseUrl: "https://academy.test",
                                extraContext: expect.objectContaining({
                                    total: 3,
                                    followers: 2,
                                    replies: 1,
                                }),
                            }),
                        )
                        // user-2: only a communityReply counts toward "replies" too
                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-2",
                                extraContext: expect.objectContaining({
                                    total: 3,
                                    followers: 0,
                                    replies: 3,
                                }),
                            }),
                        )
                        expect(winstonLogSpy).toHaveBeenCalledWith(
                            WinstonLog.CronTickCompleted,
                            expect.objectContaining({
                                op: "cron.social-digest.completed",
                                count: 2,
                            }),
                        )
                    })

                it("skips grouped rows whose count is zero or non-finite",
                    async () => {
                        queryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                userId: "user-1",
                                type: NotificationType.NewFollower,
                                count: "0",
                            },
                            {
                                userId: "user-2",
                                type: NotificationType.NewFollower,
                                count: "not-a-number",
                            },
                        ])

                        await service.sendDailyDigests()

                        // neither row survives the count filter → nobody gets a digest
                        expect(mockEnqueueLearnerEmail).not.toHaveBeenCalled()
                    })

                it("isolates a per-user enqueue failure so the OTHER recipients in the sweep still get their digest",
                    async () => {
                        queryBuilder.getRawMany.mockResolvedValueOnce([
                            {
                                userId: "user-fail",
                                type: NotificationType.NewFollower,
                                count: "1",
                            },
                            {
                                userId: "user-ok",
                                type: NotificationType.NewFollower,
                                count: "1",
                            },
                        ])
                        const enqueueFailure = new Error("mail queue unreachable")
                        mockEnqueueLearnerEmail.mockImplementation(async (params) => {
                            if (params.userId === "user-fail") {
                                throw enqueueFailure
                            }
                        })

                        // the sweep itself must not reject — a bad user must never abort it
                        await expect(service.sendDailyDigests()).resolves.toBeUndefined()

                        // both recipients were attempted — the loop kept going past the failure
                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledTimes(2)
                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-fail",
                            }),
                        )
                        expect(mockEnqueueLearnerEmail).toHaveBeenCalledWith(
                            expect.objectContaining({
                                userId: "user-ok",
                            }),
                        )
                        // the failure is logged per-user, not thrown
                        expect(winstonLogSpy).toHaveBeenCalledWith(
                            WinstonLog.BestEffortOperationFailed,
                            expect.objectContaining({
                                op: "cron.social-digest.enqueue-failed",
                                userId: "user-fail",
                            }),
                        )
                        expect(winstonLogSpy).toHaveBeenCalledWith(
                            WinstonLog.CronTickCompleted,
                            expect.objectContaining({
                                op: "cron.social-digest.completed",
                                count: 1,
                            }),
                        )
                    })

                it("wraps an aggregation failure in a typed SocialDigestFailedException, logs it, and swallows it",
                    async () => {
                        const aggregationFailure = new Error("relation \"notifications\" does not exist")
                        queryBuilder.getRawMany.mockRejectedValueOnce(aggregationFailure)

                        // the scheduler must never see a rejection — a bad run self-heals tomorrow
                        await expect(service.sendDailyDigests()).resolves.toBeUndefined()

                        // no per-user email work happens once the aggregation itself failed
                        expect(mockEnqueueLearnerEmail).not.toHaveBeenCalled()
                        // the raw DB error is wrapped in the typed, groupable exception before logging
                        expect(winstonLogSpy).toHaveBeenCalledWith(
                            WinstonLog.CronTickFailed,
                            expect.objectContaining({
                                op: "cron.social-digest.failed",
                            }),
                        )
                    })
            })
    })
