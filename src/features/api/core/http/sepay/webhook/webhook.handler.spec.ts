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
    SEPAY,
} from "@modules/sepay"
import {
    makeEntityManagerMock,
} from "@tests/utils"
import type {
    EntityManagerMock,
} from "@tests/utils"
import {
    SepayWebhookCommand,
} from "./webhook.command"
import {
    SepayWebhookHandler,
} from "./webhook.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** The invoice number the IPN echoes back as our transaction referenceId. */
const INVOICE = "inv-123"

/**
 * Build a pending transaction row with safe defaults; pass overrides to model
 * an enrollment / subscription / stale / wrong-action state per test.
 */
const buildTransaction = (
    overrides: Record<string, unknown> = {
    },
): Record<string, unknown> => ({
    id: "txn-1",
    userId: "user-1",
    referenceId: INVOICE,
    status: TransactionStatus.Pending,
    actionType: ActionType.Enroll,
    courseId: "course-1",
    aiSubTier: null,
    // created just now → never trips the stale-transaction guard
    createdAt: new Date(),
    ...overrides,
})

describe("SepayWebhookHandler",
    () => {
        let module: TestingModule
        let handler: SepayWebhookHandler
        let entityManager: EntityManagerMock
        let sepay: { order: { retrieve: jest.Mock } }
        let enqueueEnrollJobService: jest.Mocked<Pick<EnqueueEnrollJobService, "enqueue">>
        let aiEntitlementService: jest.Mocked<Pick<AiEntitlementService, "grantTier">>

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // SePay PG client: order.retrieve is the authoritative verification call
            sepay = {
                order: {
                    retrieve: jest.fn().mockResolvedValue({
                        data: {
                        },
                    }),
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
                    SepayWebhookHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
                    DayjsService,
                    {
                        provide: SEPAY,
                        useValue: sepay,
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

            handler = module.get<SepayWebhookHandler>(SepayWebhookHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("enqueues the enroll job for a valid enrollment IPN",
            async () => {
                // a matching pending enrollment transaction exists
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction(),
                )

                await handler.execute(
                    new SepayWebhookCommand({
                        order_invoice_number: INVOICE,
                    }),
                )

                // authoritative server-to-server verification happened first
                expect(sepay.order.retrieve).toHaveBeenCalledWith(INVOICE)
                // enroll worker received the hand-off
                expect(enqueueEnrollJobService.enqueue).toHaveBeenCalledWith({
                    userId: "user-1",
                    courseId: "course-1",
                    transactionId: "txn-1",
                })
                // subscription path must not run for an enrollment
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
                    new SepayWebhookCommand({
                        order_invoice_number: INVOICE,
                    }),
                )

                // tier granted directly (no worker for subscriptions)
                expect(aiEntitlementService.grantTier).toHaveBeenCalledWith({
                    userId: "user-1",
                    tier: AiSubTier.Plus,
                    transactionId: "txn-1",
                })
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })

        it("throws when the invoice number is missing (no mutation)",
            async () => {
                await expect(
                    handler.execute(
                        new SepayWebhookCommand({
                        }),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                // never reached the DB or the grant/enqueue path
                expect(entityManager.findOne).not.toHaveBeenCalled()
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })

        it("throws when no pending transaction matches the invoice",
            async () => {
                // findOne default resolves null → no pending row
                await expect(
                    handler.execute(
                        new SepayWebhookCommand({
                            order_invoice_number: INVOICE,
                        }),
                    ),
                ).rejects.toBeInstanceOf(TransactionNotFoundException)

                // no side effects when the reference is unknown
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
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
                        new SepayWebhookCommand({
                            order_invoice_number: INVOICE,
                        }),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                // no tier granted when the row lacks a tier
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
            })

        it("rejects an enrollment IPN that carries no course",
            async () => {
                // enrollment transaction missing its courseId
                entityManager.findOne.mockResolvedValueOnce(
                    buildTransaction({
                        courseId: null,
                    }),
                )

                await expect(
                    handler.execute(
                        new SepayWebhookCommand({
                            order_invoice_number: INVOICE,
                        }),
                    ),
                ).rejects.toBeInstanceOf(TransactionCourseNotFoundException)

                // nothing enqueued without a course to enroll into
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
                        new SepayWebhookCommand({
                            order_invoice_number: INVOICE,
                        }),
                    ),
                ).rejects.toBeInstanceOf(BadRequestException)

                // neither grant path ran for an unknown action
                expect(aiEntitlementService.grantTier).not.toHaveBeenCalled()
                expect(enqueueEnrollJobService.enqueue).not.toHaveBeenCalled()
            })
    })
