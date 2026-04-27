import {
    Module,
} from "@nestjs/common"
import {
    AuthOtpModule,
} from "@modules/auth-otp/auth-otp.module"
import {
    LoginVerifyOtpResolver,
} from "./login-verify-otp.resolver"
import {
    LoginVerifyOtpService,
} from "./login-verify-otp.service"
import {
    LoginVerifyOtpHandler,
} from "./login-verify-otp.handler"

@Module({
    imports: [
        AuthOtpModule,
    ],
    providers: [
        LoginVerifyOtpService,
        LoginVerifyOtpResolver,
        LoginVerifyOtpHandler,
    ],
})
export class LoginVerifyOtpMutationModule {}

