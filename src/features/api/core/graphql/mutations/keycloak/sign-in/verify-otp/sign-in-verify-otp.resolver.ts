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
    SignInVerifyOtpRequest,
} from "./graphql-types/request"
import {
    SignInVerifyOtpResponse,
    type SignInVerifyOtpData,
} from "./graphql-types/response"
import {
    SignInVerifyOtpService,
} from "./sign-in-verify-otp.service"
import type {
    GraphQLContextParams,
} from "../../../../shared/types/graphql-context"

@Resolver()
/**
 * GraphQL entry for completing password sign-in. Cookie/CSRF/session
 * side-effects live here because CQRS must not touch the HTTP response.
 */
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
        [Locale.Vi]: "Đăng nhập thành công", // vn-ok: vi-locale string emitted to clients
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
            ctx: GraphQLContextParams,
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

