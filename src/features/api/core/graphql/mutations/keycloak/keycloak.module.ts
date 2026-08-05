import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    ExchangeCodeForTokenSingleMutationModule,
} from "./exchange-code-for-token"
import {
    RefreshTokenSingleMutationModule,
} from "./refresh-token"
import {
    SignOutSingleMutationModule,
} from "./sign-out"
import {
    RevokeSessionSingleMutationModule,
} from "./revoke-session"
import {
    SignInVerifyOtpSingleMutationModule,
    SignInInitSingleMutationModule,
    SignInResendOtpSingleMutationModule,
    ForgotPasswordInitSingleMutationModule,
    ForgotPasswordResendOtpSingleMutationModule,
    ForgotPasswordVerifyOtpSingleMutationModule,
} from "./sign-in"
import {
    SignUpInitSingleMutationModule,
    SignUpVerifyOtpSingleMutationModule,
    SignUpResendOtpSingleMutationModule,
} from "./sign-up"
@Module({
    imports: [
        ExchangeCodeForTokenSingleMutationModule.register({
            isGlobal: true,
        }),
        RefreshTokenSingleMutationModule.register({
            isGlobal: true,
        }),
        SignOutSingleMutationModule.register({
            isGlobal: true,
        }),
        RevokeSessionSingleMutationModule.register({
            isGlobal: true,
        }),
        SignInInitSingleMutationModule.register({
            isGlobal: true,
        }),
        SignInVerifyOtpSingleMutationModule.register({
            isGlobal: true,
        }),
        SignInResendOtpSingleMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordInitSingleMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordResendOtpSingleMutationModule.register({
            isGlobal: true,
        }),
        ForgotPasswordVerifyOtpSingleMutationModule.register({
            isGlobal: true,
        }),
        SignUpInitSingleMutationModule.register({
            isGlobal: true,
        }),
        SignUpVerifyOtpSingleMutationModule.register({
            isGlobal: true,
        }),
        SignUpResendOtpSingleMutationModule.register({
            isGlobal: true,
        }),
    ],
})
/**
 * Aggregates every Keycloak write (sign-in/up, OTP, token, session) so the API
 * app can import auth mutations as one configurable module.
 */
export class KeycloakMutationsModule extends ConfigurableModuleClass {}