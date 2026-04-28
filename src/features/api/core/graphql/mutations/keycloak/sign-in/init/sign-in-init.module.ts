import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-in.module-definition"
import {
    SignInInitResolver,
} from "./sign-in-init.resolver"
import {
    SignInInitService,
} from "./sign-in-init.service"
import {
    SignInInitHandler,
} from "./sign-in-init.handler"

@Module({
    providers: [
        SignInInitService,
        SignInInitResolver,
        SignInInitHandler,
    ],
})
export class SignInInitMutationModule extends ConfigurableModuleClass {}

