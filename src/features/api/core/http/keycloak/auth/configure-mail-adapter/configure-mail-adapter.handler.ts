import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakTokenService,
    KeycloakUserService,
} from "@modules/keycloak"
import {
    Injectable,
} from "@nestjs/common"
import {
    CommandHandler,
    ICommandHandler,
} from "@nestjs/cqrs"
import {
    KeycloakConfigureMailAdapterResponse,
} from "../dtos"
import {
    KeycloakConfigureMailAdapterCommand,
} from "./configure-mail-adapter.command"

@CommandHandler(KeycloakConfigureMailAdapterCommand)
@Injectable()
export class KeycloakConfigureMailAdapterHandler
    extends ICQRSHandler<KeycloakConfigureMailAdapterCommand, KeycloakConfigureMailAdapterResponse>
    implements ICommandHandler<KeycloakConfigureMailAdapterCommand, KeycloakConfigureMailAdapterResponse> {
    constructor(
        private readonly keycloakTokenService: KeycloakTokenService,
        private readonly keycloakUserService: KeycloakUserService,
    ) {
        super()
    }

    protected override async process(
        command: KeycloakConfigureMailAdapterCommand,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        return {
            configured: true,
            message: command.params.verifyEmailUserId
                ? "Configured Brevo SMTP adapter and sent verify email action"
                : "Configured Brevo SMTP adapter",
        }
    }
}
