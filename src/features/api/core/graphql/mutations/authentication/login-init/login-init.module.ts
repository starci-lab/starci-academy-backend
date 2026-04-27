import {
    Module,
} from "@nestjs/common"
import {
    AuthOtpModule,
} from "@modules/auth-otp/auth-otp.module"
import {
    LoginInitResolver,
} from "./login-init.resolver"
import {
    LoginInitService,
} from "./login-init.service"
import {
    LoginInitHandler,
} from "./login-init.handler"

@Module({
    imports: [
        AuthOtpModule,
    ],
    providers: [
        LoginInitService,
        LoginInitResolver,
        LoginInitHandler,
    ],
})
export class LoginInitMutationModule {}

