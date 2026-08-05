import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./sign-up-resend-otp.module-definition"
import {
    SignUpResendOtpResolver,
} from "./sign-up-resend-otp.resolver"
import {
    SignUpResendOtpService,
} from "./sign-up-resend-otp.service"
import {
    SignUpResendOtpHandler,
} from "./sign-up-resend-otp.handler"

@Module({
    providers: [
        SignUpResendOtpService,
        SignUpResendOtpResolver,
        SignUpResendOtpHandler,
    ],
})
/** Wires sign-up OTP resend as its own mutation so throttle can be stricter than init. */
export class SignUpResendOtpSingleMutationModule extends ConfigurableModuleClass {}
