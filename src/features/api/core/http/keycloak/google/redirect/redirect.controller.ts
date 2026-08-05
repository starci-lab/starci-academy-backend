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

@Controller(
    {
        path: httpConfig().keycloak().google().tags,
        version: "1",
    }
)
/**
 * Controller for starting Keycloak Google OIDC redirect (PKCE).
 */
export class KeycloakGoogleRedirectController {
    constructor(
        private readonly keycloakOidcRedirectService: KeycloakOidcRedirectService,
    ) {}

    @ApiOperation({
        summary: "Redirect to Keycloak (Google) with PKCE",
        description: "Builds Keycloak authorization URL, caches PKCE verifier + client redirectUri, and redirects (302).",
    })
    @ApiResponse({
        status: 302,
        description: "Redirects to Keycloak authorization endpoint.",
    })
    @Get(httpConfig().keycloak().google().redirect().path)
    async redirect(
        @Query("redirect_uri") redirectUri: string,
        @Res() res: Response,
    ): Promise<void> {
        const url = await this.keycloakOidcRedirectService.buildAuthorizeRedirectUrl(
            KeycloakIdentityProvider.Google,
            redirectUri,
        )
        res.redirect(
            302,
            url,
        )
    }
}

