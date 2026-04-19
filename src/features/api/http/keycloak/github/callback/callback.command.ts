import {
    KeycloakGithubCallbackQuery as KeycloakGithubCallbackQueryDto,
} from "./dtos"

export class KeycloakGithubCallbackCommand {
    constructor(
        readonly params: KeycloakGithubCallbackQueryDto,
    ) {}
}
