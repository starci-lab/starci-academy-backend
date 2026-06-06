import {
    Args,
    Context,
    Mutation,
    Resolver,
} from "@nestjs/graphql"
import {
    UseInterceptors,
} from "@nestjs/common"
import type {
    Response,
} from "express"
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
import {
    ExchangeCodeForTokenRequest,
    ExchangeCodeForTokenResponse,
    type ExchangeCodeForTokenData,
} from "./graphql-types"
import {
    ExchangeCodeForTokenService,
} from "./exchange-code-for-token.service"
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

@Resolver()
export class ExchangeCodeForTokenResolver {
    constructor(
        private readonly exchangeCodeForTokenService: ExchangeCodeForTokenService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly sessionService: SessionService,
    ) {}

    @UseThrottler(ThrottlerConfig.Strict)
    @GraphQLSuccessMessage({
        [Locale.En]: "Code exchanged successfully",
        [Locale.Vi]: "Đổi code lấy token thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => ExchangeCodeForTokenResponse,
        {
            name: "exchangeCodeForToken",
            description: "Exchange OIDC authorization code for Keycloak tokens (server-side).",
        },
    )
    async execute(
        @Args("request")
            request: ExchangeCodeForTokenRequest,
        @Context()
            ctx: {
                req: Request
                res: Response
            },
    ): Promise<ExchangeCodeForTokenData> {
        const {
            data,
            refreshToken,
        } = await this.exchangeCodeForTokenService.execute(request)
        this.cookieService.attachHttpOnlyCookie({
            res: ctx.res,
            name: CookieName.KeycloakRefreshToken,
            value: refreshToken,
        })
        // issue a CSRF token alongside login so the client can guard later
        // cookie-driven calls (refresh / sign-out)
        this.csrfService.issueCookie({
            res: ctx.res,
        })
        // start a fresh single account-wide session, evicting other devices
        await this.sessionService.startSession({
            res: ctx.res,
            accessToken: data.accessToken,
        })
        return data
    }
}

