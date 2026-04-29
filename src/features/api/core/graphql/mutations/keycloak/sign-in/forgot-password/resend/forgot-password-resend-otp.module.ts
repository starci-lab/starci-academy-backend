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
export class ForgotPasswordResendOtpMutationModule extends ConfigurableModuleClass {}