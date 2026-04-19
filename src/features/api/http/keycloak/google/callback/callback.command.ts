import {
    KeycloakGoogleCallbackQuery as KeycloakGoogleCallbackQueryDto,
} from "./dtos"

export class KeycloakGoogleCallbackCommand {
    constructor(
        readonly params: KeycloakGoogleCallbackQueryDto,
    ) {}
}
