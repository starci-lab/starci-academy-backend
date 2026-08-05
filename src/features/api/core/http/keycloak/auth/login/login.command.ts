import {
    KeycloakLoginRequest,
} from "../dtos/login.request"

/**
 * CQRS envelope for the password grant so the controller does not call Keycloak token APIs
 * directly.
 */
export class KeycloakLoginCommand {
    constructor(
        readonly params: KeycloakLoginRequest,
    ) {}
}
