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
    KeycloakGithubCallbackResponse,
} from "./dtos"

@Injectable()
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
