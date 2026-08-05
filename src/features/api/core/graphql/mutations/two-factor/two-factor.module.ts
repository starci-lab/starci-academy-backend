import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./two-factor.module-definition"
import {
    SetupTwoFactorSingleMutationModule,
} from "./setup-two-factor/setup-two-factor.module"
import {
    ConfirmTwoFactorSingleMutationModule,
} from "./confirm-two-factor/confirm-two-factor.module"
import {
    DisableTwoFactorSingleMutationModule,
} from "./disable-two-factor/disable-two-factor.module"

@Module({
    imports: [
        SetupTwoFactorSingleMutationModule.register({
            isGlobal: true,
        }),
        ConfirmTwoFactorSingleMutationModule.register({
            isGlobal: true,
        }),
        DisableTwoFactorSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Two-factor (TOTP) mutation group -- setup, confirm, disable.
 */
export class TwoFactorMutationsModule extends ConfigurableModuleClass {}
