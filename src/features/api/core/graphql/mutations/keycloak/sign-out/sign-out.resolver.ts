import {
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseGuards,
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
} from "express"
import {
    CookieName,
    GraphQLCookie,
    CookieService,
} from "@modules/cookie"
import {
    SignOutResponse,
} from "./graphql-types"
import {
    SignOutService,
} from "./sign-out.service"
import {
    CsrfGuard,
} from "@modules/csrf"
import {
    SessionService,
} from "@modules/session"
import {
    envConfig,
} from "@modules/env"

@Resolver()
export class SignOutResolver {
    constructor(
        private readonly signOutService: SignOutService,
        private readonly cookieService: CookieService,
        private readonly sessionService: SessionService,
    ) {}

    @UseGuards(CsrfGuard)
    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Signed out successfully",
        [Locale.Vi]: "Đăng xuất thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => SignOutResponse,
        {
            name: "signOut",
            description: "Clears refresh-token cookie (server-side sign out).",
        },
    )
    async execute(
        @GraphQLCookie(CookieName.KeycloakRefreshToken)
            refreshToken: string,
        @Context()
            ctx: {
                req: Request
                res: Response
            },
    ): Promise<undefined> {
        await this.signOutService.execute(refreshToken)
        this.cookieService.clearCookie(
            {
                res: ctx.res,
                name: CookieName.KeycloakRefreshToken,
            }
        )
        // also drop the CSRF token cookie so no stale double-submit pair lingers.
        // must match the domain the cookie was issued with, else the browser
        // keeps the domain-scoped cookie around (deletion matches name+domain+path)
        this.cookieService.clearCookie(
            {
                res: ctx.res,
                name: CookieName.CsrfToken,
                options: {
                    domain: envConfig().cookie.domain || undefined,
                },
            }
        )
        // end the single-session record + clear its cookie on sign-out
        await this.sessionService.endSession({
            res: ctx.res,
            refreshToken,
        })
    }
}

