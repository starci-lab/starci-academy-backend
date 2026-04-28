import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    ExchangeCodeForTokenMutationModule,
} from "./exchange-code-for-token"
import {
    RefreshTokenMutationModule,
} from "./refresh-token"
import {
    SignOutMutationModule,
} from "./sign-out"
import {
    SignInVerifyOtpMutationModule,
    SignInInitMutationModule,
} from "./sign-in"
import {
    SignUpInitMutationModule,
} from "./sign-up/init/sign-up-init.module"
import {
    SignUpVerifyOtpMutationModule,
} from "./sign-up/verify-otp/sign-up-verify-otp.module"

@Module({
    imports: [
        ExchangeCodeForTokenMutationModule.register({
            isGlobal: true,
        }),
        RefreshTokenMutationModule.register({
            isGlobal: true,
        }),
        SignOutMutationModule.register({
            isGlobal: true,
        }),
        SignInInitMutationModule.register({
            isGlobal: true,
        }),
        SignInVerifyOtpMutationModule.register({
            isGlobal: true,
        }),
        SignUpInitMutationModule.register({
            isGlobal: true,
        }),
        SignUpVerifyOtpMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class KeycloakMutationsModule extends ConfigurableModuleClass {}

