import {
    KeycloakRegisterRequest,
} from "../dtos"

/**
 * CQRS envelope for register-then-login so the controller does not sequence Keycloak admin
 * + token calls.
 */
export class KeycloakRegisterCommand {
    constructor(
        readonly params: KeycloakRegisterRequest,
    ) {}
}
