import {
    Injectable,
} from "@nestjs/common"
import {
    CommandBus,
} from "@nestjs/cqrs"
import {
    KeycloakConfigureMailAdapterRequest,
} from "./dtos/configure-mail-adapter.request"
import {
    KeycloakLoginRequest,
} from "./dtos/login.request"
import {
    KeycloakRegisterRequest,
} from "./dtos/register.request"
import {
    KeycloakConfigureMailAdapterResponse,
    KeycloakAuthResponse,
} from "./dtos/response"
import {
    KeycloakLoginCommand,
} from "./login/login.command"
import {
    KeycloakRegisterCommand,
} from "./register/register.command"
import {
    KeycloakConfigureMailAdapterCommand,
} from "./configure-mail-adapter/configure-mail-adapter.command"

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
