import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    KeycloakConfigureMailAdapterRequest,
    KeycloakConfigureMailAdapterResponse,
    KeycloakLoginRequest,
    KeycloakRegisterRequest,
    KeycloakAuthResponse,
} from "./dtos"
import {
    KeycloakLoginCommand,
} from "./login"
import {
    KeycloakRegisterCommand,
} from "./register"
import {
    KeycloakConfigureMailAdapterCommand,
} from "./configure-mail-adapter"

@Injectable()
/**
 * Dispatches login/register/mail-adapter commands so the controller does not import
 * Keycloak admin or JWT decode.
 */
export class KeycloakAuthService {
    constructor(
        private readonly commandBus: CommandBus,
    ) {}

    async login(dto: KeycloakLoginRequest): Promise<KeycloakAuthResponse> {
        return this.commandBus.execute(
            new KeycloakLoginCommand(dto),
        )
    }

    async register(dto: KeycloakRegisterRequest): Promise<KeycloakAuthResponse> {
        return this.commandBus.execute(
            new KeycloakRegisterCommand(dto),
        )
    }

    async configureMailAdapter(
        dto: KeycloakConfigureMailAdapterRequest,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        return this.commandBus.execute(
            new KeycloakConfigureMailAdapterCommand(dto),
        )
    }
}
