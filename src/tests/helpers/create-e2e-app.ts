import {
    Test,
} from "@nestjs/testing"
import {
    BullModule as NestBullModule,
} from "@nestjs/bullmq"
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases/postgresql/primary/primary.module"
import {
    AiEntitlementService,
} from "@modules/ai/ai-entitlement.service"
import {
    DayjsService,
} from "@modules/lib/mixin/dayjs.service"
import {
    AiAutoQuotaConfigService,
} from "@modules/filesystem/ai-auto-quota-config.service"
import {
    MountFilesystemService,
} from "@modules/filesystem/mount.service"
import {
    EncryptionService,
} from "@modules/crypto/encryption.service"
import {
    EnqueueEnrollJobService,
} from "@modules/bussiness/jobs/enqueue/enroll.service"
import {
    EnqueueSendMailJobService,
} from "@modules/bussiness/jobs/enqueue/send-mail.service"
import {
    EnqueueReconcileTransactionJobService,
} from "@modules/bussiness/jobs/enqueue/reconcile-transaction.service"
import {
    VoucherService,
} from "@modules/bussiness/rewards/voucher.service"
import {
    TransactionActionService,
} from "@modules/bussiness/transactions/atomic/transaction-action.service"
import {
    TransactionReconcileQueryService,
} from "@modules/bussiness/transactions/atomic/transaction-reconcile-query.service"
import {
    InstallmentPlanService,
} from "@modules/bussiness/installment-plan/installment-plan.service"
import {
    NotificationService,
} from "@modules/bussiness/notification/notification.service"
import {
    TransactionGrantService,
} from "@modules/bussiness/transactions/atomic/transaction-grant.service"
import {
    MembershipService,
} from "@modules/membership/membership.service"
import {
    SEPAY,
} from "@modules/integrations/sepay/constants/sepay"
import {
    PaypalClient,
} from "@modules/integrations/paypal/paypal.client"
import {
    NowPaymentsClient,
} from "@modules/integrations/nowpayments/nowpayments.client"
import {
    PAYOS,
} from "@modules/integrations/payos/constants/payos"
import {
    STRIPE,
} from "@modules/integrations/stripe/constants/stripe"
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
    PayosWebhookController,
} from "@features/api/core/http/payos/webhook/webhook.controller"
import {
    PayosWebhookService,
} from "@features/api/core/http/payos/webhook/webhook.service"
import {
    PayosWebhookHandler,
} from "@features/api/core/http/payos/webhook/webhook.handler"
import {
    StripeWebhookController,
} from "@features/api/core/http/stripe/webhook/webhook.controller"
import {
    StripeWebhookService,
} from "@features/api/core/http/stripe/webhook/webhook.service"
import {
    StripeWebhookHandler,
} from "@features/api/core/http/stripe/webhook/webhook.handler"
import {
    WinstonService,
} from "@modules/platform/winston/winston.service"
import {
    bullData,
} from "@modules/integrations/bullmq/constants/queue"
import {
    BullQueueName,
} from "@modules/integrations/bullmq/enums/queue-name"
import {
    createSuperJsonServiceProvider,
} from "@modules/lib/mixin/superjson.providers"
import {
    ReconcileTransactionWorker,
} from "@features/api/processors/reconcile-transaction/reconcile-transaction.worker"
import type {
    E2eApp,
} from "./types/e2e-app"
import type {
    SepayClientMock,
    PayosClientMock,
    StripeClientMock,
} from "./types/webhook-client-mocks"

/**
 * A stand-in for {@link WinstonService} that swallows every log line.
 *
 * The real service injects three Winston `Logger` instances, one of which ships
 * to Loki -- a test must never open that transport, and an assertion cares about
 * the rows a handler wrote, never about what it logged. Exported so the specs
 * that build their OWN testing module reuse this exact stub rather than each
 * inventing a slightly different one.
 */
export const winstonServiceMock = {
    provide: WinstonService,
    useValue: {
        log: jest.fn(),
    },
}

/**
 * Boot a focused e2e application around the SePay webhook flow.
 *
 * Real: the HTTP stack, the CQRS bus, the primary Postgres datasource (against
 * the Testcontainers DB), {@link AiEntitlementService} and {@link DayjsService}
 * -- so a grant actually writes rows.
 *
 * Mocked: the outbound SePay SDK, the enroll job queue, and the
 * filesystem/crypto config services the grant path never exercises.
 *
 * @returns the booted {@link E2eApp}
 */
export const createE2eApp = async (): Promise<E2eApp> => {
    // outbound payment-gateway SDKs -- never hit the network in a test
    const sepayClient: SepayClientMock = {
        order: {
            retrieve: jest.fn(),
        },
    }
    const payosClient: PayosClientMock = {
        paymentRequests: {
            get: jest.fn().mockResolvedValue({
                status: "PAID",
                amountPaid: 500_000,
            }),
        },
        webhooks: {
            verify: jest.fn(),
        },
    }
    const stripeClient: StripeClientMock = {
        checkout: {
            sessions: {
                retrieve: jest.fn(),
            },
        },
        webhooks: {
            constructEvent: jest.fn(),
        },
    }

    // course-enrollment hand-off -- asserted, never actually queued
    const enqueueEnrollJob = {
        enqueue: jest.fn(),
    }

    const moduleRef = await Test.createTestingModule({
        imports: [
            // real Postgres connection + schema sync against the test container.
            // skip hydration/seeders/resolvers -- they pull global app deps the
            // focused webhook flow does not need.
            PrimaryPostgreSQLModule.register({
                isGlobal: true,
                withHydration: false,
                withResolvers: false,
            }),
            // CommandBus + automatic @CommandHandler discovery
            CqrsModule,
            NestBullModule.forRoot({
                connection: {
                    host: process.env.REDIS_BULLMQ_HOST,
                    port: Number(process.env.REDIS_BULLMQ_PORT),
                    password: process.env.REDIS_BULLMQ_PASSWORD,
                },
            }),
            NestBullModule.registerQueue({
                name: bullData[BullQueueName.ReconcileTransaction].name,
                prefix: bullData[BullQueueName.ReconcileTransaction].prefix,
            }),
        ],
        controllers: [
            SepayWebhookController,
            PayosWebhookController,
            StripeWebhookController,
        ],
        providers: [
            SepayWebhookService,
            SepayWebhookHandler,
            PayosWebhookService,
            PayosWebhookHandler,
            StripeWebhookService,
            StripeWebhookHandler,
            // real services so grantTier mutates the real DB
            AiEntitlementService,
            InstallmentPlanService,
            TransactionGrantService,
            ReconcileTransactionWorker,
            TransactionReconcileQueryService,
            TransactionActionService,
            VoucherService,
            createSuperJsonServiceProvider(),
            DayjsService,
            // every handler logs through WinstonService; stubbed so no test
            // opens the Loki transport
            winstonServiceMock,
            // mocked externals / unused-by-grant config
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
                useValue: {
                    retrieveOrder: jest.fn(),
                    captureOrder: jest.fn(),
                },
            },
            {
                provide: NowPaymentsClient,
                useValue: {
                    getInvoiceStatus: jest.fn(),
                },
            },
            {
                provide: EnqueueEnrollJobService,
                useValue: enqueueEnrollJob,
            },
            // grant-path side effects the webhook handlers inject but that a
            // grant assertion never needs to actually fire -- stubbed so Nest can
            // resolve the full handler provider graph at compile()
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
            EnqueueReconcileTransactionJobService,
            {
                provide: NotificationService,
                useValue: {
                    createNotification: jest.fn(),
                },
            },
            {
                provide: MountFilesystemService,
                useValue: {
                    sepayIpnSecret: () => "e2e-sepay-secret",
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
        ],
    }).compile()

    const app = moduleRef.createNestApplication({
        // keep the raw request body so the Stripe controller can read
        // `request.rawBody` for signature verification (mirrors production boot)
        rawBody: true,
    })
    // match the controller's `version: "1"` -> routes resolve at /v1/...
    app.enableVersioning({
        type: VersioningType.URI,
    })
    // mirror the production global ValidationPipe
    app.useGlobalPipes(new ValidationPipe())
    await app.init()

    return {
        app,
        sepayClient,
        payosClient,
        stripeClient,
        enqueueEnrollJob,
    }
}
