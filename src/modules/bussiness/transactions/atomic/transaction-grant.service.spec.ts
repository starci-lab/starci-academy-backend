import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    TransactionGrantService,
} from "./transaction-grant.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnqueueEnrollJobService,
} from "../../jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "../../jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "../../notification/notification.service"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    AiSubTier,
} from "@modules/databases/postgresql/primary/enums/ai-sub-tier"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    AiSubscriptionTierNotAvailableException,
} from "@modules/platform/exceptions/errors/ai/ai-subscription-tier-not-available"
import {
    UnsupportedTransactionActionException,
} from "@modules/platform/exceptions/errors/payment/unsupported-transaction-action"
import {
    TransactionCourseNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-course-not-found"
import {
    TransactionExpiredException,
} from "@modules/platform/exceptions/errors/transaction/transaction-expired"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The reference id every fixture transaction is matched by. */
const REFERENCE_ID = "ref-123"

/**
 * Build a pending transaction row with safe defaults; pass overrides to model
 * an enrollment / subscription / wrong-action state per test.
 */
const buildTransaction = (
    overrides: Record<string, unknown> = {
    },
): Record<string, unknown> => ({
    id: "txn-1",
    userId: "user-1",
    referenceId: REFERENCE_ID,
    status: TransactionStatus.Pending,
    actionType: ActionType.Enroll,
    courseId: "course-1",
    aiSubTier: null,
    // created just now -> never trips the stale-transaction guard
    createdAt: new Date(),
    ...overrides,
})

describe("TransactionGrantService",
    () => {
        let module: TestingModule
        let service: TransactionGrantService
        let entityManager: EntityManagerMock
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>
        let membershipService: jest.Mocked<Pick<MembershipService, "grantMembership">>
        let notificationService: jest.Mocked<Pick<NotificationService, "createNotification">>

        beforeEach(async () => {
            entityManager = makeEntityManagerMock()

            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>

            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            membershipService = {
                grantMembership: jest.fn(),
            } as unknown as jest.Mocked<Pick<MembershipService, "grantMembership">>

            notificationService = {
                createNotification: jest.fn(),
            } as unknown as jest.Mocked<Pick<NotificationService, "createNotification">>

            module = await Test.createTestingModule({
                providers: [
                    TransactionGrantService,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: enqueueEnrollJobService,
                    },
                    {
                        provide: AiEntitlementService,
                        useValue: aiEntitlementService,
                    },
                    {
                        provide: MembershipService,
                        useValue: membershipService,
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: NotificationService,
                        useValue: notificationService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            service = module.get<TransactionGrantService>(TransactionGrantService)
        })

        afterEach(async () => {
            await module.close()
        })

        describe("resolvePendingTransaction",
            () => {
                it("returns the matching pending transaction",
                    async () => {
                        const transaction = buildTransaction()
                        entityManager.findOne.mockResolvedValueOnce(transaction)

                        const result = await service.resolvePendingTransaction(REFERENCE_ID)

                        expect(result).toBe(transaction)
                        expect(entityManager.findOne).toHaveBeenCalledWith(
                            expect.anything(),
                            {
                                where: {
                                    referenceId: REFERENCE_ID,
                                    status: TransactionStatus.Pending,
                                },
                            },
                        )
                    })

                it("throws TransactionNotFoundException when no pending transaction matches",
                    async () => {
                        await expect(
                            service.resolvePendingTransaction(REFERENCE_ID),
                        ).rejects.toBeInstanceOf(TransactionNotFoundException)
                    })

                it("throws TransactionExpiredException for a stale transaction",
                    async () => {
                        entityManager.findOne.mockResolvedValueOnce(
                            buildTransaction({
                                // far in the past -> past the reuse/expiry window
                                createdAt: new Date("2000-01-01T00:00:00Z"),
                            }),
                        )

                        await expect(
                            service.resolvePendingTransaction(REFERENCE_ID),
                        ).rejects.toBeInstanceOf(TransactionExpiredException)
                    })
            })

        describe("grantForTransaction",
            () => {
                it("fans an Enroll transaction out to the enroll job service",
                    async () => {
                        const transaction = buildTransaction() as never

                        await service.grantForTransaction(transaction)

                        expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                            transaction,
                        })
                    })

                it("throws TransactionCourseNotFoundException when nothing got enqueued",
                    async () => {
                        enqueueEnrollJobService.enqueueForTransaction.mockResolvedValueOnce({
                            enqueuedCount: 0,
                        })

                        await expect(
                            service.grantForTransaction(
                                buildTransaction() as never,
                            ),
                        ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)
                    })

                it("grants the AI subscription tier and notifies the buyer",
                    async () => {
                        aiEntitlementService.grantTier.mockResolvedValueOnce(true)
                        const transaction = buildTransaction({
                            actionType: ActionType.AiSubscriptionPurchase,
                            aiSubTier: AiSubTier.Plus,
                            courseId: null,
                        }) as never

                        await service.grantForTransaction(transaction)

                        expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                            userId: "user-1",
                            tier: AiSubTier.Plus,
                            transactionId: "txn-1",
                        })
                        expect(notificationService.createNotification).toHaveBeenCalled()
                    })

                it("skips the notification when grantTier reports no fresh grant",
                    async () => {
                        aiEntitlementService.grantTier.mockResolvedValueOnce(false)

                        await service.grantForTransaction(
                            buildTransaction({
                                actionType: ActionType.AiSubscriptionPurchase,
                                aiSubTier: AiSubTier.Plus,
                                courseId: null,
                            }) as never,
                        )

                        expect(notificationService.createNotification).not.toHaveBeenCalled()
                    })

                it("throws AiSubscriptionTierNotAvailableException when the transaction carries no tier",
                    async () => {
                        await expect(
                            service.grantForTransaction(
                                buildTransaction({
                                    actionType: ActionType.AiSubscriptionPurchase,
                                    aiSubTier: null,
                                    courseId: null,
                                }) as never,
                            ),
                        ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)
                    })

                it("grants a community membership",
                    async () => {
                        membershipService.grantMembership.mockResolvedValueOnce(true)

                        await service.grantForTransaction(
                            buildTransaction({
                                actionType: ActionType.MembershipPurchase,
                                courseId: null,
                            }) as never,
                        )

                        expect(membershipService.grantMembership).toHaveBeenCalledWith({
                            userId: "user-1",
                            transactionId: "txn-1",
                        })
                    })

                it("throws UnsupportedTransactionActionException for an unsupported action type",
                    async () => {
                        await expect(
                            service.grantForTransaction(
                                buildTransaction({
                                    actionType: "unsupported-action",
                                }) as never,
                            ),
                        ).rejects.toBeInstanceOf(UnsupportedTransactionActionException)
                    })
            })
    })
