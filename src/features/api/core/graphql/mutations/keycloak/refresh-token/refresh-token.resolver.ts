import {
    Args,
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
    SkipThrottle,
} from "@modules/throttler"
import {
    Locale,
} from "@modules/databases"
import {
    RefreshTokenResponse,
    type RefreshTokenData,
    RefreshTokenRequest,
} from "./graphql-types"
import {
    RefreshTokenService,
} from "./refresh-token.service"
import {
    CookieService,
    GraphQLCookie,
} from "@modules/cookie"
import {
    CookieName,
} from "@modules/cookie"
import {
    CsrfGuard,
    CsrfService,
} from "@modules/csrf"
import type {
    Response,
} from "express"
import {
    BearerJwt
} from "@modules/passport"

@Resolver()
export class RefreshTokenResolver {
    constructor(
        private readonly refreshTokenService: RefreshTokenService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
    ) { }

    @UseGuards(CsrfGuard)
    @SkipThrottle()
    @GraphQLSuccessMessage({
        [Locale.En]: "Token refreshed successfully",
        [Locale.Vi]: "Làm mới token thành công",
    })
    @UseInterceptors(GraphQLTransformInterceptor)
    @Mutation(
        () => RefreshTokenResponse,
        {
            name: "refreshToken",
            description: "Refresh Keycloak tokens using refresh token.",
        },
    )
    async execute(
        @GraphQLCookie(CookieName.KeycloakRefreshToken)
            refreshToken: string,
        @Args("request")
            request: RefreshTokenRequest,
        @BearerJwt()
            accessToken: string | undefined,
        @Context()
            ctx: {
                req: Request
                res: Response
            },
    ): Promise<RefreshTokenData> {
        const {
            data,
            refreshToken: newRefreshToken,
        } = await this.refreshTokenService.execute(
            {
                refreshToken,
                accessToken,
                request,
            },
        )
        this.cookieService.attachHttpOnlyCookie({
            res: ctx.res,
            name: CookieName.KeycloakRefreshToken,
            value: newRefreshToken,
        })
        // rotate the CSRF token together with the refresh token so the client
        // always holds a fresh, valid double-submit pair
        this.csrfService.issueCookie({
            res: ctx.res,
        })
        return data
    }
}

