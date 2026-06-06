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
    Response,
    Request,
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
    SignUpVerifyOtpInput,
    SignUpVerifyOtpResponse,
    type SignUpVerifyOtpData,
} from "./graphql-types"
import {
    SignUpVerifyOtpService,
} from "./sign-up-verify-otp.service"

@Resolver()
export class SignUpVerifyOtpResolver {
    constructor(
        private readonly signUpVerifyOtpService: SignUpVerifyOtpService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly sessionService: SessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Signed up successfully",
        [Locale.Vi]: "Đăng ký thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignUpVerifyOtpResponse,
        {
            name: "signUpVerifyOtp",
            description: "Verifies OTP and returns Keycloak access token; refresh token is set as HttpOnly cookie.",
        },
    )
    async execute(
        @Args(
            "request",
            {
                description: "Challenge id + OTP code.",
            },
        )
            request: SignUpVerifyOtpInput,
        @Context()
            ctx: {
                req: Request,
                res: Response,
            },
    ): Promise<SignUpVerifyOtpData> {
        const result = await this.signUpVerifyOtpService.execute(
            {
                request,
            }
        )

        this.cookieService.attachHttpOnlyCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
                value: result.refreshToken,
            }
        )

        // issue a CSRF token alongside sign-up so later cookie-driven calls
        // (refresh / sign-out) can pass the double-submit check
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

