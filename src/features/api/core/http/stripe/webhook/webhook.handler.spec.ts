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
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
import {
    makeEntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import type {
    EntityManagerMock,
} from "@modules/tests/utils/mocks/entity-manager.mock"
import {
    StripeWebhookCommand,
} from "./webhook.command"
import {
    StripeWebhookHandler,
} from "./webhook.handler"

// the handler reads the signing secret from a mounted file via this helper;
// stub it so the spec never touches the real filesystem
jest.mock("@modules/filesystem",
    () => ({
        getStripeWebhookSecret: jest.fn(() => "whsec_test"),
    }))

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The client_reference_id Stripe echoes back as our transaction referenceId. */
const REFERENCE_ID = "ref-123"

/** Params the controller captures (raw body + signature header). */
const WEBHOOK_PARAMS = {
    rawBody: Buffer.from("{}"),
    signature: "t=1,v1=sig",
}

/**
 * Build a Stripe checkout.session.completed event with the given reference id
 * on the session object. Pass `referenceId: null` to model a missing id.
 * `payment_status` defaults to "paid" -- the handler ignores any completed
 * session whose funds have not cleared yet (e.g. a pending async payment).
 */
const buildCompletedEvent = (
    referenceId: string | null = REFERENCE_ID,
    paymentStatus: string = "paid",
): Record<string, unknown> => ({
    type: "checkout.session.completed",
    data: {
        object: {
            client_reference_id: referenceId,
            payment_status: paymentStatus,
        },
    },
})

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

describe("StripeWebhookHandler",
    () => {
        let module: TestingModule
        let handler: StripeWebhookHandler
        let entityManager: EntityManagerMock
        let stripe: { webhooks: { constructEvent: jest.Mock } }
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>
        let membershipService: jest.Mocked<Pick<MembershipService, "grantMembership">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let notificationService: jest.Mocked<Pick<NotificationService, "createNotification">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // Stripe client: constructEvent verifies the signature + parses the event
            stripe = {
                webhooks: {
                    constructEvent: jest.fn(() => buildCompletedEvent()),
                },
            }

            // enroll worker hand-off -- assert it is enqueued on the Enroll path;
            // default resolves a successful single-course fan-out
            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>

            // entitlement grant -- assert it fires on the subscription path
            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            // community membership grant -- not exercised by the Enroll/AiSubscription
            // paths under test, but required by the handler's constructor
            membershipService = {
                grantMembership: jest.fn(),
            } as unknown as jest.Mocked<Pick<MembershipService, "grantMembership">>

            // best-effort post-grant email -- only fires when a grant actually happens
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>

            // best-effort post-grant in-app notification -- same as above
            notificationService = {
                createNotification: jest.fn(),
            } as unknown as jest.Mocked<Pick<NotificationService, "createNotification">>

            module = await Test.createTestingModule({
                providers: [
                    StripeWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: STRIPE,
                        useValue: stripe,
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
                        provide: EnqueueSendMailJobService,
                        useValue: enqueueSendMailJobService,
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

            handler = module.get<StripeWebhookHandler>(StripeWebhookHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the enroll job for a valid completed-session event",
            async () => {
                // a matching pending enrollment transaction exists
                const transaction = buildTransaction()
                entityManager.findOne.mockResolvedValueOnce(transaction)

                await handler.execute(
                    new StripeWebhookCommand(WEBHOOK_PARAMS),
                )

                // event was verified + parsed before any mutation
                expect(stripe.webhooks.constructEvent).toHaveBeenCalled()
                // enroll worker received the hand-off (fans the paid order out per course)
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
                    new StripeWebhookCommand(WEBHOOK_PARAMS),
                )

                expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                    userId: "user-1",
                    tier: AiSubTier.Plus,
                    transactionId: "txn-1",
                })
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects a bad signature without touching the DB",
            async () => {
                // constructEvent throws on a signature mismatch -- a raw Stripe SDK
                // failure that propagates unwrapped (the handler does not catch it)
                const signatureError = new Error("Webhook signature verification failed")
                stripe.webhooks.constructEvent.mockImplementationOnce(() => {
                    throw signatureError
                })

                await expect(
                    handler.execute(
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
                    ),
                ).rejects.toThrow()

                // never looked up or mutated a transaction
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("ignores non-completion event types without side effects",
            async () => {
                // a refund event is not a paid checkout -> handler returns early
                stripe.webhooks.constructEvent.mockReturnValueOnce({
                    type: "charge.refunded",
                    data: {
                        object: {
                        },
                    },
                })

                await handler.execute(
                    new StripeWebhookCommand(WEBHOOK_PARAMS),
                )

                // early return -> no lookup, no grant, no enqueue
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("throws when the session omits our reference id",
            async () => {
                // completed session without client_reference_id -> cannot match
                stripe.webhooks.constructEvent.mockReturnValueOnce(
                    buildCompletedEvent(null),
                )

                await expect(
                    handler.execute(
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws when no pending transaction matches the reference id",
            async () => {
                // findOne default resolves null -> no pending row
                await expect(
                    handler.execute(
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
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
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("rejects an enrollment event that carries no course",
            async () => {
                // enrollment transaction missing its courseId -- the fan-out service
                // (mocked here) resolves this to zero enqueued jobs
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
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)
            })

        it("throws UnsupportedTransactionActionException for an unsupported action type",
            async () => {
                // transaction with an action the switch does not handle
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        actionType: "unsupported-action",
                    }),
                )

                await expect(
                    handler.execute(
                        new StripeWebhookCommand(WEBHOOK_PARAMS),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedTransactionActionException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })
    })
