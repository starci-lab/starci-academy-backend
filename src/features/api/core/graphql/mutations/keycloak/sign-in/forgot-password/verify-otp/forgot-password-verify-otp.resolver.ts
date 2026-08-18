import {
    Args,
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import {
    GraphQLSuccessMessage,
    GraphQLTransformInterceptor,
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    ThrottlerConfig,
} from "@modules/platform/throttler/enums/throttler-config"
import {
    UseThrottler,
} from "@modules/platform/throttler/throttler.decorators"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    CsrfService,
} from "@modules/platform/csrf/csrf.service"
import {
    SessionService,
} from "@modules/platform/session/session.service"
import {
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "../../verify-otp/graphql-types/response"
import {
    ForgotPasswordVerifyOtpRequest,
} from "./graphql-types/request"
import {
    ForgotPasswordVerifyOtpService,
} from "./forgot-password-verify-otp.service"
import type {
    GraphQLContextParams,
} from "../../../../../shared/types/graphql-context"

@Resolver()
/**
 * GraphQL entry for completing reset. Cookie/CSRF/session side-effects live
 * here because CQRS must not touch the HTTP response.
 */
export class ForgotPasswordVerifyOtpResolver {
    constructor(
        private readonly forgotPasswordVerifyOtpService: ForgotPasswordVerifyOtpService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly sessionService: SessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Password reset successfully",
        [Locale.Vi]: "�?t l?i m?t kh?u th�nh c�ng",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInVerifyOtpResponse,
        {
            name: "forgotPasswordVerifyOtp",
            description: "Verifies OTP, resets password, and returns login tokens.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id + OTP code.",
            },
        )
            request: ForgotPasswordVerifyOtpRequest,
        @Context()
            ctx: GraphQLContextParams,
    ): Promise<SignInVerifyOtpData> {
        const result = await this.forgotPasswordVerifyOtpService.execute(
            {
                request,
            },
        )

        this.cookieService.attachHttpOnlyCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
                value: result.refreshToken,
            },
        )

        // issue a CSRF token alongside the post-reset login so later
        // cookie-driven calls (refresh / sign-out) pass the double-submit check
        this.csrfService.issueCookie({
            res: ctx.res,
        })

        // register this device's session (evicts the oldest when the account is
        // already at its device limit); req carries the User-Agent + client IP
        await this.sessionService.startSession({
            res: ctx.res,
            req: ctx.req,
            accessToken: result.data.accessToken,
        })

        return result.data
    }
}