import {
    KeycloakLoginRequest,
} from "../dtos"

export class KeycloakLoginCommand {
    constructor(
        readonly params: KeycloakLoginRequest,
    ) {}
}
