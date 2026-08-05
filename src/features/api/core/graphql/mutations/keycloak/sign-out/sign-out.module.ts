import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-out.module-definition"
import {
    SignOutResolver,
} from "./sign-out.resolver"
import {
    SignOutService,
} from "./sign-out.service"
import {
    SignOutHandler,
} from "./sign-out.handler"
import {
    CookieModule,
} from "@modules/platform/cookie/cookie.module"

@Module({
    imports: [
        CookieModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SignOutService,
        SignOutResolver,
        SignOutHandler,
    ],
})
/** Wires sign-out with CookieModule so this mutation can clear auth cookies itself. */
export class SignOutSingleMutationModule extends ConfigurableModuleClass {}

