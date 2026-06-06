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
} from "@modules/api"
import {
    UseThrottler,
    ThrottlerConfig,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import type {
    Request,
    Response,
} from "express"
import {
    CookieName,
    CookieService,
} from "@modules/cookie"
import {
    CsrfService,
} from "@modules/csrf"
import {
    SessionService,
} from "@modules/session"
import {
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "../../verify-otp/graphql-types"
import {
    ForgotPasswordVerifyOtpRequest,
} from "./graphql-types"
import {
    ForgotPasswordVerifyOtpService,
} from "./forgot-password-verify-otp.service"

@Resolver()
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
            ctx: {
                req: Request,
                res: Response,
            },
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

        // start a fresh single account-wide session, evicting other devices
        await this.sessionService.startSession({
            res: ctx.res,
            accessToken: result.data.accessToken,
        })

        return result.data
    }
}