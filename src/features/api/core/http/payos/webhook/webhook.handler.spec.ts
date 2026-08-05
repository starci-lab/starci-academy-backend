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
} from "@modules/ai"
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
    TransactionCourseNotFoundException,
    UnsupportedTransactionActionException,
} from "@modules/exceptions"
import {
    DayjsService,
} from "@modules/mixin"
import {
    PAYOS,
} from "@modules/payos"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import {
    PayosWebhookCommand,
} from "./webhook.command"
import {
    PayosWebhookHandler,
} from "./webhook.handler"
import type {
    PayosWebhookRequest,
} from "./dtos"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The order code payOS echoes back as our transaction referenceId. */
const ORDER_CODE = "98765"

/**
 * Build a minimal payOS webhook request body for the handler. The handler only
 * reads `data.orderCode`; verification is mocked so the rest can stay sparse.
 */
const buildBody = (): PayosWebhookRequest => ({
    code: "00",
    desc: "success",
    success: true,
    data: {
        orderCode: ORDER_CODE,
    },
    signature: "sig",
}) as unknown as PayosWebhookRequest

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
    referenceId: ORDER_CODE,
    status: TransactionStatus.Pending,
    actionType: ActionType.Enroll,
    courseId: "course-1",
    aiSubTier: null,
    // created just now -> never trips the stale-transaction guard
    createdAt: new Date(),
    ...overrides,
})

describe("PayosWebhookHandler",
    () => {
        let module: TestingModule
        let handler: PayosWebhookHandler
        let entityManager: EntityManagerMock
        let payos: { webhooks: { verify: jest.Mock } }
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // payOS client: webhooks.verify resolves on a trusted payload
            payos = {
                webhooks: {
                    verify: jest.fn().mockResolvedValue(undefined),
                },
            }

            // enroll worker hand-off -- assert it is enqueued on the Enroll path. Default
            // to a single successful fan-out; individual tests override for the
            // malformed-transaction (enqueuedCount: 0) case.
            enqueueEnrollJobService = {
                enqueueForTransaction: jest.fn().mockResolvedValue({
                    enqueuedCount: 1,
                }),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueueForTransaction">>

            // entitlement grant -- assert it fires on the subscription path
            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            module = await Test.createTestingModule({
                providers: [
                    PayosWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) -> use the real one
                    DayjsService,
                    {
                        provide: PAYOS,
                        useValue: payos,
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
                        // MembershipPurchase path is not exercised by these tests -- a
                        // bare stub is enough to satisfy DI (mirrors the sibling
                        // reconcile-transaction.worker.spec.ts style).
                        provide: MembershipService,
                        useValue: {
                            grantMembership: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                        },
                    },
                    {
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

            handler = module.get<PayosWebhookHandler>(PayosWebhookHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the enroll job for a valid enrollment webhook",
            async () => {
                // a matching pending enrollment transaction exists
                const transaction = buildTransaction()
                entityManager.findOne.mockResolvedValueOnce(transaction)

                await handler.execute(
                    new PayosWebhookCommand(
                        buildBody(),
                    ),
                )

                // signature verification ran before any mutation
                expect(payos.webhooks.verify).toHaveBeenCalled()
                // enroll worker received the hand-off -- the handler now fans out
                // per-transaction (single- or multi-course) via enqueueForTransaction
                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                    transaction,
                })
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("grants the AI tier for a valid subscription webhook",
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
                    new PayosWebhookCommand(
                        buildBody(),
                    ),
                )

                // tier granted directly (no worker for subscriptions)
                expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                    userId: "user-1",
                    tier: AiSubTier.Plus,
                    transactionId: "txn-1",
                })
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects an invalid signature without touching the DB",
            async () => {
                // verify throws -> the payload is untrusted
                payos.webhooks.verify.mockRejectedValueOnce(
                    new Error("invalid signature"),
                )

                await expect(
                    handler.execute(
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toThrow()

                // never looked up or mutated a transaction
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("acks (no throw) when no pending transaction matches the order code",
            async () => {
                // PayOS also probes the webhook URL with a sample orderCode to validate
                // it -- the handler now acks unmatched callbacks instead of throwing, so
                // a stray/probe delivery never trips PayOS's "inactive URL" retry logic.
                // findOne default resolves null -> no pending row
                await expect(
                    handler.execute(
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).resolves.toBeUndefined()

                // no side effects when the reference is unknown
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })

        it("rejects a subscription webhook that carries no tier",
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
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("rejects an enrollment webhook that carries no course",
            async () => {
                // enrollment transaction missing its courseId -- the handler now
                // delegates the items-vs-course resolution to
                // EnqueueEnrollJobService.enqueueForTransaction, which reports the
                // malformed row back as `enqueuedCount: 0` (no items, no course)
                const transaction = buildTransaction({
                    courseId: null,
                })
                entityManager.findOne.mockResolvedValueOnce(transaction)
                enqueueEnrollJobService.enqueueForTransaction.mockResolvedValueOnce({
                    enqueuedCount: 0,
                })

                await expect(
                    handler.execute(
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)

                expect(enqueueEnrollJobService.enqueueForTransaction).toHaveBeenCalledWith({
                    transaction,
                })
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
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(UnsupportedTransactionActionException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueueForTransaction).not.toHaveBeenCalled()
            })
    })
