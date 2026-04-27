import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    ExchangeCodeForTokenMutationModule,
} from "./exchange-code-for-token"
import {
    RefreshTokenMutationModule,
} from "./refresh-token"

@Module({
    imports: [
        ExchangeCodeForTokenMutationModule.register({
            isGlobal: true,
        }),
        RefreshTokenMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class KeycloakMutationsModule extends ConfigurableModuleClass {}

