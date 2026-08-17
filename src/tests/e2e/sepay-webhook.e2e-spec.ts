import request from "supertest"
import {
    Test,
} from "@nestjs/testing"
import type {
    INestApplication,
} from "@nestjs/common"
import {
    VersioningType,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    getEntityManagerToken,
} from "@nestjs/typeorm"
import type {
    EntityManager,
} from "typeorm"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    TransactionEntity,
} from "@modules/databases/postgresql/primary/entities/transaction.entity"
import {
    UserEntity,
} from "@modules/databases/postgresql/primary/entities/user.entity"
import {
    ActionType,
} from "@modules/databases/postgresql/primary/enums/action-type"
import {
    PaymentType,
} from "@modules/databases/postgresql/primary/enums/payment-type"
import {
    PricingPhase,
} from "@modules/databases/postgresql/primary/enums/pricing-phase"
import {
    TransactionStatus,
} from "@modules/databases/postgresql/primary/enums/transaction-status"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    AbstractExceptionHttpFilter,
} from "@modules/platform/exceptions/filters/abstract-exception-http.filter"
import {
    SepayWebhookController,
} from "@features/api/core/http/sepay/webhook/webhook.controller"
import {
    SepayWebhookGuard,
} from "@features/api/core/http/sepay/webhook/webhook.guard"
import {
    SepayWebhookHandler,
} from "@features/api/core/http/sepay/webhook/webhook.handler"
import {
    SepayWebhookService,
} from "@features/api/core/http/sepay/webhook/webhook.service"

const POSTGRESQL_PRIMARY = "primary"
const WEBHOOK_URL = "/v1/sepay/webhook"
const IPN_SECRET = "e2e-sepay-secret"

describe("SePay webhook authenticated wake-up (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        const enqueue = jest.fn()

        beforeAll(async () => {
            const moduleRef = await Test.createTestingModule({
                imports: [
                    PrimaryPostgreSQLModule.register({
                        isGlobal: true,
                        withHydration: false,
                        withResolvers: false,
                    }),
                    CqrsModule,
                ],
                controllers: [
                    SepayWebhookController,
                ],
                providers: [
                    SepayWebhookService,
                    SepayWebhookHandler,
                    SepayWebhookGuard,
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue,
                        },
                    },
                    {
                        provide: MountFilesystemService,
                        useValue: {
                            sepayIpnSecret: () => IPN_SECRET,
                        },
                    },
                    {
                        provide: WinstonService,
                        useValue: {
                            log: jest.fn(),
                        },
                    },
                ],
            }).compile()

            app = moduleRef.createNestApplication()
            app.enableVersioning({
                type: VersioningType.URI,
            })
            app.useGlobalFilters(new AbstractExceptionHttpFilter(
                moduleRef.get(WinstonService),
            ))
            await app.init()
            entityManager = app.get<EntityManager>(
                getEntityManagerToken(POSTGRESQL_PRIMARY),
            )
        })

        afterAll(async () => {
            await app.close().catch(() => undefined)
        })

        afterEach(async () => {
            await entityManager.query(
                "TRUNCATE TABLE \"transactions\", \"users\" RESTART IDENTITY CASCADE",
            )
            jest.clearAllMocks()
        })

        const seedPending = async (referenceId: string): Promise<string> => {
            const user = await entityManager.save(
                entityManager.create(UserEntity,
                    {
                        keycloakId: `kc-${referenceId}`,
                    }),
            )
            const transaction = await entityManager.save(
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
                    }),
            )
            return transaction.id
        }

        it("rejects missing or wrong transport secret",
            async () => {
                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send({
                        order_invoice_number: "INV-AUTH",
                    })
                    .expect(401)
                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .set("X-Secret-Key",
                        "wrong")
                    .send({
                        order_invoice_number: "INV-AUTH",
                    })
                    .expect(401)
                expect(enqueue).not.toHaveBeenCalled()
            })

        it("ACKs 200 and wakes reconciliation for a pending invoice",
            async () => {
                const transactionId = await seedPending("INV-PENDING")

                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .set("X-Secret-Key",
                        IPN_SECRET)
                    .send({
                        order_invoice_number: "INV-PENDING",
                    })
                    .expect(200)

                expect(enqueue).toHaveBeenCalledWith({
                    transactionId,
                    attempt: 1,
                    delayMs: 0,
                    lane: "fast",
                    deduplication: {
                        id: `sepay-webhook:${transactionId}`,
                        ttlMs: 30_000,
                    },
                })
            })

        it("ACKs missing, unknown and replayed invoices without a wake-up",
            async () => {
                const transactionId = await seedPending("INV-REPLAY")
                await entityManager.update(TransactionEntity,
                    transactionId,
                    {
                        status: TransactionStatus.Succeeded,
                    })

                for (const body of [
                    {
                    },
                    {
                        order_invoice_number: "INV-UNKNOWN",
                    },
                    {
                        order_invoice_number: "INV-REPLAY",
                    },
                ]) {
                    await request(app.getHttpServer())
                        .post(WEBHOOK_URL)
                        .set("X-Secret-Key",
                            IPN_SECRET)
                        .send(body)
                        .expect(200)
                }
                expect(enqueue).not.toHaveBeenCalled()
            })
    })
