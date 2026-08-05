import {
    Body,
    Controller,
    Post,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiOperation,
    ApiResponse,
} from "@nestjs/swagger"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api"
import {
    httpConfig,
} from "../../http"
import {
    KeycloakAuthService,
} from "./auth.service"
import {
    KeycloakAuthResponse,
    KeycloakConfigureMailAdapterRequest,
    KeycloakConfigureMailAdapterResponse,
    KeycloakLoginRequest,
    KeycloakRegisterRequest,
} from "./dtos"

@Controller({
    path: httpConfig().keycloak().auth().tags,
    version: "1",
})
/**
 * REST login/register/mail-adapter — password grants and admin adapter swaps that cannot
 * ride GraphQL (cookies, redirects, Keycloak admin).
 */
export class KeycloakAuthController {
    constructor(
        private readonly keycloakAuthService: KeycloakAuthService,
    ) {}

    @RestSuccessMessage("User tokens after successful login.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Login with Keycloak username/password",
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

    @RestSuccessMessage("User registered and token issued successfully.")
    @UseInterceptors(RestTransformInterceptor)
    @ApiOperation({
        summary: "Register account with Keycloak",
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
    @Post(httpConfig().keycloak().auth().configureMailAdapter().path)
    async configureMailAdapter(
        @Body()
            body: KeycloakConfigureMailAdapterRequest,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        return this.keycloakAuthService.configureMailAdapter(body)
    }
}
