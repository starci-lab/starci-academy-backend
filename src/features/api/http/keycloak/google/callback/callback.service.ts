import {
    Injectable,
} from "@nestjs/common"
import {
    KeycloakGoogleCallbackQuery 
} from "./dtos"

/**
 * Service for handling the Google Keycloak callback.
 */
@Injectable()
export class KeycloakGoogleCallbackService {
    /**
     * Handle the Google Keycloak callback.
     * @param query - The query parameters.
     * @returns The result of the callback.
     */
    async callback(
        {
            code,
            sessionState,
            iss,
        }: KeycloakGoogleCallbackQuery
    ) {
        // validate the query parameters
        console.log(
            code,
            sessionState,
            iss
        )
    }
}