import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./graphql.module-definition"
import {
    KeycloakModule,
} from "./keycloak"
import {
    PayosModule,
} from "./payos"

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
    ],
})
export class HttpModule extends ConfigurableModuleClass {}
