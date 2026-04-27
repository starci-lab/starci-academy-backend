import {
    KeycloakRegisterRequest,
} from "../dtos"

export class KeycloakRegisterCommand {
    constructor(
        readonly params: KeycloakRegisterRequest,
    ) {}
}
