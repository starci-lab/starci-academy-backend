import {
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
} from "express"
import {
    CookieName,
    Cookie,
    CookieService,
} from "@modules/cookie"
import {
    SignOutResponse,
} from "./graphql-types"
import {
    SignOutService,
} from "./sign-out.service"

@Resolver()
export class SignOutResolver {
    constructor(
        private readonly signOutService: SignOutService,
        private readonly cookieService: CookieService,
    ) {}

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
        @Cookie(CookieName.KeycloakRefreshToken)
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
    }
}

