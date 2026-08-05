import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-up.module-definition"
import {
    SignUpInitResolver,
} from "./sign-up-init.resolver"
import {
    SignUpInitService,
} from "./sign-up-init.service"
import {
    SignUpInitHandler,
} from "./sign-up-init.handler"

@Module({
    providers: [
        SignUpInitService,
        SignUpInitResolver,
        SignUpInitHandler,
    ],
})
/** Wires sign-up init so account start can register without verify/resend. */
export class SignUpInitSingleMutationModule extends ConfigurableModuleClass {}

