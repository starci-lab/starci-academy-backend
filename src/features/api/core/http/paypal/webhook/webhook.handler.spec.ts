import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
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
    InvalidPaypalWebhookSignatureException,
} from "@modules/platform/exceptions/errors/payment/invalid-paypal-webhook-signature"
import {
    UnsupportedTransactionActionException,
} from "@modules/platform/exceptions/errors/payment/unsupported-transaction-action"
import {
    TransactionCourseNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-course-not-found"
import {
    TransactionNotFoundException,
} from "@modules/platform/exceptions/errors/transaction/transaction-not-found"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    makeEntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@tests/mocks/entity-manager.mock"
import {
    PaypalWebhookCommand,
} from "./webhook.command"
import {
    PaypalWebhookHandler,
} from "./webhook.handler"
import type {
    PaypalWebhookParams,
} from "./types/webhook"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The custom_id PayPal echoes back as our transaction referenceId. */
const REFERENCE_ID = "ref-123"

/**
 * Build the webhook params (body + signature headers). The body defaults to a
 * captured-payment event whose resource carries our custom_id directly.
 */
const buildParams = (
    body: Record<string, unknown> = {
        event_type: "PAYMENT.CAPTURE.COMPLETED",
        resource: {
            custom_id: REFERENCE_ID,
        },
    },
): PaypalWebhookParams => ({
    body,
    authAlgo: "SHA256withRSA",
    certUrl: "https://api.paypal.com/cert",
    transmissionId: "tx-id",
    transmissionSig: "tx-sig",
    transmissionTime: "2026-06-11T00:00:00Z",
}) as unknown as PaypalWebhookParams

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

describe("PaypalWebhookHandler",
    () => {
        let module: TestingModule
        let handler: PaypalWebhookHandler
        let entityManager: EntityManagerMock
        let paypalClient: jest.Mocked<Pick<PaypalClient, "verifyWebhookSignature" | "retrieveOrder">>
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>
        let membershipService: jest.Mocked<Pick<MembershipService, "grantMembership">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // PayPal client: signature verifies true; order lookup is the fallback path
            paypalClient = {
                verifyWebhookSignature: jest.fn().mockResolvedValue(true),
                retrieveOrder: jest.fn().mockResolvedValue({
                    referenceId: REFERENCE_ID,
                }),
            } as unknown as jest.Mocked<Pick<PaypalClient, "verifyWebhookSignature" | "retrieveOrder">>

            // enroll worker hand-off -- default happy path fans out one job; override
            // to { enqueuedCount: 0 } for the malformed-transaction test
            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>

            // entitlement grant -- assert it fires on the subscription path
            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            // membership grant -- not exercised by these tests (no MembershipPurchase
            // fixture yet) but required by the handler's constructor
            membershipService = {
                grantMembership: jest.fn(),
            } as unknown as jest.Mocked<Pick<MembershipService, "grantMembership">>

            module = await Test.createTestingModule({
                providers: [
                    PaypalWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: PaypalClient,
                        useValue: paypalClient,
                    },
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
                        // best-effort mailer hand-off, only reached when grantTier
                        // reports a fresh grant -- unused by these fixtures
                        provide: EnqueueSendMailJobService,
                        useValue: {
                        },
                    },
                    {
                        // best-effort notification, only reached alongside the mailer
                        // hand-off above -- unused by these fixtures
                        provide: NotificationService,
                        useValue: {
                            createNotification: jest.fn(),
                        },
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

            handler = module.get<PaypalWebhookHandler>(PaypalWebhookHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the enroll job for a valid capture event",
            async () => {
                // a matching pending enrollment transaction exists
                const transaction = buildTransaction()
                entityManager.findOne.mockResolvedValueOnce(transaction)

                await handler.execute(
                    new PaypalWebhookCommand(
                        buildParams(),
                    ),
                )

                // signature was verified before any mutation
                expect(paypalClient.verifyWebhookSignature).toHaveBeenCalled()
                // enroll worker received the whole transaction to fan out per-course
                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                    transaction,
                })
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("grants the AI tier for a valid subscription event",
            async () => {
                // a matching pending subscription-purchase transaction exists
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                        courseId: null,
                    }),
                )

                await handler.execute(
                    new PaypalWebhookCommand(
                        buildParams(),
                    ),
                )

                expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                    userId: "user-1",
                    tier: AiSubTier.Plus,
                    transactionId: "txn-1",
                })
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("resolves the reference id from the order-detail fallback",
            async () => {
                // resource omits custom_id but carries an order id -> look it up
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction(),
                )

                await handler.execute(
                    new PaypalWebhookCommand(
                        buildParams({
                            event_type: "PAYMENT.CAPTURE.COMPLETED",
                            resource: {
                                id: "order-1",
                            },
                        }),
                    ),
                )

                // fallback order lookup recovered the reference id
                expect(paypalClient.retrieveOrder).toHaveBeenCalledWith({
                    orderId: "order-1",
                })
                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalled()
            })

        it("rejects an invalid signature without touching the DB",
            async () => {
                // verification fails -> the payload is untrusted
                paypalClient.verifyWebhookSignature.mockResolvedValueOnce(false)

                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(InvalidPaypalWebhookSignatureException)

                // never looked up or mutated a transaction
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("ignores unrelated event types without side effects",
            async () => {
                // a denied-payment event is not a paid order -> handler returns early
                await handler.execute(
                    new PaypalWebhookCommand(
                        buildParams({
                            event_type: "PAYMENT.CAPTURE.DENIED",
                            resource: {
                                custom_id: REFERENCE_ID,
                            },
                        }),
                    ),
                )

                // early return -> no lookup, no grant, no enqueue
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("throws when the resource omits our reference id",
            async () => {
                // no custom_id and no order id -> reference id is unresolvable
                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams({
                                event_type: "PAYMENT.CAPTURE.COMPLETED",
                                resource: {
                                },
                            }),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws when no pending transaction matches the reference id",
            async () => {
                // findOne default resolves null -> no pending row
                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects a subscription event that carries no tier",
            async () => {
                // subscription-purchase transaction with a null tier
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: null,
                        courseId: null,
                    }),
                )

                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("rejects an enrollment event that carries no course",
            async () => {
                // enrollment transaction missing its courseId -> the enroll service
                // fans out zero jobs (no transaction_items row, no direct courseId)
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        courseId: null,
                    }),
                )
                enqueueEnrollJobService.enqueueForTransaction.mockResolvedValueOnce({
                    enqueuedCount: 0,
                })

                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)

                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalled()
            })

        it("throws for an unsupported action type",
            async () => {
                // transaction with an action the switch does not handle
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        actionType: "unsupported-action",
                    }),
                )

                await expect(
                    handler.execute(
                        new PaypalWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedTransactionActionException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })
    })
