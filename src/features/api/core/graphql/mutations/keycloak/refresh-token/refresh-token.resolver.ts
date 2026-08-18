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
} from "@modules/api/apollo/server/interceptors/graphql-transform.interceptor"
import {
    SkipThrottle,
} from "@nestjs/throttler"
import {
    Locale,
} from "@modules/databases/postgresql/primary/enums/locale"
import {
    RefreshTokenRequest,
} from "./graphql-types/request"
import {
    RefreshTokenResponse,
    type RefreshTokenData,
} from "./graphql-types/response"
import {
    RefreshTokenService,
} from "./refresh-token.service"
import {
    GraphQLCookie,
} from "@modules/platform/cookie/cookie.decorators"
import {
    CookieService,
} from "@modules/platform/cookie/cookie.service"
import {
    CookieName,
} from "@modules/platform/cookie/enums"
import {
    CsrfGuard,
} from "@modules/platform/csrf/guards/csrf.guard"
import {
    BearerJwt,
} from "@modules/platform/passport/decorators/bearer-jwt.decorators"
import type {
    GraphQLContextParams,
} from "../../../shared/types/graphql-context"

@Resolver()
/**
 * GraphQL entry for cookie-driven refresh. CSRF is required because the
 * refresh cookie is sent automatically; throttle is skipped so a near-expiry
 * access token is not locked out by the same burst that triggered refresh.
 */
export class RefreshTokenResolver {
    constructor(
        private readonly refreshTokenService: RefreshTokenService,
        private readonly cookieService: CookieService,
    ) { }

    @UseGuards(CsrfGuard)
    @SkipThrottle()
    @GraphQLSuccessMessage({
        [Locale.En]: "Token refreshed successfully",
        [Locale.Vi]: "Làm mới token thành công", // vn-ok: vi-locale string emitted to clients
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
            ctx: GraphQLContextParams,
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
        // NOTE: the CSRF token is intentionally NOT rotated here. It is a stateless
        // signed double-submit token (HMAC + random), so a fresh value adds no
        // security over the one minted at sign-in. Rotating it on every refresh
        // created a race: under concurrent refresh calls the cookie advanced to a
        // new value while the client kept echoing the previous one, yielding a
        // permanent "CSRF token mismatch". The login-issued token stays valid.
        return data
    }
}

