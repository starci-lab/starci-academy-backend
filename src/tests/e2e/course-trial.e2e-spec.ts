import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    ContentEntity,
} from "@modules/databases/postgresql/primary/entities/content.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    ModuleEntity,
} from "@modules/databases/postgresql/primary/entities/module.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    TransactionItemEntity,
} from "@modules/databases/postgresql/primary/entities/transaction-item.entity"
import {
    UserContentEntity,
} from "@modules/databases/postgresql/primary/entities/user-content.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
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
    UserService,
} from "@modules/bussiness/user/user.service"
import {
    ReactionService,
} from "@modules/bussiness/discussion/reaction.service"
import {
    ProgressProjectionService,
} from "@modules/bussiness/projections/progress/progress-projection.service"
import {
    CourseStatsProjectionService,
} from "@modules/bussiness/projections/course-stats/course-stats-projection.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
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
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    RetryService,
} from "@modules/lib/mixin/retry.service"
import {
    EnrollStepService,
} from "@features/api/processors/enroll/steps/enroll-step.service"
import {
    MarkAsReadedHandler,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.handler"
import {
    MarkAsReadedCommand,
} from "@features/api/core/graphql/mutations/contents/mark-as-readed/mark-as-readed.command"
import {
    bootFlowWorld,
} from "@tests/helpers/flow-world"
import type {
    FlowWorld,
} from "@tests/helpers/flow-world"

/**
 * A learner tries a course without paying, then buys it, and everything they did while trying is
 * still theirs.
 *
 * THE TRIAL IS A ROW, NOT A TIMER. There is no "start trial" mutation and no expiry: touching a
 * lesson creates an enrollment with `isEnrolled: false`, which anchors progress without unlocking
 * anything. The flow plan asked for start -> trial -> expiry; what the system implements is
 * touch -> trial row -> upgrade in place, so that is what is proved. The gap left visible is that
 * a trial never ends on its own.
 *
 * THE ASSERTION THAT EARNS THE FILE is the last one: the purchase must flip the SAME enrollment row
 * rather than insert a second one, because progress is keyed by `enrollment_id`. If a purchase ever
 * created a fresh enrollment, every lesson the learner read while deciding would silently detach --
 * the customer pays and their history disappears. A unique `(user, course)` constraint is what
 * prevents it, and a constraint nobody tests is a constraint one migration away from being dropped.
 *
 * Requires Docker -- the lane's globalSetup boots the real Postgres this writes to.
 */
describe("a learner tries a course, then buys it, and keeps what they did",
    () => {
        let world: FlowWorld
        let commandBus: CommandBus
        let userService: UserService
        let enrollStep: EnrollStepService

        // carried between steps: this is the flow's own state, and the reason it is one file
        let learnerId: string
        let courseId: string
        let contentId: string
        let trialEnrollmentId: string

        beforeAll(async () => {
            world = await bootFlowWorld({
                providers: [
                    MarkAsReadedHandler,
                    // REAL: the trial row and the paid gate are the subject
                    UserService,
                    EnrollStepService,
                    TransactionActionService,
                    CourseStatsProjectionService,
                    VoucherService,
                    AiEntitlementService,
                    DayjsService,
                    RetryService,
                    // the lesson's own side effects -- view counts and the progress rollup are
                    // proved by `content-progress`, and stubbing them keeps this flow about access
                    {
                        provide: ReactionService,
                        useValue: {
                            invalidateViewCount: jest.fn(),
                        },
                    },
                    {
                        provide: ProgressProjectionService,
                        useValue: {
                            recomputeForEnrollment: jest.fn(),
                            recompute: jest.fn(),
                            onContentRead: jest.fn(),
                        },
                    },
                    {
                        provide: JobActionService,
                        useValue: {
                            saveExecutionResult: jest.fn(),
                            startJob: jest.fn(),
                            increaseJob: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueResolveGithubJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: NotificationService,
                        useValue: {
                            create: jest.fn(),
                        },
                    },
                    {
                        provide: MembershipService,
                        useValue: {
                            grantMembership: jest.fn(),
                            grantFreeMonths: jest.fn(),
                        },
                    },
                ],
            })
            commandBus = world.app.get(CommandBus)
            userService = world.app.get(UserService)
            enrollStep = world.app.get(EnrollStepService)

            await world.truncate(
                "user_contents",
                "transaction_items",
                "transactions",
                "enrollments",
                "contents",
                "modules",
                "courses",
                "users",
            )

            const learner = await world.mintLearner("course-trial")
            learnerId = learner.id

            const course = await world.entityManager.save(
                world.entityManager.create(CourseEntity,
                    {
                        title: "Fullstack Mastery",
                        displayId: "course-trial-flow",
                        description: "e2e fixture course",
                        originalPrice: 999_000,
                        defaultLocale: Locale.En,
                    }),
            )
            courseId = course.id
            const courseModule = await world.entityManager.save(
                world.entityManager.create(ModuleEntity,
                    {
                        title: "Module 1",
                        displayId: "course-trial-module",
                        description: "e2e fixture module",
                        defaultLocale: Locale.En,
                        course,
                    }),
            )
            const content = await world.entityManager.save(
                world.entityManager.create(ContentEntity,
                    {
                        title: "Intro Lesson",
                        displayId: "course-trial-lesson",
                        body: "unused-db-scalar-body",
                        defaultLocale: Locale.En,
                        isPremium: false,
                        module: courseModule,
                    }),
            )
            contentId = content.id
        })

        afterAll(async () => {
            // guarded: when `beforeAll` fails there is no world, and an unguarded close buries the
            // real error under a `Cannot read properties of undefined` from the teardown
            await world?.close()
        })

        it("owns nothing before touching anything",
            async () => {
                await expect(
                    userService.checkEnrollment(learnerId,
                        courseId),
                ).resolves.toBe(false)

                const enrolments = await world.entityManager.count(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                        },
                    })
                expect(enrolments).toBe(0)
            })

        it("opens a trial enrolment the moment a lesson is touched",
            async () => {
                await commandBus.execute(
                    new MarkAsReadedCommand({
                        request: {
                            contentId,
                            readed: true,
                            silent: true,
                        },
                        user: await world.entityManager.findOneOrFail(UserEntity,
                            {
                                where: {
                                    id: learnerId,
                                },
                            }),
                    }),
                )

                const enrolment = await world.entityManager.findOneOrFail(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    })
                trialEnrollmentId = enrolment.id

                // a TRIAL row: it exists so progress has something to hang off, and that is all
                expect(enrolment.isEnrolled).toBe(false)
            })

        it("still unlocks nothing, because a trial row is not ownership",
            async () => {
                /*
                 * THE WHOLE RISK IN ONE ASSERTION. The trial row and the paid row are the same
                 * table; the only thing separating a reader from a customer is one boolean. If a
                 * gate ever checks "has an enrollment" instead of "is_enrolled = true", the course
                 * becomes free to anyone who clicks a lesson -- and nothing else in the system
                 * would look wrong.
                 */
                await expect(
                    userService.checkEnrollment(learnerId,
                        courseId),
                ).resolves.toBe(false)
            })

        it("records the reading against that trial enrolment",
            async () => {
                const progress = await world.entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: learnerId,
                            contentId,
                        },
                        relations: {
                            enrollment: true,
                        },
                    })
                expect(progress.isRead).toBe(true)
                // keyed by enrollment, which is what makes the next step matter
                expect(progress.enrollment?.id).toBe(trialEnrollmentId)
            })

        it("upgrades the SAME row when the course is bought, so the reading survives",
            async () => {
                // a settled order for this course, then the worker that opens access
                const order = await world.entityManager.save(
                    world.entityManager.create(TransactionEntity,
                        {
                            userId: learnerId,
                            amount: 10_000,
                            discountPercent: 0,
                            status: TransactionStatus.Pending,
                            actionType: ActionType.Enroll,
                            paymentType: PaymentType.Sepay,
                            pricingPhase: PricingPhase.EarlyBird,
                            checkoutUrl: "https://bank.test/course-trial",
                            referenceId: "course-trial-reference",
                        }),
                )
                await world.entityManager.save(
                    world.entityManager.create(TransactionItemEntity,
                        {
                            transaction: order,
                            course: {
                                id: courseId,
                            },
                            amount: 10_000,
                            discountPercent: 0,
                            pricingPhase: PricingPhase.EarlyBird,
                        }),
                )

                await enrollStep.process({
                    payload: {
                        userId: learnerId,
                        courseId,
                        transactionId: order.id,
                    },
                    queueName: "enroll",
                    job: {
                        id: "course-trial-enroll-job",
                    },
                    extended: undefined,
                } as never)

                // ONE enrolment, not two -- the unique (user, course) constraint upgraded in place
                const enrolments = await world.entityManager.find(EnrollmentEntity,
                    {
                        where: {
                            user: {
                                id: learnerId,
                            },
                            course: {
                                id: courseId,
                            },
                        },
                    })
                expect(enrolments).toHaveLength(1)
                expect(enrolments[0].id).toBe(trialEnrollmentId)
                expect(enrolments[0].isEnrolled).toBe(true)

                // and the lesson read during the trial is still attached to it
                const progress = await world.entityManager.findOneOrFail(UserContentEntity,
                    {
                        where: {
                            userId: learnerId,
                            contentId,
                        },
                        relations: {
                            enrollment: true,
                        },
                    })
                expect(progress.enrollment?.id).toBe(trialEnrollmentId)

                // the gate now says yes, from the same row it said no from
                await expect(
                    userService.checkEnrollment(learnerId,
                        courseId),
                ).resolves.toBe(true)
            })
    })
