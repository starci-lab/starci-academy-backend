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
    KeycloakIdentityProvider,
    KeycloakOidcRedirectService,
} from "@modules/keycloak"

/**
 * Controller for starting Keycloak GitHub OIDC redirect (PKCE).
 */
@Controller(
    {
        path: httpConfig().keycloak().github().tags,
        version: "1",
    }
)
export class KeycloakGithubRedirectController {
    constructor(
        private readonly keycloakOidcRedirectService: KeycloakOidcRedirectService,
    ) {}

    @ApiOperation({
        summary: "Redirect to Keycloak (GitHub) with PKCE",
        description: "Builds Keycloak authorization URL, caches PKCE verifier + client redirectUri, and redirects (302).",
    })
    @ApiResponse({
        status: 302,
        description: "Redirects to Keycloak authorization endpoint.",
    })
    @Get(httpConfig().keycloak().github().redirect().path)
    async redirect(
        @Query("redirect_uri") redirectUri: string,
        @Res() res: Response,
    ): Promise<void> {
        const url = await this.keycloakOidcRedirectService.buildAuthorizeRedirectUrl(
            KeycloakIdentityProvider.Github,
            redirectUri,
        )
        res.redirect(
            302,
            url,
        )
    }
}

