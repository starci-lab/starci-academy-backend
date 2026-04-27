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
    ConfigurableModuleClass,
} from "./refresh-token.module-definition"

@Module({
    providers: [
        RefreshTokenService,
        RefreshTokenResolver,
        RefreshTokenHandler,
    ],
})
export class RefreshTokenMutationModule extends ConfigurableModuleClass {}

