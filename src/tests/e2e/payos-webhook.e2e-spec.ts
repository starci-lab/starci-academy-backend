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
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    PayosWebhookController,
} from "@features/api/core/http/payos/webhook/webhook.controller"
import {
    PayosWebhookHandler,
} from "@features/api/core/http/payos/webhook/webhook.handler"
import {
    PayosWebhookService,
} from "@features/api/core/http/payos/webhook/webhook.service"

const POSTGRESQL_PRIMARY = "primary"
const WEBHOOK_URL = "/v1/payos/webhook"
const payosBody = (orderCode: string,
    success = true) => ({
    code: success ? "00" : "01",
    desc: success ? "success" : "failed",
    success,
    data: {
        orderCode,
        amount: 99_000,
        description: "AI subscription",
        accountNumber: "0001",
        reference: "ref",
        transactionDateTime: "2026-06-11T00:00:00Z",
        currency: "VND",
        paymentLinkId: "plink",
        code: success ? "00" : "01",
        desc: success ? "success" : "failed",
    },
    signature: "valid-signature",
})

describe("PayOS webhook verified wake-up (e2e)",
    () => {
        let app: INestApplication
        let entityManager: EntityManager
        const enqueue = jest.fn()
        const verify = jest.fn()

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
                    PayosWebhookController,
                ],
                providers: [
                    PayosWebhookService,
                    PayosWebhookHandler,
                    {
                        provide: PAYOS,
                        useValue: {
                            webhooks: {
                                verify,
                            },
                        },
                    },
                    {
                        provide: EnqueueReconcileTransactionJobService,
                        useValue: {
                            enqueue,
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
                        paymentType: PaymentType.PayOS,
                        actionType: ActionType.AiSubscriptionPurchase,
                    }),
            )
            return transaction.id
        }

        it("rejects a bad signature and never wakes reconciliation",
            async () => {
                await seedPending("700001")
                verify.mockRejectedValueOnce(new Error("invalid signature"))

                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700001"))
                    .expect(500)
                expect(enqueue).not.toHaveBeenCalled()
            })

        it("ACKs 200 and wakes reconciliation for a verified pending payment",
            async () => {
                const transactionId = await seedPending("700002")
                verify.mockResolvedValueOnce(undefined)

                await request(app.getHttpServer())
                    .post(WEBHOOK_URL)
                    .send(payosBody("700002"))
                    .expect(200)

                expect(enqueue).toHaveBeenCalledWith({
                    transactionId,
                    attempt: 1,
                    delayMs: 0,
                    lane: "fast",
                    deduplication: {
                        id: `payos-webhook:${transactionId}`,
                        ttlMs: 30_000,
                    },
                })
            })

        it("ACKs probe, non-success, unknown and replay without a wake-up",
            async () => {
                const transactionId = await seedPending("700003")
                await entityManager.update(TransactionEntity,
                    transactionId,
                    {
                        status: TransactionStatus.Succeeded,
                    })
                verify.mockResolvedValue(undefined)

                for (const body of [
                    payosBody("0"),
                    payosBody("700004",
                        false),
                    payosBody("700004"),
                    payosBody("700003"),
                ]) {
                    await request(app.getHttpServer())
                        .post(WEBHOOK_URL)
                        .send(body)
                        .expect(200)
                }
                expect(enqueue).not.toHaveBeenCalled()
            })
    })
