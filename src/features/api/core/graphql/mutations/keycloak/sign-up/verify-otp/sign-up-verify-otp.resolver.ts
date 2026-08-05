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
import type {
    Response,
    Request,
} from "express"
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
    SignUpVerifyOtpInput,
} from "./graphql-types/request"
import {
    SignUpVerifyOtpResponse,
    type SignUpVerifyOtpData,
} from "./graphql-types/response"
import {
    SignUpVerifyOtpService,
} from "./sign-up-verify-otp.service"

@Resolver()
/**
 * GraphQL entry for completing sign-up. Cookie/CSRF/session side-effects live
 * here because CQRS must not touch the HTTP response.
 */
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
        [Locale.Vi]: "Đăng ký thành công", // vn-ok: vi-locale string emitted to clients
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

