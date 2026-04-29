import {
    Controller,
    Get,
    Query,
    Res,
} from "@nestjs/common"
import type {
    Response,
} from "express"
import {
    ApiOperation,
    ApiResponse,
} from "@nestjs/swagger"
import {
    httpConfig,
} from "../../../http"
import {
    MissingRequiredParameterException,
} from "@modules/exceptions"
import {
    CookieName, RestCookie
} from "@modules/cookie"
import {
    GithubOauthRedirectCommandService,
} from "./redirect.service"
/**
 * Controller for starting GitHub OAuth redirect.
 *
 * Redirects (302) to:
 * `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...&scope=...&state=...`
 */
@Controller(
    {
        path: httpConfig().github().oauth().tags,
        version: "1",
    },
)
export class GithubOauthRedirectController {
    constructor(
        private readonly githubOauthRedirectCommandService: GithubOauthRedirectCommandService,
    ) { }

    @ApiOperation({
        summary: "Redirect to GitHub OAuth",
        description: "Builds GitHub authorization URL from FE-provided params and redirects (302).",
    })
    @ApiResponse({
        status: 302,
        description: "Redirects to GitHub authorization endpoint.",
    })
    @Get(httpConfig().github().oauth().redirect().path)
    async redirect(
        /**
         * The redirect URI.
         */
        @Query("redirectUri")
            redirectUri: string,
        /**
         * The response object.
         */
        @Res() res: Response,
        /**
         * The refresh token cookie.
         */
        @RestCookie(CookieName.KeycloakRefreshToken)
            refreshToken: string,
    ): Promise<void> {
        if (!redirectUri) {
            throw new MissingRequiredParameterException({
                parameter: "redirectUri",
            })
        }
        const {
            url,
        } = await this.githubOauthRedirectCommandService.execute(
            {
                refreshToken,
                redirectUri,
            },
        )
        res.redirect(
            302,
            url,
        )
    }
}

