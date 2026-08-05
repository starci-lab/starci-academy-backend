import {
    KeycloakGithubCallbackQuery as KeycloakGithubCallbackQueryDto,
} from "./dtos"

/**
 * CQRS envelope for the Keycloak GitHub IdP code exchange so the callback controller stays
 * a redirect leaf.
 */
export class KeycloakGithubCallbackCommand {
    constructor(
        readonly params: KeycloakGithubCallbackQueryDto,
    ) {}
}
