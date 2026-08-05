// Load the bussiness barrel first so its CQRS/elasticsearch base classes are
// initialised before the handler pulls `@modules/cqrs` — dodges a load-order
// "Class extends value undefined" cycle.
import "@modules/bussiness"
import {
    Test,
    TestingModule,
} from "@nestjs/testing"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness"
import {
    AiSubTier,
    PaymentType,
} from "@modules/databases"
import {
    AiSubscriptionTierNotAvailableException,
    PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError,
    UserNotFoundException,
} from "@modules/exceptions"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    PAYOS,
} from "@modules/payos"
import {
    SEPAY,
} from "@modules/sepay"
import {
    STRIPE,
} from "@modules/stripe"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    makeEntityManagerMock,
} from "@modules/tests"
import type {
    EntityManagerMock,
} from "@modules/tests"
import type {
    UserEntity,
} from "@modules/databases"
import {
    PurchaseAiSubscriptionCommand,
} from "./purchase-ai-subscription.command"
import {
    PurchaseAiSubscriptionHandler,
} from "./purchase-ai-subscription.handler"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Params for the `RetryService.retry` mock. */
interface RetryServiceRetryParams {
    action: () => Promise<unknown>
}

/**
 * Build a minimal user stand-in carrying only the id the handler reads.
 *
 * @param id - The user id to embed.
 * @returns a UserEntity-typed stub with just the id populated.
 */
const fakeUser = (
    id: string,
): UserEntity => ({
    id,
}) as unknown as UserEntity

describe("PurchaseAiSubscriptionHandler",
    () => {
        let module: TestingModule
        let handler: PurchaseAiSubscriptionHandler
        let entityManager: EntityManagerMock
        let payos: { paymentRequests: { create: jest.Mock } }
        let sepay: { checkout: { initOneTimePaymentFields: jest.Mock; initCheckoutUrl: jest.Mock } }
        let mountFilesystemService: { appConfig: jest.Mock }
        let enqueueReconcileTransactionJobService: jest.Mocked<
            Pick<EnqueueReconcileTransactionJobService, "enqueue">
        >

        beforeEach(async () => {
            // fresh jest-backed entity manager with happy-path defaults
            entityManager = makeEntityManagerMock()

            // PayOS client: payment-link creation echoes a checkout URL + amount
            payos = {
                paymentRequests: {
                    create: jest.fn().mockResolvedValue({
                        checkoutUrl: "https://payos/checkout",
                        amount: 100000,
                    }),
                },
            }

            // SePay client: signs the order fields + exposes the form-POST URL
            sepay = {
                checkout: {
                    initOneTimePaymentFields: jest.fn().mockReturnValue({
                        signature: "sig",
                    }),
                    initCheckoutUrl: jest.fn().mockReturnValue("https://sepay/checkout"),
                },
            }

            // live catalog: a single enabled "plus" tier priced in VND + USD
            mountFilesystemService = {
                appConfig: jest.fn().mockReturnValue({
                    subscriptions: {
                        tiers: [
                            {
                                tier: AiSubTier.Plus,
                                enabled: true,
                                priceVnd: 100000,
                                priceUsd: 5,
                            },
                        ],
                    },
                }),
            }

            // reconcile-poll scheduler — assert it is enqueued after persistence
            enqueueReconcileTransactionJobService = {
                enqueue: jest.fn(),
            } as unknown as jest.Mocked<Pick<EnqueueReconcileTransactionJobService, "enqueue">>

            module = await Test.createTestingModule({
                providers: [
                    PurchaseAiSubscriptionHandler,
                    // DayjsService is a pure dayjs wrapper (no I/O) → use the real one
                    DayjsService,
                    {
                        provide: PAYOS,
                        useValue: payos,
                    },
                    {
                        provide: SEPAY,
                        useValue: sepay,
                    },
                    {
                        provide: STRIPE,
                        useValue: {
                        },
                    },
                    {
                        provide: PaypalClient,
                        useValue: {
                        },
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: {
                        },
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemService,
                    },
                    {
                        // RetryService just runs the action once for the unit test
                        provide: RetryService,
                        useValue: {
                            retry: jest.fn(
                                ({
                                    action,
                                }: RetryServiceRetryParams) => action(),
                            ),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJobService,
                    },
                    {
                        provide: getEntityManagerToken(POSTGRESQL_PRIMARY),
                        useValue: entityManager,
                    },
                ],
            }).compile()

            handler = module.get<PurchaseAiSubscriptionHandler>(PurchaseAiSubscriptionHandler)
        })

        afterEach(async () => {
            await module.close()
        })

        it("throws when there is no authenticated user (no catalog read)",
            async () => {
                await expect(
                    handler.execute(
                        new PurchaseAiSubscriptionCommand({
                            request: {
                                tier: AiSubTier.Plus,
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: undefined,
                        }),
                    ),
                ).rejects.toBeInstanceOf(UserNotFoundException)

                // guard fires before any catalog lookup or persistence
                expect(mountFilesystemService.appConfig).not.toHaveBeenCalled()
            })

        it("throws when the requested tier is not enabled in the catalog",
            async () => {
                // catalog only carries an enabled "plus" tier → "pro" is unavailable
                await expect(
                    handler.execute(
                        new PurchaseAiSubscriptionCommand({
                            request: {
                                tier: AiSubTier.Pro,
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                                payosCancelUrl: "https://app/cancel",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(AiSubscriptionTierNotAvailableException)

                // no checkout is created for an unavailable tier
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })

        it("creates a fresh PayOS checkout, persists the transaction and schedules reconcile",
            async () => {
                // no reusable pending transaction exists
                entityManager.findOne.mockResolvedValueOnce(null)
                // the persisted transaction gets an id assigned by the DB
                entityManager.save.mockImplementationOnce(async (entity: { id?: string }) => {
                    entity.id = "txn-1"
                    return entity
                })

                const result = await handler.execute(
                    new PurchaseAiSubscriptionCommand({
                        request: {
                            tier: AiSubTier.Plus,
                            paymentType: PaymentType.PayOS,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // a PayOS payment link is created for the VND tier price
                expect(payos.paymentRequests.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        amount: 100000,
                        returnUrl: "https://app/ok",
                        cancelUrl: "https://app/cancel",
                    }),
                )
                // the pending transaction is persisted + a reconcile poll scheduled
                expect(entityManager.save).toHaveBeenCalled()
                expect(enqueueReconcileTransactionJobService.enqueue).toHaveBeenCalledWith({
                    transactionId: "txn-1",
                })
                // the checkout URL + transaction id are returned to the client
                expect(result.checkoutUrl).toBe("https://payos/checkout")
                expect(result.transactionId).toBe("txn-1")
            })

        it("reuses a still-fresh pending transaction instead of creating a new one",
            async () => {
                // a recent pending transaction for the same tier + provider exists
                entityManager.findOne.mockResolvedValueOnce({
                    id: "txn-existing",
                    referenceId: "987654",
                    amount: 100000,
                    checkoutUrl: "https://payos/existing",
                    paymentType: PaymentType.PayOS,
                    // created just now → within the reuse window
                    createdAt: new Date(),
                })

                const result = await handler.execute(
                    new PurchaseAiSubscriptionCommand({
                        request: {
                            tier: AiSubTier.Plus,
                            paymentType: PaymentType.PayOS,
                            payosReturnUrl: "https://app/ok",
                            payosCancelUrl: "https://app/cancel",
                        },
                        user: fakeUser("user-1"),
                    }),
                )

                // the existing checkout is handed back; no new link / persistence
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
                expect(entityManager.save).not.toHaveBeenCalled()
                expect(result.transactionId).toBe("txn-existing")
                expect(result.checkoutUrl).toBe("https://payos/existing")
            })

        it("throws when PayOS is chosen without both redirect URLs",
            async () => {
                // no reusable transaction; PayOS requires explicit return + cancel URLs
                entityManager.findOne.mockResolvedValueOnce(null)

                await expect(
                    handler.execute(
                        new PurchaseAiSubscriptionCommand({
                            request: {
                                tier: AiSubTier.Plus,
                                paymentType: PaymentType.PayOS,
                                payosReturnUrl: "https://app/ok",
                            },
                            user: fakeUser("user-1"),
                        }),
                    ),
                ).rejects.toBeInstanceOf(PayOsReturnUrlAndPayOsCancelUrlMustBeRequiredError)

                // no payment link is created when a redirect URL is missing
                expect(payos.paymentRequests.create).not.toHaveBeenCalled()
            })
    })
