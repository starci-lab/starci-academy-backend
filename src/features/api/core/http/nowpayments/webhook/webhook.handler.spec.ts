import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    WinstonService,
} from "@modules/winston"
import {
    EnqueueEnrollJobService,
    EnqueueSendMailJobService,
    NotificationService,
} from "@modules/bussiness"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    MembershipService,
} from "@modules/membership"
import {
    ActionType,
    AiSubTier,
    TransactionStatus,
} from "@modules/databases"
import {
    AiSubscriptionTierNotAvailableException,
    InvalidNowpaymentsWebhookSignatureException,
    TransactionCourseNotFoundException,
    TransactionNotFoundException,
    UnsupportedTransactionActionException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    NowPaymentsWebhookCommand,
} from "./webhook.command"
import {
    NowPaymentsWebhookHandler,
} from "./webhook.handler"
import type {
    NowPaymentsWebhookParams,
} from "./types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The order_id NOWPayments echoes back as our transaction referenceId. */
const REFERENCE_ID = "ref-123"

/**
 * Build the IPN params (body + signature header). The body defaults to a
 * finished payment carrying our order_id.
 */
const buildParams = (
    body: Record<string, unknown> = {
        payment_status: "finished",
        order_id: REFERENCE_ID,
    },
): NowPaymentsWebhookParams => ({
    body,
    signature: "hmac-sig",
}) as unknown as NowPaymentsWebhookParams

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

describe("NowPaymentsWebhookHandler",
    () => {
        let module: TestingModule
        let handler: NowPaymentsWebhookHandler
        let entityManager: EntityManagerMock
        let nowPaymentsClient: jest.Mocked<Pick<NowPaymentsClient, "verifySignature">>
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>
        let membershipService: jest.Mocked<Pick<MembershipService, "grantMembership">>
        let enqueueSendMailJobService: jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
        let notificationService: jest.Mocked<Pick<NotificationService, "createNotification">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // NOWPayments client: HMAC verification returns true on a trusted IPN
            nowPaymentsClient = {
                verifySignature: jest.fn(() => true),
            } as unknown as jest.Mocked<Pick<NowPaymentsClient, "verifySignature">>

            // enroll worker hand-off -- assert it is enqueued on the Enroll path.
            // default to a successful single-course fan-out; the no-course test
            // overrides this to `{ enqueuedCount: 0 }` per-call.
            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>

            // entitlement grant -- assert it fires on the subscription path
            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            // membership grant -- only reached by the MembershipPurchase branch,
            // which none of these cases exercise; a plain mock satisfies DI.
            membershipService = {
                grantMembership: jest.fn(),
            } as unknown as jest.Mocked<Pick<MembershipService, "grantMembership">>

            // transactional email + in-app notification hand-offs -- only reached
            // when a grant call above resolves truthy, which the mocks above never
            // do by default; a plain mock satisfies DI.
            enqueueSendMailJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueSendMailJobService, "enqueue">>
            notificationService = {
                createNotification: jest.fn(),
            } as unknown as jest.Mocked<Pick<NotificationService, "createNotification">>

            module = await Test.createTestingModule({
                providers: [
                    NowPaymentsWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: NowPaymentsClient,
                        useValue: nowPaymentsClient,
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

            handler = module.get<NowPaymentsWebhookHandler>(NowPaymentsWebhookHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the enroll job for a valid finished IPN",
            async () => {
                // a matching pending enrollment transaction exists
                const transaction = buildTransaction()
                entityManager.findOne.mockResolvedValueOnce(transaction)

                await handler.execute(
                    new NowPaymentsWebhookCommand(
                        buildParams(),
                    ),
                )

                // signature was verified before any mutation
                expect(nowPaymentsClient.verifySignature).toHaveBeenCalled()
                // enroll worker received the whole transaction -- it resolves the
                // per-course fan-out (single- or multi-course) internally
                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                    transaction,
                })
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("grants the AI tier for a valid subscription IPN",
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
                    new NowPaymentsWebhookCommand(
                        buildParams({
                            payment_status: "confirmed",
                            order_id: REFERENCE_ID,
                        }),
                    ),
                )

                expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                    userId: "user-1",
                    tier: AiSubTier.Plus,
                    transactionId: "txn-1",
                })
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects an invalid signature without touching the DB",
            async () => {
                // HMAC mismatch -> the payload is untrusted
                nowPaymentsClient.verifySignature.mockReturnValueOnce(false)

                await expect(
                    handler.execute(
                        new NowPaymentsWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(InvalidNowpaymentsWebhookSignatureException)

                // never looked up or mutated a transaction
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("ignores intermediate payment statuses without side effects",
            async () => {
                // a still-confirming IPN is not yet paid -> handler returns early
                await handler.execute(
                    new NowPaymentsWebhookCommand(
                        buildParams({
                            payment_status: "confirming",
                            order_id: REFERENCE_ID,
                        }),
                    ),
                )

                // early return -> no lookup, no grant, no enqueue
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("throws when the IPN omits our order id",
            async () => {
                // finished payment without order_id -> cannot match a transaction
                await expect(
                    handler.execute(
                        new NowPaymentsWebhookCommand(
                            buildParams({
                                payment_status: "finished",
                            }),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                expect(entityManager.findOne).not.toHaveBeenCalled()
            })

        it("throws when no pending transaction matches the order id",
            async () => {
                // findOne default resolves null -> no pending row
                await expect(
                    handler.execute(
                        new NowPaymentsWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects a subscription IPN that carries no tier",
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
                        new NowPaymentsWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("rejects an enrollment IPN that carries no course",
            async () => {
                // enrollment transaction missing its courseId, and no
                // transaction_items rows either -> the fan-out enqueues nothing
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
                        new NowPaymentsWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)

                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalled()
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
                        new NowPaymentsWebhookCommand(
                            buildParams(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedTransactionActionException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })
    })
