import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./disable-two-factor.module-definition"
import {
    DisableTwoFactorResolver,
} from "./disable-two-factor.resolver"

@Module({
    providers: [
        DisableTwoFactorResolver,
    ],
})
/**
 * Registers 2FA disable as its own leaf so teardown cannot share setup /
 * confirm resolvers (those mint or prove secrets; this one clears them).
 */
export class DisableTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
