import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-in-resend-otp.module-definition"
import {
    SignInResendOtpResolver,
} from "./sign-in-resend-otp.resolver"
import {
    SignInResendOtpService,
} from "./sign-in-resend-otp.service"
import {
    SignInResendOtpHandler,
} from "./sign-in-resend-otp.handler"

@Module({
    providers: [
        SignInResendOtpService,
        SignInResendOtpResolver,
        SignInResendOtpHandler,
    ],
})
export class SignInResendOtpMutationModule extends ConfigurableModuleClass {}
