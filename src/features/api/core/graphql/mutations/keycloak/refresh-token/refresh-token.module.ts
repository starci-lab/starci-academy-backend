import {
    Module,
} from "@nestjs/common"
import {
    RefreshTokenResolver,
} from "./refresh-token.resolver"
import {
    RefreshTokenService,
} from "./refresh-token.service"
import {
    RefreshTokenHandler,
} from "./refresh-token.handler"
import {
    RefreshTokenCoalescerService,
} from "./refresh-token-coalescer.service"
import {
    ConfigurableModuleClass,
} from "./refresh-token.module-definition"

@Module({
    providers: [
        RefreshTokenService,
        RefreshTokenResolver,
        RefreshTokenHandler,
        RefreshTokenCoalescerService,
    ],
})
export class RefreshTokenSingleMutationModule extends ConfigurableModuleClass {}

