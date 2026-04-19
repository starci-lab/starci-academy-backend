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
    KeycloakGoogleCallbackResponse,
} from "./dtos"

@Injectable()
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
