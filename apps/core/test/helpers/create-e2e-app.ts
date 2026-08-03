import {
    Test,
} from "@nestjs/testing"
import {
    ValidationPipe,
    VersioningType,
} from "@nestjs/common"
import {
    CqrsModule,
} from "@nestjs/cqrs"
import {
    PrimaryPostgreSQLModule,
} from "@modules/databases"
import {
    AiEntitlementService,
} from "@modules/ai"
import {
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
    EnqueueSendMailJobService,
    NotificationService,
} from "@modules/bussiness"
import {
    MembershipService,
} from "@modules/membership"
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
import type {
    SepayClientMock,
    PayosClientMock,
    StripeClientMock,
    E2eApp,
} from "./types"

/**
 * Boot a focused e2e application around the SePay webhook flow.
 *
 * Real: the HTTP stack, the CQRS bus, the primary Postgres datasource (against
 * the Testcontainers DB), {@link AiEntitlementService} and {@link DayjsService}
 * — so a grant actually writes rows.
 *
 * Mocked: the outbound SePay SDK, the enroll job queue, and the
 * filesystem/crypto config services the grant path never exercises.
 *
 * @returns the booted {@link E2eApp}
 */
export const createE2eApp = async (): Promise<E2eApp> => {
    // outbound payment-gateway SDKs — never hit the network in a test
    const sepayClient: SepayClientMock = {
        order: {
            retrieve: jest.fn(),
        },
    }
    const payosClient: PayosClientMock = {
        webhooks: {
            verify: jest.fn(),
        },
    }
    const stripeClient: StripeClientMock = {
        webhooks: {
            constructEvent: jest.fn(),
        },
    }

    // course-enrollment hand-off — asserted, never actually queued
    const enqueueEnrollJob = {
        enqueue: jest.fn(),
    }

    const moduleRef = await Test.createTestingModule({
        imports: [
            // real Postgres connection + schema sync against the test container.
            // skip hydration/seeders/resolvers — they pull global app deps the
            // focused webhook flow does not need.
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
            DayjsService,
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
                provide: EnqueueEnrollJobService,
                useValue: enqueueEnrollJob,
            },
            // grant-path side effects the webhook handlers inject but that a
            // grant assertion never needs to actually fire — stubbed so Nest can
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
            {
                provide: NotificationService,
                useValue: {
                    createNotification: jest.fn(),
                },
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
        ],
    }).compile()

    const app = moduleRef.createNestApplication({
        // keep the raw request body so the Stripe controller can read
        // `request.rawBody` for signature verification (mirrors production boot)
        rawBody: true,
    })
    // match the controller's `version: "1"` → routes resolve at /v1/...
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
