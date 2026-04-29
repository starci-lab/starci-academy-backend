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
    SignInResendOtpMutationModule,
    ForgotPasswordInitMutationModule,
    ForgotPasswordResendOtpMutationModule,
    ForgotPasswordVerifyOtpMutationModule,
} from "./sign-in"
import {
    SignUpInitMutationModule,
    SignUpVerifyOtpMutationModule,
    SignUpResendOtpMutationModule,
} from "./sign-up"
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
        SignInResendOtpMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordInitMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordResendOtpMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordVerifyOtpMutationModule.register({
            isGlobal: true,
        }),
        SignUpInitMutationModule.register({
            isGlobal: true,
        }),
        SignUpVerifyOtpMutationModule.register({
            isGlobal: true,
        }),
        SignUpResendOtpMutationModule.register({
            isGlobal: true,
        }),
    ],
})
export class KeycloakMutationsModule extends ConfigurableModuleClass {}