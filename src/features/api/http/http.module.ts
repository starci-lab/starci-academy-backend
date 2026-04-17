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
    MinioWebhookModule,
} from "./minio"


/**
 * Module for the HTTP.
 */
@Module({
    imports: [
        KeycloakModule.register({
            isGlobal: true,
        }),
        PayosModule.register({
            isGlobal: true,
        }),
        SepayModule.register({
            isGlobal: true,
        }),
        MinioWebhookModule,
    ],
})
export class HttpModule extends ConfigurableModuleClass {}
