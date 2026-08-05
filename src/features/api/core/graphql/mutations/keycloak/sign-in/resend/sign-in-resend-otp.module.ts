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
/** Wires sign-in OTP resend as its own mutation so throttle can be stricter than init. */
export class SignInResendOtpSingleMutationModule extends ConfigurableModuleClass {}
