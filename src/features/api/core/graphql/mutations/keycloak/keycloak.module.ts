import {
    Module,
} from "@nestjs/common"
import {
    ConfigurableModuleClass,
} from "./keycloak.module-definition"
import {
    ExchangeCodeForTokenSingleMutationModule,
} from "./exchange-code-for-token/exchange-code-for-token.module"
import {
    RefreshTokenSingleMutationModule,
} from "./refresh-token/refresh-token.module"
import {
    SignOutSingleMutationModule,
} from "./sign-out/sign-out.module"
import {
    RevokeSessionSingleMutationModule,
} from "./revoke-session/revoke-session.module"
import {
    ForgotPasswordInitSingleMutationModule,
} from "./sign-in/forgot-password/init/forgot-password-init.module"
import {
    ForgotPasswordResendOtpSingleMutationModule,
} from "./sign-in/forgot-password/resend/forgot-password-resend-otp.module"
import {
    ForgotPasswordVerifyOtpSingleMutationModule,
} from "./sign-in/forgot-password/verify-otp/forgot-password-verify-otp.module"
import {
    SignInInitSingleMutationModule,
} from "./sign-in/init/sign-in-init.module"
import {
    SignInResendOtpSingleMutationModule,
} from "./sign-in/resend/sign-in-resend-otp.module"
import {
    SignInVerifyOtpSingleMutationModule,
} from "./sign-in/verify-otp/sign-in-verify-otp.module"
import {
    SignUpInitSingleMutationModule,
} from "./sign-up/init/sign-up-init.module"
import {
    SignUpResendOtpSingleMutationModule,
} from "./sign-up/resend/sign-up-resend-otp.module"
import {
    SignUpVerifyOtpSingleMutationModule,
} from "./sign-up/verify-otp/sign-up-verify-otp.module"
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