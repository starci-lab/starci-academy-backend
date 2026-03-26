import {
    Controller,
    Get,
    Query,
} from "@nestjs/common"
import {
    KeycloakGoogleCallbackService 
} from "./callback.service"
import {
    httpConfig,
} from "../../../http"
/**
 * Controller for the Keycloak Google callback.
 */
@Controller(
    {
        path: httpConfig().keycloak().google().tags,
        version: "1",
    }
)
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
        return this.keycloakGoogleCallbackService.callback({
            code,
            sessionState,
            iss,
        })
    }
}

