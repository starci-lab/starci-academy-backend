/**
 * HTTP/Kafka controller — routes delegate to service.
 * (EN: Controller — routes delegate to service.)
 */
}

    /**
     * Đăng nhập qua **public client** (Direct Access Grants, không cần secret).
     * (EN: Login via **public client** (Direct Access Grants, no secret required).)
     */
    @Public()
    @Post("login/public")
    loginPublic(@Body() body: PasswordLoginBody): Promise<TokenResponse> {
        return this.keycloakService.loginPublicClient(body.username, body.password)
    }

    /**
     * Đăng nhập qua **confidential (private) client** (gửi kèm client_secret).
     * (EN: Login via **confidential (private) client** (sends client_secret).)
     */
    @Public()
    @Post("login/private")
    loginPrivate(@Body() body: PasswordLoginBody): Promise<TokenResponse> {
        return this.keycloakService.loginPrivateClient(body.username, body.password)
    }

    /**
     * Trả về authorize URL để redirect trình duyệt sang Keycloak login (Authorization Code flow).
     * (EN: Returns authorize URL to redirect browser to Keycloak login (Authorization Code flow).)
     */
    @Public()
    @Get("authorize/url")
    /**
 * Logic — Xử lý nghiệp vụ `authorizeUrl` cho lab.
 * Code — `authorizeUrl()` — logic trong service/controller.
 * (EN Logic: Business handler `authorizeUrl` for the lab.)
 * (EN Code: `authorizeUrl()` — in-class handler logic.)
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
     * Callback nhận authorization code từ Keycloak → đổi thành access token.
     * (EN: Callback receives authorization code from Keycloak → exchanges for access token.)
     */
    @Public()
    @Get("callback")
    exchangeCode(@Query("code") code?: string): Promise<TokenResponse> {
        return this.keycloakService.exchangeCode(code ?? "")
    }
