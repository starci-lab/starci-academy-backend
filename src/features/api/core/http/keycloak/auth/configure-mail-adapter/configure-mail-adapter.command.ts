import {
    KeycloakConfigureMailAdapterRequest,
} from "../dtos/configure-mail-adapter.request"

/**
 * CQRS envelope for swapping Keycloak's SMTP adapter so the REST leaf never imports the
 * admin client.
 */
export class KeycloakConfigureMailAdapterCommand {
    constructor(
        readonly params: KeycloakConfigureMailAdapterRequest,
    ) {}
}
