import {
    Controller,
    Get,
    Query,
    UseInterceptors,
} from "@nestjs/common"
import {
    ApiResponse,
} from "@nestjs/swagger"
import {
    RestSuccessMessage,
    RestTransformInterceptor,
} from "@modules/api/rest/interceptors/rest-transform.interceptor"
import {
    KeycloakGithubCallbackService 
} from "./callback.service"
import {
    KeycloakGithubCallbackResponse,
} from "./dtos/response"
import {
    httpConfig,
} from "../../../http"
import {
    ApiOperation 
} from "@nestjs/swagger"
@Controller(
    {
        path: httpConfig().keycloak().github().tags,
        version: "1",
    }
)
/**
 * Controller for the Keycloak GitHub callback.
 */
export class KeycloakGithubCallbackController {
    constructor(
        private readonly keycloakGithubCallbackService: KeycloakGithubCallbackService,
    ) {}
    /**
     * Handle the GitHub Keycloak callback.
     * @param code - The code parameter received from the GitHub OAuth2 authorization flow.
     * @param state - The state parameter received from the GitHub OAuth2 authorization flow.
     * @param sessionState - The session state parameter received from the GitHub OAuth2 authorization flow.
     * @param res - The response object.
     * @returns The result of the callback.
     */
    @RestSuccessMessage("User tokens after successful OAuth exchange.")
    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "GitHub Keycloak callback (Development Only)",
        description: "GitHub Keycloak callback for development purposes.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "User tokens after successful OAuth exchange.",
            type: KeycloakGithubCallbackResponse,
        },
    )
    @Get(httpConfig().keycloak().github().callback().path)
    async callback(
        /**
         * The code parameter received from the GitHub OAuth2 authorization flow.
         */
        @Query("code") code: string,
        /**
         * The state parameter received from the GitHub OAuth2 authorization flow.
         */
        @Query("session_state") sessionState: string,
        @Query("iss") iss: string,
    ) {
        return this.keycloakGithubCallbackService.execute({
            code,
            sessionState,
            iss,
        })
    }
}