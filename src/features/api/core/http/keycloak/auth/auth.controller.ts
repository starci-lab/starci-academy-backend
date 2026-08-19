import {
    Body,
    Controller,
    Post,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiResponse,
} from "@nestjs/swagger"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"
import {
    httpConfig,
} from "../../http"
import {
    AdminServiceTokenGuard,
} from "@modules/bussiness/guards/admin-access.guard"
import {
    KeycloakAuthService,
} from "./auth.service"
import {
    KeycloakConfigureMailAdapterRequest,
} from "./dtos/configure-mail-adapter.request"
import {
    KeycloakLoginRequest,
} from "./dtos/login.request"
import {
    KeycloakRegisterRequest,
} from "./dtos/register.request"
import {
    KeycloakAuthResponse,
    KeycloakConfigureMailAdapterResponse,
} from "./dtos/response"

@Controller({
    path: httpConfig().keycloak().auth().tags,
    version: "1",
})
/**
 * REST login/register/mail-adapter -- password grants and admin adapter swaps that cannot
 * ride GraphQL (cookies, redirects, Keycloak admin).
 */
export class KeycloakAuthController {
    constructor(
        private readonly keycloakAuthService: KeycloakAuthService,
    ) {}

    /**
     * DEPRECATED, kept live -- removal is the owner's call, not made here.
     *
     * An exhaustive search (this repo's src/e2e/docs, the active frontend
     * `starci-academy-fe`, the legacy sibling `starci-academy-main-ui` -- whose
     * unused REST client points at this same route -- and every other
     * checked-out repo under D:\Repositories, including the Mia Mia fork, whose
     * own frontend calls the equivalent route on its own separately deployed
     * backend, not this one) found no caller of this route anywhere.
     *
     * Replacement: `signInInit` / `signInVerifyOtp` GraphQL mutations under
     * `src/features/api/core/graphql/mutations/keycloak/sign-in/**`. Unlike this
     * route, that pair carries `CaptchaGuard`, CSRF issuance via `CsrfService`,
     * `UseThrottler(Strict)`, and httpOnly refresh-token cookies via
     * `CookieService`. This route returns tokens in the plain JSON body with no
     * captcha, no CSRF, and only the application-wide throttler (rate limiting,
     * not authorization).
     */
    @RestSuccessMessage("User tokens after successful login.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Login with Keycloak username/password",
        description: "Deprecated: no known caller as of 2026-08-19. Use the `signInInit` / " +
            "`signInVerifyOtp` GraphQL mutations instead, which add CaptchaGuard, CSRF, " +
            "strict throttling and httpOnly cookies that this REST route does not have.",
        deprecated: true,
    })
    @ApiResponse({
        status: 200,
        description: "User tokens after successful login.",
        type: KeycloakAuthResponse,
    })
    @Post(httpConfig().keycloak().auth().login().path)
    async login(
        @Body()
            body: KeycloakLoginRequest,
    ): Promise<KeycloakAuthResponse> {
        return this.keycloakAuthService.login(body)
    }

    /**
     * DEPRECATED, kept live -- removal is the owner's call, not made here.
     *
     * Same exhaustive search as `login` above, same result: no caller of this
     * route anywhere across this repo, its active and legacy frontends, or any
     * other checked-out repo under D:\Repositories.
     *
     * Replacement: the `signInInit` / `signInVerifyOtp` GraphQL mutations under
     * `src/features/api/core/graphql/mutations/keycloak/sign-in/**`, which carry
     * `CaptchaGuard`, CSRF issuance via `CsrfService`, `UseThrottler(Strict)`, and
     * httpOnly cookies via `CookieService` that this route does not have.
     */
    @RestSuccessMessage("User registered and token issued successfully.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Register account with Keycloak",
        description: "Deprecated: no known caller as of 2026-08-19. Use the `signInInit` / " +
            "`signInVerifyOtp` GraphQL mutations instead, which add CaptchaGuard, CSRF, " +
            "strict throttling and httpOnly cookies that this REST route does not have.",
        deprecated: true,
    })
    @ApiResponse({
        status: 201,
        description: "User registered and token issued successfully.",
        type: KeycloakAuthResponse,
    })
    @Post(httpConfig().keycloak().auth().register().path)
    async register(
        @Body()
            body: KeycloakRegisterRequest,
    ): Promise<KeycloakAuthResponse> {
        return this.keycloakAuthService.register(body)
    }

    @RestSuccessMessage("Keycloak realm SMTP adapter configured.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Configure Keycloak SMTP adapter with Brevo",
    })
    @ApiResponse({
        status: 200,
        description: "Keycloak SMTP adapter configuration result.",
        type: KeycloakConfigureMailAdapterResponse,
    })
    /*
     * OPERATOR ACTION, AND UNTIL 2026-08-19 AN UNAUTHENTICATED ONE.
     *
     * This route rewrites the Keycloak realm's SMTP adapter and can fire a verify-email action
     * at any supplied user id. It carried no guard of any kind, and the only application-wide
     * `APP_GUARD` in this repository is the throttler -- which limits how FAST an anonymous
     * caller may do this, not whether they may. Anyone who could reach the port could repoint
     * the realm's mail transport and send verification mail to an arbitrary account.
     *
     * `AdminServiceTokenGuard` is the operator boundary this repository already implements --
     * a static `x-admin-api-key` compared against the mounted secret, with no user session --
     * and is what the sibling admin routes under `http/admin/**` use for the same class of
     * action. Reusing it keeps one operator boundary rather than inventing a second.
     */
    @UseGuards(AdminServiceTokenGuard)
    @Post(httpConfig().keycloak().auth().configureMailAdapter().path)
    async configureMailAdapter(
        @Body()
            body: KeycloakConfigureMailAdapterRequest,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        return this.keycloakAuthService.configureMailAdapter(body)
    }
}
