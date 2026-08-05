import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    KeycloakGithubCallbackCommand,
} from "./callback.command"
import {
    KeycloakGithubCallbackQuery,
} from "./dtos/request"
import {
    KeycloakGithubCallbackResponse,
} from "./dtos/response"

@Injectable()
/**
 * Dispatches the GitHub IdP callback through the command bus so the controller only 302s.
 */
export class KeycloakGithubCallbackService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        query: KeycloakGithubCallbackQuery,
    ): Promise<KeycloakGithubCallbackResponse> {
        return this.commandBus.execute(
            new KeycloakGithubCallbackCommand(query),
        )
    }
}
