import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./confirm-two-factor.module-definition"
import {
    ConfirmTwoFactorResolver,
} from "./confirm-two-factor.resolver"

@Module({
    providers: [
        ConfirmTwoFactorResolver,
    ],
})
/**
 * Registers 2FA confirm (TOTP prove-out) separately from setup — confirming
 * must not rotate secrets the way setup does.
 */
export class ConfirmTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
