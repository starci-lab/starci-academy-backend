import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-in-verify-otp.module-definition"
import {
    SignInVerifyOtpResolver,
} from "./sign-in-verify-otp.resolver"
import {
    SignInVerifyOtpService,
} from "./sign-in-verify-otp.service"
import {
    SignInVerifyOtpHandler,
} from "./sign-in-verify-otp.handler"
import {
    CookieModule,
} from "@modules/cookie"

@Module({
    imports: [
        CookieModule.register({
            isGlobal: true,
        }),
    ],
    providers: [
        SignInVerifyOtpService,
        SignInVerifyOtpResolver,
        SignInVerifyOtpHandler,
    ],
})
export class SignInVerifyOtpMutationModule extends ConfigurableModuleClass {}

