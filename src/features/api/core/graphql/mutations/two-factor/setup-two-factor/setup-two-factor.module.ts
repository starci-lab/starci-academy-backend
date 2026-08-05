import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./setup-two-factor.module-definition"
import {
    SetupTwoFactorResolver,
} from "./setup-two-factor.resolver"

@Module({
    providers: [
        SetupTwoFactorResolver,
    ],
})
/**
 * Registers 2FA setup (secret mint + otpauth URL) separately from confirm
 * so a setup call never marks 2FA active without a valid TOTP.
 */
export class SetupTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
