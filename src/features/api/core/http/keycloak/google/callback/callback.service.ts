import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    KeycloakGoogleCallbackCommand,
} from "./callback.command"
import {
    KeycloakGoogleCallbackQuery,
} from "./dtos/request"
import {
    KeycloakGoogleCallbackResponse,
} from "./dtos/response"

@Injectable()
/**
 * Dispatches the Google IdP callback through the command bus so the controller only 302s.
 */
export class KeycloakGoogleCallbackService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async execute(
        query: KeycloakGoogleCallbackQuery,
    ): Promise<KeycloakGoogleCallbackResponse> {
        return this.commandBus.execute(
            new KeycloakGoogleCallbackCommand(query),
        )
    }
}
