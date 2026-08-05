import request from "supertest"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    Test,
} from "@nestjs/testing"
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    ActionType,
    AiSubStatus,
    AiSubscriptionEntity,
    AiSubTier,
    PaymentType,
    PricingPhase,
    PrimaryPostgreSQLModule,
    TransactionEntity,
    TransactionStatus,
    UserEntity,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
    createSuperJsonServiceProvider,
    DayjsService,
} from "@modules/mixin"
import {
    MountFilesystemService,
    AiAutoQuotaConfigService,
} from "@modules/filesystem"
import {
    EncryptionService,
} from "@modules/crypto"
import {
    EnqueueEnrollJobService,
    EnqueueReconcileTransactionJobService,
    EnqueueSendMailJobService,
    InstallmentPlanService,
    NotificationService,
    TransactionActionService,
    TransactionReconcileQueryService,
    VoucherService,
} from "@modules/bussiness"
import {
    MembershipService,
} from "@modules/membership"
import {
    WinstonService,
} from "@modules/winston"
import {
    SEPAY,
} from "@modules/sepay"
import {
    SepayWebhookController,
} from "@features/api/core/http/sepay/webhook/webhook.controller"
import {
    SepayWebhookService,
} from "@features/api/core/http/sepay/webhook/webhook.service"
import {
    SepayWebhookHandler,
} from "@features/api/core/http/sepay/webhook/webhook.handler"
import {
    ReconcileTransactionWorker,
} from "@features/api/processors/reconcile-transaction/reconcile-transaction.worker"
import type {
    SepayClientMock,
} from "@tests/helpers"
import {
    TestHelpersModule,
} from "@tests/helpers"

/** Connection name used by the primary PostgreSQL data source. */
const POSTGRESQL_PRIMARY = "primary"

/** URI of the SePay webhook (controller path "sepay", version "1", post "webhook"). */
const WEBHOOK_URL = "/v1/sepay/webhook"

/**
 * Narrow view onto {@link ReconcileTransactionWorker}'s private `finalize` --
 * the same method `process()` calls internally on a "paid" poll result. Cast
 * to this, a spec can drive the SECOND finalize path directly, exactly the
 * way `process()` would after resolving the gateway status itself.
 */
interface ReconcileFinalizer {
    finalize(transaction: TransactionEntity): Promise<void>
}

/**
 * Regression coverage for `.artifacts/states/transactions/findings.md` #1: the
 * atomic Pending -> Succeeded claim inside {@link AiEntitlementService.grantTier}
 * (the Round-1 money-race fix). Unlike `sepay-webhook.e2e-spec.ts`'s own
 * "idempotent" case -- which only proves a SEQUENTIAL replay (await the first
 * delivery, then await a second) -- this spec fires the webhook and the
 * reconcile worker's `finalize()` at the SAME still-Pending row CONCURRENTLY,
 * which is the actual race `grantTier`'s guarded `UPDATE ... WHERE status =
 * 'pending'` claim exists to close.
 *
 * Boots a dedicated module (not the shared `createE2eApp` helper) because this
 * spec needs a second finalize path -- {@link ReconcileTransactionWorker} -- that
 * the shared helper does not wire up.
 */
describe("Transaction grant concurrency — webhook vs reconcile race (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        let sepayClient: SepayClientMock
        let aiEntitlementService: AiEntitlementService
        let reconcileWorker: ReconcileFinalizer

        beforeAll(async () => {
            // outbound SePay SDK -- never hits the network in a test (same stub
            // sepay-webhook.e2e-spec.ts uses)
            sepayClient = {
                order: {
                    retrieve: jest.fn(),
                },
            }
            // course-enrollment hand-off -- unused by the AI-subscription branch
            // this spec exercises, stubbed like sepay-webhook.e2e-spec.ts
            const enqueueEnrollJob = {
                enqueue: jest.fn(),
            }

            const moduleRef = await Test.createTestingModule({
                imports: [
                    TestHelpersModule,
                    // real Postgres connection + schema sync against the test container
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    // CommandBus + automatic @CommandHandler discovery
                    CqrsModule,
                ],
                controllers: [
                    SepayWebhookController,
                ],
                providers: [
                    SepayWebhookService,
                    SepayWebhookHandler,
                    // the SECOND finalize path under test -- resolved from the app
                    // exactly like production DI would resolve it for a real poll
                    ReconcileTransactionWorker,
                    // real services so grantTier's atomic claim runs against the real DB
                    AiEntitlementService,
                    DayjsService,
                    createSuperJsonServiceProvider(),
                    // mocked outbound SDK
                    {
                        provide: SEPAY,
                        useValue: sepayClient,
                    },
                    {
                        provide: EnqueueEnrollJobService,
                        useValue: enqueueEnrollJob,
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            appConfig: () => ({
                                subscriptions: {
                                    tiers: [],
                                },
                            }),
                        },
                    },
                    {
                        provide: AiAutoQuotaConfigService,
                        useValue: {
                            getAutoQuota: () => ({
                                usesPer5h: 30,
                                usesPerWeek: 100,
                            }),
                        },
                    },
                    {
                        provide: EncryptionService,
                        useValue: {
                            encrypt: jest.fn(),
                            decrypt: jest.fn(),
                        },
                    },
                    // constructor deps of SepayWebhookHandler / ReconcileTransactionWorker
                    // that the AiSubscriptionPurchase-grant branch under test never
                    // reaches beyond "fire the post-grant side effect once" -- stubbed
                    // the same way the enroll queue above is stubbed, not exercised
                    // for real (no mail/queue/DB-adjacent infra involved)
                    {
                        provide: MembershipService,
                        useValue: {
                            grantMembership: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueSendMailJobService,
                        useValue: {
                            enqueue: jest.fn(),
                        },
                    },
                    {
                        provide: NotificationService,
                        useValue: {
                            createNotification: jest.fn(),
                        },
                    },
                    {
                        provide: TransactionReconcileQueryService,
                        useValue: {
                            resolve: jest.fn(),
                        },
                    },
                    {
                        provide: TransactionActionService,
                        useValue: {
                            updateTransactionStatusIfExpected: jest.fn(),
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
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
                    {
                        provide: VoucherService,
                        useValue: {
                            release: jest.fn(),
                        },
                    },
                    {
                        provide: InstallmentPlanService,
                        useValue: {
                            applyPaymentForTransaction: jest.fn(),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            // match the controller's `version: "1"` -> routes resolve at /v1/...
            app.enableVersioning({
                type: VersioningType.URI,
            })
            // mirror the production global ValidationPipe
            app.useGlobalPipes(new ValidationPipe())
            await app.init()

            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
            aiEntitlementService = app.get(AiEntitlementService)
            // `finalize` is private -- this cast is the only way to drive it directly,
            // the same way `process()` drives it internally after a "paid" poll
            reconcileWorker = app.get(ReconcileTransactionWorker) as unknown as ReconcileFinalizer
        })

        afterAll(async () => {
            // TypeORM's shutdown hook looks up the default (unnamed) DataSource,
            // which this named-only setup doesn't register -- ignore that noise.
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            // wipe the rows each test created so cases stay independent
            await entityManager.query(
                "TRUNCATE TABLE \"ai_subscriptions\", \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        /**
         * Seed a user + a pending AI-subscription-purchase transaction and return
         * the persisted transaction -- same shape `sepay-webhook.e2e-spec.ts` seeds
         * (with an email added so the post-grant notify path has a recipient).
         */
        const seedPendingPurchase = async (
            referenceId: string,
        ): Promise<TransactionEntity> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                        email: `${referenceId}@buyer.test`,
                    }),
            )
            return entityManager.save(
                entityManager.create(TransactionEntity,
                    {
                        user,
                        referenceId,
                        amount: 99_000,
                        pricingPhase: PricingPhase.Regular,
                        checkoutUrl: "https://pay.test/checkout",
                        status: TransactionStatus.Pending,
                        paymentType: PaymentType.Sepay,
                        actionType: ActionType.AiSubscriptionPurchase,
                        aiSubTier: AiSubTier.Plus,
                    }),
            )
        }

        it("grants the tier exactly once when the webhook and the reconcile poll race the same pending transaction",
            async () => {
                const transaction = await seedPendingPurchase("INV-RACE")
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        status: "PAID",
                    },
                })

                // spy on the real atomic claim BOTH finalize paths call through to --
                // webhook handler and worker share the same singleton instance
                const grantTierSpy = jest.spyOn(aiEntitlementService,
                    "grantTier")

                // fire BOTH production finalize paths concurrently on the SAME
                // still-Pending row. The webhook has its own app-level guard
                // (`findOne` WHERE status=Pending) before it ever reaches grantTier;
                // the reconcile worker's `finalize()` -- reached here exactly as
                // `process()` reaches it after a "paid" poll -- has no such guard of
                // its own. The atomic `UPDATE ... WHERE status = 'pending'` claim
                // inside grantTier is the ONLY thing standing between this and a
                // double grant.
                const [
                    webhookOutcome,
                    reconcileOutcome,
                ] = await Promise.allSettled([
                    request(app.getHttpServer())
                        .post(WEBHOOK_URL)
                        .send({
                            order_invoice_number: "INV-RACE",
                        }),
                    reconcileWorker.finalize(transaction),
                ])

                // neither racer should reject purely from losing the race -- a lost
                // claim is a silent no-op (affected: 0 -> return false), not a throw
                expect(webhookOutcome.status).toBe("fulfilled")
                expect(reconcileOutcome.status).toBe("fulfilled")

                // the grant path ran at least once. It may run once or twice
                // depending on race timing: the webhook's own `WHERE status =
                // 'pending'` findOne can short-circuit it BEFORE grantTier when
                // the reconcile poll wins the race and commits first. Whichever
                // grantTier calls happen, exactly ONE wins the atomic claim
                // (returns true); every loser's `claim.affected` was 0 and no-opped
                expect(grantTierSpy).toHaveBeenCalled()
                const grantResults = await Promise.all(
                    grantTierSpy.mock.results.map((result) => result.value),
                )
                expect(grantResults.filter(Boolean)).toHaveLength(1)

                // the funding transaction settled exactly once
                const settled = await entityManager.findOne(TransactionEntity,
                    {
                        where: {
                            id: transaction.id,
                        },
                    })
                expect(settled?.status).toBe(TransactionStatus.Succeeded)

                // exactly one entitlement row exists, granted exactly once -- not
                // double-applied by the loser of the race
                const subscriptions = await entityManager.find(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: transaction.userId,
                            },
                        },
                    })
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0].tier).toBe(AiSubTier.Plus)
                expect(subscriptions[0].status).toBe(AiSubStatus.Active)
            })

        it("documents the pre-existing sequential case still holds: a second delivery after the first settles is a no-op",
            async () => {
                const transaction = await seedPendingPurchase("INV-SEQ")
                sepayClient.order.retrieve.mockResolvedValue({
                    data: {
                        status: "PAID",
                    },
                })

                // first delivery settles the purchase and grants the tier
                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-SEQ",
                    })
                    .expect(201)

                // second delivery is fully AWAITED after the first already committed
                // -- the row is no longer Pending, so the webhook's own findOne guard
                // rejects it before grantTier is even reached (this is the scenario
                // sepay-webhook.e2e-spec.ts's "idempotent" test already covers)
                const replay = await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-SEQ",
                    })
                expect(replay.status).toBeGreaterThanOrEqual(400)

                // the reconcile worker's finalize(), called directly with the now-
                // stale in-memory transaction object (as if a late poll fired after
                // the webhook already won), also cannot grant a second time -- proof
                // that it's the atomic claim inside grantTier stopping it, not a
                // fresh read of the row's status
                await expect(
                    reconcileWorker.finalize(transaction),
                ).resolves.toBeUndefined()

                const subscriptions = await entityManager.find(AiSubscriptionEntity,
                    {
                        where: {
                            user: {
                                id: transaction.userId,
                            },
                        },
                    })
                expect(subscriptions).toHaveLength(1)
                expect(subscriptions[0].tier).toBe(AiSubTier.Plus)
            })
    })
