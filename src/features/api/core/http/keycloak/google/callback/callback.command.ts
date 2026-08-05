import {
    KeycloakGoogleCallbackQuery as KeycloakGoogleCallbackQueryDto,
} from "./dtos"

/**
 * CQRS envelope for the Keycloak Google IdP code exchange so the callback controller stays
 * a redirect leaf.
 */
export class KeycloakGoogleCallbackCommand {
    constructor(
        readonly params: KeycloakGoogleCallbackQueryDto,
    ) {}
}
