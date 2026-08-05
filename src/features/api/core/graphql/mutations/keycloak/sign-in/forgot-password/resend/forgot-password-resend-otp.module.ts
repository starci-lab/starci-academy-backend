import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./forgot-password-resend-otp.module-definition"
import {
    ForgotPasswordResendOtpResolver,
} from "./forgot-password-resend-otp.resolver"
import {
    ForgotPasswordResendOtpService,
} from "./forgot-password-resend-otp.service"
import {
    ForgotPasswordResendOtpHandler,
} from "./forgot-password-resend-otp.handler"

@Module({
    providers: [
        ForgotPasswordResendOtpService,
        ForgotPasswordResendOtpResolver,
        ForgotPasswordResendOtpHandler,
    ],
})
/** Wires reset-OTP resend as its own mutation so throttle can be stricter than init. */
export class ForgotPasswordResendOtpSingleMutationModule extends ConfigurableModuleClass {}