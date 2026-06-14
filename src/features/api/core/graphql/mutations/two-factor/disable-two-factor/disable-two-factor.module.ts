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
export class DisableTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
