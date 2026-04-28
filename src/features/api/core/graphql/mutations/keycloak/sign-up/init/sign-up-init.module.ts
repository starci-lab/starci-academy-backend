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
export class SignUpInitMutationModule extends ConfigurableModuleClass {}

