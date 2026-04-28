import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-up-verify-otp.module-definition"
import {
    SignUpVerifyOtpResolver,
} from "./sign-up-verify-otp.resolver"
import {
    SignUpVerifyOtpService,
} from "./sign-up-verify-otp.service"
import {
    SignUpVerifyOtpHandler,
} from "./sign-up-verify-otp.handler"

@Module({
    providers: [
        SignUpVerifyOtpService,
        SignUpVerifyOtpResolver,
        SignUpVerifyOtpHandler,
    ],
})
export class SignUpVerifyOtpMutationModule extends ConfigurableModuleClass {}

