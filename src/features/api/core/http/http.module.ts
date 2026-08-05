import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./http.module-definition"
import {
    KeycloakModule,
} from "./keycloak/keycloak.module"
import {
    PayosModule,
} from "./payos/payos.module"
import {
    SepayModule,
} from "./sepay/sepay.module"
import {
    StripeModule,
} from "./stripe/stripe.module"
import {
    PaypalModule,
} from "./paypal/paypal.module"
import {
    NowPaymentsModule,
} from "./nowpayments/nowpayments.module"
import {
    MinioWebhookModule,
} from "./minio/webhook/webhook.module"
import {
    GithubModule,
} from "./github/github.module"
import {
    AdminModule,
} from "./admin/admin.module"
import {
    MountFoundationsModule,
} from "./mount/foundations/mount-foundations.module"


@Module({
    imports: [
        KeycloakModule.register(
            {
                isGlobal: true,
            }
        ),
        PayosModule.register(
            {
                isGlobal: true,
            }
        ),
        SepayModule.register(
            {
                isGlobal: true,
            }
        ),
        StripeModule.register(
            {
                isGlobal: true,
            }
        ),
        PaypalModule.register(
            {
                isGlobal: true,
            }
        ),
        NowPaymentsModule.register(
            {
                isGlobal: true,
            }
        ),
        GithubModule.register(
            {
                isGlobal: true,
            }
        ),
        MinioWebhookModule.register(
            {
                isGlobal: true,
            }
        ),
        AdminModule.register(
            {
                isGlobal: true,
            }
        ),
        MountFoundationsModule.register(
            {
                isGlobal: true,
            }
        ),
    ],
})
/**
 * Module for the HTTP.
 */
export class HttpModule extends ConfigurableModuleClass { }
