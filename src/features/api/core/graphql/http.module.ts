import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./graphql.module-definition"
import { 
    KeycloakModule 
} from "@modules/keycloak"
import { 
    PayosModule 
} from "../http/payos"
import { 
    SepayModule 
} from "@modules/sepay"

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
    ],
})
export class HttpModule extends ConfigurableModuleClass {}
