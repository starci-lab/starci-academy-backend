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
} from "@modules/api"
import {
    KeycloakGoogleCallbackService 
} from "./callback.service"
import {
    KeycloakGoogleCallbackResponse,
} from "./dtos"
import {
    httpConfig,
} from "../../../http"
import {
    ApiOperation 
} from "@nestjs/swagger"
@Controller(
    {
        path: httpConfig().keycloak().google().tags,
        version: "1",
    }
)
/**
 * Controller for the Keycloak Google callback.
 */
export class KeycloakGoogleCallbackController {
    constructor(
        private readonly keycloakGoogleCallbackService: KeycloakGoogleCallbackService,
    ) {}
    /**
     * Handle the Google Keycloak callback.
     * @param code - The code parameter received from the Google OAuth2 authorization flow.
     * @param state - The state parameter received from the Google OAuth2 authorization flow.
     * @param sessionState - The session state parameter received from the Google OAuth2 authorization flow.
     * @param res - The response object.
     * @returns The result of the callback.
     */
    @RestSuccessMessage("User tokens after successful OAuth exchange.")
    @UseInterceptors(
        RestTransformInterceptor,
    )
    @ApiOperation({
        summary: "Google Keycloak callback (Development Only)",
        description: "Google Keycloak callback for development purposes.",
    })
    @ApiResponse(
        {
            status: 200,
            description: "User tokens after successful OAuth exchange.",
            type: KeycloakGoogleCallbackResponse,
        },
    )
    @Get(httpConfig().keycloak().google().callback().path)
    async callback(
        /**
         * The code parameter received from the Google OAuth2 authorization flow.
         */
        @Query("code") code: string,
        /**
         * The state parameter received from the Google OAuth2 authorization flow.
         */
        @Query("session_state") sessionState: string,
        @Query("iss") iss: string,
    ) {
        return this.keycloakGoogleCallbackService.execute({
            code,
            sessionState,
            iss,
        })
    }
}

