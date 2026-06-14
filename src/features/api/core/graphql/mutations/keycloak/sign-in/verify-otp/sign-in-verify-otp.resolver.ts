import {
    Args,
    Mutation,
    Resolver,
    Context,
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
    SignInVerifyOtpRequest,
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "./graphql-types"
import {
    SignInVerifyOtpService,
} from "./sign-in-verify-otp.service"

@Resolver()
export class SignInVerifyOtpResolver {
    constructor(
        private readonly signInVerifyOtpService: SignInVerifyOtpService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly sessionService: SessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Logged in successfully",
        [Locale.Vi]: "Đăng nhập thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignInVerifyOtpResponse,
        {
            name: "signInVerifyOtp",
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
            request: SignInVerifyOtpRequest,
        @Context()
            ctx: {
                req: Request,
                res: Response,
            },
    ): Promise<SignInVerifyOtpData> {
        const result = await this.signInVerifyOtpService.execute({
            request,
        })
        this.cookieService.attachHttpOnlyCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
                value: result.refreshToken,
            }
        )
        // issue a CSRF token alongside login so the client can guard later
        // cookie-driven calls (refresh / sign-out)
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

