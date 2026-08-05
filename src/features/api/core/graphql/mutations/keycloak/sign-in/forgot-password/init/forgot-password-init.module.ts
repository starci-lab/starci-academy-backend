import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./forgot-password-init.module-definition"
import {
    ForgotPasswordInitResolver,
} from "./forgot-password-init.resolver"
import {
    ForgotPasswordInitService,
} from "./forgot-password-init.service"
import {
    ForgotPasswordInitHandler,
} from "./forgot-password-init.handler"

@Module({
    providers: [
        ForgotPasswordInitService,
        ForgotPasswordInitResolver,
        ForgotPasswordInitHandler,
    ],
})
/** Wires forgot-password init as its own mutation so reset OTP can ship independently. */
export class ForgotPasswordInitSingleMutationModule extends ConfigurableModuleClass {}