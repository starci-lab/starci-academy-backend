import type {
    INestApplication,
} from "@nestjs/common"
import {
    Test,
} from "@nestjs/testing"
import {
    ScheduleModule,
    SchedulerRegistry,
} from "@nestjs/schedule"
import {
    BullModule as NestBullModule,
    getQueueToken,
} from "@nestjs/bullmq"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    Queue,
} from "bullmq"
import {
    QdrantClient,
} from "@qdrant/qdrant-js"
import type {
    EntityManager,
} from "typeorm"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    QDRANT_CLIENT,
} from "@modules/databases/qdrant/constants/client"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    NotificationEntity,
} from "@modules/databases/postgresql/primary/entities/notification.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    LeagueCohortEntity,
} from "@modules/databases/postgresql/primary/entities/league-cohort.entity"
import {
    UserLeagueEntity,
} from "@modules/databases/postgresql/primary/entities/user-league.entity"
import {
    XpHistoryEntity,
} from "@modules/databases/postgresql/primary/entities/xp-history.entity"
import {
    StreakProtectedDayEntity,
} from "@modules/databases/postgresql/primary/entities/streak-protected-day.entity"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    RagPlaygroundSessionEntity,
} from "@modules/databases/postgresql/primary/entities/rag-playground-session.entity"
import {
    NotificationType,
} from "@modules/databases/postgresql/primary/enums/notification-type"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    LeagueTier,
} from "@modules/databases/postgresql/primary/enums/league-tier"
import {
    XpSource,
} from "@modules/databases/postgresql/primary/enums/xp-source"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    LeagueResetService,
} from "@modules/bussiness/league/league-reset.service"
import {
    LeagueService,
} from "@modules/bussiness/league/league.service"
import {
    LeagueCohortPointsProjectionService,
} from "@modules/bussiness/projections/league-cohort-points/league-cohort-points-projection.service"
import {
    SocialDigestCronService,
} from "@modules/bussiness/notification/social-digest-cron.service"
import {
    StreakFreezeCronService,
} from "@modules/bussiness/streak/streak-freeze-cron.service"
import {
    UserStatsProjectionService,
} from "@modules/bussiness/projections/user-stats/user-stats-projection.service"
import {
    InstallmentPlanEnforcementCronService,
} from "@modules/bussiness/installment-plan/installment-plan-enforcement.cron"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    PublicRagPlaygroundCleanupService,
} from "@modules/integrations/rag/public-rag-playground-cleanup.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    until,
} from "@tests/helpers/flow-wait"

const sendMailQueueData = bullData[BullQueueName.SendMail]
const DAY_MS = 24 * 60 * 60 * 1000

/** Sunday 00:00 in Asia/Ho_Chi_Minh, represented as UTC. */
const currentLeagueWeekStart = (): Date => {
    const offsetMs = 7 * 60 * 60 * 1000
    const local = new Date(Date.now() + offsetMs)
    return new Date(Date.UTC(
        local.getUTCFullYear(),
        local.getUTCMonth(),
        local.getUTCDate() - local.getUTCDay(),
    ) - offsetMs)
}

/**
 * Operational E2E for scheduler ownership. Two real Nest applications register
 * the same cron callbacks against shared Postgres/Redis, just like two pods.
 * Fixtures enter through `SchedulerRegistry`; assertions read durable rows and
 * the real BullMQ queue. Qdrant is the sole external boundary in this slice.
 */
describe("scheduler ticks remain idempotent across application replicas",
    () => {
        let appA: INestApplication
        let appB: INestApplication
        let entityManager: EntityManager
        let schedulerA: SchedulerRegistry
        let schedulerB: SchedulerRegistry
        let sendMailQueue: Queue<string>
        let qdrantClient: QdrantClient

        const createSchedulerApp = async (): Promise<INestApplication> => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    ScheduleModule.forRoot(),
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue({
                        name: sendMailQueueData.name,
                        prefix: sendMailQueueData.prefix,
                    }),
                ],
                providers: [
                    LeagueResetService,
                    LeagueService,
                    LeagueCohortPointsProjectionService,
                    SocialDigestCronService,
                    StreakFreezeCronService,
                    UserStatsProjectionService,
                    InstallmentPlanEnforcementCronService,
                    InstallmentPlanService,
                    PublicRagPlaygroundCleanupService,
                    EnqueueSendMailJobService,
                    JobActionService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: async () => undefined,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: () => undefined,
                        },
                    },
                    {
                        provide: QDRANT_CLIENT,
                        useFactory: () => new QdrantClient({
                            url: process.env.QDRANT_URL,
                            apiKey: process.env.QDRANT_API_KEY,
                            checkCompatibility: false,
                        }),
                    },
                ],
            }).compile()
            const app = moduleRef.createNestApplication()
            await app.init()
            return app
        }

        const fireOnBothReplicas = async (name: string): Promise<void> => {
            await Promise.all([
                schedulerA.getCronJob(name).fireOnTick(),
                schedulerB.getCronJob(name).fireOnTick(),
            ])
        }

        beforeAll(async () => {
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"
            appA = await createSchedulerApp()
            appB = await createSchedulerApp()
            entityManager = appA.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            schedulerA = appA.get(SchedulerRegistry)
            schedulerB = appB.get(SchedulerRegistry)
            sendMailQueue = appA.get<Queue<string>>(
                getQueueToken(sendMailQueueData.name),
            )
            qdrantClient = appA.get<QdrantClient>(QDRANT_CLIENT)
        })

        beforeEach(async () => {
            await sendMailQueue.drain(true)
            await entityManager.query(`
                TRUNCATE TABLE
                    "notifications", "jobs", "streak_protected_days",
                    "user_stats_projections", "xp_histories", "user_leagues",
                    "league_cohorts", "installment_plans", "enrollments",
                    "courses", "rag_playground_sessions", "users"
                RESTART IDENTITY CASCADE
            `)
        })

        afterAll(async () => {
            await appB?.close().catch(() => undefined)
            await appA?.close().catch(() => undefined)
        })

        it("settles one league week once when two replicas tick together",
            async () => {
                const user = await entityManager.save(UserEntity,
                    {
                        keycloakId: "scheduler-league-user",
                        username: "scheduler-league-user",
                    })
                const newWeekStart = currentLeagueWeekStart()
                const previousWeekStart = new Date(newWeekStart.getTime() - 7 * DAY_MS)
                const previousCohort = await entityManager.save(LeagueCohortEntity,
                    {
                        tier: LeagueTier.Bronze,
                        weekStartAt: previousWeekStart,
                        weekEndAt: newWeekStart,
                    })
                await entityManager.save(UserLeagueEntity,
                    {
                        userId: user.id,
                        user,
                        tier: LeagueTier.Bronze,
                        cohort: previousCohort,
                        joinedWeekAt: previousWeekStart,
                        lastWeekRank: null,
                    })
                const xp = await entityManager.save(XpHistoryEntity,
                    {
                        user,
                        course: null,
                        source: XpSource.Challenge,
                        amount: 20,
                        points: 20,
                        refId: "scheduler-league-xp",
                    })
                await entityManager.query(
                    "UPDATE xp_histories SET created_at = $1 WHERE id = $2",
                    [new Date(previousWeekStart.getTime() + DAY_MS),
                        xp.id],
                )

                await fireOnBothReplicas("league-weekly-reset")

                await until(async () => (await entityManager.count(LeagueCohortEntity,
                    {
                        where: {
                            weekStartAt: newWeekStart,
                        },
                    })) === 1,
                {
                    describe: "one new league cohort",
                })
                const standing = await entityManager.findOneByOrFail(UserLeagueEntity,
                    {
                        userId: user.id,
                    })
                expect(standing.tier).toBe(LeagueTier.Silver)
                expect(standing.lastWeekRank).toBe(1)

                await schedulerA.getCronJob("league-weekly-reset").fireOnTick()
                await until(async () => (await entityManager.count(LeagueCohortEntity,
                    {
                        where: {
                            weekStartAt: newWeekStart,
                        },
                    })) === 1,
                {
                    describe: "the repeated league tick to remain a no-op",
                })
            })

        it("queues one social digest and never reuses claimed notifications",
            async () => {
                const user = await entityManager.save(UserEntity,
                    {
                        keycloakId: "scheduler-digest-user",
                        email: "scheduler-digest@starci.test",
                        emailDigestEnabled: true,
                    })
                const recent = await entityManager.save(NotificationEntity,
                    {
                        user,
                        type: NotificationType.NewFollower,
                        payload: null,
                        readAt: null,
                        digestSentAt: null,
                    })
                const old = await entityManager.save(NotificationEntity,
                    {
                        user,
                        type: NotificationType.CommentReply,
                        payload: null,
                        readAt: null,
                        digestSentAt: null,
                    })
                await entityManager.query(
                    "UPDATE notifications SET created_at = now() - interval '25 hours' WHERE id = $1",
                    [old.id],
                )

                await fireOnBothReplicas("social-activity-digest")

                await until(async () => (await entityManager.count(JobEntity,
                    {
                        where: {
                            actionType: ActionType.SendMail,
                        },
                    })) === 1,
                {
                    describe: "one social digest mail job",
                })
                await until(async () => (await sendMailQueue.getWaitingCount()) === 1,
                    {
                        describe: "the social digest to reach BullMQ",
                    })
                const persistedRecent = await entityManager.findOneByOrFail(NotificationEntity,
                    {
                        id: recent.id,
                    })
                const persistedOld = await entityManager.findOneByOrFail(NotificationEntity,
                    {
                        id: old.id,
                    })
                expect(persistedRecent.digestSentAt).toBeInstanceOf(Date)
                expect(persistedOld.digestSentAt).toBeNull()

                await schedulerA.getCronJob("social-activity-digest").fireOnTick()
                await until(async () => (await entityManager.count(JobEntity,
                    {
                        where: {
                            actionType: ActionType.SendMail,
                        },
                    })) === 1,
                {
                    describe: "the repeated digest tick to remain a no-op",
                })
            })

        it("spends one streak freeze once across concurrent daily ticks",
            async () => {
                const user = await entityManager.save(UserEntity,
                    {
                        keycloakId: "scheduler-streak-user",
                        streakFreezes: 1,
                    })
                const xp = await entityManager.save(XpHistoryEntity,
                    {
                        user,
                        course: null,
                        source: XpSource.LessonRead,
                        amount: 3,
                        points: 3,
                        refId: "scheduler-streak-xp",
                    })
                await entityManager.query(
                    "UPDATE xp_histories SET created_at = now() - interval '2 days' WHERE id = $1",
                    [xp.id],
                )

                await fireOnBothReplicas("streak-freeze-auto-protect")

                await until(async () => (await entityManager.count(StreakProtectedDayEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    })) === 1,
                {
                    describe: "one protected streak day",
                })
                expect((await entityManager.findOneByOrFail(UserEntity,
                    {
                        id: user.id,
                    })).streakFreezes).toBe(0)

                await schedulerA.getCronJob("streak-freeze-auto-protect").fireOnTick()
                await until(async () => (await entityManager.count(StreakProtectedDayEntity,
                    {
                        where: {
                            userId: user.id,
                        },
                    })) === 1,
                {
                    describe: "the repeated streak tick to remain a no-op",
                })
            })

        it("claims each installment due stage once at its exact window",
            async () => {
                const user = await entityManager.save(UserEntity,
                    {
                        keycloakId: "scheduler-installment-user",
                        email: "scheduler-installment@starci.test",
                    })
                const now = new Date()
                const seedPlan = (daysPastDue: number) => entityManager.save(
                    InstallmentPlanEntity,
                    {
                        user,
                        originTransaction: null,
                        lockedCourseIds: [],
                        planType: InstallmentPlanType.Fixed,
                        status: InstallmentPlanStatus.Active,
                        months: 3,
                        monthlyAmountVnd: 500_000,
                        totalAmountVnd: 1_500_000,
                        markupPercent: 10,
                        installmentsPaid: 1,
                        nextDueAt: new Date(now.getTime() - daysPastDue * DAY_MS),
                        secondReminderAfterDays: 7,
                        lockoutAfterDays: 14,
                        dueRemindedAt: null,
                        secondRemindedAt: null,
                    },
                )
                const due = await seedPlan(0)
                const warning = await seedPlan(7)
                const defaulted = await seedPlan(14)
                const future = await seedPlan(-1)

                await fireOnBothReplicas("installment-plan-enforcement")

                await until(async () => (await entityManager.count(JobEntity,
                    {
                        where: {
                            actionType: ActionType.SendMail,
                        },
                    })) === 3,
                {
                    describe: "one mail job for each installment stage",
                })
                const [persistedDue,
                    persistedWarning,
                    persistedDefaulted,
                    persistedFuture] = await Promise.all([
                    entityManager.findOneByOrFail(InstallmentPlanEntity,
                        {
                            id: due.id,
                        }),
                    entityManager.findOneByOrFail(InstallmentPlanEntity,
                        {
                            id: warning.id,
                        }),
                    entityManager.findOneByOrFail(InstallmentPlanEntity,
                        {
                            id: defaulted.id,
                        }),
                    entityManager.findOneByOrFail(InstallmentPlanEntity,
                        {
                            id: future.id,
                        }),
                ])
                expect(persistedDue.dueRemindedAt).toBeInstanceOf(Date)
                expect(persistedDue.secondRemindedAt).toBeNull()
                expect(persistedWarning.dueRemindedAt).toBeNull()
                expect(persistedWarning.secondRemindedAt).toBeInstanceOf(Date)
                expect(persistedDefaulted.status).toBe(InstallmentPlanStatus.Defaulted)
                expect(persistedFuture.status).toBe(InstallmentPlanStatus.Active)
                expect(persistedFuture.dueRemindedAt).toBeNull()

                await schedulerA.getCronJob("installment-plan-enforcement").fireOnTick()
                await until(async () => (await entityManager.count(JobEntity,
                    {
                        where: {
                            actionType: ActionType.SendMail,
                        },
                    })) === 3,
                {
                    describe: "the repeated installment tick to remain a no-op",
                })
            })

        it("drops one idle RAG collection once while preserving fresh sessions",
            async () => {
                const idle = await entityManager.save(RagPlaygroundSessionEntity,
                    {
                        sessionId: "scheduler-rag-idle",
                        sourceKind: "paste",
                        sourceLabel: "idle.ts",
                        sampleId: null,
                        chunkCount: 2,
                        lastAccessedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
                    })
                const fresh = await entityManager.save(RagPlaygroundSessionEntity,
                    {
                        sessionId: "scheduler-rag-fresh",
                        sourceKind: "paste",
                        sourceLabel: "fresh.ts",
                        sampleId: null,
                        chunkCount: 2,
                        lastAccessedAt: new Date(),
                    })
                await qdrantClient.createCollection(
                    "playground-scheduler-rag-idle",
                    {
                        vectors: {
                            size: 2,
                            distance: "Cosine",
                        },
                    },
                )

                await fireOnBothReplicas("rag-playground-cleanup")

                await until(async () => (await entityManager.count(RagPlaygroundSessionEntity,
                    {
                        where: {
                            id: idle.id,
                        },
                    })) === 0,
                {
                    describe: "the idle RAG session row to be claimed",
                })
                expect(await entityManager.exists(RagPlaygroundSessionEntity,
                    {
                        where: {
                            id: fresh.id,
                        },
                    })).toBe(true)
                expect((await qdrantClient.getCollections()).collections)
                    .not.toEqual(expect.arrayContaining([
                        expect.objectContaining({
                            name: "playground-scheduler-rag-idle",
                        }),
                    ]))

                await schedulerA.getCronJob("rag-playground-cleanup").fireOnTick()
                expect((await qdrantClient.getCollections()).collections)
                    .not.toEqual(expect.arrayContaining([
                        expect.objectContaining({
                            name: "playground-scheduler-rag-idle",
                        }),
                    ]))
            })
    })
