import {
    KeycloakConfigureMailAdapterRequest,
} from "../dtos"

export class KeycloakConfigureMailAdapterCommand {
    constructor(
        readonly params: KeycloakConfigureMailAdapterRequest,
    ) {}
}
