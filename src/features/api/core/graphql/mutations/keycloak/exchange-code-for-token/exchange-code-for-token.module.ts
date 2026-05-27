import {
    Module,
} from "@nestjs/common"
import {
    ExchangeCodeForTokenResolver,
} from "./exchange-code-for-token.resolver"
import {
    ExchangeCodeForTokenService,
} from "./exchange-code-for-token.service"
import {
    ExchangeCodeForTokenHandler,
} from "./exchange-code-for-token.handler"
import {
    ConfigurableModuleClass,
} from "./exchange-code-for-token.module-definition"

@Module({
    providers: [
        ExchangeCodeForTokenService,
        ExchangeCodeForTokenResolver,
        ExchangeCodeForTokenHandler,
    ],
})
export class ExchangeCodeForTokenSingleMutationModule extends ConfigurableModuleClass {}

