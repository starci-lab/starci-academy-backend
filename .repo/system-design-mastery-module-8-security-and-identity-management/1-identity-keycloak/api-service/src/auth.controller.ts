/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Login via **public client** (Direct Access Grants, no secret required).
     */
    @Public()
    @Post("login/public")
    loginPublic(@Body() body: PasswordLoginBody): Promise<TokenResponse> {
        return this.keycloakService.loginPublicClient(body.username, body.password)
    }

    /**
     * Login via **confidential (private) client** (sends client_secret).
     */
    @Public()
    @Post("login/private")
    loginPrivate(@Body() body: PasswordLoginBody): Promise<TokenResponse> {
        return this.keycloakService.loginPrivateClient(body.username, body.password)
    }

    /**
     * Returns authorize URL to redirect browser to Keycloak login (Authorization Code flow).
     */
    @Public()
    @Get("authorize/url")
    /**
 * Logic — Business handler `authorizeUrl` for the lab.
 * Code — `authorizeUrl()` — in-class handler logic.
 */
    authorizeUrl(): {
        authorizeUrl: string
        note: string
    } {
        return {
            authorizeUrl: this.keycloakService.getAuthorizeUrl(),
            note: "Open authorizeUrl in browser, then copy `code` from callback query params.",
        }
    }

    /**
     * Callback receives authorization code from Keycloak → exchanges for access token.
     */
    @Public()
    @Get("callback")
    exchangeCode(@Query("code") code?: string): Promise<TokenResponse> {
        return this.keycloakService.exchangeCode(code ?? "")
    }
