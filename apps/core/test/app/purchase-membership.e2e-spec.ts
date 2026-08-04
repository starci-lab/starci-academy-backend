import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    ActionType,
    PaymentType,
    PricingPhase,
    PrimaryPostgreSQLModule,
    TransactionEntity,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    MembershipNotAvailableException,
} from "@modules/exceptions"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness"
import {
    MountFilesystemService,
} from "@modules/filesystem"
import type {
    AppConfig,
} from "@modules/filesystem"
import {
    DayjsService,
    RetryService,
} from "@modules/mixin"
import {
    SEPAY,
} from "@modules/sepay/constants"
import {
    PAYOS,
} from "@modules/payos/constants"
import {
    STRIPE,
} from "@modules/stripe/constants"
import {
    PaypalClient,
} from "@modules/paypal"
import {
    NowPaymentsClient,
} from "@modules/nowpayments"
import {
    PurchaseMembershipHandler,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.handler"
import {
    PurchaseMembershipCommand,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/purchase-membership.command"
import type {
    PurchaseMembershipRequest,
} from "@features/api/core/graphql/mutations/membership/purchase-membership/graphql-types"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** Monthly VND price the mounted `app.yaml` `membership` section is stubbed to return. */
const MEMBERSHIP_PRICE_VND = 99_000
/** Monthly USD price for the international gateways. */
const MEMBERSHIP_PRICE_USD = 4.99

/**
 * e2e for `membership/purchase-membership` — `.artifacts/states/transactions/`
 * findings: the single-product membership checkout had zero e2e coverage — only
 * the `enabled` kill-switch and gateway routing were reachable via a mocked
 * `MountFilesystemService`/entity manager in a unit spec, never a real Postgres
 * `Pending` `TransactionEntity` row.
 *
 * MOCKED: the 5 gateway SDK clients + the reconcile-job queue (same shape as
 * `course-enroll.e2e-spec.ts`) and `MountFilesystemService.appConfig()` — the
 * real class reads the mounted `app.yaml`, which this harness has no file for;
 * stubbed to hand back a fixed `membership` product config.
 *
 * REAL: Postgres (Testcontainers), `PurchaseMembershipHandler`, `DayjsService`
 * (the reuse-window check), `RetryService`.
 *
 * Requires Docker (Testcontainers spins up a real Postgres in `beforeAll`).
 */
describe("Purchase membership (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let handler: PurchaseMembershipHandler
        let payosClient: {
            paymentRequests: {
                create: jest.Mock
            }
        }
        let sepayClient: {
            checkout: {
                initCheckoutUrl: jest.Mock
                initOneTimePaymentFields: jest.Mock
            }
        }
        let stripeClient: {
            checkout: {
                sessions: {
                    create: jest.Mock
                }
            }
        }
        let paypalClient: {
            createOrder: jest.Mock
        }
        let nowPaymentsClient: {
            createInvoice: jest.Mock
        }
        let enqueueReconcileTransactionJob: {
            enqueue: jest.Mock
        }
        let membershipEnabled: boolean

        /** Rebuildable mounted-config stub — tests flip `membershipEnabled` per case. */
        const mountFilesystemServiceMock = {
            appConfig: (): Partial<AppConfig> => ({
                membership: {
                    priceVnd: MEMBERSHIP_PRICE_VND,
                    priceUsd: MEMBERSHIP_PRICE_USD,
                    courseDiscountPercent: 20,
                    freeMonthsOnCoursePurchase: 1,
                    enabled: membershipEnabled,
                },
            }),
        }

        beforeAll(async () => {
            payosClient = {
                paymentRequests: {
                    create: jest.fn(),
                },
            }
            sepayClient = {
                checkout: {
                    initCheckoutUrl: jest.fn(() => "https://sepay.test/checkout"),
                    initOneTimePaymentFields: jest.fn((fields: unknown) => fields),
                },
            }
            stripeClient = {
                checkout: {
                    sessions: {
                        create: jest.fn(),
                    },
                },
            }
            paypalClient = {
                createOrder: jest.fn(),
            }
            nowPaymentsClient = {
                createInvoice: jest.fn(),
            }
            enqueueReconcileTransactionJob = {
                enqueue: jest.fn(),
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                ],
                providers: [
                    PurchaseMembershipHandler,
                    DayjsService,
                    RetryService,
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
                    {
                        provide: PAYOS,
                        useValue: payosClient,
                    },
                    {
                        provide: STRIPE,
                        useValue: stripeClient,
                    },
                    {
                        provide: PaypalClient,
                        useValue: paypalClient,
                    },
                    {
                        provide: NowPaymentsClient,
                        useValue: nowPaymentsClient,
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: enqueueReconcileTransactionJob,
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: mountFilesystemServiceMock,
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            handler = app.get(PurchaseMembershipHandler)
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        beforeEach(() => {
            // membership enabled by default; the one exception test below flips it off
            membershipEnabled = true
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        const seedUser = async (
            referenceId: string,
        ): Promise<UserEntity> =>
            entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )

        const buildRequest = (
            overrides: Partial<PurchaseMembershipRequest> & Pick<PurchaseMembershipRequest, "paymentType">,
        ): PurchaseMembershipRequest => ({
            payosReturnUrl: "https://academy.test/return",
            payosCancelUrl: "https://academy.test/cancel",
            ...overrides,
        })

        it("Sepay (VND): creates a Pending MembershipPurchase transaction, signed locally",
            async () => {
                const user = await seedUser("membership-sepay")

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: buildRequest({
                            paymentType: PaymentType.Sepay,
                        }),
                        user,
                    }),
                )

                expect(sepayClient.checkout.initOneTimePaymentFields).toHaveBeenCalledWith(
                    expect.objectContaining({
                        order_amount: MEMBERSHIP_PRICE_VND,
                        currency: "VND",
                    }),
                )
                expect(result.amount).toBe(MEMBERSHIP_PRICE_VND)

                const transaction = await entityManager.findOneOrFail(
                    TransactionEntity,
                    {
                        where: {
                            id: result.transactionId,
                        },
                    },
                )
                expect(transaction.status).toBe(TransactionStatus.Pending)
                expect(transaction.actionType).toBe(ActionType.MembershipPurchase)
                // `course` is the @ManyToOne relation, left undefined by a
                // findOneOrFail that does not join it; assert on `courseId`, the
                // @RelationId scalar TypeORM loads by default (null for a
                // membership purchase, which carries no course).
                expect(transaction.courseId).toBeNull()
                expect(transaction.aiSubTier).toBeNull()
                expect(transaction.pricingPhase).toBe(PricingPhase.Regular)
                expect(transaction.amount).toBe(MEMBERSHIP_PRICE_VND)
            })

        it("Stripe (USD): charges the configured USD price in cents, stores the session id",
            async () => {
                const user = await seedUser("membership-stripe")
                stripeClient.checkout.sessions.create.mockResolvedValueOnce({
                    id: "cs_test_membership",
                    url: "https://checkout.stripe.test/cs_test_membership",
                })

                const result = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: buildRequest({
                            paymentType: PaymentType.Stripe,
                        }),
                        user,
                    }),
                )

                expect(stripeClient.checkout.sessions.create).toHaveBeenCalledWith(
                    expect.objectContaining({
                        line_items: [
                            expect.objectContaining({
                                price_data: expect.objectContaining({
                                    // 4.99 USD -> 499 cents
                                    unit_amount: 499,
                                }),
                            }),
                        ],
                    }),
                )
                const transaction = await entityManager.findOneOrFail(
                    TransactionEntity,
                    {
                        where: {
                            id: result.transactionId,
                        },
                    },
                )
                expect(transaction.actionType).toBe(ActionType.MembershipPurchase)
                expect(transaction.providerPaymentId).toBe("cs_test_membership")
                // the persisted amount stays the stable VND reference, not the USD charge
                expect(transaction.amount).toBe(MEMBERSHIP_PRICE_VND)
            })

        it("reuses a still-fresh Pending transaction instead of opening a second gateway checkout",
            async () => {
                const user = await seedUser("membership-reuse")
                payosClient.paymentRequests.create.mockResolvedValueOnce({
                    orderCode: 555,
                    amount: MEMBERSHIP_PRICE_VND,
                    checkoutUrl: "https://payos.test/checkout/555",
                })

                const first = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: buildRequest({
                            paymentType: PaymentType.PayOS,
                        }),
                        user,
                    }),
                )
                const second = await handler.execute(
                    new PurchaseMembershipCommand({
                        request: buildRequest({
                            paymentType: PaymentType.PayOS,
                        }),
                        user,
                    }),
                )

                expect(second.transactionId).toBe(first.transactionId)
                // the gateway link is created exactly once — the second call reused the row
                expect(payosClient.paymentRequests.create).toHaveBeenCalledTimes(1)
                const count = await entityManager.count(TransactionEntity)
                expect(count).toBe(1)
            })

        it("rejects when membership is disabled (kill-switch) and writes no row",
            async () => {
                membershipEnabled = false
                const user = await seedUser("membership-disabled")

                await expect(
                    handler.execute(
                        new PurchaseMembershipCommand({
                            request: buildRequest({
                                paymentType: PaymentType.PayOS,
                            }),
                            user,
                        }),
                    ),
                ).rejects.toThrow(MembershipNotAvailableException)

                expect(payosClient.paymentRequests.create).not.toHaveBeenCalled()
                const count = await entityManager.count(TransactionEntity)
                expect(count).toBe(0)
            })
    })
