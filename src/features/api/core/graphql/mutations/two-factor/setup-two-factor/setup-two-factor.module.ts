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
export class SetupTwoFactorSingleMutationModule extends ConfigurableModuleClass {}
