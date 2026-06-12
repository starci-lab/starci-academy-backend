import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    BadRequestException,
} from "@nestjs/common"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    ActionType,
    AiSubTier,
    TransactionStatus,
} from "@modules/databases"
import {
    AiSubscriptionTierNotAvailableException,
    TransactionCourseNotFoundException,
    TransactionNotFoundException,
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
    // created just now → never trips the stale-transaction guard
    createdAt: new Date(),
    ...overrides,
})

describe("PayosWebhookHandler",
    () => {
        let module: TestingModule
        let handler: PayosWebhookHandler
        let entityManager: EntityManagerMock
        let payos: { webhooks: { verify: jest.Mock } }
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueue">>
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

            // enroll worker hand-off — assert it is enqueued on the Enroll path
            enqueueEnrollJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueEnrollJobService, "enqueue">>

            // entitlement grant — assert it fires on the subscription path
            aiEntitlementService = {
                grantTier: jest.fn(),
            } as unknown as jest.Mocked<Pick<AiEntitlementService, "grantTier">>

            module = await Test.createTestingModule({
                providers: [
                    PayosWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
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
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
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
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction(),
                )

                await handler.execute(
                    new PayosWebhookCommand(
                        buildBody(),
                    ),
                )

                // signature verification ran before any mutation
                expect(payos.webhooks.verify).toHaveBeenCalled()
                // enroll worker received the hand-off
                expect(enqueueEnrollJobService.enqueue).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseId: "course-1",
                    transactionId: "txn-1",
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
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })

        it("rejects an invalid signature without touching the DB",
            async () => {
                // verify throws → the payload is untrusted
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
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })

        it("throws when no pending transaction matches the order code",
            async () => {
                // findOne default resolves null → no pending row
                await expect(
                    handler.execute(
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                // no side effects when the reference is unknown
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
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
                // enrollment transaction missing its courseId
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        courseId: null,
                    }),
                )

                await expect(
                    handler.execute(
                        new PayosWebhookCommand(
                            buildBody(),
                        ),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)

                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })

        it("throws BadRequest for an unsupported action type",
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
                ).rejects.toBeInstanceOf(BadRequestException)

                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })
    })
