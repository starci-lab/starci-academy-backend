// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the step pulls `@modules/bussiness` -- dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness/bussiness.module"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    ActivityEntity,
} from "@modules/databases/postgresql/primary/entities/activity.entity"
import {
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    CourseNotFoundException,
} from "@modules/platform/exceptions/errors/courses/course-not-found"
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
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    JobEntity,
} from "@modules/databases/postgresql/primary/entities/job.entity"
import type {
    JobExtendedContext,
} from "@modules/bussiness/jobs/types/context"
import type {
    EnrollPayload,
} from "@modules/integrations/bullmq/types/payloads/enroll"
import {
    EnrollStepService,
} from "./enroll-step.service"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

const courseId = "course-1"
const userId = "user-1"
const transactionId = "tx-1"

/**
 * Build the job context the enroll step consumes. The job stub carries only the
 * id the finalize log reads.
 *
 * @returns a minimal {@link JobExtendedContext} for the enroll step.
 */
const makeContext = (): JobExtendedContext<EnrollPayload, undefined> => ({
    payload: {
        courseId,
        userId,
        transactionId,
    },
    queueName: "enroll",
    job: {
        id: "job-1",
    } as unknown as JobEntity,
    extended: undefined,
})

/**
 * A course stub with a pricing phase that still has slots (so the phase is not
 * advanced) -- keeps the convert/create assertions focused on the enrollment row.
 *
 * @returns a CourseEntity stub.
 */
const fakeCourse = (): CourseEntity => ({
    id: courseId,
    title: "Course One",
    metadata: {
        currentPhase: PricingPhase.EarlyBird,
    },
    pricingPhases: [
        {
            phase: PricingPhase.EarlyBird,
            // generous slot count so the enrollment count never exceeds it
            slotAvailable: 1000,
        },
    ],
}) as unknown as CourseEntity

/**
 * Options for {@link programFindOne}: the rows each entity lookup should resolve.
 * The dispatcher is keyed by the entity CLASS the step passes to `findOne`, so the
 * tests stay robust against call ordering (writeActivity / mail / github each issue
 * their own lookup interleaved with the enrollment reads).
 */
interface FindOneProgram {
    /** Resolves both the pessimistic-lock read and the relations read. */
    course: CourseEntity | null
    /** The existing enrollment (trial / paid) or null for the create path. */
    enrollment: EnrollmentEntity | null
    /** The user the post-tx welcome-mail + resolve-github lookups resolve. */
    user: UserEntity | null
}

/**
 * Program the entity-manager `findOne` to dispatch by entity class instead of call
 * order. ActivityEntity lookups (from the idempotent writeActivity helper) resolve
 * null so a fresh feed row is always written without colliding with the user/course
 * lookups.
 *
 * @param entityManager - the mock to program
 * @param program - the rows to resolve per entity
 */
const programFindOne = (
    entityManager: EntityManagerMock,
    program: FindOneProgram,
): void => {
    entityManager.findOne = jest.fn(async (entity: unknown) => {
        if (entity === CourseEntity) {
            return program.course
        }
        if (entity === EnrollmentEntity) {
            return program.enrollment
        }
        if (entity === UserEntity) {
            return program.user
        }
        if (entity === ActivityEntity) {
            // no prior activity -> writeActivity proceeds to append the feed row
            return null
        }
        return null
    })
}

describe("EnrollStepService",
    () => {
        let module: TestingModule
        let service: EnrollStepService
        let entityManager: EntityManagerMock
        let transactionActionService: jest.Mocked<Pick<TransactionActionService, "updateTransactionStatusIfExpected">>
        let jobActionService: jest.Mocked<Pick<JobActionService, "increaseJob" | "saveExecutionResult">>
        let enqueueResolveGithubJobService: jest.Mocked<Pick<EnqueueResolveGithubJobService, "enqueue">>
        let winstonService: jest.Mocked<Pick<WinstonService, "log">>
        let courseStatsProjectionService: jest.Mocked<Pick<CourseStatsProjectionService, "recompute">>
        let userService: jest.Mocked<Pick<UserService, "invalidateEnrolledCourses">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let voucherService: jest.Mocked<Pick<VoucherService, "markUsed">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()
            // `count` of paid enrollments is read to decide phase advancement -- keep it
            // low so the phase stays put
            entityManager.count = jest.fn().mockResolvedValue(1)

            transactionActionService = {
                updateTransactionStatusIfExpected: jest.fn(),
            } as unknown as jest.Mocked<Pick<TransactionActionService, "updateTransactionStatusIfExpected">>
            jobActionService = {
                increaseJob: jest.fn(),
                saveExecutionResult: jest.fn(),
            } as unknown as jest.Mocked<Pick<JobActionService, "increaseJob" | "saveExecutionResult">>
            enqueueResolveGithubJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueResolveGithubJobService, "enqueue">>
            winstonService = {
                log: jest.fn(),
            } as unknown as jest.Mocked<Pick<WinstonService, "log">>
            courseStatsProjectionService = {
                recompute: jest.fn(),
            } as unknown as jest.Mocked<Pick<CourseStatsProjectionService, "recompute">>
            userService = {
                invalidateEnrolledCourses: jest.fn(),
            } as unknown as jest.Mocked<Pick<UserService, "invalidateEnrolledCourses">>
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
            voucherService = {
                markUsed: jest.fn(),
            } as unknown as jest.Mocked<Pick<VoucherService, "markUsed">>

            module = await Test.createTestingModule({
                providers: [
                    EnrollStepService,
                    {
                        provide: TransactionActionService,
                        useValue: transactionActionService,
                    },
                    {
                        provide: JobActionService,
                        useValue: jobActionService,
                    },
                    {
                        provide: EnqueueResolveGithubJobService,
                        useValue: enqueueResolveGithubJobService,
                    },
                    {
                        provide: WinstonService,
                        useValue: winstonService,
                    },
                    {
                        provide: CourseStatsProjectionService,
                        useValue: courseStatsProjectionService,
                    },
                    {
                        provide: UserService,
                        useValue: userService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
                    },
                    {
                        provide: VoucherService,
                        useValue: voucherService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            service = module.get<EnrollStepService>(EnrollStepService)
        })

        afterEach(async () => {
            await module.close()
        })

        it("CONVERTS a trial placeholder → paid in place and runs the post-steps",
            async () => {
                // a TRIAL row (is_enrolled = false) already exists for this user x course
                const trial = {
                    id: "enrollment-trial",
                    isEnrolled: false,
                    pricingPhase: PricingPhase.EarlyBird,
                } as EnrollmentEntity

                // dispatch by entity: the course lock + relations read resolve the course,
                // the enrollment lookup resolves the TRIAL (-> must convert), and the post-tx
                // user lookups resolve an emailed user (welcome mail) without a github name.
                programFindOne(entityManager,
                    {
                        course: fakeCourse(),
                        enrollment: trial,
                        user: {
                            id: userId,
                            email: "learner@example.com",
                        } as UserEntity,
                    })

                await service.process(makeContext())

                // the trial flag is flipped to paid in place (CONVERT, not a fresh insert)
                expect(trial.isEnrolled).toBe(true)
                expect(trial.pricingPhase).toBe(PricingPhase.EarlyBird)
                expect(entityManager.save).toHaveBeenCalledWith(trial)

                // it is NOT treated as a duplicate -> the transaction is marked succeeded
                // AND the post-steps run (stats recompute + cache invalidation + welcome mail)
                expect(transactionActionService.updateTransactionStatusIfExpected).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: transactionId,
                        status: TransactionStatus.Succeeded,
                        expectedStatus: TransactionStatus.Pending,
                    }),
                )
                expect(courseStatsProjectionService.recompute).toHaveBeenCalledWith(
                    expect.objectContaining({
                        courseId,
                    }),
                )
                expect(userService.invalidateEnrolledCourses).toHaveBeenCalledWith(userId)
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalled()
            })

        it("CREATES a fresh paid enrollment when no row exists yet (post-steps run)",
            async () => {
                // no existing enrollment -> the create path; emailed user -> welcome mail
                programFindOne(entityManager,
                    {
                        course: fakeCourse(),
                        enrollment: null,
                        user: {
                            id: userId,
                            email: "learner@example.com",
                        } as UserEntity,
                    })

                await service.process(makeContext())

                // a fresh PAID enrollment is built (is_enrolled = true)
                expect(entityManager.create).toHaveBeenCalledWith(
                    expect.anything(),
                    expect.objectContaining({
                        user: {
                            id: userId,
                        },
                        course: {
                            id: courseId,
                        },
                        pricingPhase: PricingPhase.EarlyBird,
                        isEnrolled: true,
                    }),
                )
                // post-steps run for a genuine new enrollment
                expect(userService.invalidateEnrolledCourses).toHaveBeenCalledWith(userId)
                expect(enqueueSendMailJobService.enqueue).toHaveBeenCalled()
            })

        it("is a NO-OP for a genuine duplicate (already paid): no convert, no post-steps",
            async () => {
                // an ALREADY-PAID enrollment exists -> duplicate enroll job
                const paid = {
                    id: "enrollment-paid",
                    isEnrolled: true,
                    pricingPhase: PricingPhase.EarlyBird,
                } as EnrollmentEntity

                // existing PAID enrollment -> genuine duplicate (no convert / no post-steps)
                programFindOne(entityManager,
                    {
                        course: fakeCourse(),
                        enrollment: paid,
                        user: null,
                    })

                await service.process(makeContext())

                // the transaction is still finalized as succeeded ...
                expect(transactionActionService.updateTransactionStatusIfExpected).toHaveBeenCalledWith(
                    expect.objectContaining({
                        id: transactionId,
                        status: TransactionStatus.Succeeded,
                        expectedStatus: TransactionStatus.Pending,
                    }),
                )
                // ... but nothing is converted/created and NONE of the post-steps fire
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(courseStatsProjectionService.recompute).not.toHaveBeenCalled()
                expect(userService.invalidateEnrolledCourses).not.toHaveBeenCalled()
                expect(enqueueSendMailJobService.enqueue).not.toHaveBeenCalled()
                expect(enqueueResolveGithubJobService.enqueue).not.toHaveBeenCalled()
            })

        it("enqueues a resolve-github job for a converted user that has a github username",
            async () => {
                const trial = {
                    id: "enrollment-trial",
                    isEnrolled: false,
                    pricingPhase: PricingPhase.EarlyBird,
                } as EnrollmentEntity

                // the post-tx user resolves with BOTH an email (welcome mail) and a github
                // username (-> resolve-github job enqueued)
                programFindOne(entityManager,
                    {
                        course: fakeCourse(),
                        enrollment: trial,
                        user: {
                            id: userId,
                            email: "learner@example.com",
                            githubUsername: "octocat",
                        } as UserEntity,
                    })

                await service.process(makeContext())

                expect(enqueueResolveGithubJobService.enqueue).toHaveBeenCalledWith(
                    expect.objectContaining({
                        userId,
                        courseId,
                        githubUsername: "octocat",
                    }),
                )
            })
        it("fails before writes when the course no longer exists",
            async () => {
                programFindOne(entityManager,
                    {
                        course: null,
                        enrollment: null,
                        user: null,
                    })

                await expect(service.process(makeContext())).rejects.toBeInstanceOf(CourseNotFoundException)
                expect(entityManager.delete).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
            })
        it("creates missing metadata and advances the phase when the current phase has no slots",
            async () => {
                const course = {
                    id: courseId,
                    title: "Course One",
                    metadata: null,
                    pricingPhases: [],
                } as unknown as CourseEntity
                programFindOne(entityManager,
                    {
                        course,
                        enrollment: null,
                        user: null,
                    })
                entityManager.count.mockResolvedValueOnce(0)

                await service.process(makeContext())

                expect(entityManager.create).toHaveBeenCalledWith(expect.anything(),
                    expect.objectContaining({
                        currentPhase: PricingPhase.Regular,
                        course,
                    }))
                expect(course.metadata).toEqual(expect.objectContaining({
                    currentPhase: PricingPhase.Regular,
                }))
                expect(entityManager.save).toHaveBeenCalledWith(course)
            })

        it("advances existing course metadata when the current phase sells out",
            async () => {
                const course = fakeCourse()
                course.pricingPhases = [{
                    phase: PricingPhase.EarlyBird,
                    slotAvailable: 1,
                }] as never
                programFindOne(entityManager,
                    {
                        course,
                        enrollment: null,
                        user: null,
                    })
                entityManager.count.mockResolvedValueOnce(2)

                await service.process(makeContext())

                expect(course.metadata?.currentPhase).toBe(PricingPhase.Regular)
                expect(entityManager.save).toHaveBeenCalledWith(course)
            })
    })
