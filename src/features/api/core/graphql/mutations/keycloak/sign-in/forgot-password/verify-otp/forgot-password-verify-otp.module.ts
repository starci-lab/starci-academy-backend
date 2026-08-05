import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./forgot-password-verify-otp.module-definition"
import {
    ForgotPasswordVerifyOtpResolver,
} from "./forgot-password-verify-otp.resolver"
import {
    ForgotPasswordVerifyOtpService,
} from "./forgot-password-verify-otp.service"
import {
    ForgotPasswordVerifyOtpHandler,
} from "./forgot-password-verify-otp.handler"

@Module({
    providers: [
        ForgotPasswordVerifyOtpService,
        ForgotPasswordVerifyOtpResolver,
        ForgotPasswordVerifyOtpHandler,
    ],
})
/** Wires reset-OTP verify so password apply + login stay in one mutation folder. */
export class ForgotPasswordVerifyOtpSingleMutationModule extends ConfigurableModuleClass {}