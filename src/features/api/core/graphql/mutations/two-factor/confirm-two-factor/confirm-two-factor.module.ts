import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./confirm-two-factor.module-definition"
import {
    ConfirmTwoFactorResolver,
} from "./confirm-two-factor.resolver"
import {
    ConfirmTwoFactorService,
} from "./confirm-two-factor.service"
import {
    ConfirmTwoFactorHandler,
} from "./confirm-two-factor.handler"

@Module({
    providers: [
        ConfirmTwoFactorResolver,
        ConfirmTwoFactorService,
        ConfirmTwoFactorHandler,
    ],
})
/**
 * Registers 2FA confirm (TOTP prove-out) separately from setup -- confirming
 * must not rotate secrets the way setup does.
 */
export class ConfirmTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
