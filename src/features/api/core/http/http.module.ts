import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./http.module-definition"
import {
    KeycloakModule,
} from "./keycloak"
import {
    PayosModule,
} from "./payos"
import {
    SepayModule,
} from "./sepay"
import {
    StripeModule,
} from "./stripe"
import {
    PaypalModule,
} from "./paypal"
import {
    NowPaymentsModule,
} from "./nowpayments"
import {
    MinioWebhookModule,
} from "./minio"
import {
    GithubModule,
} from "./github"
import {
    AdminModule,
} from "./admin"
import {
    MountFoundationsModule,
} from "./mount/foundations"


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
