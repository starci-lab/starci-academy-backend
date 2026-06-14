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
export class ConfirmTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
