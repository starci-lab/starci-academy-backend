import {
    ICQRSHandler,
} from "@modules/cqrs"
import {
    KeycloakTokenService,
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
    ) {
        super()
    }

    protected override async process(
        command: KeycloakConfigureMailAdapterCommand,
    ): Promise<KeycloakConfigureMailAdapterResponse> {
        await this.keycloakTokenService.configureRealmBrevoSmtpAdapter()

        if (command.params.verifyEmailUserId) {
            await this.keycloakTokenService.sendVerifyEmail(command.params.verifyEmailUserId)
        }

        return {
            configured: true,
            message: command.params.verifyEmailUserId
                ? "Configured Brevo SMTP adapter and sent verify email action"
                : "Configured Brevo SMTP adapter",
        }
    }
}
