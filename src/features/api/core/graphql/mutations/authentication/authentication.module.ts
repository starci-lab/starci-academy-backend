import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./authentication.module-definition"
import {
    ConnectGithubAccountMutationModule,
} from "./connect-github-account"
import {
    LoginInitMutationModule,
} from "./login-init"
import {
    LoginVerifyOtpMutationModule,
} from "./login-verify-otp"

@Module({
    imports: [
        ConnectGithubAccountMutationModule,
        LoginInitMutationModule,
        LoginVerifyOtpMutationModule,
    ],
})
export class AuthenticationMutationsModule extends ConfigurableModuleClass {}
