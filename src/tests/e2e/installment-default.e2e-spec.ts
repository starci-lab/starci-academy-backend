import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    ScheduleModule,
    SchedulerRegistry,
} from "@nestjs/schedule"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
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
    CourseEntity,
} from "@modules/databases/postgresql/primary/entities/course.entity"
import {
    EnrollmentEntity,
} from "@modules/databases/postgresql/primary/entities/enrollment.entity"
import {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    InstallmentPlanEnforcementCronService,
} from "@modules/bussiness/installment-plan/installment-plan-enforcement.cron"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    until,
} from "@tests/helpers/flow-wait"

/**
 * A learner who passes the installment grace period loses paid-course access.
 *
 * Fixture writes are direct because they arrange external state. The business
 * action enters through Nest Schedule's registered CronJob, never through the
 * cron provider itself; the assertions read the persisted plan and enrollment.
 */
describe("an overdue installment plan defaults and locks course access",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let scheduler: SchedulerRegistry
        let planId: string
        let enrollmentId: string

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    ScheduleModule.forRoot(),
                ],
                providers: [
                    InstallmentPlanEnforcementCronService,
                    InstallmentPlanService,
                    DayjsService,
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn().mockResolvedValue(undefined),
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            scheduler = app.get(SchedulerRegistry)
            await entityManager.query(
                "TRUNCATE TABLE \"installment_plans\", \"enrollments\", \"courses\", \"users\" RESTART IDENTITY CASCADE",
            )
        })

        afterAll(async () => {
            await app?.close().catch(() => undefined)
        })

        it("starts with paid access and a plan beyond its lockout date",
            async () => {
                const learner = await entityManager.save(
                    entityManager.create(UserEntity,
                        {
                            keycloakId: "kc-installment-default-flow",
                            email: "installment-default@starci.test",
                        }),
                )
                const course = await entityManager.save(
                    entityManager.create(CourseEntity,
                        {
                            title: "Installment-gated course",
                            displayId: "installment-default-flow",
                            description: "e2e fixture course",
                            originalPrice: 1_500_000,
                            defaultLocale: Locale.En,
                        }),
                )
                const enrollment = await entityManager.save(
                    entityManager.create(EnrollmentEntity,
                        {
                            user: learner,
                            course,
                            pricingPhase: PricingPhase.Regular,
                            isEnrolled: true,
                        }),
                )
                const plan = await entityManager.save(
                    entityManager.create(InstallmentPlanEntity,
                        {
                            user: learner,
                            originTransaction: null,
                            lockedCourseIds: [course.id],
                            planType: InstallmentPlanType.Fixed,
                            status: InstallmentPlanStatus.Overdue,
                            months: 3,
                            monthlyAmountVnd: 500_000,
                            totalAmountVnd: 1_500_000,
                            markupPercent: 10,
                            installmentsPaid: 1,
                            nextDueAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                            secondReminderAfterDays: 7,
                            lockoutAfterDays: 14,
                            dueRemindedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                            secondRemindedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                        }),
                )
                planId = plan.id
                enrollmentId = enrollment.id

                expect(plan.status).toBe(InstallmentPlanStatus.Overdue)
                expect(enrollment.isEnrolled).toBe(true)
            })

        it("runs the production scheduler callback",
            async () => {
                scheduler.getCronJob("installment-plan-enforcement").fireOnTick()

                await until(async () => {
                    const plan = await entityManager.findOneByOrFail(
                        InstallmentPlanEntity,
                        {
                            id: planId,
                        },
                    )
                    return plan.status === InstallmentPlanStatus.Defaulted
                },
                {
                    describe: "the overdue installment plan to default",
                })

                const plan = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: planId,
                    },
                )
                expect(plan.status).toBe(InstallmentPlanStatus.Defaulted)
            })

        it("persists the default and closes the gated enrollment",
            async () => {
                const plan = await entityManager.findOneByOrFail(
                    InstallmentPlanEntity,
                    {
                        id: planId,
                    },
                )
                const enrollment = await entityManager.findOneByOrFail(
                    EnrollmentEntity,
                    {
                        id: enrollmentId,
                    },
                )

                expect(plan.status).toBe(InstallmentPlanStatus.Defaulted)
                expect(enrollment.isEnrolled).toBe(false)
            })
    })
