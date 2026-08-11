import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    Global,
    Module,
} from "@nestjs/common"
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
import type {
    EntityManager,
} from "typeorm"
import SuperJSON from "superjson"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    POSTGRESQL_PRIMARY,
} from "@modules/databases/postgresql/primary/constants/connection"
import {
    ActivityEntity,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import {
    CartItemEntity,
} from "@modules/databases/postgresql/primary/entities/cart-item.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    ActivityType,
} from "@modules/databases/postgresql/primary/enums/activity-type"
import {
    JobStatus,
} from "@modules/databases/postgresql/primary/enums/job-status"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    JobActionService,
} from "@modules/bussiness/jobs/atomic/job-action.service"
import {
    EnqueueResolveGithubJobService,
} from "@modules/bussiness/jobs/enqueue/resolve-github.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import type {
    EnrollPayload,
} from "@modules/integrations/bullmq/types/payloads/enroll"
import {
    CacheModule,
} from "@modules/integrations/cache/cache.module"
import {
    RedisInstanceKey,
} from "@modules/lib/native/redis/enums/instance-key"
import {
    RedisModule,
} from "@modules/lib/native/redis/redis.module"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    SUPERJSON,
} from "@modules/lib/mixin/constants/superjson"
import {
    EventEmitterService,
} from "@modules/platform/event/event-emitter.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnrollWorker,
} from "@features/api/processors/enroll/enroll.worker"
import {
    StepMappingService,
} from "@features/api/processors/enroll/step-mapping.service"
import {
    EnrollStepService,
} from "@features/api/processors/enroll/steps/enroll-step.service"
import {
    until,
} from "@tests/helpers/flow-wait"
import {
    winstonServiceMock,
} from "@tests/helpers/create-e2e-app"

@Global()
@Module({
    providers: [
        winstonServiceMock,
        createSuperJsonServiceProvider(),
        DayjsService,
    ],
    exports: [
        WinstonService,
        SUPERJSON,
        DayjsService,
    ],
})
class PaymentEnrollmentE2eDependenciesModule {}

const superJson = new SuperJSON()
const enrollQueueData = bullData[BullQueueName.Enroll]
const sendMailQueueData = bullData[BullQueueName.SendMail]
const resolveGithubQueueData = bullData[BullQueueName.ResolveGithub]

interface PaidEnrollmentFixture {
    course: CourseEntity
    transaction: TransactionEntity
    user: UserEntity
}

/**
 * Production-queue proof for the paid-course hand-off. The queue, worker,
 * transaction boundary, projection, cache invalidation and Postgres writes are
 * real. No handler or worker is called by the test. Downstream SMTP/GitHub jobs
 * remain on their real queues; the fixture deliberately has no email/GitHub
 * identity, because those external deliveries are separate business flows.
 */
describe("a settled course payment opens exactly one enrollment",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let enrollQueue: Queue<string>
        let sendMailQueue: Queue<string>
        let resolveGithubQueue: Queue<string>
        let priorEnqueueDelay: string | undefined

        beforeAll(async () => {
            priorEnqueueDelay = process.env.BULLMQ_ENQUEUE_UX_DELAY
            process.env.BULLMQ_ENQUEUE_UX_DELAY = "0ms"

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PaymentEnrollmentE2eDependenciesModule,
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    RedisModule.register({
                        instanceKeys: [RedisInstanceKey.Cache],
                        isGlobal: true,
                    }),
                    CacheModule.register({
                        isGlobal: true,
                    }),
                    NestBullModule.forRoot({
                        connection: {
                            host: process.env.REDIS_BULLMQ_HOST,
                            port: Number(process.env.REDIS_BULLMQ_PORT),
                            password: process.env.REDIS_BULLMQ_PASSWORD,
                        },
                    }),
                    NestBullModule.registerQueue(
                        {
                            name: enrollQueueData.name,
                            prefix: enrollQueueData.prefix,
                        },
                        {
                            name: sendMailQueueData.name,
                            prefix: sendMailQueueData.prefix,
                        },
                        {
                            name: resolveGithubQueueData.name,
                            prefix: resolveGithubQueueData.prefix,
                        },
                    ),
                ],
                providers: [
                    EnrollWorker,
                    StepMappingService,
                    EnrollStepService,
                    JobActionService,
                    TransactionActionService,
                    VoucherService,
                    CourseStatsProjectionService,
                    UserService,
                    EnqueueResolveGithubJobService,
                    EnqueueSendMailJobService,
                    {
                        provide: EventEmitterService,
                        useValue: {
                            emit: async () => undefined,
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            enrollQueue = app.get<Queue<string>>(
                getQueueToken(enrollQueueData.name),
            )
            sendMailQueue = app.get<Queue<string>>(
                getQueueToken(sendMailQueueData.name),
            )
            resolveGithubQueue = app.get<Queue<string>>(
                getQueueToken(resolveGithubQueueData.name),
            )
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
            process.env.BULLMQ_ENQUEUE_UX_DELAY = priorEnqueueDelay
        })

        afterEach(async () => {
            if (!enrollQueue || !sendMailQueue || !resolveGithubQueue || !entityManager) {
                return
            }
            await until(async () => (await enrollQueue.getActiveCount()) === 0,
                {
                    timeout: 20_000,
                    describe: "the enrollment worker to release every active delivery",
                })
            await enrollQueue.obliterate({
                force: true
            })
            await sendMailQueue.obliterate({
                force: true
            })
            await resolveGithubQueue.obliterate({
                force: true
            })
            await entityManager.query(
                "TRUNCATE TABLE \"activities\", \"course_stats_projections\", \"cart_items\", \"enrollments\", \"jobs\", \"transactions\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
        })

        const seedPaidEnrollment = async (
            key: string,
        ): Promise<PaidEnrollmentFixture> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-payment-enroll-${key}`,
                    }),
            )
            const course = await entityManager.save(
                entityManager.create(CourseEntity,
                    {
                        title: `Paid course ${key}`,
                        displayId: `paid-course-${key}`,
                        description: "payment-to-enrollment operational fixture",
                        originalPrice: 500_000,
                        defaultLocale: Locale.En,
                    }),
            )
            const transaction = await entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        course,
                        referenceId: `payment-enroll-${key}`,
                        providerPaymentId: `provider-payment-enroll-${key}`,
                        amount: 500_000,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://gateway.test/paid",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.PayOS,
                        actionType: ActionType.Enroll,
                    }),
            )
            await entityManager.save(
                entityManager.create(CartItemEntity,
                    {
                        user,
                        course,
                    }),
            )
            return {
                course, transaction, user
            }
        }

        const publishPaidEnrollment = async (
            fixture: PaidEnrollmentFixture,
            deliveryId: string,
        ): Promise<JobEntity> => {
            const payload: EnrollPayload = {
                transactionId: fixture.transaction.id,
                userId: fixture.user.id,
                courseId: fixture.course.id,
            }
            const job = await entityManager.save(
                entityManager.create(JobEntity,
                    {
                        id: deliveryId,
                        userId: fixture.user.id,
                        refs: {
                        },
                        payload: superJson.stringify(payload),
                        status: JobStatus.Queued,
                        actionType: ActionType.Enroll,
                        currentStep: 0,
                        maxSteps: 1,
                    }),
            )
            await enrollQueue.add(job.id,
                job.payload,
                {
                    jobId: job.id,
                    attempts: 3,
                    backoff: {
                        type: "fixed",
                        delay: 25,
                    },
                })
            return job
        }

        const waitForCompleted = async (
            jobId: string,
        ): Promise<void> => until(async () => {
            const job = await entityManager.findOneByOrFail(JobEntity,
                {
                    id: jobId
                })
            return job.status === JobStatus.Completed
        },
        {
            timeout: 20_000,
            describe: `enrollment delivery ${jobId} to complete`,
        })

        const assertSingleGrant = async (
            fixture: PaidEnrollmentFixture,
        ): Promise<void> => {
            expect(await entityManager.count(EnrollmentEntity,
                {
                    where: {
                        user: {
                            id: fixture.user.id
                        },
                        course: {
                            id: fixture.course.id
                        },
                        isEnrolled: true,
                    },
                })).toBe(1)
            expect(await entityManager.count(ActivityEntity,
                {
                    where: {
                        user: {
                            id: fixture.user.id,
                        },
                        type: ActivityType.CourseEnrolled,
                    },
                })).toBe(1)
            expect(await entityManager.count(CartItemEntity,
                {
                    where: {
                        user: {
                            id: fixture.user.id
                        },
                        course: {
                            id: fixture.course.id
                        },
                    },
                })).toBe(0)
            expect((await entityManager.findOneByOrFail(TransactionEntity,
                {
                    id: fixture.transaction.id,
                })).status).toBe(TransactionStatus.Succeeded)
        }

        it("persists the paid entitlement after the real worker consumes the queue",
            async () => {
                const fixture = await seedPaidEnrollment("happy")
                const job = await publishPaidEnrollment(fixture,
                    "10000000-0000-4000-8000-000000000001")

                await waitForCompleted(job.id)

                await assertSingleGrant(fixture)
            })

        it("keeps the grant exact-once when the payment delivery is retried",
            async () => {
                const fixture = await seedPaidEnrollment("retry")
                const first = await publishPaidEnrollment(fixture,
                    "10000000-0000-4000-8000-000000000002")
                await waitForCompleted(first.id)

                const retry = await publishPaidEnrollment(fixture,
                    "10000000-0000-4000-8000-000000000003")
                await waitForCompleted(retry.id)

                await assertSingleGrant(fixture)
            })

        it("serializes concurrent payment deliveries into one business grant",
            async () => {
                const fixture = await seedPaidEnrollment("race")

                const [left,
                    right] = await Promise.all([
                    publishPaidEnrollment(fixture,
                        "10000000-0000-4000-8000-000000000004"),
                    publishPaidEnrollment(fixture,
                        "10000000-0000-4000-8000-000000000005"),
                ])
                await Promise.all([
                    waitForCompleted(left.id),
                    waitForCompleted(right.id),
                ])

                await assertSingleGrant(fixture)
            })
    })
