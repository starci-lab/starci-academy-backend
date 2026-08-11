import {
    Test,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import dayjs from "dayjs"
import {
    InstallmentPlanStatus,
} from "@modules/databases/postgresql/primary/enums/installment-plan-status"
import {
    InstallmentPlanType,
} from "@modules/databases/postgresql/primary/enums/installment-plan-type"
import type {
    InstallmentPlanEntity,
} from "@modules/databases/postgresql/primary/entities/installment-plan.entity"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    EnqueueSendMailJobService,
} from "../jobs/enqueue/send-mail.service"
import {
    enqueueInstallmentDefaultedEmail,
    enqueueInstallmentDueEmail,
    enqueueInstallmentFinalWarningEmail,
} from "@modules/integrations/transactional-email/grant-emails"
import {
    InstallmentPlanEnforcementCronService,
} from "./installment-plan-enforcement.cron"
import {
    InstallmentPlanService,
} from "./installment-plan.service"

const POSTGRESQL_PRIMARY = "primary"
const NOW = new Date("2026-08-11T08:00:00.000Z")
const DAY_MS = 24 * 60 * 60 * 1000

jest.mock("@modules/integrations/transactional-email/grant-emails",
    () => ({
        enqueueInstallmentDefaultedEmail: jest.fn().mockResolvedValue(undefined),
        enqueueInstallmentDueEmail: jest.fn().mockResolvedValue(undefined),
        enqueueInstallmentFinalWarningEmail: jest.fn().mockResolvedValue(undefined),
    }))

const mockDueEmail = enqueueInstallmentDueEmail as jest.MockedFunction<typeof enqueueInstallmentDueEmail>
const mockWarningEmail = enqueueInstallmentFinalWarningEmail as jest.MockedFunction<typeof enqueueInstallmentFinalWarningEmail>
const mockDefaultedEmail = enqueueInstallmentDefaultedEmail as jest.MockedFunction<typeof enqueueInstallmentDefaultedEmail>

const planAt = (daysPastDue: number): InstallmentPlanEntity => ({
    id: `plan-${daysPastDue}`,
    userId: "user-installment",
    lockedCourseIds: [],
    planType: InstallmentPlanType.Fixed,
    status: InstallmentPlanStatus.Active,
    months: 3,
    monthlyAmountVnd: 500_000,
    totalAmountVnd: 1_500_000,
    markupPercent: 10,
    installmentsPaid: 1,
    remainingVnd: null,
    minPaymentFloorVnd: 500_000,
    minPaymentPercent: 10,
    nextDueAt: new Date(NOW.getTime() - daysPastDue * DAY_MS),
    secondReminderAfterDays: 7,
    lockoutAfterDays: 14,
    dueRemindedAt: null,
    secondRemindedAt: null,
} as unknown as InstallmentPlanEntity)

describe("InstallmentPlanEnforcementCronService",
    () => {
        let service: InstallmentPlanEnforcementCronService
        let entityManager: EntityManagerMock
        const installmentPlanService = {
            computeMinPaymentVnd: jest.fn().mockReturnValue(500_000),
            lockGatedEnrollments: jest.fn().mockResolvedValue(undefined),
        }

        beforeEach(async () => {
            jest.clearAllMocks()
            entityManager = makeEntityManagerMock()
            const module = await Test.createTestingModule({
                providers: [
                    InstallmentPlanEnforcementCronService,
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: DayjsService,
                        useValue: {
                            now: () => dayjs(NOW),
                            from: (value: Date) => dayjs(value),
                        },
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: installmentPlanService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
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
            service = module.get(InstallmentPlanEnforcementCronService)
        })

        it("selects one mutually-exclusive action at each exact due threshold",
            async () => {
                entityManager.find.mockResolvedValue([
                    planAt(0),
                    planAt(7),
                    planAt(14),
                ])

                await service.enforceOverduePlans()

                expect(mockDueEmail).toHaveBeenCalledTimes(1)
                expect(mockWarningEmail).toHaveBeenCalledTimes(1)
                expect(mockDefaultedEmail).toHaveBeenCalledTimes(1)
                expect(installmentPlanService.lockGatedEnrollments).toHaveBeenCalledTimes(1)
            })

        it("does not emit a duplicate consequence when another replica won the claim",
            async () => {
                entityManager.find.mockResolvedValue([planAt(0)])
                entityManager.update.mockResolvedValue({
                    affected: 0,
                })

                await service.enforceOverduePlans()

                expect(mockDueEmail).not.toHaveBeenCalled()
                expect(mockWarningEmail).not.toHaveBeenCalled()
                expect(mockDefaultedEmail).not.toHaveBeenCalled()
            })
    })
